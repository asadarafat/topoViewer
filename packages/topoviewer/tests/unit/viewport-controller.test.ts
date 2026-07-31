import { describe, expect, it } from 'vitest';
import {
  normalizeViewportThresholds,
  reduceViewportExpansion,
  resolveViewportThresholdTransition
} from '../../src';

describe('viewport drilldown controller', () => {
  it('expands eligible groups once above the upper threshold', () => {
    const current = ['manual-group'];
    const result = reduceViewportExpansion({
      expandedGroupIds: current,
      eligibleGroupIds: ['site-b', 'site-a', 'site-b'],
      zoom: 1.4,
      policy: { expandAboveZoom: 1.2, collapseBelowZoom: 0.8 }
    });

    expect(result).toEqual({
      changed: true,
      expandedGroupIds: ['manual-group', 'site-b', 'site-a'],
      reason: 'expanded'
    });
    expect(reduceViewportExpansion({
      expandedGroupIds: result.expandedGroupIds,
      eligibleGroupIds: ['site-b', 'site-a'],
      zoom: 1.4,
      policy: { expandAboveZoom: 1.2, collapseBelowZoom: 0.8 }
    })).toEqual({ changed: false, expandedGroupIds: result.expandedGroupIds, reason: 'unchanged' });
  });

  it('collapses only eligible groups below the lower threshold', () => {
    expect(reduceViewportExpansion({
      expandedGroupIds: ['site-a', 'manual-group', 'site-b'],
      eligibleGroupIds: ['site-a', 'site-b'],
      zoom: 0.6,
      policy: { expandAboveZoom: 1.2, collapseBelowZoom: 0.8 }
    })).toEqual({ changed: true, expandedGroupIds: ['manual-group'], reason: 'collapsed' });
  });

  it('holds state inside the hysteresis band without reallocating IDs', () => {
    const current = ['site-a'];
    const result = reduceViewportExpansion({
      expandedGroupIds: current,
      eligibleGroupIds: ['site-a'],
      zoom: 1,
      policy: { collapseBelowZoom: 0.8, expandAboveZoom: 1.2 }
    });

    expect(result).toEqual({ changed: false, expandedGroupIds: current, reason: 'unchanged' });
    expect(result.expandedGroupIds).toBe(current);
  });

  it('normalizes missing, reversed, and invalid thresholds deterministically', () => {
    expect(normalizeViewportThresholds({ expandAboveZoom: 1.2, hysteresis: 0.3 }))
      .toEqual({ lower: 0.9, upper: 1.2 });
    expect(normalizeViewportThresholds({ collapseBelowZoom: 0.8, hysteresis: 0.3 }))
      .toEqual({ lower: 0.8, upper: 1.1 });
    expect(normalizeViewportThresholds({ collapseBelowZoom: 2, expandAboveZoom: 1 }))
      .toEqual({ lower: 1, upper: 2 });
    expect(normalizeViewportThresholds({ collapseBelowZoom: Number.NaN, expandAboveZoom: Number.POSITIVE_INFINITY }))
      .toEqual({});
  });

  it('reports invalid zoom and exposes the same transition decision for adapters', () => {
    const current = ['site-a'];
    expect(reduceViewportExpansion({
      expandedGroupIds: current,
      eligibleGroupIds: ['site-a'],
      zoom: Number.NaN,
      policy: { collapseBelowZoom: 0.8, expandAboveZoom: 1.2 }
    })).toEqual({ changed: false, expandedGroupIds: current, reason: 'invalid-zoom' });

    expect(resolveViewportThresholdTransition(0.7, { collapseBelowZoom: 0.8, expandAboveZoom: 1.2 })).toBe('lower');
    expect(resolveViewportThresholdTransition(1, { collapseBelowZoom: 0.8, expandAboveZoom: 1.2 })).toBe('hold');
    expect(resolveViewportThresholdTransition(1.3, { collapseBelowZoom: 0.8, expandAboveZoom: 1.2 })).toBe('upper');
  });
});
