import { describe, expect, it } from 'vitest';
import { buildAttentionIndex, FocusQueryError, resolveFocusQuery } from '../../src';
import { attentionFixture } from './attention-fixture';

function ids(value: ReadonlySet<string>): string[] {
  return Array.from(value);
}

describe('resolveFocusQuery', () => {
  it('focuses by ID, labels, data fields, paths, regions, and selectors with reasons', () => {
    const index = buildAttentionIndex(attentionFixture());
    const result = resolveFocusQuery(index, {
      ids: ['core-1'],
      labels: { role: 'access' },
      data: { severity: 'critical' },
      pathIds: ['lsp-critical'],
      regionIds: ['region-fra'],
      selectors: ['link[labels.media="fiber"]']
    });

    expect(result.mode).toBe('dim-context');
    expect(ids(result.focusedIds)).toEqual([
      'core-1',
      'dist-1',
      'access-1',
      'core-dist',
      'lsp-critical',
      'region-fra'
    ]);
    expect(ids(result.relatedIds)).toEqual([]);
    expect(ids(result.contextIds)).toEqual(['stitched-vpn']);
    expect(ids(result.hiddenIds)).toEqual([]);
    expect(result.reasons.get('core-1')).toEqual([
      'id:core-1',
      'data:severity=critical',
      'path-member:lsp-critical',
      'region-member:region-fra'
    ]);
    expect(result.reasons.get('core-dist')).toEqual(['selector:link[labels.media="fiber"]']);
  });

  it('traverses downstream, upstream, and bidirectional dependency focus by depth', () => {
    const index = buildAttentionIndex(attentionFixture());

    const downstream = resolveFocusQuery(index, {
      dependency: { from: ['core-1'], direction: 'downstream', depth: 2 }
    });
    expect(ids(downstream.focusedIds)).toEqual(['core-1']);
    expect(ids(downstream.relatedIds)).toEqual(['dist-1', 'access-1']);
    expect(downstream.reasons.get('access-1')).toEqual(['dependency:downstream:depth=2']);

    const upstream = resolveFocusQuery(index, {
      dependency: { from: ['core-1'], direction: 'upstream', depth: 1 }
    });
    expect(ids(upstream.relatedIds)).toEqual(['access-1']);
    expect(upstream.reasons.get('access-1')).toEqual(['dependency:upstream:depth=1']);

    const both = resolveFocusQuery(index, {
      dependency: { from: ['dist-1'], direction: 'both', depth: 1 }
    });
    expect(ids(both.focusedIds)).toEqual(['dist-1']);
    expect(ids(both.relatedIds)).toEqual(['core-1', 'access-1']);
  });

  it('supports hide-context mode', () => {
    const index = buildAttentionIndex(attentionFixture());
    const result = resolveFocusQuery(index, {
      ids: ['core-1'],
      mode: 'hide-context'
    });

    expect(ids(result.focusedIds)).toEqual(['core-1']);
    expect(ids(result.contextIds)).toEqual([]);
    expect(ids(result.hiddenIds)).toEqual([
      'dist-1',
      'access-1',
      'core-dist',
      'lsp-critical',
      'stitched-vpn',
      'region-fra'
    ]);
  });

  it('focuses changed objects by timestamp and revision metadata', () => {
    const document = attentionFixture();
    document.graph?.nodes?.push({
      id: 'revision-only',
      label: 'Revision only',
      labels: { role: 'access' },
      layers: ['physical'],
      data: { revision: 9 }
    });
    const index = buildAttentionIndex(document);

    const changedSince = resolveFocusQuery(index, {
      changes: { since: '2026-06-01T00:00:00Z' }
    });
    expect(ids(changedSince.focusedIds)).toEqual(['access-1']);
    expect(changedSince.reasons.get('access-1')).toContain('change:changedAt>=2026-06-01T00:00:00Z');
    expect(changedSince.reasons.has('revision-only')).toBe(false);

    const revisionChanged = resolveFocusQuery(index, {
      changes: { revision: 5 }
    });
    expect(ids(revisionChanged.focusedIds)).toEqual(['access-1', 'revision-only']);
    expect(revisionChanged.reasons.get('access-1')).toContain('change:revision!=5');
    expect(revisionChanged.reasons.get('revision-only')).toContain('change:revision!=5');
  });

  it('rejects missing IDs, invalid depths, and unsupported modes', () => {
    const index = buildAttentionIndex(attentionFixture());

    expect(() => resolveFocusQuery(index, { ids: ['missing'] })).toThrow(FocusQueryError);
    expect(() => resolveFocusQuery(index, {
      dependency: { from: ['core-1'], direction: 'downstream', depth: -1 }
    })).toThrow(/non-negative integer/);
    expect(() => resolveFocusQuery(index, {
      ids: ['core-1'],
      mode: 'spotlight' as never
    })).toThrow(/not supported/);
    expect(() => resolveFocusQuery(index, {
      pathIds: ['missing-path']
    })).toThrow(/missing path/);
    expect(() => resolveFocusQuery(index, {
      regionIds: ['missing-region']
    })).toThrow(/missing region/);
  });

  it('focuses a link direction while preserving the parent link as related context', () => {
    const document = attentionFixture();
    if (document.graph?.links?.[0]) {
      document.graph.links[0].directions = {
        sourceToTarget: { label: 'Core to distribution' },
        targetToSource: { label: 'Distribution to core' }
      };
    }
    const index = buildAttentionIndex(document);
    const result = resolveFocusQuery(index, {
      ids: ['core-dist:sourceToTarget']
    });

    expect(ids(result.focusedIds)).toEqual(['core-dist:sourceToTarget']);
    expect(ids(result.relatedIds)).toEqual(['core-dist']);
    expect(result.reasons.get('core-dist')).toEqual(['link-direction-parent:core-dist:sourceToTarget']);
  });
});
