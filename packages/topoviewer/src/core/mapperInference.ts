import type { TopoDocument } from './types';
import {
  authoringLinkDirectionObjects,
  findAuthoringObject,
  type AuthoringObjectSelection
} from './authoringGraph';
import {
  createBasicMapperRule,
  type BasicMapperRule,
  type MapperAuthoringTargetKind
} from './mapperAuthoring';
import type { MapperAuthoringSample } from './mapperSamples';

export interface MapperMetricDiscovery {
  labelKeys: string[];
  metric: string;
  sampleCount: number;
}

export interface MapperJoinCandidate {
  ambiguousSampleCount: number;
  id: string;
  matchedObjectIds: string[];
  matchedSampleCount: number;
  mode: 'id' | 'label' | 'data' | 'linkDirection';
  objectKey?: string;
  telemetryLabel: string;
  directionTelemetryLabel?: string;
}

export interface MapperRuleProposal {
  candidates: MapperJoinCandidate[];
  metric: string;
  sampleCount: number;
  status: 'ready' | 'ambiguous' | 'missing-join' | 'unsupported-target';
  targetId: string;
  targetKind: MapperAuthoringTargetKind;
}

export interface ProposedMapperRule {
  collection: 'rules' | 'mappings';
  value: BasicMapperRule | Record<string, unknown>;
}

interface InventoryObject {
  data: Record<string, unknown>;
  id: string;
  labels: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function inventory(document: TopoDocument, kind: MapperAuthoringTargetKind): InventoryObject[] {
  if (kind === 'graph') {
    const graph = document.graph as unknown as Record<string, unknown> | undefined;
    return graph ? [{ data: {}, id: String(graph.id || 'graph'), labels: {} }] : [];
  }
  if (kind === 'linkDirection') {
    return authoringLinkDirectionObjects(document).map((item) => ({
      data: isRecord(item.data) ? item.data : {},
      id: String(item.id),
      labels: isRecord(item.labels) ? item.labels : {}
    }));
  }
  const graph = document.graph as unknown as Record<string, unknown> | undefined;
  const collection = kind === 'node' ? graph?.nodes
    : kind === 'link' ? graph?.links
      : kind === 'path' ? graph?.paths
        : graph?.regions;
  return records(collection).flatMap((item) => {
    const id = typeof item.id === 'string' ? item.id : '';
    return id ? [{
      data: isRecord(item.data) ? item.data : {},
      id,
      labels: isRecord(item.labels) ? item.labels : {}
    }] : [];
  });
}

function scalar(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return undefined;
}

function valueIndex(objects: InventoryObject[], value: (object: InventoryObject) => unknown) {
  const index = new Map<string, string[]>();
  for (const object of objects) {
    const item = scalar(value(object));
    if (!item) continue;
    const ids = index.get(item) || [];
    ids.push(object.id);
    index.set(item, ids);
  }
  return index;
}

function candidateCoverage(
  samples: MapperAuthoringSample[],
  label: string,
  index: Map<string, string[]>,
  targetId: string
) {
  const matchedIds = new Set<string>();
  let matchedSampleCount = 0;
  let ambiguousSampleCount = 0;
  for (const sample of samples) {
    const value = sample.labels[label];
    const ids = value === undefined ? [] : index.get(value) || [];
    if (!ids.length) continue;
    matchedSampleCount += 1;
    if (ids.length > 1) ambiguousSampleCount += 1;
    ids.forEach((id) => matchedIds.add(id));
  }
  return {
    ambiguousSampleCount,
    matchedObjectIds: [...matchedIds].sort(),
    matchedSampleCount,
    matchesTarget: matchedIds.has(targetId)
  };
}

function objectCandidates(
  objects: InventoryObject[],
  samples: MapperAuthoringSample[],
  targetId: string
): MapperJoinCandidate[] {
  const labelKeys = [...new Set(samples.flatMap((sample) => Object.keys(sample.labels)))].sort();
  const candidates: MapperJoinCandidate[] = [];
  const indexes: Array<{ mode: 'id' | 'label' | 'data'; objectKey?: string; values: Map<string, string[]> }> = [
    { mode: 'id', values: valueIndex(objects, (object) => object.id) }
  ];
  const topologyLabelKeys = [...new Set(objects.flatMap((object) => Object.keys(object.labels)))].sort();
  const topologyDataKeys = [...new Set(objects.flatMap((object) => Object.keys(object.data)))].sort();
  topologyLabelKeys.forEach((key) => indexes.push({
    mode: 'label', objectKey: key, values: valueIndex(objects, (object) => object.labels[key])
  }));
  topologyDataKeys.forEach((key) => indexes.push({
    mode: 'data', objectKey: key, values: valueIndex(objects, (object) => object.data[key])
  }));
  for (const telemetryLabel of labelKeys) {
    for (const item of indexes) {
      const coverage = candidateCoverage(samples, telemetryLabel, item.values, targetId);
      if (!coverage.matchesTarget) continue;
      candidates.push({
        ambiguousSampleCount: coverage.ambiguousSampleCount,
        id: `${item.mode}:${telemetryLabel}:${item.objectKey || 'id'}`,
        matchedObjectIds: coverage.matchedObjectIds,
        matchedSampleCount: coverage.matchedSampleCount,
        mode: item.mode,
        objectKey: item.objectKey,
        telemetryLabel
      });
    }
  }
  return candidates.sort((left, right) => (
    left.ambiguousSampleCount - right.ambiguousSampleCount
    || right.matchedSampleCount - left.matchedSampleCount
    || Number(right.mode === 'id') - Number(left.mode === 'id')
    || left.id.localeCompare(right.id)
  ));
}

function directionCandidates(
  document: TopoDocument,
  samples: MapperAuthoringSample[],
  targetId: string
): MapperJoinCandidate[] {
  const target = authoringLinkDirectionObjects(document).find((item) => item.id === targetId);
  if (!target) return [];
  const linkId = String(target.linkId || target.parentLinkId || '');
  const direction = String(target.direction || '');
  const labelKeys = [...new Set(samples.flatMap((sample) => Object.keys(sample.labels)))].sort();
  return labelKeys.flatMap((linkLabel) => labelKeys.flatMap((directionLabel) => {
    if (linkLabel === directionLabel) return [];
    const matching = samples.filter((sample) => (
      sample.labels[linkLabel] === linkId && sample.labels[directionLabel] === direction
    ));
    if (!matching.length) return [];
    return [{
      ambiguousSampleCount: 0,
      directionTelemetryLabel: directionLabel,
      id: `linkDirection:${linkLabel}:${directionLabel}`,
      matchedObjectIds: [targetId],
      matchedSampleCount: matching.length,
      mode: 'linkDirection' as const,
      telemetryLabel: linkLabel
    }];
  })).sort((left, right) => right.matchedSampleCount - left.matchedSampleCount || left.id.localeCompare(right.id));
}

export function discoverMapperMetrics(samples: MapperAuthoringSample[]): MapperMetricDiscovery[] {
  const byMetric = new Map<string, MapperAuthoringSample[]>();
  for (const sample of samples) {
    const current = byMetric.get(sample.metric) || [];
    current.push(sample);
    byMetric.set(sample.metric, current);
  }
  return [...byMetric.entries()].map(([metric, entries]) => ({
    labelKeys: [...new Set(entries.flatMap((entry) => Object.keys(entry.labels)))].sort(),
    metric,
    sampleCount: entries.length
  })).sort((left, right) => left.metric.localeCompare(right.metric));
}

export function proposeMapperRule(
  document: TopoDocument,
  samples: MapperAuthoringSample[],
  metric: string,
  selection: AuthoringObjectSelection
): MapperRuleProposal {
  const targetKind = selection.kind as MapperAuthoringTargetKind;
  const metricSamples = samples.filter((sample) => sample.metric === metric);
  if (!['node', 'link', 'linkDirection', 'path', 'region'].includes(targetKind)) {
    return {
      candidates: [], metric, sampleCount: metricSamples.length,
      status: 'unsupported-target', targetId: selection.id, targetKind
    };
  }
  const target = findAuthoringObject(document, selection);
  if (!target) {
    return {
      candidates: [], metric, sampleCount: metricSamples.length,
      status: 'unsupported-target', targetId: selection.id, targetKind
    };
  }
  const candidates = targetKind === 'linkDirection'
    ? directionCandidates(document, metricSamples, selection.id)
    : objectCandidates(inventory(document, targetKind), metricSamples, selection.id);
  return {
    candidates,
    metric,
    sampleCount: metricSamples.length,
    status: !candidates.length ? 'missing-join' : candidates.length === 1 ? 'ready' : 'ambiguous',
    targetId: selection.id,
    targetKind
  };
}

export function mapperRuleFromProposal(
  mapper: Record<string, unknown>,
  proposal: MapperRuleProposal,
  candidateId?: string
): ProposedMapperRule {
  if (proposal.status === 'unsupported-target' || proposal.status === 'missing-join') {
    throw new Error('The proposal does not have a valid target join.');
  }
  const candidate = proposal.candidates.find((item) => item.id === candidateId)
    || (proposal.candidates.length === 1 ? proposal.candidates[0] : undefined);
  if (!candidate) throw new Error('Choose one join candidate before creating the mapper rule.');
  if (candidate.mode === 'id' || candidate.mode === 'linkDirection') {
    return {
      collection: 'rules',
      value: createBasicMapperRule(mapper, {
        directionLabel: candidate.directionTelemetryLabel,
        joinLabel: candidate.telemetryLabel,
        linkLabel: candidate.telemetryLabel,
        metric: proposal.metric,
        targetKind: proposal.targetKind
      })
    };
  }
  const id = createBasicMapperRule(mapper, {
    joinLabel: candidate.telemetryLabel,
    metric: proposal.metric,
    targetKind: proposal.targetKind
  }).id;
  return {
    collection: 'mappings',
    value: {
      id,
      metric: proposal.metric,
      target: {
        kind: proposal.targetKind,
        resolve: {
          by: candidate.mode,
          key: candidate.objectKey,
          metricLabel: candidate.telemetryLabel
        }
      }
    }
  };
}
