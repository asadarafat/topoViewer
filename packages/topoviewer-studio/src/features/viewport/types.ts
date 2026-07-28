export type StudioThemeColorPreference =
  | { mode: 'theme' }
  | { mode: 'custom'; value: string };

export interface StudioViewportPreferences {
  backgroundColor: StudioThemeColorPreference;
  gridColor: StudioThemeColorPreference;
  gridSize: number;
  gridVisible: boolean;
  helperLinesEnabled: boolean;
  miniMapVisible: boolean;
  snapToAlignment: boolean;
  version: 2;
  viewportControlsVisible: boolean;
}

const legacyThemeBackgroundColors = new Set(['#0d151e', '#121212']);
const legacyThemeGridColors = new Set(['#49657f']);
const cssHexColor = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i;
const cssNamedColor = /^[a-z]+$/i;
const cssColorFunction = /^(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\([^<>;{}]+\)$/i;
const cssVariableColor = /^var\(\s*--[a-z0-9_-]+(?:\s*,[^<>;{}]+)?\)$/i;

export const defaultStudioViewportPreferences: StudioViewportPreferences = {
  backgroundColor: { mode: 'theme' },
  gridColor: { mode: 'theme' },
  gridSize: 20,
  gridVisible: true,
  helperLinesEnabled: true,
  miniMapVisible: false,
  snapToAlignment: true,
  version: 2,
  viewportControlsVisible: true
};

function isStoredCssColor(value: string): boolean {
  const normalized = value.trim();
  return Boolean(
    normalized &&
      (cssHexColor.test(normalized) ||
        cssNamedColor.test(normalized) ||
        cssColorFunction.test(normalized) ||
        cssVariableColor.test(normalized))
  );
}

function normalizeThemeColor(
  value: unknown,
  legacyThemeColors: ReadonlySet<string>
): StudioThemeColorPreference {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const candidate = value as { mode?: unknown; value?: unknown };
    if (candidate.mode === 'theme') return { mode: 'theme' };
    if (
      candidate.mode === 'custom' &&
      typeof candidate.value === 'string' &&
      isStoredCssColor(candidate.value)
    ) {
      return { mode: 'custom', value: candidate.value.trim() };
    }
    return { mode: 'theme' };
  }

  if (typeof value !== 'string') return { mode: 'theme' };
  const normalized = value.trim();
  if (!normalized || legacyThemeColors.has(normalized.toLocaleLowerCase())) {
    return { mode: 'theme' };
  }
  return isStoredCssColor(normalized)
    ? { mode: 'custom', value: normalized }
    : { mode: 'theme' };
}

export function resolveStudioThemeColor(
  preference: StudioThemeColorPreference,
  themeColor: string
): string {
  return preference.mode === 'custom' ? preference.value : themeColor;
}

export function normalizeStudioViewportPreferences(value: unknown): StudioViewportPreferences {
  const candidate =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const gridSize = Number(candidate.gridSize);
  return {
    backgroundColor: normalizeThemeColor(
      candidate.backgroundColor,
      legacyThemeBackgroundColors
    ),
    gridColor: normalizeThemeColor(candidate.gridColor, legacyThemeGridColors),
    gridSize:
      Number.isFinite(gridSize) && gridSize >= 8 && gridSize <= 128
        ? Math.round(gridSize)
        : defaultStudioViewportPreferences.gridSize,
    gridVisible:
      typeof candidate.gridVisible === 'boolean'
        ? candidate.gridVisible
        : defaultStudioViewportPreferences.gridVisible,
    helperLinesEnabled:
      typeof candidate.helperLinesEnabled === 'boolean'
        ? candidate.helperLinesEnabled
        : defaultStudioViewportPreferences.helperLinesEnabled,
    miniMapVisible:
      typeof candidate.miniMapVisible === 'boolean'
        ? candidate.miniMapVisible
        : defaultStudioViewportPreferences.miniMapVisible,
    snapToAlignment:
      typeof candidate.snapToAlignment === 'boolean'
        ? candidate.snapToAlignment
        : defaultStudioViewportPreferences.snapToAlignment,
    version: 2,
    viewportControlsVisible:
      typeof candidate.viewportControlsVisible === 'boolean'
        ? candidate.viewportControlsVisible
        : defaultStudioViewportPreferences.viewportControlsVisible
  };
}
