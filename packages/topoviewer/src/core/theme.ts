import type { CSSProperties } from 'react';
import themeTokenSource from './themeTokens.json';

export type TopoViewerColorMode = 'light' | 'dark' | 'system';

export interface TopoViewerThemeTokens {
  background: string;
  backgroundEnd: string;
  backgroundAccentPrimary: string;
  backgroundAccentSecondary: string;
  foreground: string;
  foregroundStrong: string;
  foregroundMuted: string;
  panelBackground: string;
  surfaceBackground: string;
  chipBackground: string;
  chipHoverBackground: string;
  buttonBackground: string;
  border: string;
  borderStrong: string;
  accent: string;
  edgeDefault: string;
  edgeLabelBackground: string;
  edgeLabelBorder: string;
  onAccent: string;
  inverseBackground: string;
  inverseForeground: string;
  focus: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  regionFill: string;
  regionStroke: string;
  shadowSoft: string;
  shadowMedium: string;
  shadowStrong: string;
}

/* The JSON manifest is the single source used by runtime types and generated CSS. */
export const TOPOVIEWER_DARK_THEME: Readonly<TopoViewerThemeTokens> = Object.freeze({
  ...themeTokenSource.dark
} as TopoViewerThemeTokens);

export const TOPOVIEWER_LIGHT_THEME: Readonly<TopoViewerThemeTokens> = Object.freeze({
  ...themeTokenSource.light
} as TopoViewerThemeTokens);

const cssVariableByToken = Object.freeze({
  ...themeTokenSource.cssVariables
} as Record<keyof TopoViewerThemeTokens, `--topoviewer-${string}`>);

export type TopoViewerThemeStyle = CSSProperties & Record<`--topoviewer-${string}`, string | number | undefined>;

export function topoViewerThemeStyle(
  mode: TopoViewerColorMode,
  overrides: Partial<TopoViewerThemeTokens> = {}
): TopoViewerThemeStyle {
  const values = mode === 'system'
    ? overrides
    : { ...(mode === 'light' ? TOPOVIEWER_LIGHT_THEME : TOPOVIEWER_DARK_THEME), ...overrides };
  return Object.fromEntries(
    Object.entries(values).flatMap(([key, value]) => (
      value === undefined ? [] : [[cssVariableByToken[key as keyof TopoViewerThemeTokens], value]]
    ))
  ) as TopoViewerThemeStyle;
}

export function topoViewerThemeClassName(mode: TopoViewerColorMode): string {
  return `topoviewer-theme-${mode}`;
}
