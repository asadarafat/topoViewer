import type {
  AttentionGraphIndex,
  AttentionGraphInput,
  AttentionIndexedObject,
  AttentionObjectByKind,
  AttentionObjectKind
} from './types';
import type {
  DataBag,
  GraphDefinition,
  GraphEntity,
  GraphPath,
  GraphRegion,
  Scalar,
  TopoDocument
} from '../types';

const EMPTY_IDS = Object.freeze([]) as readonly string[];
const VALUE_SEPARATOR = '\u0000';

export type {
  AttentionGraphIndex,
  AttentionGraphInput,
  AttentionIndexedObject,
  AttentionObjectByKind,
  AttentionObjectKind,
  FocusDependencyDirection,
  FocusDependencyQuery,
  FocusChangeQuery,
  FocusPresentationMode,
  FocusQuery,
  FocusQueryErrorCode,
  FocusResult,
  AttentionViewportPolicy,
  AggregateGraphResult,
  AggregateGroupDefinition,
  AggregateGroupKind,
  AggregateGroupSummary,
  DeriveAggregateGraphOptions,
  LabelAggregateGroupDefinition,
  LinkAggregateGroupSummary,
  LinkGroupingKey,
  LinkGroupingOptions,
  LinkGroupingViewportPolicy,
  ParentAggregateGroupDefinition,
  RegionAggregateGroupDefinition,
  AttentionLabelPriority,
  AttentionPresentation,
  AttentionPresentationResult,
  AttentionPresentationState,
  AttentionScore,
  AttentionScoreResult,
  AttentionScoringOptions
} from './types';
export { FocusQueryError, resolveFocusQuery } from './focus';
export { deriveAggregateGraph } from './reduction';
export { deriveAttentionPresentation, explainAttentionScore, scoreAttention } from './scoring';

function graphFromInput(input: AttentionGraphInput): GraphDefinition {
  if ('graph' in input || 'diagram' in input || 'toggles' in input || 'layout' in input || 'limits' in input || 'version' in input) {
    return (input as TopoDocument).graph || {};
  }
  return input as GraphDefinition;
}

function objectKey(kind: AttentionObjectKind, id: string): string {
  return `${kind}${VALUE_SEPARATOR}${id}`;
}

function valueKey(value: unknown): string {
  if (value === null) return 'null:null';
  if (Array.isArray(value) || typeof value === 'object') return `json:${stableStringify(value)}`;
  return `${typeof value}:${String(value)}`;
}

function indexedValueKey(path: string, value: unknown): string {
  return `${path}${VALUE_SEPARATOR}${valueKey(value)}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(',')}}`;
}

function cloneDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map((entry) => cloneDeep(entry)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneDeep(entry)])) as T;
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.values(value).forEach((entry) => deepFreeze(entry));
  return Object.freeze(value);
}

function addUnique(map: Map<string, string[]>, key: string, id: string) {
  const current = map.get(key);
  if (!current) {
    map.set(key, [id]);
    return;
  }
  if (!current.includes(id)) current.push(id);
}

function addUniquePair(map: Map<string, string[]>, source: string | undefined, target: string | undefined) {
  if (!source || !target) return;
  addUnique(map, source, target);
}

function freezeIds(ids: string[]): readonly string[] {
  return Object.freeze([...ids]);
}

function mergeIds(left: readonly string[], right: readonly string[]): readonly string[] {
  const merged: string[] = [];
  [...left, ...right].forEach((id) => {
    if (!merged.includes(id)) merged.push(id);
  });
  return freezeIds(merged);
}

function freezeListMap(map: Map<string, string[]>): ReadonlyMap<string, readonly string[]> {
  return new Map(Array.from(map.entries()).map(([key, value]) => [key, freezeIds(value)]));
}

function mapLookup(map: ReadonlyMap<string, readonly string[]>, key: string): readonly string[] {
  return map.get(key) || EMPTY_IDS;
}

function addEntityLabels(entity: GraphEntity, labelPresence: Map<string, string[]>, labelValues: Map<string, string[]>) {
  if (entity.label !== undefined) {
    addUnique(labelPresence, 'label', entity.id);
    addUnique(labelValues, indexedValueKey('label', entity.label), entity.id);
  }
  Object.entries(entity.labels || {}).forEach(([key, value]) => {
    addUnique(labelPresence, key, entity.id);
    addUnique(labelValues, indexedValueKey(key, value), entity.id);
  });
}

function addDataFields(entity: GraphEntity, dataPresence: Map<string, string[]>, dataValues: Map<string, string[]>) {
  flattenData(entity.data || {}).forEach(([path, value]) => {
    addUnique(dataPresence, path, entity.id);
    addUnique(dataValues, indexedValueKey(path, value), entity.id);
  });
}

function flattenData(data: DataBag, prefix = ''): Array<[string, unknown]> {
  return Object.entries(data).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return [[path, value], ...flattenData(value as DataBag, path)];
    }
    return [[path, value]];
  });
}

function pathMembers(path: GraphPath): readonly string[] {
  const members: string[] = [];
  (path.sequence || []).forEach((id) => {
    if (!members.includes(id)) members.push(id);
  });
  [path.source, path.target].forEach((id) => {
    if (id && !members.includes(id)) members.push(id);
  });
  return members;
}

function addPathAdjacency(path: GraphPath, outgoing: Map<string, string[]>, incoming: Map<string, string[]>) {
  if (Array.isArray(path.sequence) && path.sequence.length >= 2) {
    path.sequence.slice(0, -1).forEach((source, index) => {
      const target = path.sequence?.[index + 1];
      addDirectedAdjacency(source, target, outgoing, incoming);
    });
    return;
  }
  addDirectedAdjacency(path.source, path.target, outgoing, incoming);
}

function addDirectedAdjacency(source: string | undefined, target: string | undefined, outgoing: Map<string, string[]>, incoming: Map<string, string[]>) {
  addUniquePair(outgoing, source, target);
  addUniquePair(incoming, target, source);
}

function addParent(entity: GraphEntity & { parent?: string }, parentById: Map<string, string>, childrenByParent: Map<string, string[]>) {
  if (!entity.parent) return;
  parentById.set(entity.id, entity.parent);
  addUnique(childrenByParent, entity.parent, entity.id);
}

function addIndexedObject<K extends AttentionObjectKind>(
  kind: K,
  entity: AttentionObjectByKind[K],
  objectsById: Map<string, AttentionIndexedObject>,
  objectsByKey: Map<string, AttentionIndexedObject>,
  objectIds: string[],
  kindIds: string[],
  labelPresence: Map<string, string[]>,
  labelValues: Map<string, string[]>,
  dataPresence: Map<string, string[]>,
  dataValues: Map<string, string[]>
) {
  const immutableEntity = deepFreeze(cloneDeep(entity));
  const object = deepFreeze({
    id: entity.id,
    kind,
    entity: immutableEntity
  }) as AttentionIndexedObject<K>;

  objectsByKey.set(objectKey(kind, entity.id), object);
  if (!objectsById.has(entity.id)) objectsById.set(entity.id, object);
  objectIds.push(entity.id);
  kindIds.push(entity.id);
  addEntityLabels(entity, labelPresence, labelValues);
  addDataFields(entity, dataPresence, dataValues);
}

export function buildAttentionIndex(input: AttentionGraphInput): AttentionGraphIndex {
  const graph = graphFromInput(input);
  const objectsById = new Map<string, AttentionIndexedObject>();
  const objectsByKey = new Map<string, AttentionIndexedObject>();
  const objectIds: string[] = [];
  const nodeIds: string[] = [];
  const linkIds: string[] = [];
  const pathIds: string[] = [];
  const regionIds: string[] = [];
  const labelPresence = new Map<string, string[]>();
  const labelValues = new Map<string, string[]>();
  const dataPresence = new Map<string, string[]>();
  const dataValues = new Map<string, string[]>();
  const parentById = new Map<string, string>();
  const childrenByParent = new Map<string, string[]>();
  const regionMembersByRegion = new Map<string, string[]>();
  const regionsByMember = new Map<string, string[]>();
  const pathMembersByPath = new Map<string, string[]>();
  const pathsByMember = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  (graph.nodes || []).forEach((node) => {
    addIndexedObject('node', node, objectsById, objectsByKey, objectIds, nodeIds, labelPresence, labelValues, dataPresence, dataValues);
    addParent(node, parentById, childrenByParent);
  });

  (graph.links || []).forEach((link) => {
    addIndexedObject('link', link, objectsById, objectsByKey, objectIds, linkIds, labelPresence, labelValues, dataPresence, dataValues);
    addParent(link, parentById, childrenByParent);
    addDirectedAdjacency(link.source, link.target, outgoing, incoming);
  });

  (graph.paths || []).forEach((path) => {
    addIndexedObject('path', path, objectsById, objectsByKey, objectIds, pathIds, labelPresence, labelValues, dataPresence, dataValues);
    addParent(path, parentById, childrenByParent);
    pathMembers(path).forEach((memberId) => {
      addUnique(pathMembersByPath, path.id, memberId);
      addUnique(pathsByMember, memberId, path.id);
    });
    addPathAdjacency(path, outgoing, incoming);
  });

  (graph.regions || []).forEach((region: GraphRegion) => {
    addIndexedObject('region', region, objectsById, objectsByKey, objectIds, regionIds, labelPresence, labelValues, dataPresence, dataValues);
    addParent(region, parentById, childrenByParent);
    (region.members || []).forEach((memberId) => {
      addUnique(regionMembersByRegion, region.id, memberId);
      addUnique(regionsByMember, memberId, region.id);
    });
  });

  const readonlyLabels = freezeListMap(labelPresence);
  const readonlyLabelValues = freezeListMap(labelValues);
  const readonlyData = freezeListMap(dataPresence);
  const readonlyDataValues = freezeListMap(dataValues);
  const readonlyChildren = freezeListMap(childrenByParent);
  const readonlyRegionMembers = freezeListMap(regionMembersByRegion);
  const readonlyRegionsByMember = freezeListMap(regionsByMember);
  const readonlyPathMembers = freezeListMap(pathMembersByPath);
  const readonlyPathsByMember = freezeListMap(pathsByMember);
  const readonlyOutgoing = freezeListMap(outgoing);
  const readonlyIncoming = freezeListMap(incoming);

  return Object.freeze({
    objectIds: freezeIds(objectIds),
    nodeIds: freezeIds(nodeIds),
    linkIds: freezeIds(linkIds),
    pathIds: freezeIds(pathIds),
    regionIds: freezeIds(regionIds),
    getObject: (id: string, kind?: AttentionObjectKind) => (
      kind
        ? objectsByKey.get(objectKey(kind, id))
        : objectsById.get(id)
    ),
    getNode: (id: string) => objectsByKey.get(objectKey('node', id)) as AttentionIndexedObject<'node'> | undefined,
    getLink: (id: string) => objectsByKey.get(objectKey('link', id)) as AttentionIndexedObject<'link'> | undefined,
    getPath: (id: string) => objectsByKey.get(objectKey('path', id)) as AttentionIndexedObject<'path'> | undefined,
    getRegion: (id: string) => objectsByKey.get(objectKey('region', id)) as AttentionIndexedObject<'region'> | undefined,
    getByLabel: (key: string, value?: Scalar) => (
      value === undefined
        ? mapLookup(readonlyLabels, key)
        : mapLookup(readonlyLabelValues, indexedValueKey(key, value))
    ),
    getByData: (path: string, value?: unknown) => (
      value === undefined
        ? mapLookup(readonlyData, path)
        : mapLookup(readonlyDataValues, indexedValueKey(path, value))
    ),
    getParent: (id: string) => parentById.get(id),
    getChildren: (parentId: string) => mapLookup(readonlyChildren, parentId),
    getRegionMembers: (regionId: string) => mapLookup(readonlyRegionMembers, regionId),
    getRegionsByMember: (id: string) => mapLookup(readonlyRegionsByMember, id),
    getPathMembers: (pathId: string) => mapLookup(readonlyPathMembers, pathId),
    getPathsByMember: (id: string) => mapLookup(readonlyPathsByMember, id),
    getOutgoing: (id: string) => mapLookup(readonlyOutgoing, id),
    getIncoming: (id: string) => mapLookup(readonlyIncoming, id),
    getAdjacent: (id: string) => mergeIds(mapLookup(readonlyOutgoing, id), mapLookup(readonlyIncoming, id))
  });
}
