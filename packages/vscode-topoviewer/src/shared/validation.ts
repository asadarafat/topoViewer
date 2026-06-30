import yaml from 'js-yaml';
import {
  composeTopoViewerDocument,
  lintTopoDocument,
  styleDefinitionForKey,
  validateTopoDocument,
  type DiagramCallout,
  type DiagramConnector,
  type DiagramShape,
  type GraphLink,
  type GraphNode,
  type GraphPath,
  type GraphRegion,
  type StyleTargetKind,
  type TopoDocument
} from 'topoviewer';
import type { ValidationResult, WebviewDiagnostic, WebviewState } from './types';

class SourceYamlError extends Error {
  column?: number;
  document: 'topology' | 'stylesheet' | 'mapper';
  line?: number;

  constructor(message: string, document: 'topology' | 'stylesheet' | 'mapper', line?: number, column?: number) {
    super(message);
    this.name = 'SourceYamlError';
    this.document = document;
    this.line = line;
    this.column = column;
  }
}

function isYamlException(error: unknown): error is yaml.YAMLException {
  return !!error && typeof error === 'object' && 'mark' in error;
}

function parseYamlObject(text: string, source: string, document: 'topology' | 'stylesheet' | 'mapper'): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = yaml.load(text || '{}');
  } catch (error) {
    if (isYamlException(error) && error.mark) {
      throw new SourceYamlError(error.message, document, error.mark.line + 1, error.mark.column + 1);
    }
    throw new SourceYamlError(error instanceof Error ? error.message : String(error), document, 1, 1);
  }
  if (!parsed) return {};
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new SourceYamlError(`${source} must contain a YAML object at the document root.`, document, 1, 1);
  }
  return parsed as Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function composeTopoDocument(state: WebviewState): TopoDocument {
  const topology = parseYamlObject(state.topologyText, 'Topology YAML', 'topology');
  const stylesheet = parseYamlObject(state.stylesheetText, 'Stylesheet YAML', 'stylesheet');
  return composeTopoViewerDocument(topology as TopoDocument, stylesheet as TopoDocument, { validate: false });
}

function firstValidationPath(message: string): string | undefined {
  const suffix = message.split(' is invalid: ')[1] || message;
  const match = suffix.match(/^([^:;]+):/);
  return match?.[1] && match[1] !== '<root>' ? match[1] : undefined;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findYamlPathLine(text: string, path: string | undefined): number | undefined {
  if (!path) return undefined;
  const segments = path.split('.').filter(Boolean);
  const candidateKeys = [...segments].reverse().filter((segment) => !/^\d+$/.test(segment));
  const lines = text.split(/\r?\n/);
  for (const key of candidateKeys) {
    const pattern = new RegExp(`^\\s*(?:-\\s*)?${escapeRegExp(key)}\\s*:`);
    const index = lines.findIndex((line) => pattern.test(line));
    if (index !== -1) return index + 1;
  }
  const firstContent = lines.findIndex((line) => line.trim());
  return firstContent === -1 ? 1 : firstContent + 1;
}

function diagnosticLocationForPath(path: string | undefined, state: WebviewState): Pick<WebviewDiagnostic, 'column' | 'document' | 'line'> {
  const topologyLine = findYamlPathLine(state.topologyText, path);
  if (topologyLine !== undefined) return { document: 'topology', line: topologyLine, column: 1 };
  const stylesheetLine = findYamlPathLine(state.stylesheetText, path);
  if (stylesheetLine !== undefined) return { document: 'stylesheet', line: stylesheetLine, column: 1 };
  return {};
}

type MapperTargetKind = 'node' | 'link' | 'linkDirection' | 'path' | 'region' | 'layer' | 'graph';
type MapperResolverMode = 'id' | 'label' | 'data' | 'endpoint' | 'selector' | 'aggregate' | 'staticObjectIds';

interface MapperInventoryEntity {
  data?: Record<string, unknown>;
  direction?: string;
  id: string;
  labels?: Record<string, string | number | boolean>;
  layers?: string[];
  linkId?: string;
  name?: string;
  parentLinkId?: string;
  source?: string;
  target?: string;
}

interface MapperInventory {
  byKind: Record<MapperTargetKind, MapperInventoryEntity[]>;
  endpointPairs: Map<string, number>;
}

interface ParsedMapperSelector {
  kind: MapperTargetKind;
  path?: string;
  value?: string;
}

const mapperTargetKinds = new Set<MapperTargetKind>(['node', 'link', 'linkDirection', 'path', 'region', 'layer', 'graph']);
const mapperResolverModes = new Set<MapperResolverMode>(['id', 'label', 'data', 'endpoint', 'selector', 'aggregate', 'staticObjectIds']);
const compactMapperValues = new Set(['percent', 'utilization', 'utilizationPercent', 'up', 'errors', 'errorsTotal', 'latency', 'latencyMs', 'loss', 'lossPercent', 'capacity', 'capacityPercent', 'health']);
const mapperOverlayKeys = new Set([
  'lineColorBySeverity',
  'lineWidthBySeverity',
  'sourceArrowColorBySeverity',
  'targetArrowColorBySeverity',
  'outlineBySeverity',
  'statusMarker',
  'backgroundColorBySeverity',
  'borderColorBySeverity',
  'badgeLabel',
  'label',
  'propagateToLayerMembers',
  'style'
]);

function mapperDiagnostic(
  code: string,
  message: string,
  options: {
    column?: number;
    line?: number;
    path?: string;
    severity?: WebviewDiagnostic['severity'];
    source?: WebviewDiagnostic['source'];
    state?: WebviewState;
  } = {}
): WebviewDiagnostic {
  const line = options.line ?? findYamlPathLine(options.state?.mapperText || '', options.path) ?? 1;
  return {
    severity: options.severity || 'error',
    source: options.source || 'schema',
    code,
    message,
    document: 'mapper',
    line,
    column: options.column || 1,
    path: options.path
  };
}

function stringValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return undefined;
}

function nestedValue(input: unknown, path: string | undefined): unknown {
  if (!path || typeof input !== 'object' || input === null) return undefined;
  return path.split('.').reduce<unknown>((current, segment) => {
    if (typeof current !== 'object' || current === null) return undefined;
    return (current as Record<string, unknown>)[segment];
  }, input);
}

function linkDirectionId(link: GraphLink, direction: string, value: { id?: string } = {}): string {
  return value.id || `${link.id}:${direction}`;
}

function mapperEndpointKey(source: string | undefined, target: string | undefined): string | undefined {
  if (!source || !target) return undefined;
  return [source, target].sort().join('\u0000');
}

function mapperInventory(document: TopoDocument | undefined): MapperInventory {
  const graph = document?.graph;
  const links = graph?.links || [];
  const linkDirections = links.flatMap((link): MapperInventoryEntity[] => (
    Object.entries(link.directions || {}).flatMap(([direction, value]) => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
      return [{
        data: { ...(link.data || {}), ...(value.data || {}) },
        direction,
        id: linkDirectionId(link, direction, value),
        labels: { ...(link.labels || {}), ...(value.labels || {}), direction },
        layers: link.layers,
        linkId: link.id,
        name: value.name || link.name,
        parentLinkId: link.id,
        source: link.source,
        target: link.target
      }];
    })
  ));
  const endpointPairs = new Map<string, number>();
  for (const link of links) {
    const key = mapperEndpointKey(link.source, link.target);
    if (key) endpointPairs.set(key, (endpointPairs.get(key) || 0) + 1);
  }
  return {
    byKind: {
      node: graph?.nodes || [],
      link: links,
      linkDirection: linkDirections,
      path: graph?.paths || [],
      region: graph?.regions || [],
      layer: (graph?.layers || []).map((layer) => ({
        id: layer.id,
        name: layer.name
      })),
      graph: graph?.id ? [{ id: graph.id, name: graph.id }] : []
    },
    endpointPairs
  };
}

function parseMapperSelector(selector: string): ParsedMapperSelector | undefined {
  const match = selector.match(/^(node|linkDirection|link|path|region|layer|graph)(?:\[(id|direction|linkId|parentLinkId|source|target|labels\.[\w.-]+|data\.[\w.-]+)\s*=\s*["']?([^"'\]]+)["']?\])?$/);
  if (!match) return undefined;
  return {
    kind: match[1] as MapperTargetKind,
    path: match[2],
    value: match[3]
  };
}

function mapperSelectorMatches(entity: MapperInventoryEntity, selectorPath: string | undefined, expectedValue: string | undefined): boolean {
  if (!selectorPath) return true;
  if (selectorPath === 'id') return entity.id === expectedValue;
  if (selectorPath === 'direction') return entity.direction === expectedValue;
  if (selectorPath === 'linkId') return entity.linkId === expectedValue;
  if (selectorPath === 'parentLinkId') return entity.parentLinkId === expectedValue;
  if (selectorPath === 'source') return entity.source === expectedValue;
  if (selectorPath === 'target') return entity.target === expectedValue;
  if (selectorPath.startsWith('labels.')) return stringValue(entity.labels?.[selectorPath.slice('labels.'.length)]) === expectedValue;
  if (selectorPath.startsWith('data.')) return stringValue(nestedValue(entity.data, selectorPath.slice('data.'.length))) === expectedValue;
  return false;
}

function mapperSelectorEntities(selector: ParsedMapperSelector, inventory: MapperInventory): MapperInventoryEntity[] {
  return inventory.byKind[selector.kind].filter((entity) => mapperSelectorMatches(entity, selector.path, selector.value));
}

function mapperStyleKind(kind: MapperTargetKind): StyleTargetKind | undefined {
  if (kind === 'node' || kind === 'link' || kind === 'linkDirection' || kind === 'path' || kind === 'region') return kind;
  return undefined;
}

function validateMapperStylePatch(
  diagnostics: WebviewDiagnostic[],
  state: WebviewState,
  kind: MapperTargetKind,
  style: unknown,
  path: string
) {
  if (!isRecord(style)) {
    diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `${path} must be a TopoViewer style mapping.`, { path, state }));
    return;
  }
  const styleKind = mapperStyleKind(kind);
  if (!styleKind) {
    diagnostics.push(mapperDiagnostic(
      'mapper-style-target-unsupported',
      `${path} targets ${kind}; style keys are validated only after layer or graph propagation. Prefer canonical mappings with overlay.propagateToLayerMembers for aggregate rules.`,
      { path, severity: 'warning', source: 'semantic', state }
    ));
    return;
  }
  for (const key of Object.keys(style).sort()) {
    if (!styleDefinitionForKey(styleKind, key)) {
      diagnostics.push(mapperDiagnostic(
        'mapper-style-key-unsupported',
        `${path}.${key} is not a supported ${styleKind} style key.`,
        { path: `${path}.${key}`, severity: 'warning', source: 'semantic', state }
      ));
    }
  }
}

function unsupportedOverlayKeys(kind: MapperTargetKind, overlay: Record<string, unknown>): string[] {
  const activeKeys = Object.entries(overlay)
    .filter(([, value]) => value !== undefined && value !== false)
    .map(([key]) => key);
  if (kind === 'layer' || kind === 'graph') {
    return overlay.propagateToLayerMembers === false ? activeKeys.filter((key) => key !== 'propagateToLayerMembers') : [];
  }
  const common = new Set(['label', 'style']);
  const link = new Set([...common, 'lineColorBySeverity', 'lineWidthBySeverity', 'sourceArrowColorBySeverity', 'targetArrowColorBySeverity', 'statusMarker', 'outlineBySeverity']);
  const linkDirection = link;
  const path = new Set([...common, 'lineColorBySeverity', 'lineWidthBySeverity', 'sourceArrowColorBySeverity', 'targetArrowColorBySeverity']);
  const node = new Set([...common, 'statusMarker', 'outlineBySeverity', 'backgroundColorBySeverity', 'badgeLabel']);
  const region = new Set([...common, 'backgroundColorBySeverity', 'borderColorBySeverity']);
  const allowed = kind === 'link' ? link
    : kind === 'linkDirection' ? linkDirection
      : kind === 'path' ? path
        : kind === 'node' ? node
          : kind === 'region' ? region
            : common;
  return activeKeys.filter((key) => !allowed.has(key));
}

function validateMapperOverlay(
  diagnostics: WebviewDiagnostic[],
  state: WebviewState,
  kind: MapperTargetKind,
  overlay: unknown,
  path: string
) {
  if (overlay === undefined) return;
  if (!isRecord(overlay)) {
    diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `${path} must be a YAML mapping.`, { path, state }));
    return;
  }
  for (const key of Object.keys(overlay).sort()) {
    if (!mapperOverlayKeys.has(key)) {
      diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `${path}.${key} is not a supported mapper overlay key.`, { path: `${path}.${key}`, state }));
    }
  }
  const unsupported = unsupportedOverlayKeys(kind, overlay);
  if (unsupported.length) {
    diagnostics.push(mapperDiagnostic(
      'mapper-overlay-unsupported',
      `${path} uses overlay control(s) not supported for ${kind}: ${unsupported.join(', ')}.`,
      { path, severity: 'warning', source: 'semantic', state }
    ));
  }
  if (isRecord(overlay.style)) validateMapperStylePatch(diagnostics, state, kind, overlay.style, `${path}.style`);
}

function validateCompactMapperRule(
  diagnostics: WebviewDiagnostic[],
  state: WebviewState,
  rule: Record<string, unknown>,
  index: number,
  inventory: MapperInventory
) {
  const path = `rules[${index}]`;
  const select = stringValue(rule.select);
  const ruleId = stringValue(rule.id) || `rules[${index}]`;
  if (!select) return;
  const parsedSelector = parseMapperSelector(select);
  if (!parsedSelector) {
    diagnostics.push(mapperDiagnostic(
      'mapper-selector-invalid',
      `${path}.select must be a TopoViewer selector such as node, link, linkDirection, path, region, layer, graph, or node[labels.role = "pe"].`,
      { path: `${path}.select`, state }
    ));
    return;
  }

  const join = rule.join;
  const hasJoin = join !== undefined;
  if (!hasJoin && mapperSelectorEntities(parsedSelector, inventory).length === 0 && inventory.byKind[parsedSelector.kind].length > 0) {
    diagnostics.push(mapperDiagnostic(
      'mapper-selector-unmatched',
      `Mapper rule "${ruleId}" select "${select}" does not match any ${parsedSelector.kind} object in the applied topology.`,
      { path: `${path}.select`, severity: 'warning', source: 'semantic', state }
    ));
  }
  if (parsedSelector.kind === 'linkDirection' && inventory.byKind.linkDirection.length === 0) {
    diagnostics.push(mapperDiagnostic(
      'mapper-link-direction-missing-direction',
      `Mapper rule "${ruleId}" targets linkDirection, but the applied topology does not declare any link directions.`,
      { path: `${path}.select`, severity: 'warning', source: 'semantic', state }
    ));
  }

  if (typeof join === 'string' && parsedSelector.path) {
    diagnostics.push(mapperDiagnostic(
      'mapper-query-hint',
      `Mapper rule "${ruleId}" combines a predicate selector with join. Selector-wide rules should omit join; use canonical mappings for advanced joins.`,
      { path: `${path}.join`, severity: 'warning', source: 'semantic', state }
    ));
  } else if (join !== undefined && typeof join !== 'string') {
    if (parsedSelector.kind !== 'linkDirection' || !isRecord(join)) {
      diagnostics.push(mapperDiagnostic(
        'invalid-mapper-schema',
        `${path}.join must be a telemetry label string. Only linkDirection rules may use a join mapping with link and direction labels.`,
        { path: `${path}.join`, state }
      ));
    } else {
      if (!stringValue(join.link)) {
        diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `${path}.join.link is required.`, { path: `${path}.join.link`, state }));
      }
      if (!stringValue(join.direction)) {
        diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `${path}.join.direction is required.`, { path: `${path}.join.direction`, state }));
      }
    }
  }

  if (rule.value !== undefined && (!stringValue(rule.value) || !compactMapperValues.has(String(rule.value)))) {
    diagnostics.push(mapperDiagnostic(
      'invalid-mapper-schema',
      `${path}.value must be one of ${Array.from(compactMapperValues).join(', ')}.`,
      { path: `${path}.value`, state }
    ));
  }

  if (rule.states !== undefined && !isRecord(rule.states)) {
    diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `${path}.states must be a YAML mapping of state names to expressions.`, { path: `${path}.states`, state }));
  }
  if (rule.style !== undefined) {
    if (!isRecord(rule.style)) {
      diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `${path}.style must be a YAML mapping of state names to style mappings.`, { path: `${path}.style`, state }));
    } else {
      const stateKeys = new Set(Object.keys(isRecord(rule.states) ? rule.states : {}));
      for (const [stateKey, style] of Object.entries(rule.style).sort(([left], [right]) => left.localeCompare(right))) {
        if (stateKey !== 'default' && !stateKeys.has(stateKey)) {
          diagnostics.push(mapperDiagnostic(
            'invalid-mapper-schema',
            `${path}.style.${stateKey} does not have a matching states.${stateKey} expression.`,
            { path: `${path}.style.${stateKey}`, state }
          ));
        }
        validateMapperStylePatch(diagnostics, state, parsedSelector.kind, style, `${path}.style.${stateKey}`);
      }
    }
  }
}

function validateMapperResolver(
  diagnostics: WebviewDiagnostic[],
  state: WebviewState,
  kind: MapperTargetKind,
  resolver: Record<string, unknown>,
  index: number,
  inventory: MapperInventory
) {
  const path = `mappings[${index}].target.resolve`;
  const by = stringValue(resolver.by) as MapperResolverMode | undefined;
  if (!by || !mapperResolverModes.has(by)) return;
  const rulePath = `mappings[${index}]`;
  const ruleId = `${rulePath}`;

  if (by === 'id') {
    if (kind === 'linkDirection') {
      if (!stringValue(resolver.metricLabel) && (!stringValue(resolver.linkMetricLabel) || !stringValue(resolver.directionMetricLabel))) {
        diagnostics.push(mapperDiagnostic(
          'mapper-query-hint',
          `${path} should define metricLabel, or linkMetricLabel plus directionMetricLabel, so telemetry can resolve a linkDirection object.`,
          { path, severity: 'warning', source: 'semantic', state }
        ));
      }
      if (inventory.byKind.linkDirection.length === 0) {
        diagnostics.push(mapperDiagnostic(
          'mapper-link-direction-missing-direction',
          `${ruleId} targets linkDirection, but the applied topology does not declare any link directions.`,
          { path: `mappings[${index}].target.kind`, severity: 'warning', source: 'semantic', state }
        ));
      }
    } else if (!stringValue(resolver.metricLabel)) {
      diagnostics.push(mapperDiagnostic(
        'mapper-query-hint',
        `${path}.metricLabel should name the telemetry label carrying the ${kind} ID.`,
        { path: `${path}.metricLabel`, severity: 'warning', source: 'semantic', state }
      ));
    }
  }

  if ((by === 'label' || by === 'data') && (!stringValue(resolver.metricLabel) || !stringValue(resolver.key))) {
    diagnostics.push(mapperDiagnostic(
      'mapper-query-hint',
      `${path} should define metricLabel and key for ${by} matching.`,
      { path, severity: 'warning', source: 'semantic', state }
    ));
  }

  if (by === 'endpoint') {
    if (kind !== 'link' && kind !== 'linkDirection') {
      diagnostics.push(mapperDiagnostic(
        'mapper-resolver-invalid',
        `${path}.by: endpoint can only target link or linkDirection objects.`,
        { path: `${path}.by`, severity: 'warning', source: 'semantic', state }
      ));
    }
    if (!stringValue(resolver.sourceLabel) || !stringValue(resolver.targetLabel)) {
      diagnostics.push(mapperDiagnostic(
        'mapper-query-hint',
        `${path} should define sourceLabel and targetLabel for endpoint matching.`,
        { path, severity: 'warning', source: 'semantic', state }
      ));
    }
    if ([...inventory.endpointPairs.values()].some((count) => count > 1)) {
      diagnostics.push(mapperDiagnostic(
        'mapper-endpoint-ambiguous',
        `${ruleId} uses endpoint matching while the topology has parallel links. Prefer a stable link ID label for unambiguous mapping.`,
        { path, severity: 'warning', source: 'semantic', state }
      ));
    }
  }

  if (by === 'selector') {
    const selector = stringValue(resolver.selector);
    if (!selector) {
      diagnostics.push(mapperDiagnostic('mapper-selector-invalid', `${path}.selector is required for selector matching.`, { path: `${path}.selector`, state }));
      return;
    }
    const parsedSelector = parseMapperSelector(selector);
    if (!parsedSelector) {
      diagnostics.push(mapperDiagnostic('mapper-selector-invalid', `${path}.selector uses an unsupported selector "${selector}".`, { path: `${path}.selector`, state }));
      return;
    }
    if (parsedSelector.kind !== kind) {
      diagnostics.push(mapperDiagnostic(
        'mapper-selector-kind-mismatch',
        `${ruleId} target kind is ${kind}, but selector targets ${parsedSelector.kind}.`,
        { path: `${path}.selector`, severity: 'warning', source: 'semantic', state }
      ));
      return;
    }
    if (mapperSelectorEntities(parsedSelector, inventory).length === 0 && inventory.byKind[kind].length > 0) {
      diagnostics.push(mapperDiagnostic(
        'mapper-selector-unmatched',
        `${ruleId} selector "${selector}" does not match any ${kind} object in the applied topology.`,
        { path: `${path}.selector`, severity: 'warning', source: 'semantic', state }
      ));
    }
  }

  if (by === 'aggregate' && kind !== 'layer' && kind !== 'graph') {
    diagnostics.push(mapperDiagnostic(
      'mapper-resolver-invalid',
      `${path}.by: aggregate can only target layer or graph objects.`,
      { path: `${path}.by`, severity: 'warning', source: 'semantic', state }
    ));
  }

  if (by === 'staticObjectIds') {
    const ids = Array.isArray(resolver.objectIds) ? resolver.objectIds.map(stringValue).filter((value): value is string => Boolean(value)) : [];
    if (!ids.length) {
      diagnostics.push(mapperDiagnostic(
        'mapper-query-hint',
        `${path}.objectIds should list one or more ${kind} object IDs.`,
        { path: `${path}.objectIds`, severity: 'warning', source: 'semantic', state }
      ));
      return;
    }
    const existingIds = new Set(inventory.byKind[kind].map((entity) => entity.id));
    for (const id of ids) {
      if (!existingIds.has(id)) {
        diagnostics.push(mapperDiagnostic(
          'mapper-static-object-stale',
          `${ruleId} references missing ${kind} object "${id}".`,
          { path: `${path}.objectIds`, severity: 'warning', source: 'semantic', state }
        ));
      }
    }
  }
}

function validateCanonicalMapperMapping(
  diagnostics: WebviewDiagnostic[],
  state: WebviewState,
  mapping: Record<string, unknown>,
  index: number,
  inventory: MapperInventory
) {
  const target = mapping.target;
  if (!isRecord(target)) return;
  const kind = stringValue(target.kind) as MapperTargetKind | undefined;
  if (!kind || !mapperTargetKinds.has(kind)) return;
  if (isRecord(target.resolve)) {
    validateMapperResolver(diagnostics, state, kind, target.resolve, index, inventory);
  }
  validateMapperOverlay(diagnostics, state, kind, mapping.overlay, `mappings[${index}].overlay`);
  if (Array.isArray(mapping.conditions)) {
    for (const [conditionIndex, condition] of mapping.conditions.entries()) {
      if (isRecord(condition)) {
        validateMapperStylePatch(diagnostics, state, kind, condition.style, `mappings[${index}].conditions[${conditionIndex}].style`);
      }
    }
  }
}

function validateMapperText(state: WebviewState, document: TopoDocument | undefined): WebviewDiagnostic[] {
  const text = state.mapperText?.trim();
  if (!text) return [];

  let mapper: Record<string, unknown>;
  try {
    mapper = parseYamlObject(state.mapperText || '', 'Mapper YAML', 'mapper');
  } catch (error) {
    const sourceYamlError = error instanceof SourceYamlError ? error : undefined;
    return [mapperDiagnostic(
      'invalid-mapper-yaml',
      error instanceof Error ? error.message : String(error),
      { line: sourceYamlError?.line, column: sourceYamlError?.column }
    )];
  }

  const diagnostics: WebviewDiagnostic[] = [];
  const inventory = mapperInventory(document);
  const supportedRootKeys = new Set(['$schema', 'version', 'identity', 'palette', 'rules', 'mappings']);
  for (const key of Object.keys(mapper).sort()) {
    if (!supportedRootKeys.has(key)) {
      diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `Unsupported mapper root key "${key}".`, { path: key, state }));
    }
  }

  if (mapper.version !== 1) {
    diagnostics.push(mapperDiagnostic('invalid-mapper-schema', 'Mapper YAML must set version: 1.', { path: 'version', state }));
  }

  const rules = mapper.rules;
  const mappings = mapper.mappings;
  if (rules === undefined && mappings === undefined) {
    diagnostics.push(mapperDiagnostic('invalid-mapper-schema', 'Mapper YAML must define rules or mappings.', { path: 'rules', state }));
  }
  if (rules !== undefined && !Array.isArray(rules)) {
    diagnostics.push(mapperDiagnostic('invalid-mapper-schema', 'Mapper rules must be a YAML list.', { path: 'rules', state }));
  }
  if (mappings !== undefined && !Array.isArray(mappings)) {
    diagnostics.push(mapperDiagnostic('invalid-mapper-schema', 'Mapper mappings must be a YAML list.', { path: 'mappings', state }));
  }

  if (Array.isArray(rules)) {
    for (const [index, rule] of rules.entries()) {
      if (!isRecord(rule)) {
        diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `rules[${index}] must be a YAML mapping.`, { path: `rules[${index}]`, state }));
        continue;
      }
      for (const key of ['id', 'metric', 'select']) {
        if (typeof rule[key] !== 'string' || !rule[key].trim()) {
          diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `rules[${index}].${key} is required.`, { path: `rules[${index}].${key}`, state }));
        }
      }
      validateCompactMapperRule(diagnostics, state, rule, index, inventory);
    }
  }

  if (Array.isArray(mappings)) {
    for (const [index, mapping] of mappings.entries()) {
      if (!isRecord(mapping)) {
        diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `mappings[${index}] must be a YAML mapping.`, { path: `mappings[${index}]`, state }));
        continue;
      }
      for (const key of ['id', 'metric']) {
        if (typeof mapping[key] !== 'string' || !mapping[key].trim()) {
          diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `mappings[${index}].${key} is required.`, { path: `mappings[${index}].${key}`, state }));
        }
      }
      const target = mapping.target;
      if (!isRecord(target)) {
        diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `mappings[${index}].target is required.`, { path: `mappings[${index}].target`, state }));
        continue;
      }
      if (!mapperTargetKinds.has(String(target.kind || '') as MapperTargetKind)) {
        diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `mappings[${index}].target.kind must be a supported TopoViewer object kind.`, { path: `mappings[${index}].target.kind`, state }));
      }
      if (!isRecord(target.resolve)) {
        diagnostics.push(mapperDiagnostic('invalid-mapper-schema', `mappings[${index}].target.resolve is required.`, { path: `mappings[${index}].target.resolve`, state }));
      } else if (!mapperResolverModes.has(String(target.resolve.by || '') as MapperResolverMode)) {
        diagnostics.push(mapperDiagnostic(
          'invalid-mapper-schema',
          `mappings[${index}].target.resolve.by must be one of ${Array.from(mapperResolverModes).join(', ')}.`,
          { path: `mappings[${index}].target.resolve.by`, state }
        ));
      }
      validateCanonicalMapperMapping(diagnostics, state, mapping, index, inventory);
    }
  }

  return diagnostics;
}

function layerObjectCounts(document: TopoDocument): Map<string, number> {
  const counts = new Map((document.graph?.layers || []).map((layer) => [layer.id, 0]));
  const entities: Array<GraphNode | GraphLink | GraphPath | GraphRegion | DiagramShape | DiagramConnector | DiagramCallout> = [
    ...(document.graph?.nodes || []),
    ...(document.graph?.links || []),
    ...(document.graph?.paths || []),
    ...(document.graph?.regions || []),
    ...(document.diagram?.shapes || []),
    ...(document.diagram?.connectors || []),
    ...(document.diagram?.callouts || [])
  ];

  for (const entity of entities) {
    for (const layerId of entity.layers || []) {
      if (counts.has(layerId)) {
        counts.set(layerId, (counts.get(layerId) || 0) + 1);
      }
    }
  }
  return counts;
}

export function validateSources(state: WebviewState): ValidationResult {
  const diagnostics: WebviewDiagnostic[] = [];
  let document: TopoDocument | undefined;

  if (state.topologyMissing) {
    diagnostics.push({
      severity: 'error',
      source: 'host',
      code: 'missing-topology-yaml',
      message: `Topology YAML file was not found${state.topologyPath ? `: ${state.topologyPath}` : ''}.`
    });
  }
  if (state.stylesheetMissing) {
    diagnostics.push({
      severity: 'warning',
      source: 'host',
      code: 'missing-stylesheet-yaml',
      message: `Stylesheet YAML file was not found${state.stylesheetPath ? `: ${state.stylesheetPath}` : ''}.`
    });
  }
  if (state.mapperMissing) {
    diagnostics.push({
      severity: 'warning',
      source: 'host',
      code: 'missing-mapper-yaml',
      message: `Mapper YAML file was not found${state.mapperPath ? `: ${state.mapperPath}` : ''}.`,
      document: 'mapper'
    });
  }

  try {
    document = validateTopoDocument(composeTopoDocument(state), 'VS Code TopoViewer preview');
    diagnostics.push(...lintTopoDocument(document, { requireNames: false }).map((issue) => ({
      severity: issue.severity,
      source: 'semantic' as const,
      code: issue.code,
      message: issue.message,
      path: issue.path,
      ...diagnosticLocationForPath(issue.path, state)
    })));
  } catch (error) {
    const sourceYamlError = error instanceof SourceYamlError ? error : undefined;
    const inferredPath = sourceYamlError ? undefined : firstValidationPath(error instanceof Error ? error.message : String(error));
    diagnostics.push({
      severity: 'error',
      source: 'schema',
      code: 'invalid-topoviewer-document',
      message: error instanceof Error ? error.message : String(error),
      ...(sourceYamlError
        ? { document: sourceYamlError.document, line: sourceYamlError.line, column: sourceYamlError.column }
        : diagnosticLocationForPath(inferredPath, state))
    });
  }

  diagnostics.push(...validateMapperText(state, document));

  const objectCounts = document ? layerObjectCounts(document) : new Map<string, number>();

  return {
    document,
    diagnostics,
    layers: document?.graph?.layers?.map((layer) => ({
      id: layer.id,
      name: layer.name,
      objectCount: objectCounts.get(layer.id) || 0
    })) || []
  };
}
