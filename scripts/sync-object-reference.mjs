#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(repoRoot, 'packages/topoviewer/content/pages/reference/object-attributes.md');
const styleReferencePath = path.join(repoRoot, 'packages/topoviewer/content/pages/reference/stylesheet-reference.md');
const checkOnly = process.argv.includes('--check');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function writeIfChanged(filePath, content) {
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : undefined;
  if (existing === content) return false;
  if (checkOnly) {
    console.error(`${path.relative(repoRoot, filePath)} is out of sync. Run npm run sync:object-reference.`);
    process.exitCode = 1;
    return false;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return true;
}

const topologySchema = readJson('packages/topoviewer/schemas/topoviewer.schema.json');
const mapperSchema = readJson('packages/topoviewer/schemas/topoviewer-mapper.schema.json');
const attentionSchema = readJson('packages/topoviewer/schemas/topoviewer-mkdocs-block.schema.json');

function localDefinition(schema, ref) {
  const name = ref.replace(/^#\/definitions\//, '');
  return schema.definitions?.[name];
}

function definitionName(ref) {
  return ref.replace(/^#\/definitions\//, '').replace(/([a-z])([A-Z])/g, '$1 $2');
}

function mergeObjectDefinition(schema, definition) {
  if (!definition) return { properties: {}, required: [] };
  if (definition.$ref) return mergeObjectDefinition(schema, localDefinition(schema, definition.$ref));
  const properties = {};
  const required = new Set(definition.required || []);

  for (const part of definition.allOf || []) {
    const merged = mergeObjectDefinition(schema, part);
    Object.assign(properties, merged.properties);
    merged.required.forEach((key) => required.add(key));
  }

  for (const candidate of definition.anyOf || []) {
    const merged = mergeObjectDefinition(schema, candidate);
    Object.assign(properties, merged.properties);
  }

  Object.assign(properties, definition.properties || {});
  (definition.required || []).forEach((key) => required.add(key));
  return { properties, required: [...required].sort() };
}

function typeSummary(property) {
  if (!property) return 'unknown';
  if (property.$ref) return definitionName(property.$ref);
  if (property.const !== undefined) return `const ${property.const}`;
  if (property.enum) return property.enum.map(String).join(' | ');
  if (Array.isArray(property.type)) return property.type.join(' | ');
  if (property.type === 'array') {
    const itemType = typeSummary(property.items || {});
    return `array of ${itemType}`;
  }
  if (property.oneOf) return property.oneOf.map((entry) => typeSummary(entry)).join(' or ');
  if (property.anyOf) return property.anyOf.map((entry) => typeSummary(entry)).join(' or ');
  if (property.additionalProperties && typeof property.additionalProperties === 'object') {
    return `object of ${typeSummary(property.additionalProperties)}`;
  }
  return property.type || 'object';
}

function acceptedValues(property) {
  if (!property) return 'Any valid value of the documented type.';
  if (property.enum) return property.enum.map((value) => `\`${String(value)}\``).join(', ');
  if (property.const !== undefined) return `\`${String(property.const)}\``;
  if (property.pattern) return `Must match \`${property.pattern}\`.`;
  if (property.minItems !== undefined) return `Array length >= ${property.minItems}.`;
  if (property.minimum !== undefined) return `Number >= ${property.minimum}.`;
  if (property.oneOf) return property.oneOf.map(acceptedValues).filter(Boolean).join(' or ') || 'One documented shape.';
  if (property.$ref) return `See \`${definitionName(property.$ref)}\`.`;
  return 'Any valid value of the documented type.';
}

function purposeFor(objectName, key, property) {
  if (property?.description) return property.description;
  const hints = {
    '$schema': 'Optional editor/schema hint.',
    id: 'Stable identifier used by references, selectors, mapper joins, and diagnostics.',
    name: 'Human-readable display name.',
    label: 'Fallback display label.',
    labels: 'Low-cardinality classification data for selectors, filters, and mapper joins.',
    data: 'Arbitrary facts for domain metadata, selectors, mappers, and host applications.',
    handles: 'Named node connection anchors for precise link attachment, usually used for ports or interfaces.',
    layers: 'Visibility layer IDs that include this object.',
    style: 'Inline style override for one object; prefer stylesheet rules for shared policy.',
    icon: 'Named icon override for this object.',
    source: 'Source endpoint object ID.',
    target: 'Target endpoint object ID.',
    sourceHandle: 'Optional source node handle ID. Use this to attach a link to a specific source-side port or interface anchor.',
    targetHandle: 'Optional target node handle ID. Use this to attach a link to a specific target-side port or interface anchor.',
    parent: 'Parent object ID for containment or carried relationships.',
    position: 'Authored position in TopoViewer coordinate space.',
    size: 'Authored width and height in TopoViewer coordinate space.',
    members: 'Object IDs enclosed by a region.',
    selector: 'Selector expression that determines which objects a rule affects.',
    metric: 'Telemetry metric or data-frame name.',
    value: 'Telemetry value extraction or semantic value type.'
  };
  return hints[key] || `${objectName} attribute.`;
}

function defaultBehavior(key, property, required) {
  if (property?.default !== undefined) return `Defaults to \`${String(property.default)}\`.`;
  if (required) return 'Required; no default.';
  if (key === 'labels' || key === 'data') return 'Defaults to an empty object when absent.';
  if (key === 'layers') return 'Absent means the object is not tied to a named layer unless runtime fallback applies.';
  if (key === 'style') return 'Absent means stylesheet rules and runtime defaults determine presentation.';
  return 'Optional; no schema default.';
}

function validationBehavior(key, property, required) {
  const checks = [];
  if (required) checks.push('required');
  if (property?.minLength !== undefined) checks.push(`minLength ${property.minLength}`);
  if (property?.minItems !== undefined) checks.push(`minItems ${property.minItems}`);
  if (property?.additionalProperties === false) checks.push('no unknown keys');
  if (property?.enum) checks.push('enum checked');
  if (property?.const !== undefined) checks.push('const checked');
  if (['source', 'target', 'parent', 'members', 'layers', 'sequence', 'sourceHandle', 'targetHandle'].includes(key)) {
    checks.push('semantic reference checks apply');
  }
  return checks.length ? checks.join('; ') : 'Schema/type validation applies.';
}

function selectorImplication(key, objectName) {
  if (key === 'id') return 'Selectable as `[id = "..."]` where the object kind supports selectors.';
  if (key === 'labels') return 'Primary selector namespace: `[labels.<key> = "..."]`.';
  if (key === 'data') return 'Selector namespace for stable facts: `[data.<key> = "..."]`.';
  if (key === 'source' || key === 'target') return 'Useful for link/path endpoint selectors and mapper endpoint joins.';
  if (objectName.includes('Style')) return 'Style keys are applied by matching stylesheet selectors.';
  if (key === 'direction') return 'Virtual `linkDirection[direction = "..."]` selectors use this value.';
  return 'No direct selector effect.';
}

function mapperImplication(key, objectName) {
  if (key === 'id') return 'Best join target for Grafana mapper telemetry labels.';
  if (key === 'labels') return 'Mapper `label` resolver can join telemetry to `labels.<key>`.';
  if (key === 'data') return 'Mapper `data` resolver can join telemetry to `data.<key>`.';
  if (key === 'source' || key === 'target') return 'Mapper `endpoint` resolver can match link endpoints; prefer IDs for parallel links.';
  if (objectName.includes('Mapper')) return 'Directly controls telemetry-to-object mapping behavior.';
  if (objectName.includes('Style')) return 'Can be used by mapper runtime overlays when supported for the target kind.';
  return 'No direct mapper effect.';
}

function yamlCue(objectKey, key) {
  const examples = {
    document: `${key}: ...`,
    graph: `graph.${key}: ...`,
    layer: `graph.layers[].${key}: ...`,
    graphEntity: `${key}: ...`,
    node: `graph.nodes[].${key}: ...`,
    link: `graph.links[].${key}: ...`,
    linkDirection: `graph.links[].directions.sourceToTarget.${key}: ...`,
    path: `graph.paths[].${key}: ...`,
    region: `graph.regions[].${key}: ...`,
    diagram: `diagram.${key}: ...`,
    shape: `diagram.shapes[].${key}: ...`,
    callout: `diagram.callouts[].${key}: ...`,
    text: `diagram.texts[].${key}: ...`,
    pin: `pins[].${key}: ...`,
    toggle: `toggles[].${key}: ...`,
    layout: `layout.${key}: ...`,
    closLayout: `layout.clos.${key}: ...`,
    treeLayout: `layout.tree.${key}: ...`,
    limits: `limits.${key}: ...`,
    icon: `icons.router.generic.${key}: ...`,
    styleRule: `stylesheet[].${key}: ...`,
    style: `style.${key}: ...`,
    attention: `attention.${key}: ...`,
    focusQuery: `attention.query.${key}: ...`,
    focusDependencyQuery: `attention.query.dependency.${key}: ...`,
    focusChangeQuery: `attention.query.changes.${key}: ...`,
    aggregate: `attention.aggregate.${key}: ...`,
    aggregateGroup: `attention.aggregate.groups[].${key}: ...`,
    aggregateViewport: `attention.aggregate.viewport.${key}: ...`,
    attentionLinks: `attention.links.${key}: ...`,
    linkGrouping: `attention.links.grouping.${key}: ...`,
    linkGroupingViewport: `attention.links.grouping.viewport.${key}: ...`,
    mapperRoot: `${key}: ...`,
    mapperRule: `rules[].${key}: ...`,
    mapperMapping: `mappings[].${key}: ...`,
    mapperTarget: `mappings[].target.${key}: ...`,
    mapperResolver: `mappings[].target.resolve.${key}: ...`,
    mapperOverlay: `mappings[].overlay.${key}: ...`
  };
  return `\`${(examples[objectKey] || `${key}: ...`).replace(/\n/g, ' / ')}\``;
}

function openMapSection(objectName, objectKey, valueType, purpose, selectorImpact, mapperImpact) {
  return [
    `### ${objectName}`,
    '',
    '| Attribute | Required | Type / Values | Accepted Values Or Format | Default | Validation | Selector Impact | Mapper Impact | Stability | Minimal YAML Cue | Purpose |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    `| \`<key>\` | optional | ${valueType} | User-defined keys. Keep keys stable and low-cardinality when selectors or telemetry joins depend on them. | Defaults to an empty object when absent. | Schema validates value shape; semantic meaning is host-defined. | ${selectorImpact} | ${mapperImpact} | Supported | \`${objectKey}.<key>: ...\` | ${purpose} |`,
    ''
  ].join('\n');
}

function markdownTable(schema, objectKey, objectName, definition, options = {}) {
  const merged = mergeObjectDefinition(schema, definition);
  const keys = Object.keys(merged.properties).sort((a, b) => {
    const aRequired = merged.required.includes(a);
    const bRequired = merged.required.includes(b);
    if (aRequired !== bRequired) return aRequired ? -1 : 1;
    return a.localeCompare(b);
  });
  const rows = keys.map((key) => {
    const property = merged.properties[key];
    const required = merged.required.includes(key);
    return [
      `\`${options.prefix || ''}${key}\``,
      required ? 'required' : 'optional',
      escapeCell(typeSummary(property)),
      escapeCell(acceptedValues(property)),
      escapeCell(defaultBehavior(key, property, required)),
      escapeCell(validationBehavior(key, property, required)),
      escapeCell(selectorImplication(key, objectName)),
      escapeCell(mapperImplication(key, objectName)),
      options.stability || (objectName.includes('Mapper') ? 'Experimental' : 'Supported'),
      yamlCue(objectKey, key),
      escapeCell(purposeFor(objectName, key, property))
    ];
  });
  return [
    `### ${objectName}`,
    '',
    '| Attribute | Required | Type / Values | Accepted Values Or Format | Default | Validation | Selector Impact | Mapper Impact | Stability | Minimal YAML Cue | Purpose |',
    '|---|---|---|---|---|---|---|---|---|---|---|',
    ...rows.map((row) => `| ${row.join(' | ')} |`),
    ''
  ].join('\n');
}

function escapeCell(value) {
  return String(value)
    .replace(/\|/g, '\\|')
    .replace(/\[/g, '&#91;')
    .replace(/\]/g, '&#93;')
    .replace(/\n/g, '<br>');
}

function extractArrayConstants(relativePath) {
  const source = readText(relativePath);
  const constants = {};
  const matcher = /(?:export\s+)?const\s+(\w+)\s*=\s*\[([\s\S]*?)\]\s*(?:as\s+const)?;/g;
  let match;
  while ((match = matcher.exec(source)) !== null) {
    constants[match[1]] = [...match[2].matchAll(/'([^']+)'/g)].map((entry) => entry[1]);
  }
  return constants;
}

function extractStringConstants(relativePath) {
  const source = readText(relativePath);
  const constants = {};
  const matcher = /(?:export\s+)?const\s+(\w+)(?::[^=]+)?\s*=\s*'([^']+)';/g;
  let match;
  while ((match = matcher.exec(source)) !== null) {
    constants[match[1]] = match[2];
  }
  return constants;
}

const styleArrayConstants = {
  ...extractArrayConstants('packages/topoviewer/src/core/styleDefaults.ts'),
  ...extractArrayConstants('packages/topoviewer/src/core/nodeShapes.ts'),
  ...extractArrayConstants('packages/topoviewer/src/core/nodeStyle.ts'),
  ...extractArrayConstants('packages/topoviewer/src/core/edgeStyle.ts'),
  ...extractArrayConstants('packages/topoviewer/src/core/regionStyle.ts'),
  ...extractArrayConstants('packages/topoviewer/src/core/types.ts')
};
const styleStringConstants = {
  ...extractStringConstants('packages/topoviewer/src/core/styleDefaults.ts'),
  ...extractStringConstants('packages/topoviewer/src/core/nodeShapes.ts'),
  ...extractStringConstants('packages/topoviewer/src/core/nodeStyle.ts'),
  ...extractStringConstants('packages/topoviewer/src/core/edgeStyle.ts'),
  ...extractStringConstants('packages/topoviewer/src/core/regionStyle.ts'),
  ...extractStringConstants('packages/topoviewer/src/core/types.ts')
};

function splitTopLevelArgs(source) {
  const args = [];
  let current = '';
  let depth = 0;
  let quote;
  let escaped = false;

  for (const char of source) {
    if (quote) {
      current += char;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = undefined;
      }
      continue;
    }

    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      current += char;
      continue;
    }
    if (char === '(' || char === '[' || char === '{') depth += 1;
    if (char === ')' || char === ']' || char === '}') depth -= 1;
    if (char === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  if (current.trim()) args.push(current.trim());
  return args;
}

function extractDefCalls(source) {
  const calls = [];
  let index = 0;
  while (index < source.length) {
    const start = source.indexOf('def(', index);
    if (start === -1) break;
    let cursor = start + 4;
    let depth = 1;
    let quote;
    let escaped = false;
    while (cursor < source.length && depth > 0) {
      const char = source[cursor];
      if (quote) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === quote) {
          quote = undefined;
        }
      } else if (char === '\'' || char === '"' || char === '`') {
        quote = char;
      } else if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
      }
      cursor += 1;
    }
    calls.push(source.slice(start + 4, cursor - 1));
    index = cursor;
  }
  return calls;
}

function unquote(value) {
  const trimmed = String(value || '').trim();
  if ((trimmed.startsWith('\'') && trimmed.endsWith('\'')) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseStyleTargets(value) {
  return [...value.matchAll(/'([^']+)'/g)].map((entry) => entry[1]);
}

function parseDefaultSummary(expression) {
  if (!expression) return 'No TopoViewer default; authored only.';
  const trimmed = expression.trim();
  if (trimmed.startsWith('value(')) {
    const args = splitTopLevelArgs(trimmed.slice('value('.length, -1));
    const raw = unquote(args[0]);
    return `Defaults to \`${styleStringConstants[raw] || raw}\`.`;
  }
  if (trimmed.startsWith('derived(')) {
    const args = splitTopLevelArgs(trimmed.slice('derived('.length, -1));
    const description = unquote(args[1] || 'Derived from another rendered value.');
    const fallback = args[2] ? ` Fallback: \`${unquote(args[2])}\`.` : '';
    return `${description}${fallback}`;
  }
  if (trimmed.startsWith('none(')) {
    const args = splitTopLevelArgs(trimmed.slice('none('.length, -1));
    return args[0] ? unquote(args[0]) : 'No TopoViewer default; authored only.';
  }
  return 'No TopoViewer default; authored only.';
}

function dataTypeValuesSummary(dataType, expression) {
  if (expression) {
    const trimmed = expression.trim();
    if (trimmed.startsWith('[')) {
      const values = [...trimmed.matchAll(/'([^']+)'/g)].map((entry) => `\`${entry[1]}\``);
      if (values.length) return values.join(', ');
    }
    const values = styleArrayConstants[trimmed];
    if (values?.length) return values.map((value) => `\`${value}\``).join(', ');
  }

  const fallback = {
    boolean: '`true`, `false`',
    color: 'Any CSS color or supported theme variable.',
    enum: 'See accepted values.',
    integer: 'Finite integer number.',
    number: 'Finite number.',
    numberList: 'Space-separated string, comma-separated string, number, or number array.',
    text: 'String value.'
  };
  return fallback[dataType] || 'Any valid value for the documented data type.';
}

function extractStyleDefinitions() {
  const source = readText('packages/topoviewer/src/core/styleDefaults.ts');
  return extractDefCalls(source).filter((call) => call.trim().startsWith('[')).map((call) => {
    const args = splitTopLevelArgs(call);
    const dataType = unquote(args[3]);
    return {
      targets: parseStyleTargets(args[0]).join(', '),
      key: unquote(args[1]),
      label: unquote(args[2]),
      dataType,
      use: unquote(args[4]),
      values: dataTypeValuesSummary(dataType, args[6]),
      defaults: parseDefaultSummary(args[5])
    };
  }).sort((a, b) => a.targets.localeCompare(b.targets) || a.key.localeCompare(b.key));
}

function styleTargetSections() {
  const definitions = extractStyleDefinitions();
  const targetOrder = ['node', 'link', 'linkDirection', 'path', 'region', 'shape', 'callout', 'text'];
  return targetOrder.map((target) => {
    const rows = definitions
      .filter((definition) => definition.targets.split(', ').includes(target) || (target === 'linkDirection' && definition.targets.split(', ').includes('link')))
      .map((definition) => `| \`${definition.key}\` | ${definition.dataType} | ${escapeCell(definition.values)} | ${escapeCell(definition.defaults)} | ${escapeCell(definition.use)} |`);
    if (!rows.length) return '';
    const title = target === 'linkDirection' ? 'Link Direction Style Keys' : `${target[0].toUpperCase()}${target.slice(1)} Style Keys`;
    const note = target === 'linkDirection'
      ? ['', '`linkDirection` is the virtual selector subject for per-direction strokes declared under `graph.links[].directions`. It reuses the compatible link/path edge style surface.', '']
      : [''];
    return [
      `## ${title}`,
      ...note,
      '| Key | Data Type | Values | Default | Use |',
      '|---|---|---|---|---|',
      ...rows,
      ''
    ].join('\n');
  }).filter(Boolean);
}

function styleReferencePage() {
  return [
    '<!-- Generated by scripts/sync-object-reference.mjs. Do not edit directly. -->',
    '# Stylesheet Reference',
    '',
    'This page is generated from `packages/topoviewer/src/core/styleDefaults.ts`. It is the canonical public table for stylesheet keys, data types, accepted values, defaults, and intended use.',
    '',
    'Use [Style Your First Topology](../start/style-your-first-topology.md) and [TopoViewer Stylesheet](topoviewer-stylesheet.md) for workflow and recipes. Use this page when you need the exact key contract.',
    '',
    ...styleTargetSections(),
    '## Drift Guard',
    '',
    'Run this before publishing docs:',
    '',
    '```bash',
    'npm run check:object-reference',
    '```',
    '',
    'The check fails if this page is not regenerated after style-registry changes. `npm run sync:docs` regenerates it.',
    ''
  ].join('\n');
}

function styleRegistryTable() {
  const definitions = extractStyleDefinitions();
  const rows = definitions.map((definition) => {
    const firstTarget = definition.targets.split(', ')[0];
    return `| \`${definition.key}\` | ${definition.targets} | ${definition.dataType} | [Stylesheet reference](stylesheet-reference.md#${firstTarget}-style-keys) | \`style.${definition.key}: ...\` |`;
  });
  return [
    '### Renderer Style Registry',
    '',
    'This table is generated from `packages/topoviewer/src/core/styleDefaults.ts`. It is a drift guard for public style-key discoverability. Use the Stylesheet Reference page for full accepted values, defaults, and examples.',
    '',
    '| Style Key | Targets | Data Type | Detail | Minimal YAML Cue |',
    '|---|---|---|---|---|',
    ...rows,
    ''
  ].join('\n');
}

const topologySections = [
  ['document', 'Document Root', { type: 'object', properties: topologySchema.properties }],
  ['graph', 'Graph', topologySchema.definitions.graph],
  ['layer', 'Layer', topologySchema.definitions.layer],
  ['graphEntity', 'Common Graph Entity Fields', topologySchema.definitions.graphEntity],
  ['node', 'Node', topologySchema.definitions.node],
  ['link', 'Link', topologySchema.definitions.link],
  ['linkDirection', 'Link Direction', topologySchema.definitions.linkDirection],
  ['path', 'Path', topologySchema.definitions.path],
  ['region', 'Region', topologySchema.definitions.region],
  ['diagram', 'Diagram', topologySchema.definitions.diagram],
  ['shape', 'Diagram Shape', topologySchema.definitions.shape],
  ['callout', 'Callout', topologySchema.definitions.callout],
  ['text', 'Text', topologySchema.definitions.text],
  ['pin', 'Pin', topologySchema.definitions.pin],
  ['toggle', 'Toggle', topologySchema.definitions.toggle],
  ['layout', 'Layout', topologySchema.definitions.layout],
  ['closLayout', 'CLOS Layout Options', topologySchema.definitions.closLayout],
  ['treeLayout', 'Tree Layout Options', topologySchema.definitions.treeLayout],
  ['limits', 'Renderer Limits', topologySchema.definitions.limits],
  ['icon', 'Icon', topologySchema.definitions.icon],
  ['styleRule', 'Stylesheet Rule', topologySchema.definitions.styleRule],
  ['style', 'Schema Style Object', topologySchema.definitions.style]
];

const attentionSections = [
  ['attention', 'Attention Root', attentionSchema.definitions.attention],
  ['focusQuery', 'Attention Focus Query', attentionSchema.definitions.focusQuery],
  ['focusDependencyQuery', 'Attention Dependency Query', attentionSchema.definitions.focusDependencyQuery],
  ['focusChangeQuery', 'Attention Change Query', attentionSchema.definitions.focusChangeQuery],
  ['aggregate', 'Attention Aggregate', attentionSchema.definitions.aggregate],
  ['aggregateGroup', 'Attention Aggregate Group', attentionSchema.definitions.aggregateGroup],
  ['aggregateViewport', 'Attention Aggregate Viewport', attentionSchema.definitions.aggregateViewport],
  ['attentionLinks', 'Attention Links', attentionSchema.definitions.attentionLinks],
  ['linkGrouping', 'Attention Link Grouping', attentionSchema.definitions.linkGrouping],
  ['linkGroupingViewport', 'Attention Link Grouping Viewport', attentionSchema.definitions.linkGroupingViewport]
].filter(([, , definition]) => definition);

const mapperSections = [
  ['mapperRoot', 'Mapper Root', { type: 'object', properties: mapperSchema.properties, required: mapperSchema.required }],
  ['mapperRule', 'Mapper Compact Rule', mapperSchema.definitions.authoringRule],
  ['mapperMapping', 'Mapper Canonical Mapping', mapperSchema.definitions.mapping],
  ['mapperTarget', 'Mapper Target', mapperSchema.definitions.target],
  ['mapperResolver', 'Mapper Resolver', mapperSchema.definitions.resolver],
  ['mapperMapping', 'Mapper Value Selector', mapperSchema.definitions.value],
  ['mapperMapping', 'Mapper Thresholds', mapperSchema.definitions.thresholds],
  ['mapperOverlay', 'Mapper Overlay', mapperSchema.definitions.overlay],
  ['mapperMapping', 'Mapper Conditional Style', mapperSchema.definitions.conditionalStyle],
  ['mapperMapping', 'Mapper Condition', mapperSchema.definitions.condition]
].filter(([, , definition]) => definition);

const content = [
  '<!-- Generated by scripts/sync-object-reference.mjs. Do not edit directly. -->',
  '# Object Attributes',
  '',
  'This page is generated from the public JSON Schemas and the renderer style defaults registry. It exists so developers can discover public TopoViewer object attributes without reading source code, and so CI can detect docs drift when schema, style, mapper, or authoring metadata changes.',
  '',
  'Use this reference with:',
  '',
  '- [Reference model](reference-model.md) for the conceptual model;',
  '- [TopoViewer Stylesheet](topoviewer-stylesheet.md) for detailed style-key accepted values and examples;',
  '- [Grafana TopoViewer Panel](../examples/use-cases/grafana-topoviewer-panel.md) for mapper workflow and telemetry examples;',
  '- [YAML schemas](yaml-schemas.md) for editor configuration and validation commands.',
  '',
  '## Topology And Stylesheet Objects',
  '',
  ...topologySections.map(([objectKey, objectName, definition]) => markdownTable(topologySchema, objectKey, objectName, definition)),
  openMapSection(
    'Labels Map',
    'labels',
    'object of scalar values',
    'Low-cardinality classification map used by selectors, filtering, mapper joins, and host applications.',
    'Primary selector namespace: `[labels.<key> = "..."]`.',
    'Mapper `label` resolver can join telemetry labels to `labels.<key>`.'
  ),
  openMapSection(
    'Data Bag',
    'data',
    'object of arbitrary JSON/YAML values',
    'Domain facts, inventory IDs, counters, addresses, and other host-defined metadata.',
    'Selector namespace: `[data.<key> = "..."]` for stable scalar facts.',
    'Mapper `data` resolver can join telemetry labels to `data.<key>`; mapper templates can read supported fields.'
  ),
  styleRegistryTable(),
  '## Attention Objects',
  '',
  ...attentionSections.map(([objectKey, objectName, definition]) => markdownTable(attentionSchema, objectKey, objectName, definition)),
  '## Grafana Mapper Objects',
  '',
  ...mapperSections.map(([objectKey, objectName, definition]) => markdownTable(mapperSchema, objectKey, objectName, definition, { stability: 'Experimental' })),
  '## Drift Guard',
  '',
  'Run this before publishing docs:',
  '',
  '```bash',
  'npm run check:object-reference',
  '```',
  '',
  'The check fails if this page is not regenerated after schema or style-registry changes. `npm run sync:docs` regenerates it.',
  ''
].join('\n');

if (writeIfChanged(outputPath, `${content.trim()}\n`)) {
  console.log(`generated ${path.relative(repoRoot, outputPath)}`);
}

const styleReferenceContent = styleReferencePage();
if (writeIfChanged(styleReferencePath, `${styleReferenceContent.trim()}\n`)) {
  console.log(`generated ${path.relative(repoRoot, styleReferencePath)}`);
}
