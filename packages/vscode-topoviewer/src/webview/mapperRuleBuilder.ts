import yaml from 'js-yaml';
import type { TopoDocument } from 'topoviewer';

export type MapperRuleTargetKind = 'node' | 'link' | 'path' | 'region' | 'layer' | 'graph';
export type MapperRuleResolverMode = 'id' | 'label' | 'data' | 'endpoint' | 'selector' | 'aggregate' | 'staticObjectIds';

export interface MapperRuleBuilderState {
  id: string;
  metric: string;
  targetKind: MapperRuleTargetKind;
  resolverMode: MapperRuleResolverMode;
  metricLabel: string;
  valueAs: string;
  selector: string;
  objectId: string;
  labelKey: string;
  labelValue: string;
  dataKey: string;
  sourceLabel: string;
  targetLabel: string;
  warningThreshold: string;
  errorThreshold: string;
  labelTemplate: string;
  badgeTemplate: string;
  defaultColor: string;
  defaultWidth: string;
  stateName: string;
  stateExpression: string;
  stateColor: string;
  stateWidth: string;
  propagateToLayerMembers: boolean;
}

export interface MapperTopologyPickers {
  dataKeys: string[];
  endpointPairs: Array<{ label: string; source: string; target: string }>;
  labelEntries: Array<{ key: string; value: string }>;
  labelKeys: string[];
  layers: Array<{ id: string; name: string }>;
  objectIdsByKind: Record<MapperRuleTargetKind, string[]>;
}

type RecordLike = Record<string, unknown>;

const targetKinds: MapperRuleTargetKind[] = ['node', 'link', 'path', 'region', 'layer', 'graph'];
const valueKinds = ['up', 'utilizationPercent', 'errorsTotal', 'latencyMs', 'lossPercent', 'capacityPercent', 'health'];

export const mapperRuleTargetKinds = targetKinds;
export const mapperRuleResolverModes: MapperRuleResolverMode[] = ['id', 'label', 'data', 'endpoint', 'selector', 'aggregate', 'staticObjectIds'];
export const mapperRuleValueKinds = valueKinds;

export const defaultMapperRuleBuilderState: MapperRuleBuilderState = {
  id: 'mapper-rule-1',
  metric: 'topoviewer_metric',
  targetKind: 'link',
  resolverMode: 'id',
  metricLabel: 'link_id',
  valueAs: 'up',
  selector: 'link',
  objectId: '',
  labelKey: '',
  labelValue: '',
  dataKey: '',
  sourceLabel: 'source',
  targetLabel: 'target',
  warningThreshold: '80',
  errorThreshold: '90',
  labelTemplate: '{{ value }}',
  badgeTemplate: '',
  defaultColor: '#4caf50',
  defaultWidth: '3',
  stateName: 'warning',
  stateExpression: '>=80',
  stateColor: '#ff9800',
  stateWidth: '5',
  propagateToLayerMembers: false
};

function asRecord(value: unknown): RecordLike | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as RecordLike : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function objectId(value: unknown): string | undefined {
  return asRecord(value)?.id ? String(asRecord(value)?.id) : undefined;
}

function labelOf(entry: { id: string; name?: string }) {
  return entry.name && entry.name !== entry.id ? `${entry.name} (${entry.id})` : entry.id;
}

function collectLabels(entries: unknown[] = []) {
  const labelEntries = new Map<string, { key: string; value: string }>();
  for (const entry of entries) {
    const labels = asRecord(asRecord(entry)?.labels);
    if (!labels) continue;
    for (const [key, value] of Object.entries(labels)) {
      if (value === undefined || value === null) continue;
      labelEntries.set(`${key}:${String(value)}`, { key, value: String(value) });
    }
  }
  return [...labelEntries.values()].sort((a, b) => `${a.key}:${a.value}`.localeCompare(`${b.key}:${b.value}`));
}

function collectDataKeys(entries: unknown[] = []) {
  const keys = new Set<string>();
  for (const entry of entries) {
    const data = asRecord(asRecord(entry)?.data);
    if (!data) continue;
    for (const key of Object.keys(data)) keys.add(key);
  }
  return [...keys].sort();
}

export function mapperTopologyPickers(document: TopoDocument | undefined): MapperTopologyPickers {
  const graph = document?.graph || {};
  const nodes = graph.nodes || [];
  const links = graph.links || [];
  const paths = graph.paths || [];
  const regions = graph.regions || [];
  const layers = (graph.layers || []).map((layer) => ({
    id: layer.id,
    name: layer.name || layer.id
  }));
  const graphId = graph.id || 'graph';
  const typedEntries = [...nodes, ...links, ...paths, ...regions, ...layers.map((layer) => ({ id: layer.id, name: layer.name }))];

  return {
    dataKeys: collectDataKeys(typedEntries),
    endpointPairs: links.map((link) => ({
      label: `${link.source} -> ${link.target}`,
      source: link.source,
      target: link.target
    })).sort((a, b) => a.label.localeCompare(b.label)),
    labelEntries: collectLabels(typedEntries),
    labelKeys: [...new Set(collectLabels(typedEntries).map((entry) => entry.key))].sort(),
    layers,
    objectIdsByKind: {
      node: nodes.map((node) => node.id).sort(),
      link: links.map((link) => link.id).sort(),
      path: paths.map((path) => path.id).sort(),
      region: regions.map((region) => region.id).sort(),
      layer: layers.map((layer) => layer.id).sort(),
      graph: [graphId]
    }
  };
}

function firstAvailableObjectId(state: MapperRuleBuilderState, pickers: MapperTopologyPickers): string | undefined {
  return state.objectId || pickers.objectIdsByKind[state.targetKind][0];
}

function resolverFromState(state: MapperRuleBuilderState, pickers: MapperTopologyPickers): RecordLike {
  if (state.resolverMode === 'selector') {
    return { by: 'selector', selector: state.selector || state.targetKind };
  }
  if (state.resolverMode === 'label') {
    return {
      by: 'label',
      key: state.labelKey || pickers.labelKeys[0] || 'role',
      metricLabel: state.metricLabel || `${state.targetKind}_label`
    };
  }
  if (state.resolverMode === 'data') {
    return {
      by: 'data',
      key: state.dataKey || pickers.dataKeys[0] || 'name',
      metricLabel: state.metricLabel || `${state.targetKind}_data`
    };
  }
  if (state.resolverMode === 'endpoint') {
    return {
      by: 'endpoint',
      sourceLabel: state.sourceLabel || 'source',
      targetLabel: state.targetLabel || 'target'
    };
  }
  if (state.resolverMode === 'aggregate') {
    return { by: 'aggregate' };
  }
  if (state.resolverMode === 'staticObjectIds') {
    const object = firstAvailableObjectId(state, pickers);
    return {
      by: 'staticObjectIds',
      objectIds: object ? [object] : []
    };
  }
  return {
    by: 'id',
    metricLabel: state.metricLabel || `${state.targetKind}_id`
  };
}

function scalarFromExpression(expression: string): RecordLike | undefined {
  const match = expression.trim().match(/^(>=|<=|>|<|==|!=)\s*(.+)$/);
  if (!match) return undefined;
  const raw = match[2].replace(/^["']|["']$/g, '');
  const numeric = Number(raw);
  const value: string | number | boolean = Number.isFinite(numeric)
    ? numeric
    : raw === 'true'
      ? true
      : raw === 'false'
        ? false
        : raw;
  if (match[1] === '>') return { gt: value };
  if (match[1] === '>=') return { gte: value };
  if (match[1] === '<') return { lt: value };
  if (match[1] === '<=') return { lte: value };
  if (match[1] === '!=') return { ne: value };
  return { eq: value };
}

function numberOrUndefined(value: string): number | undefined {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function styleForTarget(state: MapperRuleBuilderState, color: string, width: string): RecordLike {
  const style: RecordLike = {};
  if (color) {
    if (state.targetKind === 'node') style.statusColor = color;
    else if (state.targetKind === 'region') style.borderColor = color;
    else style.lineColor = color;
  }
  const numericWidth = numberOrUndefined(width);
  if (numericWidth !== undefined) {
    if (state.targetKind === 'node') style.outlineWidth = numericWidth;
    else if (state.targetKind === 'region') style.borderWidth = numericWidth;
    else style.lineWidth = numericWidth;
  }
  return style;
}

export function buildMapperRuleFromBuilder(
  state: MapperRuleBuilderState,
  pickers: MapperTopologyPickers
) {
  const id = state.id.trim() || `${state.targetKind}-${state.metric.trim() || 'metric'}`;
  const overlayStyle = styleForTarget(state, state.defaultColor, state.defaultWidth);
  const overlay: RecordLike = {
    ...(state.labelTemplate.trim() ? { label: state.labelTemplate.trim() } : {}),
    ...(state.badgeTemplate.trim() ? { badgeLabel: state.badgeTemplate.trim(), statusMarker: true } : {}),
    ...(state.propagateToLayerMembers ? { propagateToLayerMembers: true } : {}),
    ...(Object.keys(overlayStyle).length ? { style: overlayStyle } : {})
  };
  const stateCondition = state.stateName.trim() && state.stateExpression.trim()
    ? scalarFromExpression(state.stateExpression)
    : undefined;
  const stateStyle = styleForTarget(state, state.stateColor, state.stateWidth);

  return {
    id,
    metric: state.metric.trim() || 'topoviewer_metric',
    target: {
      kind: state.targetKind,
      resolve: resolverFromState(state, pickers)
    },
    ...(state.valueAs ? { value: { as: state.valueAs } } : {}),
    ...((state.warningThreshold || state.errorThreshold) ? {
      thresholds: {
        ...(numberOrUndefined(state.warningThreshold) !== undefined ? { warning: numberOrUndefined(state.warningThreshold) } : {}),
        ...(numberOrUndefined(state.errorThreshold) !== undefined ? { error: numberOrUndefined(state.errorThreshold) } : {})
      }
    } : {}),
    ...(Object.keys(overlay).length ? { overlay } : {}),
    ...(stateCondition && Object.keys(stateStyle).length ? {
      conditions: [{
        id: state.stateName.trim(),
        when: { value: stateCondition },
        style: stateStyle
      }]
    } : {})
  };
}

export function appendMapperRule(
  source: string,
  state: MapperRuleBuilderState,
  pickers: MapperTopologyPickers,
  graphId = 'topoviewer'
): string {
  const parsed = asRecord(yaml.load(source) || {}) || {};
  const mappings = Array.isArray(parsed.mappings) ? parsed.mappings : [];
  const rule = buildMapperRuleFromBuilder(state, pickers);
  const next = {
    version: 1,
    ...parsed,
    identity: asRecord(parsed.identity) || {
      sourceId: graphId,
      sourceIdLabel: 'source_id'
    },
    mappings: [
      ...mappings,
      rule
    ]
  };
  return yaml.dump(next, {
    lineWidth: 100,
    noRefs: true,
    quotingType: '"'
  });
}
