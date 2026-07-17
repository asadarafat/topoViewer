export interface StudioViewportPreferences {
  backgroundColor: string;
  fitViewOnOpen: boolean;
  gridColor: string;
  gridSize: number;
  gridVisible: boolean;
  helperLinesEnabled: boolean;
  miniMapVisible: boolean;
  snapToAlignment: boolean;
  viewportControlsVisible: boolean;
}

export const defaultStudioViewportPreferences: StudioViewportPreferences = {
  backgroundColor: '#121212',
  fitViewOnOpen: true,
  gridColor: '#49657f',
  gridSize: 20,
  gridVisible: true,
  helperLinesEnabled: true,
  miniMapVisible: false,
  snapToAlignment: true,
  viewportControlsVisible: true
};

export function normalizeStudioViewportPreferences(value: unknown): StudioViewportPreferences {
  const candidate = value && typeof value === 'object' && !Array.isArray(value) ? (value as Partial<StudioViewportPreferences>) : {};
  const gridSize = Number(candidate.gridSize);
  const backgroundColor = typeof candidate.backgroundColor === 'string' ? candidate.backgroundColor.trim() : '';
  return {
    backgroundColor: backgroundColor && backgroundColor.toLowerCase() !== '#0d151e' ? backgroundColor : defaultStudioViewportPreferences.backgroundColor,
    fitViewOnOpen: typeof candidate.fitViewOnOpen === 'boolean' ? candidate.fitViewOnOpen : defaultStudioViewportPreferences.fitViewOnOpen,
    gridColor: typeof candidate.gridColor === 'string' && candidate.gridColor.trim() ? candidate.gridColor : defaultStudioViewportPreferences.gridColor,
    gridSize: Number.isFinite(gridSize) && gridSize >= 8 && gridSize <= 128 ? Math.round(gridSize) : defaultStudioViewportPreferences.gridSize,
    gridVisible: typeof candidate.gridVisible === 'boolean' ? candidate.gridVisible : defaultStudioViewportPreferences.gridVisible,
    helperLinesEnabled: typeof candidate.helperLinesEnabled === 'boolean' ? candidate.helperLinesEnabled : defaultStudioViewportPreferences.helperLinesEnabled,
    miniMapVisible: typeof candidate.miniMapVisible === 'boolean' ? candidate.miniMapVisible : defaultStudioViewportPreferences.miniMapVisible,
    snapToAlignment: typeof candidate.snapToAlignment === 'boolean' ? candidate.snapToAlignment : defaultStudioViewportPreferences.snapToAlignment,
    viewportControlsVisible: typeof candidate.viewportControlsVisible === 'boolean' ? candidate.viewportControlsVisible : defaultStudioViewportPreferences.viewportControlsVisible
  };
}
