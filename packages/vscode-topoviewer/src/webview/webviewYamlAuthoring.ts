import type { TopoDocument } from 'topoviewer';
import topoviewerMapperSchema from 'topoviewer/schemas/topoviewer-mapper.schema.json';
import topoviewerSchema from 'topoviewer/schemas/topoviewer.schema.json';
import topoviewerMkdocsBlockSchema from 'topoviewer/schemas/topoviewer-mkdocs-block.schema.json';
import topoviewerStylesheetSchema from 'topoviewer/schemas/topoviewer-stylesheet.schema.json';
import topoviewerTopologySchema from 'topoviewer/schemas/topoviewer-topology.schema.json';
import type { TopoObjectSelection } from '../shared/topologyMutations';
import {
  styleGroupForKey,
  styleDocumentationForKey,
  styleOptionsByKind,
  styleValueDefinitionForKey
} from './webviewStyleMetadata';

export type YamlAuthoringDocument = 'topology' | 'stylesheet' | 'mapper';

export interface YamlAuthoringSuggestion {
  detail?: string;
  documentation?: string;
  insertText?: string;
  isSnippet?: boolean;
  kind: 'key' | 'reference' | 'selector' | 'snippet' | 'value';
  label: string;
}

export interface YamlAuthoringHover {
  contents: string;
}

export interface YamlAuthoringRequest {
  document: YamlAuthoringDocument;
  layers: Array<{ id: string; name?: string }>;
  lineNumber: number;
  column: number;
  text: string;
  topoDocument?: TopoDocument;
}

export interface PendingYamlFocus {
  column: number;
  document: YamlAuthoringDocument;
  lineNumber: number;
  showSuggestions?: boolean;
}

type JsonSchema = {
  $ref?: string;
  additionalProperties?: boolean | JsonSchema;
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  description?: string;
  enum?: unknown[];
  items?: JsonSchema;
  oneOf?: JsonSchema[];
  properties?: Record<string, JsonSchema | boolean>;
  type?: string | string[];
};

const schemaDocuments = {
  'topoviewer.schema.json': topoviewerSchema as unknown as JsonSchema,
  'topoviewer-mapper.schema.json': topoviewerMapperSchema as unknown as JsonSchema,
  'topoviewer-mkdocs-block.schema.json': topoviewerMkdocsBlockSchema as unknown as JsonSchema,
  'topoviewer-stylesheet.schema.json': topoviewerStylesheetSchema as unknown as JsonSchema,
  'topoviewer-topology.schema.json': topoviewerTopologySchema as unknown as JsonSchema
};

const topologyRootSchema = topoviewerTopologySchema as unknown as JsonSchema;
const stylesheetRootSchema = topoviewerStylesheetSchema as unknown as JsonSchema;
const mapperRootSchema = topoviewerMapperSchema as unknown as JsonSchema;
const baseSchema = topoviewerSchema as unknown as JsonSchema;
const attentionSchema = topoviewerMkdocsBlockSchema as unknown as JsonSchema;

const paletteValueSuggestions = [
  { label: '#1976d2', detail: 'Material UI primary' },
  { label: '#42a5f5', detail: 'Material UI primary light' },
  { label: '#1565c0', detail: 'Material UI primary dark' },
  { label: '#9c27b0', detail: 'Material UI secondary' },
  { label: '#d32f2f', detail: 'Material UI error' },
  { label: '#ed6c02', detail: 'Material UI warning' },
  { label: '#0288d1', detail: 'Material UI info' },
  { label: '#2e7d32', detail: 'Material UI success' }
];

const integerValueSuggestions = ['0', '1', '2', '4', '8', '12', '16', '24', '32', '48', '64', '96'];
const numberValueSuggestions = ['0', '0.25', '0.5', '0.75', '1', '1.5', '2', '4', '8', '16'];

const topologyKeyDocumentation: Record<string, string> = {
  attention: 'Attention defines focus, dimming, collapse, and link grouping behavior.',
  data: 'Data stores operational or host-defined metadata used by styling and attention queries.',
  graph: 'Graph contains layers, nodes, links, paths, and regions.',
  id: 'Stable object identifier used by references, selectors, URLs, and tests.',
  labels: 'Labels classify objects for styling, filtering, attention, and docs examples.',
  layers: 'Layer IDs decide which layer toggles control this object.',
  links: 'Links describe direct relationships between source and target nodes.',
  name: 'Human-readable display name for an object.',
  nodes: 'Nodes are the primary graph objects rendered in the topology.',
  paths: 'Paths describe ordered node sequences for services, transport, or flows.',
  position: 'Explicit canvas coordinates. Dragging a node in the harness updates this field.',
  regions: 'Regions group graph objects visually and semantically.',
  sequence: 'Ordered node IDs traversed by a path.',
  source: 'Source graph node ID for a link.',
  target: 'Target graph node ID for a link.'
};

const stylesheetKeyDocumentation: Record<string, string> = {
  selector: 'Selector choosing which objects this stylesheet rule affects.',
  style: 'Style declaration applied to every object matched by the selector.'
};

const mapperKeyDocumentation: Record<string, string> = {
  accent: 'Optional label/accent color for this severity.',
  badgeLabel: 'Template used for node badge text.',
  by: 'Resolver mode used to match telemetry to TopoViewer objects.',
  color: 'Main overlay color for this severity.',
  conditions: 'Conditional runtime style patches evaluated after the base mapper overlay.',
  contains: 'String containment test for a value, label, or field condition.',
  eq: 'Exact match condition for a value, label, or field.',
  error: 'Threshold where a value becomes error severity.',
  exists: 'Presence test for a value, label, or field condition.',
  field: 'Grafana data-frame field to read; defaults to the sample value.',
  gt: 'Numeric greater-than condition.',
  gte: 'Numeric greater-than-or-equal condition.',
  identity: 'Optional source identity filter before mapper rules are evaluated.',
  info: 'Threshold where a value becomes info severity.',
  key: 'TopoViewer labels or data key used by label/data resolvers.',
  kind: 'TopoViewer target kind affected by this rule.',
  label: 'Template used for rendered label text.',
  lt: 'Numeric less-than condition.',
  lte: 'Numeric less-than-or-equal condition.',
  mappings: 'Metric-to-object mapping rules.',
  metric: 'Grafana data-frame metric name to match.',
  metricLabel: 'Telemetry label used as the join value.',
  ne: 'Negative exact-match condition for a value, label, or field.',
  objectIds: 'Explicit TopoViewer object IDs for static object matching.',
  overlay: 'Runtime-only visual overlay controls.',
  palette: 'Severity colors used by severity-driven runtime overlays.',
  resolve: 'Resolver configuration for the target object kind.',
  rules: 'Human-friendly mapper rules. Prefer this for hand-authored mapper YAML.',
  selector: 'TopoViewer selector used by selector resolver.',
  select: 'TopoViewer object kind or selector affected by this rule.',
  severity: 'Computed mapper severity for conditional style rules.',
  sourceId: 'Expected source identity value.',
  sourceIdLabel: 'Telemetry label carrying source identity.',
  sourceLabel: 'Telemetry label carrying link source node ID.',
  style: 'TopoViewer style patch applied by a mapper overlay or condition.',
  states: 'Named value states such as down, busy, or saturated.',
  target: 'TopoViewer target kind and resolver.',
  targetLabel: 'Telemetry label carrying link target node ID.',
  thresholds: 'Severity thresholds for numeric metric values.',
  value: 'Metric value extraction and semantic interpretation.',
  version: 'Mapper schema version. Use version: 1.',
  when: 'Condition that must match before a conditional style patch is applied.',
  warning: 'Threshold where a value becomes warning severity.'
};

function lineAt(text: string, lineNumber: number) {
  return text.split(/\r?\n/)[Math.max(0, lineNumber - 1)] || '';
}

function linePrefix(text: string, lineNumber: number, column: number) {
  return lineAt(text, lineNumber).slice(0, Math.max(0, column - 1));
}

function lineIndent(line: string) {
  return line.match(/^\s*/)?.[0].length || 0;
}

function resolveSchemaRef(ref: string, fallbackSchema: JsonSchema): JsonSchema | undefined {
  const [documentName, pointer = ''] = ref.includes('#') ? ref.split('#') : ['', ref];
  const source = documentName
    ? schemaDocuments[documentName as keyof typeof schemaDocuments]
    : fallbackSchema;
  if (!source || !pointer.startsWith('/')) return undefined;
  return pointer
    .slice(1)
    .split('/')
    .reduce<JsonSchema | undefined>((current, segment) => {
      if (!current) return undefined;
      const key = segment.replace(/~1/g, '/').replace(/~0/g, '~');
      return (current as Record<string, JsonSchema | undefined>)[key];
    }, source);
}

function mergeSchemaProperties(target: Record<string, JsonSchema>, source?: Record<string, JsonSchema | boolean>) {
  Object.entries(source || {}).forEach(([key, value]) => {
    if (typeof value === 'boolean') return;
    target[key] = value;
  });
}

function collectSchemaProperties(schema: JsonSchema | undefined, fallbackSchema: JsonSchema, seen = new Set<JsonSchema>()): Record<string, JsonSchema> {
  if (!schema || seen.has(schema)) return {};
  seen.add(schema);
  if (schema.$ref) {
    return collectSchemaProperties(resolveSchemaRef(schema.$ref, fallbackSchema), fallbackSchema, seen);
  }
  const properties: Record<string, JsonSchema> = {};
  mergeSchemaProperties(properties, schema.properties);
  [...(schema.allOf || []), ...(schema.anyOf || []), ...(schema.oneOf || [])].forEach((child) => {
    mergeSchemaProperties(properties, collectSchemaProperties(child, fallbackSchema, seen));
  });
  return properties;
}

function schemaDefinitionProperties(schema: JsonSchema, definitionName: string) {
  return collectSchemaProperties(resolveSchemaRef(`#/definitions/${definitionName}`, schema), schema);
}

function isClosLayoutPath(path: string[]): boolean {
  const layoutIndex = path.lastIndexOf('layout');
  if (layoutIndex === -1) return false;
  return path.slice(layoutIndex + 1).includes('clos');
}

function schemaPropertySuggestions(properties: Record<string, JsonSchema>, fallbackDocs: Record<string, string> = {}): YamlAuthoringSuggestion[] {
  return Object.entries(properties).map(([key, schema]) => {
    const enumValues = schema.enum?.map((value) => String(value)).join(', ');
    const valueHint = enumValues
      ? ` Accepted values: ${enumValues}.`
      : schema.type
        ? ` Value type: ${Array.isArray(schema.type) ? schema.type.join(' | ') : schema.type}.`
        : '';
    return {
      detail: 'TopoViewer schema key',
      documentation: `${schema.description || fallbackDocs[key] || `TopoViewer ${key} field.`}${valueHint}`,
      insertText: `${key}: `,
      kind: 'key',
      label: key
    };
  });
}

function yamlPathAtLine(text: string, lineNumber: number) {
  const stack: Array<{ indent: number; key: string }> = [];
  text.split(/\r?\n/).slice(0, Math.max(0, lineNumber)).forEach((line) => {
    const match = line.match(/^(\s*)(?:-\s*)?([A-Za-z][A-Za-z0-9_]*)\s*:/);
    if (!match) return;
    const indent = match[1]?.length || 0;
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    stack.push({ indent, key: match[2] });
  });
  return stack.map((entry) => entry.key);
}

function currentYamlKey(request: YamlAuthoringRequest) {
  const prefix = linePrefix(request.text, request.lineNumber, request.column);
  return prefix.match(/(?:^|\s)([A-Za-z][A-Za-z0-9]*)\s*:\s*[^:]*$/)?.[1];
}

function isKeyContext(request: YamlAuthoringRequest) {
  const prefix = linePrefix(request.text, request.lineNumber, request.column).trim();
  return prefix === '' || prefix === '-' || /^-?\s*[A-Za-z][A-Za-z0-9]*$/.test(prefix);
}

function isInsideQuotedScalar(prefix: string) {
  const singleQuotes = (prefix.match(/'/g) || []).length;
  const doubleQuotes = (prefix.match(/"/g) || []).length;
  return singleQuotes % 2 === 1 || doubleQuotes % 2 === 1;
}

function isCommentContext(prefix: string) {
  const commentIndex = prefix.indexOf('#');
  return commentIndex !== -1 && !isInsideQuotedScalar(prefix.slice(0, commentIndex));
}

function isScalarValueContext(prefix: string) {
  return /:\s+\S/.test(prefix) || /^\s*-\s+\S/.test(prefix);
}

export function shouldOpenYamlHelp(request: YamlAuthoringRequest) {
  const prefix = linePrefix(request.text, request.lineNumber, request.column);
  if (isCommentContext(prefix) || isInsideQuotedScalar(prefix) || isScalarValueContext(prefix)) return false;
  return isKeyContext(request) || prefix.trim().endsWith(':');
}

function isStylesheetStyleContext(request: YamlAuthoringRequest) {
  const lines = request.text.split(/\r?\n/);
  const currentIndent = lineIndent(lines[Math.max(0, request.lineNumber - 1)] || '');
  for (let index = request.lineNumber - 2; index >= 0; index -= 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    const indent = lineIndent(line);
    if (/^\s*(?:-\s*)?style:\s*$/.test(line) && indent < currentIndent) return true;
    if (/^\s*-\s*selector:/.test(line) && indent < currentIndent) return false;
    if (/^\s*stylesheet:\s*$/.test(line) && indent < currentIndent) return false;
  }
  return false;
}

function isMapperStyleContext(request: YamlAuthoringRequest) {
  const lines = request.text.split(/\r?\n/);
  const currentIndent = lineIndent(lines[Math.max(0, request.lineNumber - 1)] || '');
  for (let index = request.lineNumber - 2; index >= 0; index -= 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    const indent = lineIndent(line);
    if (/^\s*(?:-\s*)?style:\s*$/.test(line) && indent < currentIndent) return true;
    if (/^\s*(?:overlay|conditions|target|mappings):\s*$/.test(line) && indent < currentIndent) return false;
  }
  return false;
}

function selectorKindForContext(request: YamlAuthoringRequest): TopoObjectSelection['kind'] {
  const lines = request.text.split(/\r?\n/);
  const allowed = new Set<TopoObjectSelection['kind']>(['node', 'link', 'linkDirection', 'path', 'region', 'callout', 'shape']);
  for (let index = request.lineNumber - 1; index >= 0; index -= 1) {
    const kind = lines[index]?.match(/selector:\s*["']?([A-Za-z][A-Za-z0-9_-]*)/)?.[1];
    if (allowed.has(kind as TopoObjectSelection['kind'])) return kind as TopoObjectSelection['kind'];
  }
  return 'node';
}

function fieldValuePairs(objects: any[], field: 'labels' | 'data') {
  const pairs: Array<{ key: string; value: string }> = [];
  objects.forEach((object) => {
    const record = object?.[field];
    if (!record || typeof record !== 'object' || Array.isArray(record)) return;
    Object.entries(record).forEach(([key, value]) => {
      if (value === undefined || value === null || typeof value === 'object') return;
      pairs.push({ key, value: String(value) });
    });
  });
  return pairs;
}

function uniqueByLabel(suggestions: YamlAuthoringSuggestion[]) {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    if (seen.has(suggestion.label)) return false;
    seen.add(suggestion.label);
    return true;
  });
}

function objectCollection(document: TopoDocument | undefined, kind: TopoObjectSelection['kind']): any[] {
  if (!document) return [];
  if (kind === 'node') return document.graph?.nodes || [];
  if (kind === 'link') return document.graph?.links || [];
  if (kind === 'linkDirection') {
    return (document.graph?.links || []).flatMap((link: any) => Object.entries(link.directions || {}).flatMap(([direction, value]) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
      const directionObject = value as Record<string, unknown>;
      return [{
        ...directionObject,
        id: directionObject.id || `${link.id}:${direction}`,
        direction,
        labels: {
          ...(link.labels || {}),
          ...(directionObject.labels && typeof directionObject.labels === 'object' ? directionObject.labels : {}),
          direction
        },
        data: {
          ...(link.data || {}),
          ...(directionObject.data && typeof directionObject.data === 'object' ? directionObject.data : {})
        },
        linkId: link.id,
        parentLinkId: link.id,
        source: link.source,
        target: link.target,
        layers: link.layers
      }];
    }));
  }
  if (kind === 'path') return document.graph?.paths || [];
  if (kind === 'region') return document.graph?.regions || [];
  if (kind === 'callout') return document.diagram?.callouts || [];
  return document.diagram?.shapes || [];
}

function allAuthorableObjects(document: TopoDocument | undefined) {
  return (['node', 'link', 'linkDirection', 'path', 'region', 'callout', 'shape'] as const).flatMap((kind) => objectCollection(document, kind));
}

function layerIdsForSuggestions(request: YamlAuthoringRequest) {
  const graphLayerIds = (request.topoDocument?.graph?.layers || []).map((layer: any) => String(layer.id)).filter(Boolean);
  return [...new Set([...request.layers.map((layer) => layer.id), ...graphLayerIds])];
}

function referenceSuggestions(values: string[], detail: string): YamlAuthoringSuggestion[] {
  return values.map((value) => ({
    detail,
    documentation: detail,
    insertText: value,
    kind: 'reference',
    label: value
  }));
}

function invalidIndentSuggestion(message: string): YamlAuthoringSuggestion[] {
  return [{
    detail: 'Indentation correction',
    documentation: message,
    insertText: 'style:\n      ',
    isSnippet: true,
    kind: 'snippet',
    label: 'fix indentation'
  }];
}

function valueRecordKeySuggestions(request: YamlAuthoringRequest, field: 'labels' | 'data'): YamlAuthoringSuggestion[] {
  const pairs = fieldValuePairs(allAuthorableObjects(request.topoDocument), field);
  return uniqueByLabel([
    ...pairs.map(({ key, value }) => ({
      detail: `${field} key`,
      documentation: `Existing ${field} key. Example value: ${value}.`,
      insertText: `${key}: `,
      kind: 'key' as const,
      label: key
    })),
    {
      detail: `${field} entry`,
      documentation: `Add a ${field} key/value pair.`,
      insertText: '${1:key}: ${2:value}',
      isSnippet: true,
      kind: 'snippet' as const,
      label: `${field} entry`
    }
  ]);
}

function numericCoordinateSuggestions(key: string): YamlAuthoringSuggestion[] {
  return ['0', '80', '160', '240', '320', '480', '640'].map((value) => ({
    detail: `${key} coordinate`,
    documentation: `Numeric coordinate value for ${key}.`,
    insertText: value,
    kind: 'value' as const,
    label: value
  }));
}

function stylesheetIndentIssue(request: YamlAuthoringRequest): YamlAuthoringSuggestion[] | undefined {
  const lines = request.text.split(/\r?\n/);
  const currentLine = lines[Math.max(0, request.lineNumber - 1)] || '';
  const currentIndent = lineIndent(currentLine);
  if (currentLine.trim() || currentIndent < 4) return undefined;
  for (let index = request.lineNumber - 2; index >= 0; index -= 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    if (/^\s*style:\s*$/.test(line) && lineIndent(line) < currentIndent) return undefined;
    if (/^\s*-\s*selector:/.test(line) && lineIndent(line) < currentIndent) {
      return invalidIndentSuggestion('This line is indented under a stylesheet rule but no style: mapping exists yet.');
    }
    if (/^\s*stylesheet:\s*$/.test(line)) return undefined;
  }
  return undefined;
}

function topologySchemaPropertiesForPath(path: string[]) {
  if (path[path.length - 1] === 'graph') return schemaDefinitionProperties(baseSchema, 'graph');
  if (path.includes('directions')) {
    const current = path[path.length - 1];
    if (current === 'directions') return schemaDefinitionProperties(baseSchema, 'linkDirections');
    return schemaDefinitionProperties(baseSchema, 'linkDirection');
  }
  if (path.includes('nodes')) return schemaDefinitionProperties(baseSchema, 'node');
  if (path.includes('links')) return schemaDefinitionProperties(baseSchema, 'link');
  if (path.includes('paths')) return schemaDefinitionProperties(baseSchema, 'path');
  if (path.includes('regions')) return schemaDefinitionProperties(baseSchema, 'region');
  if (path[path.length - 1] === 'diagram') return schemaDefinitionProperties(baseSchema, 'diagram');
  if (path.includes('shapes')) return schemaDefinitionProperties(baseSchema, 'shape');
  if (path.includes('callouts')) return schemaDefinitionProperties(baseSchema, 'callout');
  if (isClosLayoutPath(path)) return schemaDefinitionProperties(baseSchema, 'closLayout');
  if (path.includes('layout')) return schemaDefinitionProperties(baseSchema, 'layout');
  if (path.includes('limits')) return schemaDefinitionProperties(baseSchema, 'limits');
  if (path.includes('toggles')) return schemaDefinitionProperties(baseSchema, 'toggle');
  if (path[path.length - 1] === 'attention') return schemaDefinitionProperties(attentionSchema, 'attention');
  if (path.includes('query')) return schemaDefinitionProperties(attentionSchema, 'focusQuery');
  if (path.includes('aggregate') && path.includes('groups')) return schemaDefinitionProperties(attentionSchema, 'aggregateGroup');
  if (path.includes('aggregate')) return schemaDefinitionProperties(attentionSchema, 'aggregate');
  if (path.includes('grouping')) return schemaDefinitionProperties(attentionSchema, 'linkGrouping');
  if (path.includes('attention') && path.includes('links')) return schemaDefinitionProperties(attentionSchema, 'attentionLinks');
  return collectSchemaProperties(topologyRootSchema, topologyRootSchema);
}

function stylesheetSchemaPropertiesForPath(path: string[]) {
  if (path.includes('icons')) return schemaDefinitionProperties(baseSchema, 'icon');
  if (isClosLayoutPath(path)) return schemaDefinitionProperties(baseSchema, 'closLayout');
  if (path.includes('layout')) return schemaDefinitionProperties(baseSchema, 'layout');
  if (path.includes('limits')) return schemaDefinitionProperties(baseSchema, 'limits');
  if (path.includes('toggles')) return schemaDefinitionProperties(baseSchema, 'toggle');
  if (path.includes('stylesheet')) return schemaDefinitionProperties(baseSchema, 'styleRule');
  return collectSchemaProperties(stylesheetRootSchema, stylesheetRootSchema);
}

function mapperSchemaPropertiesForPath(path: string[]) {
  if (path.includes('palette')) {
    const severityKeys = new Set(['success', 'info', 'warning', 'error']);
    return severityKeys.has(path[path.length - 1] || '')
      ? schemaDefinitionProperties(mapperRootSchema, 'severityPaletteEntry')
      : schemaDefinitionProperties(mapperRootSchema, 'severityPalette');
  }
  if (path.includes('identity')) return schemaDefinitionProperties(mapperRootSchema, 'identity');
  if (path.includes('rules')) {
    if (path.includes('style')) return {};
    if (path.includes('join')) return schemaDefinitionProperties(mapperRootSchema, 'linkDirectionJoin');
    return schemaDefinitionProperties(mapperRootSchema, 'authoringRule');
  }
  if (path.includes('conditions')) {
    if (path.includes('style')) return {};
    if (path.includes('when')) {
      if (path.includes('label') || path.includes('field')) return schemaDefinitionProperties(mapperRootSchema, 'keyedCondition');
      if (path.includes('value')) return schemaDefinitionProperties(mapperRootSchema, 'scalarCondition');
      return schemaDefinitionProperties(mapperRootSchema, 'condition');
    }
    return schemaDefinitionProperties(mapperRootSchema, 'conditionalStyle');
  }
  if (path.includes('target')) return schemaDefinitionProperties(mapperRootSchema, 'target');
  if (path.includes('resolve')) return schemaDefinitionProperties(mapperRootSchema, 'resolver');
  if (path.includes('value')) return schemaDefinitionProperties(mapperRootSchema, 'value');
  if (path.includes('thresholds')) return schemaDefinitionProperties(mapperRootSchema, 'thresholds');
  if (path.includes('overlay')) return schemaDefinitionProperties(mapperRootSchema, 'overlay');
  if (path.includes('mappings')) return schemaDefinitionProperties(mapperRootSchema, 'mapping');
  return collectSchemaProperties(mapperRootSchema, mapperRootSchema);
}

function topologyKeySuggestions(path: string[]): YamlAuthoringSuggestion[] {
  return schemaPropertySuggestions(topologySchemaPropertiesForPath(path), topologyKeyDocumentation);
}

function stylesheetSchemaKeySuggestions(path: string[]): YamlAuthoringSuggestion[] {
  return schemaPropertySuggestions(stylesheetSchemaPropertiesForPath(path), stylesheetKeyDocumentation);
}

function mapperSchemaKeySuggestions(path: string[]): YamlAuthoringSuggestion[] {
  return schemaPropertySuggestions(mapperSchemaPropertiesForPath(path), mapperKeyDocumentation);
}

function topologySnippetSuggestions(): YamlAuthoringSuggestion[] {
  return [
    {
      label: 'node snippet',
      insertText: '- id: ${1:node-id}\n  name: ${2:Node}\n  position: [${3:0}, ${4:0}]',
      isSnippet: true,
      kind: 'snippet',
      documentation: 'Insert a graph node.'
    },
    {
      label: 'link snippet',
      insertText: '- id: ${1:link-id}\n  source: ${2:source-node}\n  target: ${3:target-node}',
      isSnippet: true,
      kind: 'snippet',
      documentation: 'Insert a graph link.'
    },
    {
      label: 'link directions snippet',
      insertText: 'directions:\n  sourceToTarget:\n    label: ${1:3.2 Gbps}\n  targetToSource:\n    label: ${2:1.1 Gbps}',
      isSnippet: true,
      kind: 'snippet',
      documentation: 'Add source-to-target and target-to-source directional strokes to a graph link.'
    },
    {
      label: 'path snippet',
      insertText: '- id: ${1:path-id}\n  sequence:\n    - ${2:source-node}\n    - ${3:target-node}',
      isSnippet: true,
      kind: 'snippet',
      documentation: 'Insert an ordered graph path.'
    },
    {
      label: 'region snippet',
      insertText: '- id: ${1:region-id}\n  name: ${2:Region}\n  members:\n    - ${3:node-id}',
      isSnippet: true,
      kind: 'snippet',
      documentation: 'Insert a graph region.'
    },
    {
      label: 'attention snippet',
      insertText: 'attention:\n  query:\n    ids:\n      - ${1:object-id}\n    mode: dim-context',
      isSnippet: true,
      kind: 'snippet',
      documentation: 'Insert object focus attention.'
    }
  ];
}

function selectorSuggestions(request: YamlAuthoringRequest): YamlAuthoringSuggestion[] {
  const kinds: TopoObjectSelection['kind'][] = ['node', 'link', 'linkDirection', 'path', 'region', 'callout', 'shape'];
  const objects = allAuthorableObjects(request.topoDocument);
  const idSuggestions = kinds.flatMap((kind) => objectCollection(request.topoDocument, kind).map((object) => ({
    detail: `${kind} id selector`,
    insertText: `${kind}[id = "${String(object.id)}"]`,
    kind: 'selector' as const,
    label: `${kind}[id = "${String(object.id)}"]`
  })));
  const labelSuggestions = fieldValuePairs(objects, 'labels').flatMap(({ key, value }) => kinds.map((kind) => ({
    detail: 'label selector',
    insertText: `${kind}[labels.${key} = "${value}"]`,
    kind: 'selector' as const,
    label: `${kind}[labels.${key} = "${value}"]`
  })));
  const dataSuggestions = fieldValuePairs(objects, 'data').flatMap(({ key, value }) => kinds.map((kind) => ({
    detail: 'data selector',
    insertText: `${kind}[data.${key} = "${value}"]`,
    kind: 'selector' as const,
    label: `${kind}[data.${key} = "${value}"]`
  })));
  return uniqueByLabel([
    ...kinds.map((kind) => ({
      detail: 'object kind selector',
      insertText: kind,
      kind: 'selector' as const,
      label: kind
    })),
    ...idSuggestions,
    ...labelSuggestions,
    ...dataSuggestions
  ]);
}

function styleKeySuggestions(kind: TopoObjectSelection['kind']): YamlAuthoringSuggestion[] {
  return styleOptionsByKind[kind].map((option) => ({
    detail: styleGroupForKey(kind, option.key),
    documentation: styleDocumentationForKey(kind, option.key),
    insertText: `${option.key}: `,
    kind: 'key',
    label: option.key
  }));
}

function styleValueSuggestions(kind: TopoObjectSelection['kind'], key: string): YamlAuthoringSuggestion[] {
  const definition = styleValueDefinitionForKey(kind, key);
  if (definition.dataType === 'enum') {
    return (definition.options || []).map((option) => ({
      detail: `${key} value`,
      insertText: option,
      kind: 'value',
      label: option
    }));
  }
  if (definition.dataType === 'boolean') {
    return ['true', 'false'].map((option) => ({
      detail: `${key} boolean value`,
      insertText: option,
      kind: 'value',
      label: option
    }));
  }
  if (definition.dataType === 'color') {
    return paletteValueSuggestions.map((palette) => ({
      detail: palette.detail,
      documentation: `${palette.detail} color token.`,
      insertText: `"${palette.label}"`,
      kind: 'value',
      label: palette.label
    }));
  }
  if (definition.dataType === 'integer' || definition.dataType === 'number') {
    const values = definition.dataType === 'integer' ? integerValueSuggestions : numberValueSuggestions;
    return values.map((value) => ({
      detail: `${key} ${definition.dataType} value`,
      documentation: `Numeric ${definition.dataType} value for ${key}.`,
      insertText: value,
      kind: 'value',
      label: value
    }));
  }
  return [];
}

function stylesheetSnippetSuggestions(): YamlAuthoringSuggestion[] {
  return [{
    label: 'stylesheet rule snippet',
    insertText: '- selector: ${1:node}\n  style:\n    ${2:backgroundColor}: "${3:#1976d2}"',
    isSnippet: true,
    kind: 'snippet',
    documentation: 'Insert a selector style rule.'
  }];
}

const mapperMetricLabelSuggestions = [
  'source_id',
  'node_id',
  'link_id',
  'direction_id',
  'direction',
  'path_id',
  'region_id',
  'layer_id',
  'source',
  'target',
  'site',
  'pod',
  'role',
  'service',
  'tenant'
];

const mapperMetricNameSuggestions = [
  'topoviewer_link_up',
  'topoviewer_link_utilization_percent',
  'topoviewer_link_errors_total',
  'node_health',
  'node_cpu_utilization_percent',
  'service_path_latency_ms',
  'routing_adjacency_up'
];

const mapperSeverityColorSuggestions = [
  '"#4caf50"',
  '"#42a5f5"',
  '"#ff9800"',
  '"#d32f2f"',
  '"#2e7d32"',
  '"#1976d2"',
  '"#ed6c02"',
  '"#c62828"'
];

function mapperObjectIds(document: TopoDocument | undefined) {
  const graph = document?.graph;
  return {
    graph: graph?.id ? [graph.id] : [],
    layer: (graph?.layers || []).map((layer) => layer.id),
    link: (graph?.links || []).map((link) => link.id),
    linkDirection: objectCollection(document, 'linkDirection').map((direction) => direction.id),
    node: (graph?.nodes || []).map((node) => node.id),
    path: (graph?.paths || []).map((path) => path.id),
    region: (graph?.regions || []).map((region) => region.id)
  };
}

function mapperTargetKindForContext(request: YamlAuthoringRequest) {
  const lines = request.text.split(/\r?\n/);
  for (let index = request.lineNumber - 1; index >= 0; index -= 1) {
    const kind = lines[index]?.match(/kind:\s*["']?(node|linkDirection|link|path|region|layer|graph)/)?.[1];
    if (kind) return kind as 'node' | 'linkDirection' | 'link' | 'path' | 'region' | 'layer' | 'graph';
    const selectedKind = lines[index]?.match(/select:\s*["']?(node|linkDirection|link|path|region|layer|graph)(?:\s*\[|["']?\s*$)/)?.[1];
    if (selectedKind) return selectedKind as 'node' | 'linkDirection' | 'link' | 'path' | 'region' | 'layer' | 'graph';
  }
  return 'node';
}

function mapperStyleKindForContext(request: YamlAuthoringRequest): TopoObjectSelection['kind'] {
  const kind = mapperTargetKindForContext(request);
  return Object.prototype.hasOwnProperty.call(styleOptionsByKind, kind)
    ? kind as TopoObjectSelection['kind']
    : 'node';
}

function mapperValueSuggestions(request: YamlAuthoringRequest, key: string): YamlAuthoringSuggestion[] {
  const path = yamlPathAtLine(request.text, request.lineNumber);
  if (isMapperStyleContext(request)) return styleValueSuggestions(mapperStyleKindForContext(request), key);
  if (key === 'version') return referenceSuggestions(['1'], 'Mapper schema version');
  if (key === 'kind') return referenceSuggestions(['node', 'link', 'linkDirection', 'path', 'region', 'layer', 'graph'], 'Mapper target kind');
  if (key === 'select') return selectorSuggestions(request);
  if (key === 'by') return referenceSuggestions(['id', 'label', 'data', 'endpoint', 'selector', 'aggregate', 'staticObjectIds'], 'Mapper resolver mode');
  if (path.includes('join') && (key === 'link' || key === 'direction')) return referenceSuggestions(mapperMetricLabelSuggestions, 'Telemetry label');
  if (key === 'direction') return referenceSuggestions(['above', 'below'], 'Threshold direction');
  if (key === 'as') return referenceSuggestions(['up', 'utilizationPercent', 'errorsTotal', 'latencyMs', 'lossPercent', 'capacityPercent', 'health'], 'Metric value semantics');
  if (key === 'value' && !path.includes('conditions') && !path.includes('when')) {
    return referenceSuggestions(['percent', 'up', 'errors', 'latency', 'loss', 'capacity', 'health'], 'Rule value semantic');
  }
  if (key === 'severity') return referenceSuggestions(['none', 'success', 'info', 'warning', 'error'], 'Computed mapper severity');
  if (key === 'metric') return referenceSuggestions(mapperMetricNameSuggestions, 'Metric name');
  if (key === 'success') return referenceSuggestions(['"#4caf50"'], 'Success severity color');
  if (key === 'info') return referenceSuggestions(['"#42a5f5"'], 'Info severity color');
  if (key === 'warning') return referenceSuggestions(['"#ff9800"'], 'Warning severity color');
  if (key === 'error') return referenceSuggestions(['"#d32f2f"'], 'Error severity color');
  if (key === 'color' || key === 'accent') return referenceSuggestions(mapperSeverityColorSuggestions, 'Severity palette color');
  if (key === 'join' || key === 'metricLabel' || key === 'sourceIdLabel' || key === 'sourceLabel' || key === 'targetLabel') {
    return referenceSuggestions(mapperMetricLabelSuggestions, 'Telemetry label');
  }
  if (key === 'objectIds') {
    const kind = mapperTargetKindForContext(request);
    return referenceSuggestions(mapperObjectIds(request.topoDocument)[kind], `${kind} ID`);
  }
  if (key === 'selector') return selectorSuggestions(request);
  if (['info', 'warning', 'error'].includes(key)) return numberValueSuggestions.map((value) => ({
    detail: 'Threshold value',
    insertText: value,
    kind: 'value' as const,
    label: value
  }));
  if ([
    'lineColorBySeverity',
    'lineWidthBySeverity',
    'sourceArrowColorBySeverity',
    'targetArrowColorBySeverity',
    'outlineBySeverity',
    'statusMarker',
    'backgroundColorBySeverity',
    'borderColorBySeverity',
    'propagateToLayerMembers'
  ].includes(key)) {
    return referenceSuggestions(['true', 'false'], 'Boolean overlay setting');
  }
  if (key === 'exists') return referenceSuggestions(['true', 'false'], 'Presence condition');
  if (['gt', 'gte', 'lt', 'lte', 'eq', 'ne'].includes(key)) return numberValueSuggestions.map((value) => ({
    detail: 'Condition value',
    insertText: value,
    kind: 'value' as const,
    label: value
  }));
  if (key === 'label') return referenceSuggestions(['"{{ value | round }}%"', '"{{ severity }}"', '"{{ metric }}"', '"{{ target.id }}"'], 'Overlay label template');
  if (key === 'badgeLabel') return referenceSuggestions(['"{{ value | round }}"', '"{{ severity }}"'], 'Badge label template');
  return [];
}

function mapperSnippetSuggestions(): YamlAuthoringSuggestion[] {
  return [
    {
      label: 'mapper rule snippet',
      insertText: '- id: ${1:link-utilization}\n  metric: ${2:topoviewer_link_utilization_percent}\n  select: ${3:link}\n  join: ${4:link_id}\n  value: percent\n  states:\n    busy: ">=70"\n    saturated: ">=90"\n  style:\n    default:\n      lineColor: "#4caf50"\n      label: "{{ value | round }}%"\n    busy:\n      lineColor: "#ff9800"\n      lineWidth: 4\n    saturated:\n      lineColor: "#d32f2f"\n      lineWidth: 7\n      label: "{{ state }} {{ value | round }}%"',
      isSnippet: true,
      kind: 'snippet',
      documentation: 'Insert a compact telemetry mapper rule.'
    },
    {
      label: 'mapper document snippet',
      insertText: 'version: 1\nidentity:\n  sourceId: ${1:topology-id}\n  sourceIdLabel: ${2:source_id}\nrules:\n  - id: ${3:link-utilization}\n    metric: ${4:topoviewer_link_utilization_percent}\n    select: link\n    join: link_id\n    value: percent\n    states:\n      busy: ">=70"\n      saturated: ">=90"\n    style:\n      default:\n        lineColor: "#4caf50"\n        label: "{{ value | round }}%"\n      busy:\n        lineColor: "#ff9800"\n        lineWidth: 4\n      saturated:\n        lineColor: "#d32f2f"\n        lineWidth: 7',
      isSnippet: true,
      kind: 'snippet',
      documentation: 'Insert a compact mapper document skeleton.'
    }
  ];
}

function wordAtColumn(line: string, column: number) {
  const index = Math.max(0, Math.min(line.length, column - 1));
  const matches = line.matchAll(/[A-Za-z][A-Za-z0-9]*/g);
  for (const match of matches) {
    const start = match.index || 0;
    const end = start + match[0].length;
    if (index >= start && index <= end) return match[0];
  }
  return undefined;
}

function lineNumberForIndex(text: string, index: number) {
  return text.slice(0, Math.max(0, index)).split(/\r?\n/).length;
}

function selectorIdValue(value: string) {
  return value.replace(/"/g, '\\"');
}

export function stylesheetSelectorForSelection(selection: TopoObjectSelection) {
  return `${selection.kind}[id = "${selectorIdValue(selection.id)}"]`;
}

function selectorLineMatches(line: string, selector: string) {
  const trimmed = line.trim();
  return trimmed === `- selector: ${selector}`
    || trimmed === `selector: ${selector}`
    || trimmed === `- selector: "${selector.replace(/"/g, '\\"')}"`
    || trimmed === `selector: "${selector.replace(/"/g, '\\"')}"`;
}

function locateStyleRuleCursor(text: string, selector: string): PendingYamlFocus | undefined {
  const lines = text.split(/\r?\n/);
  const selectorIndex = lines.findIndex((line) => selectorLineMatches(line, selector));
  if (selectorIndex === -1) return undefined;
  for (let index = selectorIndex + 1; index < lines.length; index += 1) {
    if (/^\s*-\s*selector\s*:/.test(lines[index])) break;
    if (/^\s*style\s*:/.test(lines[index])) {
      const styleIndent = lineIndent(lines[index]);
      for (let candidate = index + 1; candidate < lines.length; candidate += 1) {
        if (/^\s*-\s*selector\s*:/.test(lines[candidate])) break;
        if (lines[candidate].trim() === '' && lineIndent(lines[candidate]) > styleIndent) {
          return { document: 'stylesheet', lineNumber: candidate + 1, column: lineIndent(lines[candidate]) + 1, showSuggestions: true };
        }
      }
      return { document: 'stylesheet', lineNumber: index + 1, column: lines[index].length + 1, showSuggestions: true };
    }
  }
  return { document: 'stylesheet', lineNumber: selectorIndex + 1, column: lines[selectorIndex].length + 1, showSuggestions: true };
}

export function ensureStyleRule(text: string, selector: string): { focus: PendingYamlFocus; inserted: boolean; text: string } {
  const existing = locateStyleRuleCursor(text, selector);
  if (existing) return { focus: existing, inserted: false, text };

  const trimmed = text.trimEnd();
  const lines = trimmed ? trimmed.split(/\r?\n/) : [];
  if (!lines.some((line) => /^\s*stylesheet\s*:/.test(line))) {
    lines.push('stylesheet:');
  }
  lines.push(`  - selector: ${selector}`);
  lines.push('    style:');
  lines.push('      opacity: 1');
  lines.push('      ');
  const nextText = `${lines.join('\n')}\n`;
  return {
    focus: {
      column: 7,
      document: 'stylesheet',
      lineNumber: lineNumberForIndex(nextText, nextText.lastIndexOf('      \n')),
      showSuggestions: true
    },
    inserted: true,
    text: nextText
  };
}

export function yamlAuthoringSuggestions(request: YamlAuthoringRequest): YamlAuthoringSuggestion[] {
  const path = yamlPathAtLine(request.text, request.lineNumber);
  const key = currentYamlKey(request);
  const prefix = linePrefix(request.text, request.lineNumber, request.column);
  if (request.document === 'mapper') {
    if (key && prefix.includes(':')) return mapperValueSuggestions(request, key);
    if (isMapperStyleContext(request) && isKeyContext(request)) return styleKeySuggestions(mapperStyleKindForContext(request));
    if (isKeyContext(request)) {
      return uniqueByLabel([
        ...mapperSchemaKeySuggestions(path),
        ...(prefix.trim() === '' || prefix.trim() === '-' ? mapperSnippetSuggestions() : [])
      ]);
    }
    return [];
  }
  if (request.document === 'topology') {
    const nodeIds = (request.topoDocument?.graph?.nodes || []).map((node) => node.id);
    if (path.includes('labels')) {
      return valueRecordKeySuggestions(request, 'labels');
    }
    if (path.includes('data')) {
      return valueRecordKeySuggestions(request, 'data');
    }
    if (path.includes('position')) {
      return numericCoordinateSuggestions('position');
    }
    if (key === 'source' || key === 'target' || path.includes('sequence')) {
      return referenceSuggestions(nodeIds, 'Graph node ID');
    }
    if (key === 'layers' || path.includes('layers')) {
      return referenceSuggestions(layerIdsForSuggestions(request), 'Layer ID');
    }
    return uniqueByLabel([
      ...(isKeyContext(request) ? topologyKeySuggestions(path) : []),
      ...(prefix.trim() === '' || prefix.trim() === '-' ? topologySnippetSuggestions() : [])
    ]);
  }

  const indentIssue = stylesheetIndentIssue(request);
  if (indentIssue) return indentIssue;
  if (key === 'selector') return selectorSuggestions(request);
  if (isStylesheetStyleContext(request)) {
    const selectorKind = selectorKindForContext(request);
    if (key && prefix.includes(':')) {
      return styleValueSuggestions(selectorKind, key);
    }
    if (isKeyContext(request)) return styleKeySuggestions(selectorKind);
  }
  if (isKeyContext(request)) {
    return uniqueByLabel([
      ...stylesheetSchemaKeySuggestions(path),
      ...stylesheetSnippetSuggestions()
    ]);
  }
  return [];
}

export function yamlAuthoringHover(request: YamlAuthoringRequest): YamlAuthoringHover | undefined {
  const line = lineAt(request.text, request.lineNumber);
  const word = wordAtColumn(line, request.column);
  if (!word) return undefined;
  if (request.document === 'topology' && topologyKeyDocumentation[word]) {
    return { contents: topologyKeyDocumentation[word] };
  }
  if (request.document === 'stylesheet') {
    if (stylesheetKeyDocumentation[word]) return { contents: stylesheetKeyDocumentation[word] };
    const selectorKind = selectorKindForContext(request);
    const option = styleOptionsByKind[selectorKind].find((candidate) => candidate.key === word);
    if (option) {
      return { contents: styleDocumentationForKey(selectorKind, word) };
    }
  }
  if (request.document === 'mapper' && mapperKeyDocumentation[word]) {
    return { contents: mapperKeyDocumentation[word] };
  }
  return undefined;
}

export function monacoSuggestionKind(monaco: any, suggestion: YamlAuthoringSuggestion) {
  if (suggestion.kind === 'snippet') return monaco.languages.CompletionItemKind.Snippet;
  if (suggestion.kind === 'selector') return monaco.languages.CompletionItemKind.Reference;
  if (suggestion.kind === 'reference') return monaco.languages.CompletionItemKind.Value;
  if (suggestion.kind === 'value') return monaco.languages.CompletionItemKind.Value;
  return monaco.languages.CompletionItemKind.Property;
}
