export type MapperAuthoringTargetKind = 'node' | 'link' | 'linkDirection' | 'path' | 'region' | 'graph';

export type MapperAuthoringValueSemantic =
  | 'percent'
  | 'utilization'
  | 'utilizationPercent'
  | 'up'
  | 'errors'
  | 'errorsTotal'
  | 'latency'
  | 'latencyMs'
  | 'loss'
  | 'lossPercent'
  | 'capacity'
  | 'capacityPercent'
  | 'bps'
  | 'health';

export interface CreateBasicMapperRuleOptions {
  directionLabel?: string;
  joinLabel?: string;
  linkLabel?: string;
  metric: string;
  stateExpression?: string;
  stateName?: string;
  targetKind: MapperAuthoringTargetKind;
  value?: MapperAuthoringValueSemantic;
}

export interface BasicMapperRule {
  id: string;
  join?: string | { direction: string; link: string };
  metric: string;
  select: MapperAuthoringTargetKind;
  states?: Record<string, string>;
  value?: MapperAuthoringValueSemantic;
}

export const mapperAuthoringTargetKinds: readonly MapperAuthoringTargetKind[] = [
  'node', 'link', 'linkDirection', 'path', 'region', 'graph'
];

export const mapperAuthoringValueSemantics: readonly MapperAuthoringValueSemantic[] = [
  'percent', 'utilization', 'utilizationPercent', 'up', 'errors', 'errorsTotal',
  'latency', 'latencyMs', 'loss', 'lossPercent', 'capacity', 'capacityPercent',
  'bps', 'health'
];

const defaultJoinLabels: Record<Exclude<MapperAuthoringTargetKind, 'linkDirection' | 'graph'>, string> = {
  link: 'link_id',
  node: 'node_id',
  path: 'path_id',
  region: 'region_id'
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'metric';
}

function mapperRuleIds(mapper: Record<string, unknown>): Set<string> {
  return new Set(['rules', 'mappings'].flatMap((collection) => (
    Array.isArray(mapper[collection])
      ? mapper[collection].flatMap((item) => isRecord(item) && typeof item.id === 'string' ? [item.id] : [])
      : []
  )));
}

function nextRuleId(mapper: Record<string, unknown>, base: string): string {
  const ids = mapperRuleIds(mapper);
  if (!ids.has(base)) return base;
  let suffix = 2;
  while (ids.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function createBasicMapperRule(
  mapper: Record<string, unknown>,
  options: CreateBasicMapperRuleOptions
): BasicMapperRule {
  const metric = options.metric.trim();
  if (!metric) throw new Error('Metric name is required.');
  if (!mapperAuthoringTargetKinds.includes(options.targetKind)) {
    throw new Error(`Unsupported mapper target kind: ${options.targetKind}.`);
  }
  const base = `${slug(metric)}-${slug(options.targetKind)}`;
  const rule: BasicMapperRule = {
    id: nextRuleId(mapper, base),
    metric,
    select: options.targetKind
  };
  if (options.targetKind === 'linkDirection') {
    const link = (options.linkLabel || 'link_id').trim();
    const direction = (options.directionLabel || 'direction').trim();
    if (!link || !direction) throw new Error('Link and direction telemetry labels are required.');
    rule.join = { direction, link };
  } else if (options.targetKind !== 'graph') {
    const label = (options.joinLabel || defaultJoinLabels[options.targetKind]).trim();
    if (!label) throw new Error('Join telemetry label is required.');
    rule.join = label;
  }
  if (options.value) rule.value = options.value;
  const stateName = options.stateName?.trim();
  const stateExpression = options.stateExpression?.trim();
  if (stateName || stateExpression) {
    if (!stateName || !stateExpression) throw new Error('State name and expression must be provided together.');
    if (stateName === 'default') throw new Error('The state name "default" is reserved.');
    if (!/^(?:==|!=|>=|<=|>|<).+/.test(stateExpression)) {
      throw new Error('State expression must start with ==, !=, >=, <=, >, or <.');
    }
    rule.states = { [stateName]: stateExpression };
  }
  return rule;
}

export function mapperRuleTargetKind(rule: unknown): MapperAuthoringTargetKind | undefined {
  if (!isRecord(rule)) return undefined;
  if (typeof rule.select === 'string') {
    const select = rule.select;
    const kind = mapperAuthoringTargetKinds.find((candidate) => select === candidate || select.startsWith(`${candidate}[`));
    return kind;
  }
  if (!isRecord(rule.target) || typeof rule.target.kind !== 'string') return undefined;
  const kind = rule.target.kind;
  return mapperAuthoringTargetKinds.find((candidate) => candidate === kind);
}
