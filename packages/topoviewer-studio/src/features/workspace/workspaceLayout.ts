import { studioGeometry } from '../../ui/studioTokens';

/**
 * Destinations of the one authoring panel. The rail names all four, so the
 * panel never changes destination for a reason the user cannot see.
 */
export type StudioWorkspaceView = 'add' | 'mapper' | 'project' | 'properties';

export const studioWorkspaceDefaultWidth = 360;
export const studioWorkspaceMinimumWidth = studioGeometry.panelMinimumWidth;
export const studioWorkspaceMaximumWidth = studioGeometry.panelMaximumWidth;

export function normalizeStudioWorkspaceWidth(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return studioWorkspaceDefaultWidth;
  return Math.min(studioWorkspaceMaximumWidth, Math.max(studioWorkspaceMinimumWidth, Math.round(value)));
}

/**
 * The panel is docked against the trailing edge with the rail inboard of it, so
 * the grab handle sits `railWidth` to the left of the panel's leading edge.
 */
export function studioWorkspaceWidthFromPointer(clientX: number, shellRight: number): number {
  return normalizeStudioWorkspaceWidth(shellRight - clientX - studioGeometry.railWidth);
}

/** Persisted shell layout, restored on launch so Studio reopens the way it was left. */
export interface StudioWorkspaceLayoutPreferences {
  panelOpen: boolean;
  workspaceView: StudioWorkspaceView;
  workspaceWidth: number;
}

export const defaultStudioWorkspaceLayoutPreferences: StudioWorkspaceLayoutPreferences = {
  panelOpen: true,
  workspaceView: 'add',
  workspaceWidth: studioWorkspaceDefaultWidth
};

const workspaceViews = new Set<StudioWorkspaceView>(['add', 'properties', 'mapper', 'project']);

export function normalizeStudioWorkspaceLayoutPreferences(value: unknown): StudioWorkspaceLayoutPreferences {
  const candidate = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  return {
    panelOpen: typeof candidate.panelOpen === 'boolean' ? candidate.panelOpen : true,
    workspaceView: workspaceViews.has(candidate.workspaceView as StudioWorkspaceView)
      ? (candidate.workspaceView as StudioWorkspaceView)
      : 'add',
    workspaceWidth: normalizeStudioWorkspaceWidth(candidate.workspaceWidth)
  };
}
