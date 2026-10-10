#!/usr/bin/env node
import './sync-component-reference.mjs';

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
  if (key === 'parent' && objectName === 'Node') return 'Containing node ID. Child rendering is controlled by the view toggle; this is distinct from region membership.';
  if (key === 'parent' && objectName === 'Link') return 'Parent link that visually carries this child lane. The child keeps its real source and target IDs.';
  if (key === 'parent' && objectName === 'Path') return 'Parent path that carries this child route. The child retains its own endpoints and uses the parent sequence.';
  if (key === 'parent' && objectName === 'Region') return 'Parent region ID establishing nested membership. Cyclic containment is rejected.';
  if (key === 'layers' && objectName === 'Graph') return 'Available visibility layers. Each object references these declared IDs in its layers list.';
  if (property?.description) return property.description;
  const hints = {
    '$schema': 'Optional editor/schema hint.',
    graph: 'Semantic objects and relationships: declared layers, nodes, links, paths, and regions.',
    diagram: 'Explanatory shapes, text, callouts, and connectors. These do not create graph connectivity.',
    version: 'Document contract version. Canonical topology and stylesheet bundles use 0.2; mapper rules have their own version contract.',
    attention: 'Initial focus, context, aggregation, and parallel-link grouping policy.',
    stylesheet: 'Ordered selector rules assigning presentation to matching topology or diagram objects.',
    layout: 'Layout policy; manual uses source positions, while force, CLOS, and tree compute positions.',
    limits: 'Object and image guardrails checked before the renderer mounts a graph.',
    icons: 'Named reusable glyphs, safe image references, or sanitized inline SVG definitions.',
    labelFields: 'Ordered source fields to use for visible names when no style rule supplies a label.',
    toggles: 'Named display switches with initial reader-visible values.',
    nodes: 'Identified entities such as routers, services, workloads, or interfaces.',
    links: 'Direct relationships with two endpoints. Their domain meaning is supplied by the author.',
    paths: 'Identified ordered routes or carried service paths; these do not calculate routing.',
    regions: 'Membership or containment boundaries around identified objects.',
    sequence: 'Ordered node IDs visited by the path. Consecutive entries become rendered path segments.',
    directions: 'Independent source-to-target and target-to-source channels on one relationship.',
    text: 'Visible annotation text. It explains a view without creating a graph entity.',
    title: 'Short heading displayed in the callout or configured annotation.',
    markdown: 'Callout body with supported Markdown formatting. Unsafe HTML and image payloads are sanitized.',
    pins: 'Named attachment points on an owner for precise explanatory leader endpoints.',
    geometry: 'Annotation geometry or metaphor. Choose it for communication rather than connectivity.',
    maxNodes: 'Maximum node count accepted for rendering. Increase only within a measured host capacity.',
    maxEdges: 'Maximum compiled edge count accepted for rendering.',
    maxRegions: 'Maximum region count; development-only relative to the 0.5.0 schema.',
    maxPins: 'Maximum pin count; development-only relative to the 0.5.0 schema.',
    maxPathSegments: 'Maximum compiled path segment count accepted for rendering.',
    maxImageBytes: 'Maximum embedded image payload size accepted by renderer validation.',
    mode: 'Mode selecting the behavior of this object; use the values below and its related workflow guide.',
    query: 'Criteria selecting the focused objects. Combine only criteria that express the intended focus set.',
    groups: 'Explicit groups of identified members that may appear as aggregate summaries.',
    expandedGroupIds: 'Groups initially shown as individual members rather than collapsed summaries.',
    collapseBelowZoom: 'Lower zoom threshold for switching a configured group into a summary.',
    expandAboveZoom: 'Upper zoom threshold for returning a configured group to its members.',
    threshold: 'Minimum relationship count that activates the configured grouping behavior.',
    depth: 'Maximum traversal distance from focus seeds in the dependency graph.',
    since: 'Change cutoff timestamp used by a change-focus query.',
    resolve: 'Rule defining how telemetry identities join to a known topology object.',
    overlay: 'Runtime-only style, badge, or metric presentation derived from telemetry.',
    mappings: 'Canonical telemetry mapping rules. They do not rewrite the source topology.',
    rules: 'Compact authoring rules expanded into canonical telemetry mappings.',
    severity: 'Operational severity supplied by authored or observed data; keep its origin explicit.',
    src: 'Safe image URL. Allowed schemes and sanitization are enforced by the renderer.',
    svg: 'Inline SVG sanitized before display. Keep meaningful icon alternatives in alt.',
    alt: 'Text alternative describing the icon or image meaning.',
    glyph: 'Compact fallback text shown when using a glyph-based icon.',
    fill: 'Icon body fill color, distinct from graph node body styling.',
    stroke: 'Icon outline color, distinct from relationship stroke styling.',
    id: 'Stable identifier used by references, selectors, mapper joins, and diagnostics.',
    name: 'Human-readable display name.',
    label: 'Fallback display label.',
    labels: 'Low-cardinality classification data for selectors, filters, and mapper joins.',
    data: 'Arbitrary facts for domain metadata, selectors, mappers, and host applications.',
    handles: 'Named node connection anchors for precise link attachment, usually used for ports or interfaces.',
    layers: 'Visibility layer IDs that include this object.',
    style: 'Visual properties applied to objects matched by this stylesheet rule.',
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

function defaultBehavior(key, property, required, objectKey) {
  if (key === "layers" && objectKey === "graph") return "Declare the available visibility layers; objects reference these IDs.";
  if (property?.default !== undefined) return `Defaults to \`${String(property.default)}\`.`;
  if (required) return 'Required; no default.';
  if (key === 'labels' || key === 'data') return 'Defaults to an empty object when absent.';
  if (key === 'layers') return 'Absent or empty means hidden. Select at least one declared member layer.';
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

function markdownTable(schema, objectKey, objectName, definition) {
  const merged = mergeObjectDefinition(schema, definition);
  const keys = Object.keys(merged.properties).sort();
  const source = `https://github.com/asadarafat/topoviewer/blob/development/packages/topoviewer/schemas/${objectName.includes('Mapper') ? 'topoviewer-mapper' : objectKey.startsWith('attention') || schema === attentionSchema ? 'topoviewer-mkdocs-block' : 'topoviewer'}.schema.json`;
  return [
    `# ${objectName} fields`, '',
    '[Field lookup](../object-attributes.md) · [YAML field contracts](../reference-model.md) · [Validate YAML](../../author/validate-yaml.md)', '',
    objectName.includes('Mapper') ? '**Support status:** Experimental' : 'Applies to the development document contract. Check [documentation versions](../../start/documentation-versions.md) against your installed package.', '',
    ...keys.flatMap((key) => {
      const property = merged.properties[key];
      const required = merged.required.includes(key);
      const referenced = property.$ref?.replace(/^#\/definitions\//, '');
      const description = purposeFor(objectName, key, property);
      const usefulDescription = description === `${objectName} attribute.`
        ? `The \`${key}\` field accepts ${typeSummary(property)}. Its complete constraints are in the [public schema](${source}).`
        : description.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
      const constraints = validationBehavior(key, property, required);
      return [`## ${key}`, '', usefulDescription, '',
        `**Type:** ${escapeCell(typeSummary(property))}. **${required ? 'Required' : 'Optional'}.** ${defaultBehavior(key, property, required, objectKey)}`, '',
        ...(property.enum || property.const !== undefined || property.pattern || property.minimum !== undefined || property.oneOf ? [`**Values:** ${acceptedValues(property)}${property.maximum !== undefined ? ` Maximum: ${property.maximum}.` : ''}`, ''] : []),
        ...(constraints !== 'Schema/type validation applies.' ? [`**Validation:** ${constraints}.`, ''] : []),
        ...(referenced && referenceObjectKeys.has(referenced) ? [`[${definitionName(property.$ref)} fields](${referenced}.md)`, ''] : []),
        ...(['id', 'labels', 'data', 'source', 'target'].includes(key) ? [selectorImplication(key, objectName), ''] : [])];
    })
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

function dataTypeValuesSummary(dataType, expression, key) {
  if (expression) {
    const trimmed = expression.trim();
    if (trimmed.startsWith('[')) {
      const values = [...trimmed.matchAll(/'([^']+)'/g)].map((entry) => `\`${entry[1]}\``);
      if (values.length) return values.join(', ');
    }
    const values = styleArrayConstants[trimmed];
    if (values?.length) return values.map((value) => `\`${value}\``).join(', ');
  }

  const schemaProperty = topologySchema.definitions.style.properties[key];
  if (dataType === 'number' || dataType === 'integer') {
    const numberType = dataType === 'integer' ? 'Finite integer' : 'Finite number';
    const { minimum, maximum } = schemaProperty || {};
    if (minimum !== undefined && maximum !== undefined) {
      return `${numberType} from ${minimum} to ${maximum}, inclusive.`;
    }
    if (minimum !== undefined) return `${numberType} >= ${minimum}.`;
    if (maximum !== undefined) return `${numberType} <= ${maximum}.`;
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
    const key = unquote(args[1]);
    return {
      targets: parseStyleTargets(args[0]).join(', '),
      key,
      label: unquote(args[2]),
      dataType,
      use: unquote(args[4]),
      values: dataTypeValuesSummary(dataType, args[6], key),
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
  ['mapperValue', 'Mapper Value Selector', mapperSchema.definitions.value],
  ['mapperThresholds', 'Mapper Thresholds', mapperSchema.definitions.thresholds],
  ['mapperOverlay', 'Mapper Overlay', mapperSchema.definitions.overlay],
  ['mapperConditionalStyle', 'Mapper Conditional Style', mapperSchema.definitions.conditionalStyle],
  ['mapperCondition', 'Mapper Condition', mapperSchema.definitions.condition]
].filter(([, , definition]) => definition);

const referenceObjectKeys = new Set([...topologySections, ...attentionSections, ...mapperSections].map(([key]) => key).filter((key) => !["style", "graphEntity"].includes(key)));
const groups = [
  ['Graph and diagram', topologySchema, topologySections.filter(([key]) => !['style', 'graphEntity'].includes(key))],
  ['Attention', attentionSchema, attentionSections],
  ['Telemetry mapper', mapperSchema, mapperSections]
];
const index = ['<!-- Generated by scripts/sync-object-reference.mjs. Do not edit directly. -->', '# Object Attributes', '',
  'Choose an object below for its fields, types, defaults, and constraints. Start with [Choose graph objects](topology-model.md) when deciding what to model, or [YAML field contracts](reference-model.md) for ownership and complete relationship examples.', '',
  'Style properties have their own [style key lookup](stylesheet-reference.md). [Component props and events](component-props.md) documents the React host contract. These references follow [development](../start/documentation-versions.md).', ''];
for (const [name, schema, sections] of groups) {
  const legacyAnchor = name === 'Graph and diagram' ? 'topology-and-stylesheet-objects' : name === 'Attention' ? 'attention-objects' : 'grafana-mapper-objects';
  index.push(`<span id="${legacyAnchor}"></span>`, '', `## ${name}`, '');
  for (const [key, title, definition] of sections) {
    // Keep the original index anchors while moving each field contract to its own page.
    index.push(`### ${title}`, '', `[Read ${title.toLowerCase()} fields](objects/${key}.md).`, '');
    const file = path.join(path.dirname(outputPath), 'objects', `${key}.md`);
    writeIfChanged(file, markdownTable(schema, key, title, definition));
  }
}
index.push('## Shared fields and style', '', '### Common Graph Entity Fields', '', 'Graph objects share stable IDs, labels, data, and layer membership. Read the [node fields](objects/node.md) for these contracts; links, paths, and regions add their own relationship fields.', '', '### Labels Map', '', 'Use scalar classification values such as `labels: { name: Edge A, role: access }`. Match them with `node[labels.role = "access"]`.', '',
  '### Data Bag', '', 'Use domain facts such as `data: { utilization: 38, severity: normal }`. The host owns their meaning and update policy.', '',
  '### Schema Style Object', '', '[Style key lookup](stylesheet-reference.md) documents the visual properties allowed in a stylesheet rule.', '',
  '### Renderer Style Registry', '', '[Style key lookup](stylesheet-reference.md) is generated from the same registry as runtime defaults.', '');
index.push('## Drift Guard', '', 'The documentation build checks these generated field pages against the public schemas and component declarations. Update the source generator and schema together; do not edit projections.', '');
writeIfChanged(outputPath, index.join('\n'));
const styleIndex = ['<!-- Generated by scripts/sync-object-reference.mjs. Do not edit directly. -->', '# Stylesheet Reference', '',
  'Look up a key by the object it styles. Each key has its exact values, default, and purpose. For selector syntax and worked examples, use [Stylesheet recipes](topoviewer-stylesheet.md).', ''];
for (const section of styleTargetSections()) {
  const title = section.match(/^## (.*)/)[1];
  const target = title === 'Link Direction Style Keys' ? 'linkDirection' : title.split(' ')[0].toLowerCase();
  const definitions = extractStyleDefinitions().filter((d) => d.targets.split(', ').includes(target) || (target === 'linkDirection' && d.targets.split(', ').includes('link')));
  styleIndex.push(`## ${title}`, '', `[Read ${title.toLowerCase()}](styles/${target}.md).`, '');
  const body = [`# ${title}`, '', '[Style key lookup](../stylesheet-reference.md) · [Stylesheet recipes](../topoviewer-stylesheet.md)', '',
    `Use the \`${target}\` selector subject. Appearance belongs in stylesheet rules; stable IDs and relationships belong in topology YAML.`, '',
    ...definitions.flatMap((d) => [`## \`${d.key}\``, '', d.use, '', `**Type:** ${d.dataType}. **Values:** ${d.values}`, '', `**Default:** ${d.defaults}`, ''])];
  writeIfChanged(path.join(path.dirname(styleReferencePath), 'styles', `${target}.md`), body.join('\n'));
}
styleIndex.push('## Drift Guard', '', 'Style-key pages are generated from the canonical runtime registry. CI checks coverage, values, and defaults against that same registry.', '');
writeIfChanged(styleReferencePath, styleIndex.join('\n'));
