import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { PropsWithChildren } from 'react';

const studioTheme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        background: { default: '#eef2f6', paper: '#ffffff' },
        divider: '#cbd5df',
        primary: { main: '#1769aa' },
        secondary: { main: '#53657a' },
        error: { main: '#b42318' },
        text: { primary: '#18212f', secondary: '#526274' }
      }
    },
    dark: {
      palette: {
        background: { default: '#10151d', paper: '#171e28' },
        divider: '#3d4b5e',
        primary: { main: '#64b5f6' },
        secondary: { main: '#a9b8ca' },
        error: { main: '#ff8a80' },
        text: { primary: '#f1f5f9', secondary: '#b4c0cf' }
      }
    }
  },
  shape: { borderRadius: 5 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { fontSize: 12, fontWeight: 700, letterSpacing: 0, textTransform: 'none' },
    body1: { fontSize: 13 },
    body2: { fontSize: 12 },
    caption: { fontSize: 11 }
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true, size: 'small' },
      styleOverrides: { root: { minHeight: 30, minWidth: 0, borderRadius: 5, transition: 'none' } }
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true }
    },
    MuiCheckbox: {
      defaultProps: { disableRipple: true }
    },
    MuiIconButton: {
      defaultProps: { disableRipple: true, size: 'small' },
      styleOverrides: { root: { borderRadius: 5, transition: 'none' } }
    },
    MuiInputBase: {
      styleOverrides: { root: { fontSize: 12 } }
    },
    MuiFormLabel: {
      styleOverrides: { root: { fontSize: 12, fontWeight: 700 } }
    },
    MuiMenuItem: {
      defaultProps: { disableRipple: true },
      styleOverrides: { root: { minHeight: 32, fontSize: 12 } }
    },
    MuiRadio: {
      defaultProps: { disableRipple: true }
    },
    MuiSwitch: {
      defaultProps: { disableRipple: true }
    },
    MuiTab: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          minHeight: 34,
          minWidth: 0,
          padding: '6px 10px',
          fontSize: 11,
          fontWeight: 750,
          letterSpacing: 0,
          textTransform: 'none'
        }
      }
    },
    MuiToggleButton: {
      defaultProps: { disableRipple: true }
    },
    MuiTooltip: {
      defaultProps: { arrow: true, enterDelay: 450 },
      styleOverrides: { tooltip: { fontSize: 11 } }
    }
  }
});

export function StudioThemeProvider({ children }: PropsWithChildren) {
  return <ThemeProvider defaultMode="system" theme={studioTheme}><CssBaseline enableColorScheme />{children}</ThemeProvider>;
}
