import { buildAttentionIndex } from './attention';
import type {
  AggregateGroupDefinition,
  FocusPresentationMode,
  FocusQuery,
  LinkGroupingKey,
  LinkGroupingOptions
} from './attention/types';
import type { TopoDocument, TopoDocumentAttention } from './types';

const focusModes = new Set<FocusPresentationMode>(['highlight', 'dim-context', 'hide-context']);
const groupingKeys = new Set<LinkGroupingKey>(['endpoints', 'layer']);
const advancedQueryFields = [
  'labels',
  'data',
  'pathIds',
  'regionIds',
  'selectors',
  'dependency',
  'changes'
] as const satisfies ReadonlyArray<keyof FocusQuery>;

export const DEFAULT_AUTHORING_LINK_GROUPING_THRESHOLD = 2;
export const DEFAULT_AUTHORING_LINK_GROUPING_KEYS = Object.freeze([
  'endpoints',
  'layer'
] as const satisfies readonly LinkGroupingKey[]);

export type AuthoringAttentionErrorCode =
  | 'duplicate-aggregate-source'
  | 'invalid-aggregate-source'
  | 'invalid-focus-id'
  | 'invalid-focus-mode'
  | 'invalid-link-grouping-keys'
  | 'invalid-link-grouping-threshold'
  | 'missing-aggregate-group'
  | 'unknown-focus-id';

export class AuthoringAttentionError extends Error {
  readonly code: AuthoringAttentionErrorCode;

  constructor(code: AuthoringAttentionErrorCode, message: string) {
    super(message);
    this.name = 'AuthoringAttentionError';
    this.code = code;
  }
}

export type AuthoringAttentionAction =
  | { type: 'set-interactive'; enabled: boolean }
  | { type: 'set-click-mode'; mode: FocusPresentationMode }
  | { type: 'set-focus-ids'; ids: readonly string[] }
  | { type: 'set-focus-mode'; mode: FocusPresentationMode }
  | { type: 'clear-focus-query' }
  | { type: 'add-aggregate-group'; by: 'region' | 'parent'; sourceId: string }
  | { type: 'remove-aggregate-group'; groupId: string }
  | { type: 'set-aggregate-group-expanded'; groupId: string; expanded: boolean }
  | { type: 'set-aggregate-expand-on-click'; enabled: boolean }
  | { type: 'set-link-grouping-enabled'; enabled: boolean }
  | { type: 'set-link-grouping-threshold'; threshold: number }
  | { type: 'set-link-grouping-by'; by: readonly LinkGroupingKey[] }
  | { type: 'set-link-grouping-selector'; selector?: string }
  | { type: 'set-link-grouping-expand-on-click'; enabled: boolean }
  | { type: 'remove-attention' };

export interface AuthoringAttentionSummary {
  configured: boolean;
  activeFeatureCount: number;
  focusIdCount: number;
  aggregateGroupCount: number;
  linkGroupingEnabled: boolean;
  advancedQueryFields: Array<(typeof advancedQueryFields)[number]>;
  hasAggregateViewport: boolean;
  hasLinkGroupingViewport: boolean;
}

function assertFocusMode(mode: FocusPresentationMode) {
  if (!focusModes.has(mode)) {
    throw new AuthoringAttentionError('invalid-focus-mode', `Attention mode "${String(mode)}" is not supported.`);
  }
}

function uniqueFocusIds(document: TopoDocument, ids: readonly string[]): string[] {
  const index = buildAttentionIndex(document);
  const result: string[] = [];
  ids.forEach((id) => {
    if (typeof id !== 'string' || !id.trim()) {
      throw new AuthoringAttentionError('invalid-focus-id', 'Attention object IDs must be non-empty strings.');
    }
    if (!index.getObject(id)) {
      throw new AuthoringAttentionError('unknown-focus-id', `Attention object "${id}" does not exist.`);
    }
    if (!result.includes(id)) result.push(id);
  });
  return result;
}

function withoutKey<T extends object, K extends keyof T>(value: T, key: K): Omit<T, K> {
  const { [key]: _removed, ...remaining } = value;
  return remaining;
}

function withQuery(attention: TopoDocumentAttention, query: FocusQuery | undefined): TopoDocumentAttention {
  if (query && Object.keys(query).length) return { ...attention, query };
  return withoutKey(attention, 'query');
}

function aggregateSource(group: AggregateGroupDefinition): string | undefined {
  if (group.by === 'region') return group.regionId;
  if (group.by === 'parent') return group.parentId;
  return undefined;
}

function aggregateIdBase(sourceId: string): string {
  const normalized = sourceId.trim().replace(/[^a-zA-Z0-9_.:-]+/g, '-').replace(/(^-|-$)/g, '');
  return `aggregate-${normalized || 'group'}`;
}

function nextAggregateId(groups: readonly AggregateGroupDefinition[], sourceId: string): string {
  const base = aggregateIdBase(sourceId);
  const ids = new Set(groups.map((group) => group.id));
  if (!ids.has(base)) return base;
  let sequence = 2;
  while (ids.has(`${base}-${sequence}`)) sequence += 1;
  return `${base}-${sequence}`;
}

function createAggregateGroup(
  document: TopoDocument,
  attention: TopoDocumentAttention,
  by: 'region' | 'parent',
  sourceId: string
): AggregateGroupDefinition {
  const index = buildAttentionIndex(document);
  const groups = attention.aggregate?.groups || [];
  if (groups.some((group) => group.by === by && aggregateSource(group) === sourceId)) {
    throw new AuthoringAttentionError(
      'duplicate-aggregate-source',
      `${by === 'region' ? 'Region' : 'Parent'} "${sourceId}" already has an aggregate group.`
    );
  }
  if (by === 'region' && !index.getRegion(sourceId)) {
    throw new AuthoringAttentionError('invalid-aggregate-source', `Region "${sourceId}" does not exist.`);
  }
  if (by === 'parent' && (!index.getNode(sourceId) || index.getChildren(sourceId).length === 0)) {
    throw new AuthoringAttentionError(
      'invalid-aggregate-source',
      `Parent "${sourceId}" must exist and contain at least one child.`
    );
  }
  const id = nextAggregateId(groups, sourceId);
  return by === 'region'
    ? { id, by, regionId: sourceId }
    : { id, by, parentId: sourceId };
}

function assertAggregateGroup(attention: TopoDocumentAttention, groupId: string) {
  if (!(attention.aggregate?.groups || []).some((group) => group.id === groupId)) {
    throw new AuthoringAttentionError('missing-aggregate-group', `Aggregate group "${groupId}" does not exist.`);
  }
}

function defaultGrouping(current?: LinkGroupingOptions): LinkGroupingOptions {
  return {
    threshold: DEFAULT_AUTHORING_LINK_GROUPING_THRESHOLD,
    by: [...DEFAULT_AUTHORING_LINK_GROUPING_KEYS],
    expandOnClick: true,
    ...(current ? structuredClone(current) : {})
  };
}

function withGrouping(attention: TopoDocumentAttention, grouping: LinkGroupingOptions): TopoDocumentAttention {
  return {
    ...attention,
    links: {
      ...(attention.links || {}),
      grouping
    }
  };
}

function assertGroupingThreshold(threshold: number) {
  if (!Number.isInteger(threshold) || threshold < 2) {
    throw new AuthoringAttentionError(
      'invalid-link-grouping-threshold',
      `Parallel-link grouping threshold must be an integer of at least 2; received "${threshold}".`
    );
  }
}

function normalizedGroupingKeys(keys: readonly LinkGroupingKey[]): LinkGroupingKey[] {
  const result = [...new Set(keys)];
  if (!result.length || result.some((key) => !groupingKeys.has(key))) {
    throw new AuthoringAttentionError(
      'invalid-link-grouping-keys',
      'Parallel-link grouping requires at least one supported key: endpoints or layer.'
    );
  }
  return result;
}

export function applyAuthoringAttentionAction(
  document: TopoDocument,
  action: AuthoringAttentionAction
): TopoDocumentAttention | undefined {
  if (action.type === 'remove-attention') return undefined;
  let attention = structuredClone(document.attention || {});

  switch (action.type) {
    case 'set-interactive':
      return { ...attention, interactive: action.enabled };
    case 'set-click-mode':
      assertFocusMode(action.mode);
      return { ...attention, clickMode: action.mode };
    case 'set-focus-ids': {
      const ids = uniqueFocusIds(document, action.ids);
      const query = ids.length
        ? { ...(attention.query || {}), ids }
        : withoutKey(attention.query || {}, 'ids');
      return withQuery(attention, query);
    }
    case 'set-focus-mode':
      assertFocusMode(action.mode);
      return withQuery(attention, { ...(attention.query || {}), mode: action.mode });
    case 'clear-focus-query':
      return withoutKey(attention, 'query');
    case 'add-aggregate-group': {
      const group = createAggregateGroup(document, attention, action.by, action.sourceId);
      return {
        ...attention,
        aggregate: {
          ...(attention.aggregate || {}),
          groups: [...(attention.aggregate?.groups || []), group]
        }
      };
    }
    case 'remove-aggregate-group': {
      assertAggregateGroup(attention, action.groupId);
      const groups = (attention.aggregate?.groups || []).filter((group) => group.id !== action.groupId);
      const expandedGroupIds = (attention.aggregate?.expandedGroupIds || []).filter((id) => id !== action.groupId);
      const aggregateWithoutGroups = withoutKey(attention.aggregate || {}, 'groups');
      const aggregateWithoutExpansion = withoutKey(aggregateWithoutGroups, 'expandedGroupIds');
      return {
        ...attention,
        aggregate: {
          ...aggregateWithoutExpansion,
          ...(groups.length ? { groups } : {}),
          ...(expandedGroupIds.length ? { expandedGroupIds } : {})
        }
      };
    }
    case 'set-aggregate-group-expanded': {
      assertAggregateGroup(attention, action.groupId);
      const expanded = attention.aggregate?.expandedGroupIds || [];
      const expandedGroupIds = action.expanded
        ? [...new Set([...expanded, action.groupId])]
        : expanded.filter((id) => id !== action.groupId);
      const aggregate = {
        ...(attention.aggregate || {}),
        ...(expandedGroupIds.length ? { expandedGroupIds } : {})
      };
      if (!expandedGroupIds.length) delete aggregate.expandedGroupIds;
      return { ...attention, aggregate };
    }
    case 'set-aggregate-expand-on-click':
      return {
        ...attention,
        aggregate: { ...(attention.aggregate || {}), expandOnClick: action.enabled }
      };
    case 'set-link-grouping-enabled':
      return withGrouping(attention, { ...defaultGrouping(attention.links?.grouping), enabled: action.enabled });
    case 'set-link-grouping-threshold':
      assertGroupingThreshold(action.threshold);
      return withGrouping(attention, { ...defaultGrouping(attention.links?.grouping), threshold: action.threshold });
    case 'set-link-grouping-by':
      return withGrouping(attention, {
        ...defaultGrouping(attention.links?.grouping),
        by: normalizedGroupingKeys(action.by)
      });
    case 'set-link-grouping-selector': {
      const grouping = defaultGrouping(attention.links?.grouping);
      const selector = action.selector?.trim();
      return withGrouping(
        attention,
        selector ? { ...grouping, selector } : withoutKey(grouping, 'selector')
      );
    }
    case 'set-link-grouping-expand-on-click':
      return withGrouping(attention, {
        ...defaultGrouping(attention.links?.grouping),
        expandOnClick: action.enabled
      });
  }
}

export function summarizeAuthoringAttention(document: TopoDocument): AuthoringAttentionSummary {
  const attention = document.attention;
  const query = attention?.query;
  const focusIdCount = query?.ids?.length || 0;
  const aggregateGroupCount = attention?.aggregate?.groups?.length || 0;
  const linkGroupingEnabled = attention?.links?.grouping?.enabled === true;
  const hasQuery = Boolean(query && Object.keys(query).length);
  return {
    configured: Boolean(attention),
    activeFeatureCount:
      Number(hasQuery) +
      Number(attention?.interactive === true) +
      Number(aggregateGroupCount > 0) +
      Number(linkGroupingEnabled),
    focusIdCount,
    aggregateGroupCount,
    linkGroupingEnabled,
    advancedQueryFields: query
      ? advancedQueryFields.filter((field) => Object.prototype.hasOwnProperty.call(query, field))
      : [],
    hasAggregateViewport: Boolean(attention?.aggregate?.viewport),
    hasLinkGroupingViewport: Boolean(attention?.links?.grouping?.viewport)
  };
}
