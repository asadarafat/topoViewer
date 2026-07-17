import { describe, expect, it } from 'vitest';
import { normalizeStudioWorkspaceRatio, studioWorkspaceDefaultRatio, studioWorkspaceMaximumRatio, studioWorkspaceMinimumRatio, studioWorkspaceRatioFromPointer } from '../../src/features/workspace/workspaceLayout';

describe('Studio workspace layout', () => {
  it('defaults to one quarter and clamps persisted values to the supported range', () => {
    expect(normalizeStudioWorkspaceRatio(undefined)).toBe(studioWorkspaceDefaultRatio);
    expect(normalizeStudioWorkspaceRatio(Number.NaN)).toBe(studioWorkspaceDefaultRatio);
    expect(normalizeStudioWorkspaceRatio(0.2)).toBe(studioWorkspaceMinimumRatio);
    expect(normalizeStudioWorkspaceRatio(0.42)).toBe(0.42);
    expect(normalizeStudioWorkspaceRatio(0.8)).toBe(studioWorkspaceMaximumRatio);
  });

  it('derives a bounded ratio from pointer geometry relative to the shell', () => {
    expect(studioWorkspaceRatioFromPointer(475, 100, 1500)).toBeCloseTo(1 / 4);
    expect(studioWorkspaceRatioFromPointer(850, 100, 1500)).toBe(1 / 2);
    expect(studioWorkspaceRatioFromPointer(1200, 100, 1500)).toBe(1 / 2);
    expect(studioWorkspaceRatioFromPointer(500, 100, 0)).toBe(studioWorkspaceDefaultRatio);
  });
});
