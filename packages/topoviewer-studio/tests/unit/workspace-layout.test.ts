import { describe, expect, it } from 'vitest';
import {
  defaultStudioWorkspaceLayoutPreferences,
  normalizeStudioWorkspaceLayoutPreferences,
  normalizeStudioWorkspaceWidth,
  studioWorkspaceDefaultWidth,
  studioWorkspaceMaximumWidth,
  studioWorkspaceMinimumWidth,
  studioWorkspaceWidthFromPointer
} from '../../src/features/workspace/workspaceLayout';

describe('Studio workspace layout', () => {
  it('defaults the authoring panel width and clamps persisted values to the supported range', () => {
    expect(normalizeStudioWorkspaceWidth(undefined)).toBe(studioWorkspaceDefaultWidth);
    expect(normalizeStudioWorkspaceWidth(Number.NaN)).toBe(studioWorkspaceDefaultWidth);
    expect(normalizeStudioWorkspaceWidth(100)).toBe(studioWorkspaceMinimumWidth);
    expect(normalizeStudioWorkspaceWidth(420)).toBe(420);
    expect(normalizeStudioWorkspaceWidth(2000)).toBe(studioWorkspaceMaximumWidth);
  });

  it('derives a bounded width from pointer geometry inboard of the rail', () => {
    const shellRight = 1000;
    expect(studioWorkspaceWidthFromPointer(536, shellRight)).toBe(420);
    expect(studioWorkspaceWidthFromPointer(shellRight, shellRight)).toBe(studioWorkspaceMinimumWidth);
    expect(studioWorkspaceWidthFromPointer(0, shellRight)).toBe(studioWorkspaceMaximumWidth);
  });

  it('restores persisted layout preferences and discards malformed values', () => {
    expect(normalizeStudioWorkspaceLayoutPreferences(undefined)).toEqual(defaultStudioWorkspaceLayoutPreferences);
    expect(normalizeStudioWorkspaceLayoutPreferences({ workspaceView: 'bogus', workspaceWidth: '9' })).toEqual(defaultStudioWorkspaceLayoutPreferences);
    expect(
      normalizeStudioWorkspaceLayoutPreferences({
        panelOpen: false,
        workspaceView: 'project',
        workspaceWidth: 400
      })
    ).toEqual({
      panelOpen: false,
      workspaceView: 'project',
      workspaceWidth: 400
    });
  });
});
