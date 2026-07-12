export interface StudioViewportPreferences {
  backgroundColor: string;
  fitViewOnOpen: boolean;
  gridSize: number;
  gridVisible: boolean;
  helperLinesEnabled: boolean;
  miniMapVisible: boolean;
  snapToAlignment: boolean;
  viewportControlsVisible: boolean;
}

export const defaultStudioViewportPreferences: StudioViewportPreferences = {
  backgroundColor: '#0d151e',
  fitViewOnOpen: true,
  gridSize: 20,
  gridVisible: true,
  helperLinesEnabled: true,
  miniMapVisible: false,
  snapToAlignment: true,
  viewportControlsVisible: true
};

export function normalizeStudioViewportPreferences(value: unknown): StudioViewportPreferences {
  const candidate = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Partial<StudioViewportPreferences>
    : {};
  const gridSize = Number(candidate.gridSize);
  return {
    backgroundColor: typeof candidate.backgroundColor === 'string' && candidate.backgroundColor.trim()
      ? candidate.backgroundColor
      : defaultStudioViewportPreferences.backgroundColor,
    fitViewOnOpen: typeof candidate.fitViewOnOpen === 'boolean'
      ? candidate.fitViewOnOpen
      : defaultStudioViewportPreferences.fitViewOnOpen,
    gridSize: Number.isFinite(gridSize) && gridSize >= 8 && gridSize <= 128
      ? Math.round(gridSize)
      : defaultStudioViewportPreferences.gridSize,
    gridVisible: typeof candidate.gridVisible === 'boolean'
      ? candidate.gridVisible
      : defaultStudioViewportPreferences.gridVisible,
    helperLinesEnabled: typeof candidate.helperLinesEnabled === 'boolean'
      ? candidate.helperLinesEnabled
      : defaultStudioViewportPreferences.helperLinesEnabled,
    miniMapVisible: typeof candidate.miniMapVisible === 'boolean'
      ? candidate.miniMapVisible
      : defaultStudioViewportPreferences.miniMapVisible,
    snapToAlignment: typeof candidate.snapToAlignment === 'boolean'
      ? candidate.snapToAlignment
      : defaultStudioViewportPreferences.snapToAlignment,
    viewportControlsVisible: typeof candidate.viewportControlsVisible === 'boolean'
      ? candidate.viewportControlsVisible
      : defaultStudioViewportPreferences.viewportControlsVisible
  };
}
