import yaml from 'js-yaml';
import type { StyleDeclaration } from 'topoviewer';
import type { GrafanaPanelDiagnostic } from './types';
import type {
  MapperCondition,
  MapperConditionScalar,
  MapperConditionalStyle,
  MapperKeyedCondition,
  MapperOverlayPolicy,
  MapperResolver,
  MapperResolverMode,
  MapperScalarCondition,
  MapperRule,
  MapperSeverityName,
  MapperSeverityPalette,
  MapperTargetKind,
  MapperThresholds,
  MapperValueSelector,
  TopoViewerMapper
} from './mapperTypes';

const targetKinds = new Set<MapperTargetKind>(['node', 'link', 'linkDirection', 'path', 'region', 'layer', 'graph']);
const resolverModes = new Set<MapperResolverMode>(['id', 'label', 'data', 'endpoint', 'selector', 'aggregate', 'staticObjectIds']);
const valueAsKinds = new Set(['up', 'utilizationPercent', 'errorsTotal', 'latencyMs', 'lossPercent', 'capacityPercent', 'health']);
const severityNames = new Set<MapperSeverityName>(['success', 'info', 'warning', 'error']);
const rootKeys = new Set(['$schema', 'version', 'identity', 'palette', 'rules', 'mappings']);
const identityKeys = new Set(['sourceId', 'sourceIdLabel']);
const paletteEntryKeys = new Set(['color', 'accent']);
const authoringRuleKeys = new Set(['id', 'metric', 'select', 'join', 'value', 'states', 'style']);
const mappingKeys = new Set(['id', 'metric', 'target', 'value', 'thresholds', 'overlay', 'conditions']);
const targetKeys = new Set(['kind', 'resolve']);
const resolverKeys = new Set(['by', 'metricLabel', 'linkMetricLabel', 'directionMetricLabel', 'key', 'sourceLabel', 'targetLabel', 'selector', 'objectIds']);
const valueKeys = new Set(['field', 'as']);
const thresholdKeys = new Set(['info', 'warning', 'error', 'direction']);
const conditionalStyleKeys = new Set(['id', 'when', 'style']);
const conditionKeys = new Set(['severity', 'value', 'label', 'field']);
const scalarConditionKeys = new Set(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'exists']);
const keyedConditionKeys = new Set(['key', 'eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'exists']);
const overlayKeys = new Set([
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

export interface MapperParseResult {
  mapper?: TopoViewerMapper;
  diagnostics: GrafanaPanelDiagnostic[];
}

interface YamlExceptionWithMark {
  mark?: {
    line?: number;
    column?: number;
  };
}

function diagnostic(
  severity: GrafanaPanelDiagnostic['severity'],
  code: string,
  message: string,
  extra: Partial<GrafanaPanelDiagnostic> = {}
): GrafanaPanelDiagnostic {
  return { severity, code, message, ...extra };
}

function schemaDiagnostic(path: string, message: string): GrafanaPanelDiagnostic {
  return diagnostic('error', 'mapper-schema-invalid', `${path}: ${message}`, {
    document: 'mapper',
    path
  });
}

function yamlDiagnostic(label: string, error: unknown): GrafanaPanelDiagnostic {
  const mark = (error as YamlExceptionWithMark | undefined)?.mark;
  const line = typeof mark?.line === 'number' ? mark.line + 1 : undefined;
  const column = typeof mark?.column === 'number' ? mark.column + 1 : undefined;
  const location = line && column ? ` at mapper line ${line}, column ${column}` : '';
  return diagnostic(
    'error',
    'mapper-yaml-invalid',
    `Unable to parse ${label}${location}: ${error instanceof Error ? error.message : String(error)}.`,
    { document: 'mapper', line, column }
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value
    .map((item) => stringValue(item))
    .filter((item): item is string => Boolean(item));
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return undefined;
}

function conditionScalarValue(value: unknown): MapperConditionScalar | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value;
  return undefined;
}

function unknownKeyDiagnostics(input: Record<string, unknown>, allowed: Set<string>, path: string): GrafanaPanelDiagnostic[] {
  return Object.keys(input)
    .filter((key) => !allowed.has(key))
    .sort()
    .map((key) => schemaDiagnostic(path ? `${path}.${key}` : key, 'unsupported key'));
}

function parseThresholds(input: unknown): MapperThresholds | undefined {
  if (!isRecord(input)) return undefined;
  const thresholds: MapperThresholds = {};
  const info = numberValue(input.info);
  const warning = numberValue(input.warning);
  const error = numberValue(input.error);
  if (info !== undefined) thresholds.info = info;
  if (warning !== undefined) thresholds.warning = warning;
  if (error !== undefined) thresholds.error = error;
  if (input.direction === 'below') thresholds.direction = 'below';
  if (input.direction === 'above') thresholds.direction = 'above';
  return Object.keys(thresholds).length ? thresholds : undefined;
}

function parsePaletteEntry(input: unknown, diagnostics: GrafanaPanelDiagnostic[], path: string): string | { color?: string; accent?: string } | undefined {
  if (typeof input === 'string' && input.trim()) return input.trim();
  if (!isRecord(input)) {
    diagnostics.push(schemaDiagnostic(path, 'must be a color string or a mapping with color/accent'));
    return undefined;
  }
  diagnostics.push(...unknownKeyDiagnostics(input, paletteEntryKeys, path));
  const color = stringValue(input.color);
  const accent = stringValue(input.accent);
  if (!color && !accent) {
    diagnostics.push(schemaDiagnostic(path, 'must define color or accent'));
    return undefined;
  }
  return { color, accent };
}

function parsePalette(input: unknown, diagnostics: GrafanaPanelDiagnostic[]): MapperSeverityPalette | undefined {
  if (input === undefined) return undefined;
  if (!isRecord(input)) {
    diagnostics.push(schemaDiagnostic('palette', 'must be a YAML mapping'));
    return undefined;
  }
  const palette: MapperSeverityPalette = {};
  for (const key of Object.keys(input).sort()) {
    if (!severityNames.has(key as MapperSeverityName)) {
      diagnostics.push(schemaDiagnostic(`palette.${key}`, `must be one of ${Array.from(severityNames).join(', ')}`));
      continue;
    }
    const entry = parsePaletteEntry(input[key], diagnostics, `palette.${key}`);
    if (entry !== undefined) palette[key as MapperSeverityName] = entry;
  }
  return Object.keys(palette).length ? palette : undefined;
}

function parseValue(input: unknown, diagnostics: GrafanaPanelDiagnostic[], path: string): MapperValueSelector | undefined {
  if (!isRecord(input)) return undefined;
  diagnostics.push(...unknownKeyDiagnostics(input, valueKeys, path));
  const value: MapperValueSelector = {};
  const field = stringValue(input.field);
  const as = stringValue(input.as);
  if (field) value.field = field;
  if (as) {
    if (!valueAsKinds.has(as)) {
      diagnostics.push(schemaDiagnostic(`${path}.as`, `must be one of ${Array.from(valueAsKinds).join(', ')}`));
    } else {
      value.as = as;
    }
  }
  return Object.keys(value).length ? value : undefined;
}

function parseScalarCondition(
  input: unknown,
  diagnostics: GrafanaPanelDiagnostic[],
  path: string,
  keyed: false
): MapperScalarCondition | undefined;
function parseScalarCondition(
  input: unknown,
  diagnostics: GrafanaPanelDiagnostic[],
  path: string,
  keyed: true
): MapperKeyedCondition | undefined;
function parseScalarCondition(
  input: unknown,
  diagnostics: GrafanaPanelDiagnostic[],
  path: string,
  keyed: boolean
): MapperScalarCondition | MapperKeyedCondition | undefined {
  if (!isRecord(input)) {
    diagnostics.push(schemaDiagnostic(path, 'must be a YAML mapping'));
    return undefined;
  }
  diagnostics.push(...unknownKeyDiagnostics(input, keyed ? keyedConditionKeys : scalarConditionKeys, path));
  const condition: MapperScalarCondition & Partial<MapperKeyedCondition> = {};
  if (keyed) {
    const key = stringValue(input.key);
    if (!key) {
      diagnostics.push(schemaDiagnostic(`${path}.key`, 'is required for label and field conditions'));
      return undefined;
    }
    condition.key = key;
  }
  for (const key of ['eq', 'ne'] as const) {
    const value = conditionScalarValue(input[key]);
    if (value !== undefined) condition[key] = value;
  }
  for (const key of ['gt', 'gte', 'lt', 'lte'] as const) {
    if (input[key] === undefined) continue;
    const numeric = numberValue(input[key]);
    if (numeric === undefined) {
      diagnostics.push(schemaDiagnostic(`${path}.${key}`, 'must be a finite number'));
    } else {
      condition[key] = numeric;
    }
  }
  const contains = stringValue(input.contains);
  if (contains) condition.contains = contains;
  if (typeof input.exists === 'boolean') condition.exists = input.exists;
  return Object.keys(condition).length ? condition as MapperScalarCondition | MapperKeyedCondition : undefined;
}

function parseCondition(input: unknown, diagnostics: GrafanaPanelDiagnostic[], path: string): MapperCondition | undefined {
  if (input === undefined) return undefined;
  if (!isRecord(input)) {
    diagnostics.push(schemaDiagnostic(path, 'must be a YAML mapping'));
    return undefined;
  }
  diagnostics.push(...unknownKeyDiagnostics(input, conditionKeys, path));
  const condition: MapperCondition = {};
  if (input.severity !== undefined) {
    const severity = stringValue(input.severity);
    if (severity === 'none' || severityNames.has(severity as MapperSeverityName)) {
      condition.severity = severity as MapperCondition['severity'];
    } else {
      diagnostics.push(schemaDiagnostic(`${path}.severity`, `must be none or one of ${Array.from(severityNames).join(', ')}`));
    }
  }
  if (input.value !== undefined) {
    const value = parseScalarCondition(input.value, diagnostics, `${path}.value`, false);
    if (value) condition.value = value;
  }
  if (input.label !== undefined) {
    const label = parseScalarCondition(input.label, diagnostics, `${path}.label`, true);
    if (label) condition.label = label;
  }
  if (input.field !== undefined) {
    const field = parseScalarCondition(input.field, diagnostics, `${path}.field`, true);
    if (field) condition.field = field;
  }
  return Object.keys(condition).length ? condition : undefined;
}

function parseConditionalStyles(input: unknown, diagnostics: GrafanaPanelDiagnostic[], path: string): MapperConditionalStyle[] | undefined {
  if (input === undefined) return undefined;
  if (!Array.isArray(input)) {
    diagnostics.push(schemaDiagnostic(path, 'must be a YAML sequence'));
    return undefined;
  }
  const conditions = input.flatMap((item, index): MapperConditionalStyle[] => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(item)) {
      diagnostics.push(schemaDiagnostic(itemPath, 'must be a YAML mapping'));
      return [];
    }
    diagnostics.push(...unknownKeyDiagnostics(item, conditionalStyleKeys, itemPath));
    if (!isRecord(item.style)) {
      diagnostics.push(schemaDiagnostic(`${itemPath}.style`, 'must define a style mapping'));
      return [];
    }
    const id = stringValue(item.id);
    const when = parseCondition(item.when, diagnostics, `${itemPath}.when`);
    return [{
      id,
      style: item.style as StyleDeclaration,
      when
    }];
  });
  return conditions.length ? conditions : undefined;
}

function parseSelectKind(select: string): { hasPredicate: boolean; kind: MapperTargetKind } | undefined {
  const match = select.match(/^(node|linkDirection|link|path|region|layer|graph)(?:\s*\[|$)/);
  if (!match) return undefined;
  return {
    hasPredicate: /\[/.test(select),
    kind: match[1] as MapperTargetKind
  };
}

function parseAuthoringJoin(
  input: unknown,
  selected: { hasPredicate: boolean; kind: MapperTargetKind },
  diagnostics: GrafanaPanelDiagnostic[],
  path: string
): MapperResolver | undefined {
  if (input === undefined) {
    return { by: 'selector', selector: undefined };
  }
  const metricLabel = stringValue(input);
  if (metricLabel) {
    if (selected.hasPredicate) {
      diagnostics.push(schemaDiagnostic(path, 'cannot be combined with a predicate selector; use select without join, or use canonical mappings for advanced joins'));
      return undefined;
    }
    return { by: 'id', metricLabel };
  }
  if (isRecord(input) && selected.kind === 'linkDirection') {
    diagnostics.push(...unknownKeyDiagnostics(input, new Set(['link', 'direction']), path));
    const linkMetricLabel = stringValue(input.link);
    const directionMetricLabel = stringValue(input.direction);
    if (!linkMetricLabel || !directionMetricLabel) {
      diagnostics.push(schemaDiagnostic(path, 'must define link and direction telemetry label names for linkDirection joins'));
      return undefined;
    }
    if (selected.hasPredicate) {
      diagnostics.push(schemaDiagnostic(path, 'cannot be combined with a predicate selector; use select: linkDirection with link/direction join labels'));
      return undefined;
    }
    return { by: 'id', linkMetricLabel, directionMetricLabel };
  }
  diagnostics.push(schemaDiagnostic(path, selected.kind === 'linkDirection'
    ? 'must be a telemetry label string such as direction_id, or a mapping with link and direction labels'
    : 'must be a telemetry label string such as link_id or node_id'));
  return undefined;
}

function normalizeAuthoringValue(input: unknown, diagnostics: GrafanaPanelDiagnostic[], path: string): MapperValueSelector | undefined {
  const value = stringValue(input);
  if (!value) return undefined;
  const aliases: Record<string, string> = {
    capacity: 'capacityPercent',
    errors: 'errorsTotal',
    latency: 'latencyMs',
    loss: 'lossPercent',
    percent: 'utilizationPercent',
    utilization: 'utilizationPercent'
  };
  const normalized = aliases[value] || value;
  if (!valueAsKinds.has(normalized)) {
    diagnostics.push(schemaDiagnostic(path, `must be one of ${Array.from(valueAsKinds).join(', ')} or a supported shorthand such as percent`));
    return undefined;
  }
  return { as: normalized };
}

function scalarFromToken(input: string): MapperConditionScalar {
  const value = input.trim().replace(/^["']|["']$/g, '');
  if (value === 'true') return true;
  if (value === 'false') return false;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
}

function parseStateExpression(input: unknown, diagnostics: GrafanaPanelDiagnostic[], path: string): MapperScalarCondition | undefined {
  const expression = stringValue(input);
  if (!expression) {
    diagnostics.push(schemaDiagnostic(path, 'must be a state expression string such as ">=70" or "==0"'));
    return undefined;
  }
  const match = expression.match(/^(>=|<=|>|<|==|!=)\s*(.+)$/);
  if (!match) return { eq: scalarFromToken(expression) };
  const value = scalarFromToken(match[2]);
  if (['>', '>=', '<', '<='].includes(match[1]) && typeof value !== 'number') {
    diagnostics.push(schemaDiagnostic(path, `operator ${match[1]} requires a numeric value`));
    return undefined;
  }
  if (match[1] === '>') return { gt: value as number };
  if (match[1] === '>=') return { gte: value as number };
  if (match[1] === '<') return { lt: value as number };
  if (match[1] === '<=') return { lte: value as number };
  if (match[1] === '!=') return { ne: value };
  return { eq: value };
}

function replaceStateTemplates(style: StyleDeclaration, state: string): StyleDeclaration {
  return Object.fromEntries(Object.entries(style).map(([key, value]) => [
    key,
    typeof value === 'string'
      ? value.replace(/\{\{\s*(?:state|category)\s*\}\}/g, state)
      : value
  ])) as StyleDeclaration;
}

function parseAuthoringStates(input: unknown, diagnostics: GrafanaPanelDiagnostic[], path: string): Record<string, MapperScalarCondition> {
  if (input === undefined) return {};
  if (!isRecord(input)) {
    diagnostics.push(schemaDiagnostic(path, 'must be a YAML mapping of state names to expressions'));
    return {};
  }
  const states: Record<string, MapperScalarCondition> = {};
  for (const [state, expression] of Object.entries(input)) {
    if (state === 'default') {
      diagnostics.push(schemaDiagnostic(`${path}.default`, 'is reserved for style.default'));
      continue;
    }
    const condition = parseStateExpression(expression, diagnostics, `${path}.${state}`);
    if (condition) states[state] = condition;
  }
  return states;
}

function parseAuthoringStyle(
  input: unknown,
  states: Record<string, MapperScalarCondition>,
  diagnostics: GrafanaPanelDiagnostic[],
  path: string
): { conditions?: MapperConditionalStyle[]; overlay?: MapperOverlayPolicy } {
  if (input === undefined) return {};
  if (!isRecord(input)) {
    diagnostics.push(schemaDiagnostic(path, 'must be a YAML mapping'));
    return {};
  }
  const overlay: MapperOverlayPolicy = {};
  const conditions: MapperConditionalStyle[] = [];
  for (const [state, style] of Object.entries(input)) {
    if (!isRecord(style)) {
      diagnostics.push(schemaDiagnostic(`${path}.${state}`, 'must be a TopoViewer style mapping'));
      continue;
    }
    if (state === 'default') {
      overlay.style = style as StyleDeclaration;
      continue;
    }
    const stateCondition = states[state];
    if (!stateCondition) {
      diagnostics.push(schemaDiagnostic(`${path}.${state}`, `does not have a matching states.${state} expression`));
      continue;
    }
    conditions.push({
      id: state,
      style: replaceStateTemplates(style as StyleDeclaration, state),
      when: {
        value: stateCondition
      }
    });
  }
  return {
    conditions: conditions.length ? conditions : undefined,
    overlay: Object.keys(overlay).length ? overlay : undefined
  };
}

function parseAuthoringRule(input: unknown, index: number, diagnostics: GrafanaPanelDiagnostic[]): MapperRule | undefined {
  const context = `rule ${index + 1}`;
  const path = `rules[${index}]`;
  if (!isRecord(input)) {
    diagnostics.push(diagnostic('error', 'mapper-rule-invalid', `${context} must be a YAML mapping.`, {
      document: 'mapper',
      path
    }));
    return undefined;
  }
  diagnostics.push(...unknownKeyDiagnostics(input, authoringRuleKeys, path));
  const id = stringValue(input.id) || `rule-${index + 1}`;
  const metric = stringValue(input.metric);
  if (!metric) {
    diagnostics.push(diagnostic('error', 'mapper-rule-metric-missing', `${context} must define metric.`, {
      document: 'mapper',
      path: `${path}.metric`
    }));
    return undefined;
  }
  const select = stringValue(input.select);
  if (!select) {
    diagnostics.push(diagnostic('error', 'mapper-rule-select-missing', `${context} must define select.`, {
      document: 'mapper',
      path: `${path}.select`
    }));
    return undefined;
  }
  const selected = parseSelectKind(select);
  if (!selected) {
    diagnostics.push(diagnostic('error', 'mapper-rule-select-invalid', `${context} select must start with one of ${Array.from(targetKinds).join(', ')}.`, {
      document: 'mapper',
      path: `${path}.select`
    }));
    return undefined;
  }
  const resolver = parseAuthoringJoin(input.join, selected, diagnostics, `${path}.join`);
  if (!resolver) return undefined;
  const states = parseAuthoringStates(input.states, diagnostics, `${path}.states`);
  const style = parseAuthoringStyle(input.style, states, diagnostics, `${path}.style`);
  return {
    id,
    metric,
    target: {
      kind: selected.kind,
      resolve: input.join === undefined
        ? { by: 'selector', selector: select }
        : resolver
    },
    value: normalizeAuthoringValue(input.value, diagnostics, `${path}.value`),
    overlay: style.overlay,
    conditions: style.conditions
  };
}

function parseOverlay(input: unknown, diagnostics: GrafanaPanelDiagnostic[], path: string): MapperOverlayPolicy | undefined {
  if (!isRecord(input)) return undefined;
  diagnostics.push(...unknownKeyDiagnostics(input, overlayKeys, path));
  const overlay: MapperOverlayPolicy = {};
  for (const key of [
    'lineColorBySeverity',
    'lineWidthBySeverity',
    'sourceArrowColorBySeverity',
    'targetArrowColorBySeverity',
    'outlineBySeverity',
    'statusMarker',
    'backgroundColorBySeverity',
    'borderColorBySeverity',
    'propagateToLayerMembers'
  ] as const) {
    if (typeof input[key] === 'boolean') overlay[key] = input[key];
  }
  const badgeLabel = stringValue(input.badgeLabel);
  const label = stringValue(input.label);
  if (badgeLabel) overlay.badgeLabel = badgeLabel;
  if (label) overlay.label = label;
  if (isRecord(input.style)) overlay.style = input.style;
  return Object.keys(overlay).length ? overlay : undefined;
}

function parseResolver(input: unknown, diagnostics: GrafanaPanelDiagnostic[], context: string, path: string): MapperResolver | undefined {
  if (!isRecord(input)) {
    diagnostics.push(diagnostic('error', 'mapper-resolver-missing', `${context} must define target.resolve as a mapping.`, {
      document: 'mapper',
      path
    }));
    return undefined;
  }
  diagnostics.push(...unknownKeyDiagnostics(input, resolverKeys, path));
  const by = stringValue(input.by);
  if (!by || !resolverModes.has(by as MapperResolverMode)) {
    diagnostics.push(diagnostic('error', 'mapper-resolver-invalid', `${context} target.resolve.by must be one of ${Array.from(resolverModes).join(', ')}.`, {
      document: 'mapper',
      path: `${path}.by`
    }));
    return undefined;
  }
  const resolver: MapperResolver = { by: by as MapperResolverMode };
  const metricLabel = stringValue(input.metricLabel);
  const linkMetricLabel = stringValue(input.linkMetricLabel);
  const directionMetricLabel = stringValue(input.directionMetricLabel);
  const key = stringValue(input.key);
  const sourceLabel = stringValue(input.sourceLabel);
  const targetLabel = stringValue(input.targetLabel);
  const selector = stringValue(input.selector);
  const objectIds = stringArray(input.objectIds);
  if (metricLabel) resolver.metricLabel = metricLabel;
  if (linkMetricLabel) resolver.linkMetricLabel = linkMetricLabel;
  if (directionMetricLabel) resolver.directionMetricLabel = directionMetricLabel;
  if (key) resolver.key = key;
  if (sourceLabel) resolver.sourceLabel = sourceLabel;
  if (targetLabel) resolver.targetLabel = targetLabel;
  if (selector) resolver.selector = selector;
  if (objectIds?.length) resolver.objectIds = objectIds;
  return resolver;
}

function parseRule(input: unknown, index: number, diagnostics: GrafanaPanelDiagnostic[]): MapperRule | undefined {
  const context = `mapping ${index + 1}`;
  const path = `mappings[${index}]`;
  if (!isRecord(input)) {
    diagnostics.push(diagnostic('error', 'mapper-rule-invalid', `${context} must be a YAML mapping.`, {
      document: 'mapper',
      path
    }));
    return undefined;
  }
  diagnostics.push(...unknownKeyDiagnostics(input, mappingKeys, path));
  const id = stringValue(input.id) || `mapping-${index + 1}`;
  const metric = stringValue(input.metric);
  if (!metric) {
    diagnostics.push(diagnostic('error', 'mapper-rule-metric-missing', `${context} must define metric.`, {
      document: 'mapper',
      path: `${path}.metric`
    }));
    return undefined;
  }
  if (!isRecord(input.target)) {
    diagnostics.push(diagnostic('error', 'mapper-target-missing', `${context} must define target.kind and target.resolve.`, {
      document: 'mapper',
      path: `${path}.target`
    }));
    return undefined;
  }
  diagnostics.push(...unknownKeyDiagnostics(input.target, targetKeys, `${path}.target`));
  const kind = stringValue(input.target.kind);
  if (!kind || !targetKinds.has(kind as MapperTargetKind)) {
    diagnostics.push(diagnostic('error', 'mapper-target-invalid', `${context} target.kind must be one of ${Array.from(targetKinds).join(', ')}.`, {
      document: 'mapper',
      path: `${path}.target.kind`
    }));
    return undefined;
  }
  const resolver = parseResolver(input.target.resolve, diagnostics, context, `${path}.target.resolve`);
  if (!resolver) return undefined;
  if (isRecord(input.thresholds)) {
    diagnostics.push(...unknownKeyDiagnostics(input.thresholds, thresholdKeys, `${path}.thresholds`));
    if (input.thresholds.direction !== undefined && input.thresholds.direction !== 'above' && input.thresholds.direction !== 'below') {
      diagnostics.push(schemaDiagnostic(`${path}.thresholds.direction`, 'must be one of above, below'));
    }
  }
  return {
    id,
    metric,
    target: {
      kind: kind as MapperTargetKind,
      resolve: resolver
    },
    value: parseValue(input.value, diagnostics, `${path}.value`),
    thresholds: parseThresholds(input.thresholds),
    overlay: parseOverlay(input.overlay, diagnostics, `${path}.overlay`),
    conditions: parseConditionalStyles(input.conditions, diagnostics, `${path}.conditions`)
  };
}

function legacyRules(input: Record<string, unknown>): MapperRule[] {
  const metrics = Array.isArray(input.metrics) ? input.metrics : [];
  const objects = isRecord(input.objects) ? input.objects : {};
  const links = isRecord(objects.links) ? objects.links : {};
  const linkIdLabel = stringValue(links.idLabel) || 'link_id';
  const sourceLabel = stringValue(links.sourceLabel) || 'source';
  const targetLabel = stringValue(links.targetLabel) || 'target';
  return metrics.flatMap((metric, index) => {
    if (!isRecord(metric)) return [];
    const name = stringValue(metric.name);
    const object = stringValue(metric.object);
    if (!name || object !== 'link') return [];
    const valueAs = stringValue(metric.value);
    return [{
      id: `legacy-${name}-${index + 1}`,
      metric: name,
      target: {
        kind: 'link',
        resolve: {
          by: 'id',
          metricLabel: linkIdLabel,
          sourceLabel,
          targetLabel
        }
      },
      value: valueAs ? { as: valueAs } : undefined,
      thresholds: name.includes('utilization') ? { info: 50, warning: 80, error: 90 } : undefined,
      overlay: {
        lineColorBySeverity: true,
        lineWidthBySeverity: true,
        sourceArrowColorBySeverity: true,
        targetArrowColorBySeverity: true,
        label: valueAs === 'up' ? '{{ severity }}' : '{{ value | round }}',
        statusMarker: true,
        outlineBySeverity: true
      }
    } satisfies MapperRule];
  }).map((rule) => ({
    ...rule,
    // aarafat-tag: legacy-source-id-migration
    target: rule.target,
    value: rule.value,
    thresholds: rule.thresholds,
    overlay: rule.overlay
  }));
}

export function parseTopoViewerMapperYaml(source: string, label = 'TopoViewer mapper'): MapperParseResult {
  const diagnostics: GrafanaPanelDiagnostic[] = [];
  try {
    const parsed = yaml.load(source);
    if (parsed === undefined || parsed === null) {
      return {
        mapper: { version: 1, mappings: [] },
        diagnostics: [diagnostic('warning', 'mapper-empty', `${label} is empty; telemetry overlays are disabled for this bundle.`)]
      };
    }
    if (!isRecord(parsed)) {
      return {
        diagnostics: [diagnostic('error', 'mapper-document-invalid', `${label} must be a YAML mapping.`, {
          document: 'mapper'
        })]
      };
    }
    diagnostics.push(...unknownKeyDiagnostics(parsed, rootKeys, ''));
    const version = numberValue(parsed.version);
    if (version !== 1) {
      diagnostics.push(diagnostic('error', 'mapper-version-invalid', `${label} must declare version: 1.`, {
        document: 'mapper',
        path: 'version'
      }));
      return { diagnostics };
    }
    const identitySource = isRecord(parsed.identity) ? parsed.identity : isRecord(parsed.source) ? parsed.source : {};
    if (isRecord(parsed.identity)) {
      diagnostics.push(...unknownKeyDiagnostics(parsed.identity, identityKeys, 'identity'));
    }
    const sourceId = stringValue(identitySource.sourceId);
    const sourceIdLabel = stringValue(identitySource.sourceIdLabel);
    const rawRules = Array.isArray(parsed.rules) ? parsed.rules : undefined;
    const rawMappings = Array.isArray(parsed.mappings) ? parsed.mappings : undefined;
    if (!rawRules && parsed.rules !== undefined) {
      diagnostics.push(diagnostic('error', 'mapper-rules-invalid', `${label} rules must be a YAML sequence.`, {
        document: 'mapper',
        path: 'rules'
      }));
      return { diagnostics };
    }
    if (!rawMappings && parsed.mappings !== undefined) {
      diagnostics.push(diagnostic('error', 'mapper-mappings-invalid', `${label} mappings must be a YAML sequence.`, {
        document: 'mapper',
        path: 'mappings'
      }));
      return { diagnostics };
    }
    const authoringRules = rawRules
      ? rawRules.map((item, index) => parseAuthoringRule(item, index, diagnostics)).filter((rule): rule is MapperRule => Boolean(rule))
      : [];
    const canonicalRules = rawMappings
      ? rawMappings.map((item, index) => parseRule(item, index, diagnostics)).filter((rule): rule is MapperRule => Boolean(rule))
      : [];
    const mappings = rawRules || rawMappings
      ? [...authoringRules, ...canonicalRules]
      : legacyRules(parsed);
    if (!rawRules && !rawMappings && mappings.length === 0) {
      diagnostics.push(diagnostic('error', 'mapper-mappings-missing', `${label} must define rules or mappings.`, {
        document: 'mapper',
        path: 'rules'
      }));
    }
    if (!rawRules && !rawMappings && mappings.length) {
      diagnostics.push(diagnostic('info', 'mapper-legacy-shape', `${label} uses the legacy metrics shape; prefer rules for new bundles.`));
    }
    return {
      mapper: {
        version: 1,
        identity: sourceId || sourceIdLabel ? { sourceId, sourceIdLabel } : undefined,
        palette: parsePalette(parsed.palette, diagnostics),
        mappings
      },
      diagnostics
    };
  } catch (error) {
    return {
      diagnostics: [yamlDiagnostic(label, error)]
    };
  }
}
