import type { TopoDocument } from 'topoviewer';
import {
  mapperAuthoringMetadata,
  styleAuthoringMetadata,
  styleAuthoringMetadataByTarget
} from 'topoviewer/authoring';
import type { StyleTargetKind } from 'topoviewer';
import type { StudioDocumentKind, StudioProject } from '../../contracts/project';
import { parseStudioSource, sourcePathAtOffset, sourceRangeAtPath } from '../../session/yamlSource';

export interface StudioYamlAssistItem {
  detail: string;
  documentation: string;
  insertText: string;
  label: string;
  values?: string[];
}

export interface StudioYamlHover {
  contents: string;
}

export interface StudioYamlAssist {
  completions(document: StudioDocumentKind, context?: StudioYamlCursorInput): StudioYamlAssistItem[];
  hover(document: StudioDocumentKind, word: string, context?: StudioYamlCursorInput): StudioYamlHover | undefined;
  questionMark(document: StudioDocumentKind, context: StudioYamlCursorInput): { endOffset: number; startOffset: number } | undefined;
}

export interface StudioYamlCursorInput {
  offset: number;
  text: string;
}

export type StudioStylesheetCursorKind =
  | 'root'
  | 'stylesheet-sequence'
  | 'selector'
  | 'style-key'
  | 'style-value'
  | 'comment'
  | 'quoted-string'
  | 'block-scalar'
  | 'url'
  | 'unknown';

export interface StudioStylesheetCursorContext {
  existingKeys: string[];
  field?: string;
  kind: StudioStylesheetCursorKind;
  path?: Array<string | number>;
  ruleIndex?: number;
  target?: StyleTargetKind;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function records(values: readonly unknown[] | undefined): Record<string, unknown>[] {
  return (values || []).flatMap((value) => {
    const candidate = record(value);
    return candidate ? [candidate] : [];
  });
}

function unique(items: StudioYamlAssistItem[]) {
  const byLabel = new Map<string, StudioYamlAssistItem>();
  items.forEach((item) => {
    const current = byLabel.get(item.label);
    if (!current || item.documentation.length > current.documentation.length) byLabel.set(item.label, item);
  });
  return [...byLabel.values()].sort((left, right) => left.label.localeCompare(right.label));
}

function item(label: string, detail: string, documentation: string, insertText = label, values?: string[]): StudioYamlAssistItem {
  return { detail, documentation, insertText, label, values };
}

function metadataLeaf(path: string) {
  return path.replace(/\[\]|\.\*/g, '').split('.').at(-1) || path;
}

function graphFacts(document: TopoDocument) {
  const graph = record(document.graph) || {};
  const diagram = record(document.diagram) || {};
  const collections = ['layers', 'nodes', 'links', 'paths', 'regions'] as const;
  const ids = collections.flatMap((collection) => (
    Array.isArray(graph[collection])
      ? (graph[collection] as unknown[]).flatMap((value) => {
          const id = record(value)?.id;
          return typeof id === 'string' ? [id] : [];
        })
      : []
  ));
  const objects = ['nodes', 'links', 'paths', 'regions'].flatMap((collection) => (
    Array.isArray(graph[collection]) ? graph[collection] as unknown[] : []
  )).concat(['shapes', 'callouts', 'texts'].flatMap((collection) => (
    Array.isArray(diagram[collection]) ? diagram[collection] as unknown[] : []
  ))).map(record).filter(Boolean) as Record<string, unknown>[];
  ids.push(...['shapes', 'callouts', 'texts'].flatMap((collection) => (
    Array.isArray(diagram[collection])
      ? (diagram[collection] as unknown[]).flatMap((value) => {
          const id = record(value)?.id;
          return typeof id === 'string' ? [id] : [];
        })
      : []
  )));
  const labelKeys = [...new Set(objects.flatMap((value) => Object.keys(record(value.labels) || {})))];
  const dataKeys = [...new Set(objects.flatMap((value) => Object.keys(record(value.data) || {})))];
  const selectorFacts = objects.flatMap((object) => {
    const id = typeof object.id === 'string' ? object.id : undefined;
    const labels = record(object.labels) || {};
    const data = record(object.data) || {};
    return [
      ...(id ? [{ path: 'id', value: id }] : []),
      ...Object.entries(labels).flatMap(([key, value]) => (
        ['string', 'number', 'boolean'].includes(typeof value) ? [{ path: `labels.${key}`, value: String(value) }] : []
      )),
      ...Object.entries(data).flatMap(([key, value]) => (
        ['string', 'number', 'boolean'].includes(typeof value) ? [{ path: `data.${key}`, value: String(value) }] : []
      ))
    ];
  });
  return { dataKeys, ids, labelKeys, selectorFacts };
}

function entitiesForTarget(document: TopoDocument, target: StyleTargetKind): Record<string, unknown>[] {
  if (target === 'node') return records(document.graph?.nodes);
  if (target === 'link') return records(document.graph?.links);
  if (target === 'path') return records(document.graph?.paths);
  if (target === 'region') return records(document.graph?.regions);
  if (target === 'shape') return records(document.diagram?.shapes);
  if (target === 'callout') return records(document.diagram?.callouts);
  if (target === 'text') return records(document.diagram?.texts);
  return (document.graph?.links || []).flatMap((link) => Object.entries(link.directions || {}).map(([direction, value]) => ({
    ...value,
    id: value.id || `${link.id}:${direction}`
  })));
}

function selectorCompletions(document: TopoDocument, target?: StyleTargetKind): StudioYamlAssistItem[] {
  const targets = target ? [target] : styleTargetKinds;
  return unique(targets.flatMap((kind) => {
    const entities = entitiesForTarget(document, kind);
    const exact = entities.flatMap((entity) => typeof entity.id === 'string'
      ? [item(
          `${kind}[id = "${entity.id}"]`,
          `${kind} exact-ID selector`,
          `Matches only ${entity.id}.`,
          `${kind}[id = "${entity.id}"]`
        )]
      : []);
    const facts = entities.flatMap((entity) => [
      ...Object.entries(record(entity.labels) || {}).flatMap(([key, value]) => (
        ['string', 'number', 'boolean'].includes(typeof value)
          ? [item(
              `${kind}[labels.${key} = "${String(value)}"]`,
              `${kind} label selector`,
              `Matches ${kind} objects whose labels.${key} value is ${String(value)}.`,
              `${kind}[labels.${key} = "${String(value)}"]`
            )]
          : []
      )),
      ...Object.entries(record(entity.data) || {}).flatMap(([key, value]) => (
        ['string', 'number', 'boolean'].includes(typeof value)
          ? [item(
              `${kind}[data.${key} = "${String(value)}"]`,
              `${kind} data selector`,
              `Matches ${kind} objects whose data.${key} value is ${String(value)}.`,
              `${kind}[data.${key} = "${String(value)}"]`
            )]
          : []
      ))
    ]);
    return [item(kind, `${kind} selector`, `Matches every ${kind}.`, kind), ...exact, ...facts];
  }));
}

function styleValueCompletions(
  target: StyleTargetKind | undefined,
  fieldName: string | undefined
): StudioYamlAssistItem[] {
  if (!target || !fieldName) return [];
  const field = styleAuthoringMetadataByTarget[target].find((candidate) => candidate.path === fieldName);
  if (!field) return [];
  const values = field.values || (field.valueType === 'boolean' ? ['true', 'false'] : []);
  const examples = field.examples?.map(String) || [];
  return unique([...values, ...examples].map((value) => item(
    value,
    `${field.label} value`,
    field.description,
    value
  )));
}

const styleTargetKinds: StyleTargetKind[] = [
  'node', 'link', 'linkDirection', 'path', 'region', 'shape', 'callout', 'text'
];

function styleTargetFromSelector(value: unknown): StyleTargetKind | undefined {
  if (typeof value !== 'string') return undefined;
  const target = value.trim().match(/^([a-zA-Z][\w-]*)/)?.[1] as StyleTargetKind | undefined;
  return target && styleTargetKinds.includes(target) ? target : undefined;
}

function lineBounds(text: string, offset: number) {
  const bounded = Math.max(0, Math.min(text.length, offset));
  const start = text.lastIndexOf('\n', Math.max(0, bounded - 1)) + 1;
  const next = text.indexOf('\n', bounded);
  return { end: next < 0 ? text.length : next, start };
}

function lexicalContext(text: string, offset: number): 'comment' | 'quoted-string' | 'url' | undefined {
  const bounds = lineBounds(text, offset);
  const before = text.slice(bounds.start, offset);
  let quote: '"' | "'" | undefined;
  let escaped = false;
  let commentAt = -1;
  for (let index = 0; index < before.length; index += 1) {
    const character = before[index];
    if (quote === '"' && character === '\\' && !escaped) {
      escaped = true;
      continue;
    }
    if (character === quote && !escaped) quote = undefined;
    else if (!quote && (character === '"' || character === "'")) quote = character;
    else if (!quote && character === '#') {
      commentAt = index;
      break;
    }
    escaped = false;
  }
  if (commentAt >= 0) return 'comment';
  if (quote) return 'quoted-string';
  const token = text.slice(bounds.start, bounds.end).split(/\s/).find((value) => value.includes('://'));
  if (token) {
    const tokenStart = text.indexOf(token, bounds.start);
    if (offset >= tokenStart && offset <= tokenStart + token.length) return 'url';
  }
  return undefined;
}

function inBlockScalar(text: string, offset: number): boolean {
  const lines = text.slice(0, offset).split('\n');
  let blockIndent: number | undefined;
  for (const line of lines) {
    if (blockIndent !== undefined) {
      const indent = line.match(/^\s*/)?.[0].length || 0;
      if (line.trim() && indent <= blockIndent) blockIndent = undefined;
    }
    const match = line.match(/^(\s*)[^#\n]+:\s*[>|][+-]?\d?\s*(?:#.*)?$/);
    if (match) blockIndent = match[1].length;
  }
  return blockIndent !== undefined;
}

function nearestRuleIndex(text: string, offset: number): number | undefined {
  const parsed = parseStudioSource('stylesheet', text);
  if (parsed.ok && Array.isArray(parsed.source.value.stylesheet)) {
    for (let index = 0; index < parsed.source.value.stylesheet.length; index += 1) {
      const range = sourceRangeAtPath(parsed.source, ['stylesheet', index]);
      if (range && offset >= range.startOffset && offset <= range.endOffset) return index;
    }
  }
  const before = text.slice(0, offset).split('\n');
  let index = -1;
  for (const line of before) {
    if (/^\s{2}-\s+(?:selector\s*:|style\s*:|$)/.test(line)) index += 1;
  }
  return index >= 0 ? index : undefined;
}

function fallbackRuleFacts(text: string, ruleIndex: number | undefined) {
  if (ruleIndex === undefined) return { existingKeys: [] as string[], target: undefined };
  const lines = text.split('\n');
  let currentRule = -1;
  let inRequestedRule = false;
  let inStyle = false;
  let target: StyleTargetKind | undefined;
  const existingKeys: string[] = [];

  for (const line of lines) {
    if (/^\s{2}-\s*/.test(line)) {
      currentRule += 1;
      inRequestedRule = currentRule === ruleIndex;
      inStyle = false;
    }
    if (!inRequestedRule) continue;
    const selector = line.match(/^\s*(?:-\s*)?selector:\s*['"]?([a-zA-Z][\w-]*)/);
    if (selector) target = styleTargetFromSelector(selector[1]);
    if (/^\s{4}style:\s*/.test(line)) {
      inStyle = true;
      continue;
    }
    if (!inStyle) continue;
    const key = line.match(/^\s{6}([a-zA-Z][\w.]*)\s*:/)?.[1];
    if (key) existingKeys.push(key);
  }
  return { existingKeys: [...new Set(existingKeys)], target };
}

export function stylesheetCursorContext(text: string, offset: number): StudioStylesheetCursorContext {
  const lexical = lexicalContext(text, offset);
  if (lexical) return { existingKeys: [], kind: lexical };
  if (inBlockScalar(text, offset)) return { existingKeys: [], kind: 'block-scalar' };
  const parsed = parseStudioSource('stylesheet', text);
  const path = parsed.ok ? sourcePathAtOffset(parsed.source, offset) : undefined;
  const ruleIndex = typeof path?.[1] === 'number' ? path[1] : nearestRuleIndex(text, offset);
  const rules = parsed.ok && Array.isArray(parsed.source.value.stylesheet)
    ? parsed.source.value.stylesheet as Array<Record<string, unknown>>
    : [];
  const rule = ruleIndex === undefined ? undefined : record(rules[ruleIndex]);
  const fallback = fallbackRuleFacts(text, ruleIndex);
  const target = styleTargetFromSelector(rule?.selector) || fallback.target;
  const existingKeys = [...new Set([
    ...Object.keys(record(rule?.style) || {}),
    ...fallback.existingKeys
  ])];
  const bounds = lineBounds(text, offset);
  const line = text.slice(bounds.start, bounds.end);
  const relativeOffset = offset - bounds.start;
  const mapping = line.match(/^(\s*)(?:-\s+)?([^:#][^:]*):/);
  const colon = mapping ? line.indexOf(':', mapping[1].length) : -1;
  const key = mapping?.[2]?.trim();

  if (key === 'selector' || path?.[2] === 'selector') {
    return { existingKeys, kind: 'selector', path, ruleIndex, target };
  }
  const inStyle = path?.[2] === 'style'
    || (ruleIndex !== undefined && /^\s{6,}/.test(line))
    || (ruleIndex !== undefined && /^\s*$/.test(line));
  if (inStyle) {
    const field = typeof path?.[3] === 'string' ? path[3] : key;
    return {
      existingKeys,
      field,
      kind: colon >= 0 && relativeOffset > colon ? 'style-value' : 'style-key',
      path,
      ruleIndex,
      target
    };
  }
  if (path?.[0] === 'stylesheet' || /^\s{2}-/.test(line)) {
    return { existingKeys, kind: 'stylesheet-sequence', path, ruleIndex, target };
  }
  if (/^\s{2,}$/.test(line) && /^stylesheet\s*:/m.test(text.slice(0, bounds.start))) {
    return { existingKeys, kind: 'stylesheet-sequence', path, ruleIndex, target };
  }
  if (!text.trim() || path?.length === 0) return { existingKeys: [], kind: 'root', path };
  return { existingKeys, kind: 'unknown', path, ruleIndex, target };
}

export function stylesheetQuestionMarkRange(
  text: string,
  offset: number
): { endOffset: number; startOffset: number } | undefined {
  const questionOffset = offset - 1;
  if (questionOffset < 0 || text[questionOffset] !== '?') return undefined;
  const context = stylesheetCursorContext(text, questionOffset);
  if (context.kind !== 'style-key' && context.kind !== 'style-value') return undefined;
  const bounds = lineBounds(text, questionOffset);
  const line = text.slice(bounds.start, bounds.end);
  const before = line.slice(0, questionOffset - bounds.start);
  const after = line.slice(questionOffset - bounds.start + 1);
  const standaloneKey = /^\s*$/.test(before) && /^\s*$/.test(after);
  const standaloneValue = /:\s*$/.test(before) && /^\s*(?:#.*)?$/.test(after);
  return standaloneKey || standaloneValue
    ? { endOffset: questionOffset + 1, startOffset: questionOffset }
    : undefined;
}

const topologyFields = [
  ['graph', 'Topology root', 'Contains stable graph identity and object collections.'],
  ['layers', 'Graph layers', 'Defines reusable topology visibility layers.'],
  ['nodes', 'Graph nodes', 'Defines topology nodes with stable IDs.'],
  ['links', 'Graph links', 'Defines edges between existing node IDs.'],
  ['paths', 'Graph paths', 'Defines traversals over graph reachability.'],
  ['regions', 'Graph regions', 'Defines logical groups and membership.'],
  ['diagram', 'Diagram annotations', 'Contains shapes, callouts, and standalone text.'],
  ['shapes', 'Diagram shapes', 'Defines non-semantic geometry and labels.'],
  ['callouts', 'Diagram callouts', 'Defines explanatory annotation cards and leaders.'],
  ['texts', 'Diagram text', 'Defines standalone, layer-aware text boxes.'],
  ['position', 'Object position', 'Two-number canvas position in document coordinates.'],
  ['labels', 'Selector facts', 'Stable facts used by selectors and integrations.'],
  ['data', 'Object data', 'Domain metadata retained with the topology object.'],
  ['layers', 'Layer membership', 'Layer IDs assigned to this object.']
] as const;

export function createStudioYamlAssist(project: StudioProject, document: TopoDocument): StudioYamlAssist {
  const facts = graphFacts(document);
  const topology = unique([
    ...topologyFields.map(([label, detail, documentation]) => item(label, detail, documentation, `${label}: `)),
    ...facts.ids.map((id) => item(id, 'Topology object ID', 'An existing stable object or layer ID.', id)),
    ...facts.labelKeys.map((key) => item(
      `labels.${key}`, 'Selector fact', `A label key present in the current topology. Use it in selectors such as node[labels.${key} = "value"].`, key
    )),
    ...facts.dataKeys.map((key) => item(
      `data.${key}`, 'Data fact', `A data key present in the current topology. Use it in selectors or mapper joins as data.${key}.`, key
    ))
  ]);
  const stylesheet = unique([
    item('stylesheet', 'Stylesheet rules', 'Ordered selector and style rules.', 'stylesheet:\n  - selector: node\n    style:\n      '),
    item('selector', 'Rule selector', 'Targets topology objects by kind and facts.', 'selector: node'),
    item('style', 'Visual policy', 'Contains fields supported by the selected object type.', 'style:\n  '),
    ...styleAuthoringMetadata.map((field) => item(
      metadataLeaf(field.path),
      `${field.group} · ${field.targets.join(', ')}`,
      `${field.description}${field.values?.length ? ` Accepted values: ${field.values.join(', ')}.` : ''}${field.examples?.length ? ` Examples: ${field.examples.join(', ')}.` : ''}`,
      `${metadataLeaf(field.path)}: `,
      field.values
    )),
    ...facts.labelKeys.map((key) => item(
      `labels.${key}`, 'Selector fact', `Current topology fact available to stylesheet selectors.`, `labels.${key}`
    ))
  ]);
  const mapper = unique([
    ...mapperAuthoringMetadata.map((field) => item(
      metadataLeaf(field.path),
      `${field.group} · ${field.valueType}`,
      `${field.description}${field.values?.length ? ` Accepted values: ${field.values.join(', ')}.` : ''}`,
      `${metadataLeaf(field.path)}: `,
      field.values
    )),
    ...facts.ids.map((id) => item(id, 'Mapper target ID', 'An existing topology object ID available for explicit mapper resolution.', id)),
    item('node_id', 'Common telemetry label', 'Common label used to join telemetry to node IDs.'),
    item('link_id', 'Common telemetry label', 'Common label used to join telemetry to link IDs.'),
    item('direction', 'Directional telemetry label', 'Distinguishes sourceToTarget and targetToSource samples.')
  ]);
  const values: Record<StudioDocumentKind, StudioYamlAssistItem[]> = {
    mapper: project.documents.mapper ? mapper : [],
    stylesheet,
    topology
  };
  return {
    completions(kind, cursor) {
      if (kind !== 'stylesheet' || !cursor) return values[kind];
      const context = stylesheetCursorContext(cursor.text, cursor.offset);
      if (context.kind === 'selector') return selectorCompletions(document, context.target);
      if (context.kind === 'style-key') {
        if (!context.target) return [];
        return styleAuthoringMetadataByTarget[context.target]
          .filter((field) => !context.existingKeys.includes(field.path))
          .map((field) => item(
            field.path,
            `${field.group} · ${context.target}`,
            field.description,
            `${field.path}: `,
            field.values
          ));
      }
      if (context.kind === 'style-value') {
        const field = context.field;
        if (field === 'icon') {
          return Object.keys(document.icons || {}).map((icon) => item(
            icon,
            'Project icon',
            `Icon registered in this topology as ${icon}.`,
            icon
          ));
        }
        return styleValueCompletions(context.target, field);
      }
      if (context.kind === 'root') return [stylesheet[0]];
      if (context.kind === 'stylesheet-sequence') {
        return [
          item('selector', 'Rule selector', 'Targets topology objects by kind and facts.', 'selector: node'),
          item('style', 'Visual policy', 'Contains fields supported by the selected object type.', 'style:\n  ')
        ];
      }
      return [];
    },
    hover(kind, word, cursor) {
      const normalized = word.trim().replace(/:$/, '');
      if (kind === 'stylesheet' && cursor) {
        const context = stylesheetCursorContext(cursor.text, cursor.offset);
        const field = context.target
          ? styleAuthoringMetadataByTarget[context.target].find((candidate) => candidate.path === normalized)
          : styleAuthoringMetadata.find((candidate) => candidate.path === normalized);
        if (field) return {
          contents: `**${field.label}** (\`${field.path}\`)\n\n${field.description}${field.values?.length ? `\n\nAccepted values: ${field.values.join(', ')}` : ''}`
        };
      }
      const match = values[kind].find((candidate) => (
        candidate.label === normalized || metadataLeaf(candidate.label) === normalized
      ));
      return match ? { contents: `**${match.label}**\n\n${match.documentation}` } : undefined;
    },
    questionMark(kind, cursor) {
      return kind === 'stylesheet' ? stylesheetQuestionMarkRange(cursor.text, cursor.offset) : undefined;
    }
  };
}
