import { describe, expect, it } from 'vitest';
import {
  applyAuthoringAttentionAction,
  AuthoringAttentionError,
  summarizeAuthoringAttention
} from '../../src/authoringAttention';
import type { TopoDocument } from '../../src/core/types';

function document(): TopoDocument {
  return {
    graph: {
      nodes: [
        { id: 'core', layers: ['physical'] },
        { id: 'leaf', parent: 'core', layers: ['physical'] },
        { id: 'standalone', layers: ['physical'] }
      ],
      links: [
        { id: 'core-leaf', source: 'core', target: 'leaf', layers: ['physical'] }
      ],
      paths: [
        { id: 'primary', sequence: ['core', 'leaf'], layers: ['physical'] }
      ],
      regions: [
        { id: 'west', members: ['core', 'leaf'], layers: ['physical'] }
      ]
    },
    attention: {
      query: {
        ids: ['core'],
        labels: { role: 'router' },
        data: { 'health.score': [90, 100] },
        pathIds: ['primary'],
        regionIds: ['west'],
        selectors: ['node[labels.status = "critical"]'],
        dependency: { from: ['core'], direction: 'downstream', depth: 2 },
        changes: { since: '2026-07-01T00:00:00Z' },
        mode: 'highlight'
      },
      interactive: true,
      clickMode: 'dim-context',
      aggregate: {
        groups: [
          { id: 'aggregate-west', by: 'label', key: 'zone', value: 'west' }
        ],
        expandedGroupIds: ['aggregate-west'],
        expandOnClick: true,
        viewport: { collapseBelowZoom: 0.6, expandAboveZoom: 1.1, hysteresis: 0.1 }
      },
      links: {
        grouping: {
          enabled: true,
          threshold: 3,
          by: ['endpoints', 'layer'],
          selector: 'link[labels.bundle = "fabric"]',
          expandedGroupIds: ['links:a:b'],
          expandOnClick: true,
          viewport: { groupBelowZoom: 0.7, ungroupAboveZoom: 1.2, hysteresis: 0.1 }
        }
      }
    }
  };
}

describe('attention authoring', () => {
  it('changes focus IDs without mutating the document or losing advanced policy', () => {
    const source = document();
    const before = structuredClone(source);

    const result = applyAuthoringAttentionAction(source, {
      type: 'set-focus-ids',
      ids: ['leaf', 'leaf', 'core']
    });

    expect(result?.query?.ids).toEqual(['leaf', 'core']);
    expect(result?.query).toMatchObject({
      labels: before.attention?.query?.labels,
      data: before.attention?.query?.data,
      pathIds: before.attention?.query?.pathIds,
      regionIds: before.attention?.query?.regionIds,
      selectors: before.attention?.query?.selectors,
      dependency: before.attention?.query?.dependency,
      changes: before.attention?.query?.changes,
      mode: 'highlight'
    });
    expect(result?.aggregate?.viewport).toEqual(before.attention?.aggregate?.viewport);
    expect(result?.links?.grouping?.viewport).toEqual(before.attention?.links?.grouping?.viewport);
    expect(source).toEqual(before);
  });

  it('rejects an unknown focus ID with an owned validation error', () => {
    expect(() => applyAuthoringAttentionAction(document(), {
      type: 'set-focus-ids',
      ids: ['missing']
    })).toThrowError(expect.objectContaining<Partial<AuthoringAttentionError>>({
      code: 'unknown-focus-id'
    }));
  });

  it('creates deterministic collision-safe region and parent aggregates', () => {
    const source = document();
    const region = applyAuthoringAttentionAction(source, {
      type: 'add-aggregate-group',
      by: 'region',
      sourceId: 'west'
    });
    const regionGroup = region?.aggregate?.groups?.at(-1);

    expect(regionGroup).toEqual({ id: 'aggregate-west-2', by: 'region', regionId: 'west' });
    const withParent = { ...source, attention: region };
    const parent = applyAuthoringAttentionAction(withParent, {
      type: 'add-aggregate-group',
      by: 'parent',
      sourceId: 'core'
    });
    expect(parent?.aggregate?.groups?.at(-1)).toEqual({
      id: 'aggregate-core',
      by: 'parent',
      parentId: 'core'
    });
    expect(parent?.aggregate?.viewport).toEqual(source.attention?.aggregate?.viewport);
    const removed = applyAuthoringAttentionAction({ ...source, attention: parent }, {
      type: 'remove-aggregate-group',
      groupId: 'aggregate-core'
    });
    expect(removed?.aggregate?.groups).not.toContainEqual(expect.objectContaining({ id: 'aggregate-core' }));
    expect(removed?.aggregate?.viewport).toEqual(source.attention?.aggregate?.viewport);
  });

  it.each([
    [{ type: 'add-aggregate-group', by: 'region', sourceId: 'missing' } as const, 'invalid-aggregate-source'],
    [{ type: 'add-aggregate-group', by: 'parent', sourceId: 'standalone' } as const, 'invalid-aggregate-source']
  ])('rejects invalid aggregate action %o', (action, code) => {
    expect(() => applyAuthoringAttentionAction(document(), action)).toThrowError(
      expect.objectContaining({ code })
    );
  });

  it('updates parallel-link grouping without losing selector, expansion, or viewport policy', () => {
    const source = document();
    const threshold = applyAuthoringAttentionAction(source, {
      type: 'set-link-grouping-threshold',
      threshold: 4
    });
    const grouping = threshold?.links?.grouping;

    expect(grouping).toMatchObject({
      enabled: true,
      threshold: 4,
      by: ['endpoints', 'layer'],
      selector: 'link[labels.bundle = "fabric"]',
      expandedGroupIds: ['links:a:b'],
      expandOnClick: true,
      viewport: { groupBelowZoom: 0.7, ungroupAboveZoom: 1.2, hysteresis: 0.1 }
    });
    expect(() => applyAuthoringAttentionAction(source, {
      type: 'set-link-grouping-threshold',
      threshold: 1
    })).toThrowError(expect.objectContaining({ code: 'invalid-link-grouping-threshold' }));
    expect(() => applyAuthoringAttentionAction(source, {
      type: 'set-link-grouping-by',
      by: []
    })).toThrowError(expect.objectContaining({ code: 'invalid-link-grouping-keys' }));
  });

  it('summarizes common and advanced configuration and removes only attention', () => {
    expect(summarizeAuthoringAttention(document())).toEqual({
      configured: true,
      activeFeatureCount: 4,
      focusIdCount: 1,
      aggregateGroupCount: 1,
      linkGroupingEnabled: true,
      advancedQueryFields: ['labels', 'data', 'pathIds', 'regionIds', 'selectors', 'dependency', 'changes'],
      hasAggregateViewport: true,
      hasLinkGroupingViewport: true
    });
    expect(applyAuthoringAttentionAction(document(), { type: 'remove-attention' })).toBeUndefined();
    expect(document().graph?.nodes).toHaveLength(3);
  });
});
