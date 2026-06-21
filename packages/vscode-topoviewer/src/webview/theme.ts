import { createTheme, type PaletteMode } from '@mui/material/styles';

interface TopoViewerThemeOptions {
  mode: PaletteMode;
  browserHarness?: boolean;
}

const lightPalette = {
  primary: '#1976d2',
  secondary: '#9c27b0',
  background: '#f8fafc',
  paper: '#ffffff',
  text: '#0f172a',
  muted: '#475569'
};

const darkPalette = {
  primary: '#42a5f5',
  secondary: '#ba68c8',
  background: '#0b1118',
  paper: '#111827',
  text: '#e7edf4',
  muted: '#9db2cf'
};

export function createTopoViewerTheme({ mode, browserHarness = false }: TopoViewerThemeOptions) {
  const palette = mode === 'dark' ? darkPalette : lightPalette;
  return createTheme({
    palette: {
      mode,
      primary: { main: browserHarness ? palette.primary : 'var(--vscode-button-background, #1976d2)' },
      secondary: { main: palette.secondary },
      background: {
        default: browserHarness ? palette.background : 'var(--vscode-editor-background, #f8fafc)',
        paper: browserHarness ? palette.paper : 'var(--vscode-sideBar-background, #ffffff)'
      },
      text: {
        primary: browserHarness ? palette.text : 'var(--vscode-editor-foreground, #0f172a)',
        secondary: browserHarness ? palette.muted : 'var(--vscode-descriptionForeground, #475569)'
      }
    },
    typography: {
      fontFamily: browserHarness
        ? 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        : 'var(--vscode-font-family, Inter, system-ui, sans-serif)'
    }
  });
}
