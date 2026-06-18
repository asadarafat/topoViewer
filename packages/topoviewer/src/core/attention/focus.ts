import { selectorMatches } from '../selector';
import type {
  AttentionGraphIndex,
  AttentionIndexedObject,
  FocusPresentationMode,
  FocusQuery,
  FocusQueryErrorCode,
  FocusResult
} from './types';
import type { Scalar } from '../types';

const FOCUS_MODES = new Set<FocusPresentationMode>(['highlight', 'dim-context', 'hide-context']);
const DEFAULT_TIMESTAMP_FIELDS = ['changedAt', 'updatedAt', 'lastChangedAt', 'modifiedAt'];
const DEFAULT_REVISION_FIELDS = ['revision', 'version', 'changeRevision', 'updatedRevision'];

export class FocusQueryError extends Error {
  readonly code: FocusQueryErrorCode;

  constructor(code: FocusQueryErrorCode, message: string) {
    super(message);
    this.name = 'FocusQueryError';
    this.code = code;
  }
}

function addReason(reasons: Map<string, string[]>, id: string, reason: string) {
  const current = reasons.get(id);
  if (!current) {
    reasons.set(id, [reason]);
    return;
  }
  if (!current.includes(reason)) current.push(reason);
}

function addFocus(focused: Set<string>, reasons: Map<string, string[]>, id: string, reason: string) {
  focused.add(id);
  addReason(reasons, id, reason);
}

function expectedValues(value: Scalar | readonly Scalar[] | unknown | readonly unknown[]): readonly unknown[] {
  return Array.isArray(value) ? value : [value];
}

function assertObjectExists(index: AttentionGraphIndex, id: string, reason: string) {
  if (!index.getObject(id)) {
    throw new FocusQueryError('missing-id', `Focus query references missing ${reason} "${id}".`);
  }
}

function assertValidMode(mode: string | undefined): FocusPresentationMode {
  const resolved = mode || 'dim-context';
  if (!FOCUS_MODES.has(resolved as FocusPresentationMode)) {
    throw new FocusQueryError('unsupported-mode', `Focus query mode "${resolved}" is not supported.`);
  }
  return resolved as FocusPresentationMode;
}

function assertValidDepth(depth: number) {
  if (!Number.isInteger(depth) || depth < 0) {
    throw new FocusQueryError('invalid-depth', `Focus dependency depth must be a non-negative integer; received "${depth}".`);
  }
}

function addExplicitIds(index: AttentionGraphIndex, query: FocusQuery, focused: Set<string>, reasons: Map<string, string[]>) {
  (query.ids || []).forEach((id) => {
    assertObjectExists(index, id, 'object id');
    addFocus(focused, reasons, id, `id:${id}`);
  });
}

function addLabelMatches(index: AttentionGraphIndex, query: FocusQuery, focused: Set<string>, reasons: Map<string, string[]>) {
  Object.entries(query.labels || {}).forEach(([key, value]) => {
    expectedValues(value).forEach((expected) => {
      index.getByLabel(key, expected as Scalar).forEach((id) => {
        addFocus(focused, reasons, id, `label:${key}=${String(expected)}`);
      });
    });
  });
}

function addDataMatches(index: AttentionGraphIndex, query: FocusQuery, focused: Set<string>, reasons: Map<string, string[]>) {
  Object.entries(query.data || {}).forEach(([path, value]) => {
    expectedValues(value).forEach((expected) => {
      index.getByData(path, expected).forEach((id) => {
        addFocus(focused, reasons, id, `data:${path}=${String(expected)}`);
      });
    });
  });
}

function addPathMatches(index: AttentionGraphIndex, query: FocusQuery, focused: Set<string>, reasons: Map<string, string[]>) {
  (query.pathIds || []).forEach((pathId) => {
    if (!index.getPath(pathId)) {
      throw new FocusQueryError('missing-id', `Focus query references missing path "${pathId}".`);
    }
    addFocus(focused, reasons, pathId, `path:${pathId}`);
    index.getPathMembers(pathId).forEach((id) => {
      addFocus(focused, reasons, id, `path-member:${pathId}`);
    });
  });
}

function addRegionMatches(index: AttentionGraphIndex, query: FocusQuery, focused: Set<string>, reasons: Map<string, string[]>) {
  (query.regionIds || []).forEach((regionId) => {
    if (!index.getRegion(regionId)) {
      throw new FocusQueryError('missing-id', `Focus query references missing region "${regionId}".`);
    }
    addFocus(focused, reasons, regionId, `region:${regionId}`);
    index.getRegionMembers(regionId).forEach((id) => {
      addFocus(focused, reasons, id, `region-member:${regionId}`);
    });
  });
}

function addSelectorMatches(index: AttentionGraphIndex, query: FocusQuery, focused: Set<string>, reasons: Map<string, string[]>) {
  (query.selectors || []).forEach((selector) => {
    index.objectIds.forEach((id) => {
      const object = index.getObject(id);
      if (!object || !selectorMatches(object.kind, object.entity, selector)) return;
      addFocus(focused, reasons, id, `selector:${selector}`);
    });
  });
}

function dataValue(object: AttentionIndexedObject, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') return (value as Record<string, unknown>)[key];
    return undefined;
  }, object.entity.data || {});
}

function comparableTimestamp(value: unknown): number | undefined {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && value.trim() !== '') return numeric;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function comparableRevision(value: unknown): string | number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  }
  return undefined;
}

function revisionChanged(current: string | number, baseline: string | number): boolean {
  if (typeof current === 'number' && typeof baseline === 'number') return current > baseline;
  return String(current) !== String(baseline);
}

function addChangeMatches(index: AttentionGraphIndex, query: FocusQuery, focused: Set<string>, reasons: Map<string, string[]>) {
  const changes = query.changes;
  if (!changes) return;

  const timestampBaseline = changes.since === undefined ? undefined : comparableTimestamp(changes.since);
  const revisionBaseline = changes.revision === undefined ? undefined : comparableRevision(changes.revision);
  const hasTimestampCriterion = changes.since !== undefined;
  const hasRevisionCriterion = changes.revision !== undefined;
  const hasExplicitCriterion = hasTimestampCriterion || hasRevisionCriterion;
  const timestampFields = changes.timestampFields?.length ? changes.timestampFields : DEFAULT_TIMESTAMP_FIELDS;
  const revisionFields = changes.revisionFields?.length ? changes.revisionFields : DEFAULT_REVISION_FIELDS;

  index.objectIds.forEach((id) => {
    const object = index.getObject(id);
    if (!object) return;

    if (dataValue(object, 'changed') === true && timestampBaseline === undefined && revisionBaseline === undefined) {
      addFocus(focused, reasons, id, 'change:changed=true');
    }

    if (hasTimestampCriterion || !hasExplicitCriterion) {
      timestampFields.forEach((field) => {
        const timestamp = comparableTimestamp(dataValue(object, field));
        if (timestamp === undefined) return;
        if (timestampBaseline === undefined || timestamp >= timestampBaseline) {
          addFocus(focused, reasons, id, timestampBaseline === undefined ? `change:${field}` : `change:${field}>=${String(changes.since)}`);
        }
      });
    }

    if (hasRevisionCriterion || !hasExplicitCriterion) {
      revisionFields.forEach((field) => {
        const revision = comparableRevision(dataValue(object, field));
        if (revision === undefined) return;
        if (revisionBaseline === undefined || revisionChanged(revision, revisionBaseline)) {
          addFocus(focused, reasons, id, revisionBaseline === undefined ? `change:${field}` : `change:${field}!=${String(changes.revision)}`);
        }
      });
    }
  });
}

function dependencyNeighbors(index: AttentionGraphIndex, id: string, direction: 'upstream' | 'downstream' | 'both'): readonly string[] {
  if (direction === 'upstream') return index.getIncoming(id);
  if (direction === 'downstream') return index.getOutgoing(id);
  return uniqueIds([...index.getIncoming(id), ...index.getOutgoing(id)]);
}

function uniqueIds(ids: readonly string[]): readonly string[] {
  const result: string[] = [];
  ids.forEach((id) => {
    if (!result.includes(id)) result.push(id);
  });
  return result;
}

function addDependencyMatches(index: AttentionGraphIndex, query: FocusQuery, focused: Set<string>, related: Set<string>, reasons: Map<string, string[]>) {
  const dependency = query.dependency;
  if (!dependency) return;
  assertValidDepth(dependency.depth);
  dependency.from.forEach((id) => {
    assertObjectExists(index, id, 'dependency seed');
    addFocus(focused, reasons, id, `dependency-seed:${id}`);
  });

  let frontier = uniqueIds(dependency.from);
  const seen = new Set(frontier);

  for (let level = 1; level <= dependency.depth; level += 1) {
    const next: string[] = [];
    frontier.forEach((id) => {
      dependencyNeighbors(index, id, dependency.direction).forEach((neighborId) => {
        if (seen.has(neighborId)) return;
        seen.add(neighborId);
        next.push(neighborId);
        if (!focused.has(neighborId)) related.add(neighborId);
        addReason(reasons, neighborId, `dependency:${dependency.direction}:depth=${level}`);
      });
    });
    frontier = next;
    if (!frontier.length) break;
  }
}

function orderedSet(index: AttentionGraphIndex, ids: Set<string>): ReadonlySet<string> {
  return new Set(index.objectIds.filter((id) => ids.has(id)));
}

function freezeReasons(reasons: Map<string, string[]>): ReadonlyMap<string, readonly string[]> {
  return new Map(Array.from(reasons.entries()).map(([id, values]) => [id, Object.freeze([...values])]));
}

export function resolveFocusQuery(index: AttentionGraphIndex, query: FocusQuery): FocusResult {
  const mode = assertValidMode(query.mode);
  const focused = new Set<string>();
  const related = new Set<string>();
  const reasons = new Map<string, string[]>();

  addExplicitIds(index, query, focused, reasons);
  addLabelMatches(index, query, focused, reasons);
  addDataMatches(index, query, focused, reasons);
  addPathMatches(index, query, focused, reasons);
  addRegionMatches(index, query, focused, reasons);
  addSelectorMatches(index, query, focused, reasons);
  addChangeMatches(index, query, focused, reasons);
  addDependencyMatches(index, query, focused, related, reasons);

  const focusedIds = orderedSet(index, focused);
  const relatedIds = orderedSet(index, new Set(Array.from(related).filter((id) => !focused.has(id))));
  const remainder = index.objectIds.filter((id) => !focused.has(id) && !related.has(id));
  const contextIds = mode === 'hide-context' ? new Set<string>() : new Set(remainder);
  const hiddenIds = mode === 'hide-context' ? new Set(remainder) : new Set<string>();

  return Object.freeze({
    mode,
    focusedIds,
    relatedIds,
    contextIds: orderedSet(index, contextIds),
    hiddenIds: orderedSet(index, hiddenIds),
    reasons: freezeReasons(reasons)
  });
}
