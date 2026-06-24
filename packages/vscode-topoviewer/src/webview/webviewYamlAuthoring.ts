import type { TopoDocument } from 'topoviewer';
import type { TopoObjectSelection } from '../shared/topologyMutations';
import {
  styleGroupForKey,
  styleOptionsByKind,
  styleValueDefinitionForKey
} from './webviewStyleMetadata';

export type YamlAuthoringDocument = 'topology' | 'stylesheet';

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

function lineAt(text: string, lineNumber: number) {
  return text.split(/\r?\n/)[Math.max(0, lineNumber - 1)] || '';
}

function linePrefix(text: string, lineNumber: number, column: number) {
  return lineAt(text, lineNumber).slice(0, Math.max(0, column - 1));
}

function lineIndent(line: string) {
  return line.match(/^\s*/)?.[0].length || 0;
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

function isStylesheetStyleContext(request: YamlAuthoringRequest) {
  const lines = request.text.split(/\r?\n/);
  const currentIndent = lineIndent(lines[Math.max(0, request.lineNumber - 1)] || '');
  for (let index = request.lineNumber - 2; index >= 0; index -= 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    const indent = lineIndent(line);
    if (/^\s*style:\s*$/.test(line) && indent < currentIndent) return true;
    if (/^\s*-\s*selector:/.test(line) && indent < currentIndent) return false;
    if (/^\s*stylesheet:\s*$/.test(line) && indent < currentIndent) return false;
  }
  return false;
}

function selectorKindForContext(request: YamlAuthoringRequest): TopoObjectSelection['kind'] {
  const lines = request.text.split(/\r?\n/);
  const allowed = new Set<TopoObjectSelection['kind']>(['node', 'link', 'path', 'region', 'callout', 'shape']);
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
  if (kind === 'path') return document.graph?.paths || [];
  if (kind === 'region') return document.graph?.regions || [];
  if (kind === 'callout') return document.diagram?.callouts || [];
  return document.diagram?.shapes || [];
}

function allAuthorableObjects(document: TopoDocument | undefined) {
  return (['node', 'link', 'path', 'region', 'callout', 'shape'] as const).flatMap((kind) => objectCollection(document, kind));
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

function topologyKeySuggestions(path: string[]): YamlAuthoringSuggestion[] {
  const root = [
    { label: 'graph', insertText: 'graph:\n  nodes: []', documentation: topologyKeyDocumentation.graph },
    { label: 'attention', insertText: 'attention:\n  query:\n    mode: dim-context', documentation: topologyKeyDocumentation.attention }
  ];
  const graph = ['layers', 'nodes', 'links', 'paths', 'regions'].map((label) => ({
    label,
    insertText: `${label}:`,
    documentation: topologyKeyDocumentation[label]
  }));
  const commonObject = ['id', 'name', 'labels', 'data', 'layers'].map((label) => ({
    label,
    insertText: `${label}: `,
    documentation: topologyKeyDocumentation[label]
  }));
  if (path[path.length - 1] === 'graph') return graph.map((suggestion) => ({ ...suggestion, kind: 'key' as const }));
  if (path.includes('nodes')) {
    return [...commonObject, { label: 'position', insertText: 'position: [0, 0]', documentation: topologyKeyDocumentation.position }]
      .map((suggestion) => ({ ...suggestion, kind: 'key' as const }));
  }
  if (path.includes('links')) {
    return [...commonObject, { label: 'source', insertText: 'source: ', documentation: topologyKeyDocumentation.source }, { label: 'target', insertText: 'target: ', documentation: topologyKeyDocumentation.target }]
      .map((suggestion) => ({ ...suggestion, kind: 'key' as const }));
  }
  if (path.includes('paths')) {
    return [...commonObject, { label: 'sequence', insertText: 'sequence:\n  - ', documentation: topologyKeyDocumentation.sequence }]
      .map((suggestion) => ({ ...suggestion, kind: 'key' as const }));
  }
  if (path.includes('regions')) {
    return [...commonObject, { label: 'members', insertText: 'members: []', documentation: 'Object IDs included in the region.' }]
      .map((suggestion) => ({ ...suggestion, kind: 'key' as const }));
  }
  return root.map((suggestion) => ({ ...suggestion, kind: 'key' as const }));
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
  const kinds: TopoObjectSelection['kind'][] = ['node', 'link', 'path', 'region', 'callout', 'shape'];
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
    documentation: `${option.label} style for ${kind} objects. Value type: ${styleValueDefinitionForKey(kind, option.key).dataType}.`,
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
  if (request.document === 'topology') {
    const nodeIds = (request.topoDocument?.graph?.nodes || []).map((node) => node.id);
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
      { label: 'selector', insertText: 'selector: ', kind: 'key', documentation: stylesheetKeyDocumentation.selector },
      { label: 'style', insertText: 'style:', kind: 'key', documentation: stylesheetKeyDocumentation.style },
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
      const definition = styleValueDefinitionForKey(selectorKind, word);
      return { contents: `${option.label} style for ${selectorKind} objects. Value type: ${definition.dataType}.` };
    }
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

