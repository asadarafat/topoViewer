import type { GraphEntity, TopoDocument } from './types';
import { authoringLinkDirectionObjects } from './authoringGraph';
import type { MapperAuthoringSample } from './mapperSamples';
import { selectorMatches } from './selector';

export type MapperCoverageStatus = 'resolved' | 'unresolved' | 'ambiguous' | 'duplicate' | 'ignored' | 'invalid';

export interface MapperCoverageItem {
  message: string;
  metric: string;
  objectIds: string[];
  ruleId?: string;
  sampleIndex: number;
  status: MapperCoverageStatus;
  targetKind?: string;
}

export interface MapperCoverageResult {
  items: MapperCoverageItem[];
  summary: Record<MapperCoverageStatus, number>;
}

interface NormalizedRule {
  id: string;
  metric: string;
  resolver: Record<string, unknown>;
  selector?: string;
  targetKind: string;
}

interface CoverageEntity extends Record<string, unknown> {
  id: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function selectKind(selector: unknown): string | undefined {
  if (typeof selector !== 'string') return undefined;
  return selector.match(/^[A-Za-z]+/)?.[0];
}

function normalizedRules(mapper: Record<string, unknown>): NormalizedRule[] {
  const compact = records(mapper.rules).flatMap((rule, index) => {
    const metric = typeof rule.metric === 'string' ? rule.metric : '';
    const targetKind = selectKind(rule.select);
    if (!metric || !targetKind) return [];
    const join = rule.join;
    const resolver = typeof join === 'string'
      ? { by: 'id', metricLabel: join }
      : isRecord(join)
        ? { by: 'linkDirection', directionMetricLabel: join.direction, linkMetricLabel: join.link }
        : { by: 'selector', selector: rule.select };
    return [{
      id: typeof rule.id === 'string' ? rule.id : `rule-${index + 1}`,
      metric,
      resolver,
      selector: typeof rule.select === 'string' ? rule.select : undefined,
      targetKind
    }];
  });
  const canonical = records(mapper.mappings).flatMap((rule, index) => {
    if (typeof rule.metric !== 'string' || !isRecord(rule.target) || typeof rule.target.kind !== 'string') return [];
    return [{
      id: typeof rule.id === 'string' ? rule.id : `mapping-${index + 1}`,
      metric: rule.metric,
      resolver: isRecord(rule.target.resolve) ? rule.target.resolve : {},
      targetKind: rule.target.kind
    }];
  });
  return [...compact, ...canonical];
}

function entity(value: Record<string, unknown>): CoverageEntity | undefined {
  return typeof value.id === 'string' && value.id ? value as CoverageEntity : undefined;
}

function entities(document: TopoDocument, kind: string): CoverageEntity[] {
  const graph = document.graph as unknown as Record<string, unknown> | undefined;
  if (!graph) return [];
  if (kind === 'graph') return [{ ...graph, id: typeof graph.id === 'string' ? graph.id : 'graph' }];
  if (kind === 'linkDirection') return authoringLinkDirectionObjects(document).map((item) => item as CoverageEntity);
  const collection = kind === 'node' ? graph.nodes
    : kind === 'link' ? graph.links
      : kind === 'path' ? graph.paths
        : kind === 'region' ? graph.regions
          : kind === 'layer' ? graph.layers
            : [];
  return records(collection).flatMap((item) => entity(item) || []);
}

function nestedValue(item: Record<string, unknown>, collection: 'labels' | 'data', key: unknown): unknown {
  if (typeof key !== 'string' || !isRecord(item[collection])) return undefined;
  return item[collection][key];
}

function scalar(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return undefined;
}

function resolveRule(
  document: TopoDocument,
  rule: NormalizedRule,
  sample: MapperAuthoringSample
): { ids: string[]; multipleIsAmbiguous: boolean } {
  const candidates = entities(document, rule.targetKind);
  const by = typeof rule.resolver.by === 'string' ? rule.resolver.by : '';
  if (by === 'linkDirection') {
    const linkLabel = typeof rule.resolver.linkMetricLabel === 'string' ? rule.resolver.linkMetricLabel : '';
    const directionLabel = typeof rule.resolver.directionMetricLabel === 'string' ? rule.resolver.directionMetricLabel : '';
    const linkId = sample.labels[linkLabel];
    const direction = sample.labels[directionLabel];
    return {
      ids: candidates.filter((candidate) => (
        scalar(candidate.linkId || candidate.parentLinkId) === linkId
        && scalar(candidate.direction) === direction
      )).map((candidate) => candidate.id),
      multipleIsAmbiguous: true
    };
  }
  if (by === 'id' || by === 'aggregate') {
    const metricLabel = typeof rule.resolver.metricLabel === 'string' ? rule.resolver.metricLabel : '';
    const expected = sample.labels[metricLabel];
    return { ids: candidates.filter((candidate) => candidate.id === expected).map((candidate) => candidate.id), multipleIsAmbiguous: true };
  }
  if (by === 'label' || by === 'data') {
    const metricLabel = typeof rule.resolver.metricLabel === 'string' ? rule.resolver.metricLabel : '';
    const expected = sample.labels[metricLabel];
    const collection = by === 'label' ? 'labels' : 'data';
    return {
      ids: candidates.filter((candidate) => scalar(nestedValue(candidate, collection, rule.resolver.key)) === expected).map((candidate) => candidate.id),
      multipleIsAmbiguous: true
    };
  }
  if (by === 'endpoint' && rule.targetKind === 'link') {
    const sourceLabel = typeof rule.resolver.sourceLabel === 'string' ? rule.resolver.sourceLabel : '';
    const targetLabel = typeof rule.resolver.targetLabel === 'string' ? rule.resolver.targetLabel : '';
    const source = sample.labels[sourceLabel];
    const target = sample.labels[targetLabel];
    return {
      ids: candidates.filter((candidate) => (
        (candidate.source === source && candidate.target === target)
        || (candidate.source === target && candidate.target === source)
      )).map((candidate) => candidate.id),
      multipleIsAmbiguous: true
    };
  }
  if (by === 'selector') {
    const selector = typeof rule.resolver.selector === 'string' ? rule.resolver.selector : rule.selector || rule.targetKind;
    return {
      ids: candidates.filter((candidate) => selectorMatches(rule.targetKind, candidate as GraphEntity, selector)).map((candidate) => candidate.id),
      multipleIsAmbiguous: false
    };
  }
  if (by === 'staticObjectIds') {
    const requested = Array.isArray(rule.resolver.objectIds) ? rule.resolver.objectIds.filter((id): id is string => typeof id === 'string') : [];
    const existing = new Set(candidates.map((candidate) => candidate.id));
    return { ids: requested.filter((id) => existing.has(id)), multipleIsAmbiguous: false };
  }
  return { ids: [], multipleIsAmbiguous: true };
}

function emptySummary(): Record<MapperCoverageStatus, number> {
  return { ambiguous: 0, duplicate: 0, ignored: 0, invalid: 0, resolved: 0, unresolved: 0 };
}

export function evaluateMapperCoverage(
  document: TopoDocument,
  mapper: Record<string, unknown>,
  samples: MapperAuthoringSample[]
): MapperCoverageResult {
  const rules = normalizedRules(mapper);
  const items: MapperCoverageItem[] = [];
  const applied = new Set<string>();
  const identity = isRecord(mapper.identity) ? mapper.identity : {};
  const sourceId = typeof identity.sourceId === 'string' ? identity.sourceId : undefined;
  const sourceIdLabel = typeof identity.sourceIdLabel === 'string' ? identity.sourceIdLabel : undefined;

  samples.forEach((sample, sampleIndex) => {
    if (!sample || typeof sample.metric !== 'string' || !sample.metric.trim() || !isRecord(sample.labels)) {
      items.push({ message: 'Sample is missing a valid metric or labels object.', metric: '', objectIds: [], sampleIndex, status: 'invalid' });
      return;
    }
    if (sourceId && sourceIdLabel && sample.labels[sourceIdLabel] !== sourceId) {
      items.push({ message: 'Sample source identity does not match this mapper.', metric: sample.metric, objectIds: [], sampleIndex, status: 'ignored' });
      return;
    }
    const matching = rules.filter((rule) => rule.metric === sample.metric);
    if (!matching.length) {
      items.push({ message: 'No mapper rule references this metric.', metric: sample.metric, objectIds: [], sampleIndex, status: 'ignored' });
      return;
    }
    for (const rule of matching) {
      const resolved = resolveRule(document, rule, sample);
      if (!resolved.ids.length) {
        items.push({
          message: `Rule ${rule.id} did not resolve a ${rule.targetKind} object.`, metric: sample.metric,
          objectIds: [], ruleId: rule.id, sampleIndex, status: 'unresolved', targetKind: rule.targetKind
        });
        continue;
      }
      if (resolved.multipleIsAmbiguous && resolved.ids.length > 1) {
        items.push({
          message: `Rule ${rule.id} resolved multiple ${rule.targetKind} objects.`, metric: sample.metric,
          objectIds: resolved.ids, ruleId: rule.id, sampleIndex, status: 'ambiguous', targetKind: rule.targetKind
        });
        continue;
      }
      const duplicateIds = resolved.ids.filter((id) => applied.has(`${sampleIndex}:${rule.targetKind}:${id}`));
      resolved.ids.forEach((id) => applied.add(`${sampleIndex}:${rule.targetKind}:${id}`));
      items.push({
        message: duplicateIds.length
          ? `Rule ${rule.id} maps objects already mapped for this sample.`
          : `Rule ${rule.id} resolved ${resolved.ids.length} ${rule.targetKind} object(s).`,
        metric: sample.metric,
        objectIds: resolved.ids,
        ruleId: rule.id,
        sampleIndex,
        status: duplicateIds.length ? 'duplicate' : 'resolved',
        targetKind: rule.targetKind
      });
    }
  });
  const summary = items.reduce((result, item) => {
    result[item.status] += 1;
    return result;
  }, emptySummary());
  return { items, summary };
}
