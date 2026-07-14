import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import type { PropsWithChildren } from 'react';

const studioTheme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'dark',
    background: { default: '#0c1219', paper: '#18212b' },
    divider: '#3d4b5e',
    primary: { main: '#64b5f6' },
    secondary: { main: '#a9b8ca' },
    error: { main: '#ff8a80' },
    text: { primary: '#f1f5f9', secondary: '#b4c0cf' }
  },
  shape: { borderRadius: 5 },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { fontSize: 12, fontWeight: 700, letterSpacing: 0, textTransform: 'none' },
    body1: { fontSize: 13, lineHeight: 1.4 },
    body2: { fontSize: 12, lineHeight: 1.4 },
    caption: { fontSize: 11, lineHeight: 1.35 },
    h6: { fontSize: 16, fontWeight: 750, lineHeight: 1.25 },
    subtitle1: { fontSize: 14, fontWeight: 750, lineHeight: 1.3 },
    subtitle2: { fontSize: 12, fontWeight: 750, lineHeight: 1.3 }
  },
  components: {
    MuiAccordion: {
      defaultProps: { disableGutters: true, elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          '&::before': { display: 'none' }
        }
      }
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: { minHeight: 34, paddingLeft: 12, paddingRight: 10 },
        content: { margin: '7px 0' }
      }
    },
    MuiButton: {
      defaultProps: { disableElevation: true, disableRipple: true, size: 'small' },
      styleOverrides: { root: { borderRadius: 5, minHeight: 30, minWidth: 0, transition: 'none' } }
    },
    MuiButtonBase: {
      defaultProps: { disableRipple: true }
    },
    MuiCheckbox: {
      defaultProps: { disableRipple: true }
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 4, fontSize: 11, height: 22 },
        label: { paddingLeft: 7, paddingRight: 7 }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: { backgroundImage: 'none', border: '1px solid #3d4b5e' }
      }
    },
    MuiDialogActions: {
      styleOverrides: { root: { gap: 8, padding: '12px 16px' } }
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: 16 } }
    },
    MuiDialogTitle: {
      styleOverrides: { root: { padding: '14px 16px' } }
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: { gap: 6, marginLeft: 0, marginRight: 0 },
        label: { fontSize: 12 }
      }
    },
    MuiFormHelperText: {
      styleOverrides: { root: { fontSize: 11, lineHeight: 1.35, marginLeft: 0, marginRight: 0 } }
    },
    MuiFormLabel: {
      styleOverrides: { root: { color: '#b4c0cf', fontSize: 12, fontWeight: 700, lineHeight: 1.35 } }
    },
    MuiIconButton: {
      defaultProps: { disableRipple: true, size: 'small' },
      styleOverrides: { root: { borderRadius: 5, transition: 'none' } }
    },
    MuiInputBase: {
      styleOverrides: { root: { fontSize: 12 } }
    },
    MuiListItemButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: { root: { borderRadius: 4, minHeight: 34 } }
    },
    MuiMenu: {
      styleOverrides: {
        list: { paddingBottom: 4, paddingTop: 4 },
        paper: { backgroundImage: 'none', border: '1px solid #3d4b5e' }
      }
    },
    MuiMenuItem: {
      defaultProps: { disableRipple: true },
      styleOverrides: { root: { fontSize: 12, minHeight: 32 } }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { minHeight: 32 },
        input: { paddingBottom: 7, paddingTop: 7 }
      }
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } }
    },
    MuiPopover: {
      styleOverrides: {
        paper: { backgroundImage: 'none', border: '1px solid #3d4b5e' }
      }
    },
    MuiRadio: {
      defaultProps: { disableRipple: true }
    },
    MuiSelect: {
      defaultProps: { size: 'small' },
      styleOverrides: { select: { minHeight: 'auto' } }
    },
    MuiSwitch: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: { height: 18, overflow: 'visible', padding: 0, width: 30 },
        switchBase: {
          padding: 3,
          '&.Mui-checked': {
            color: '#ffffff',
            transform: 'translateX(12px)',
            '& + .MuiSwitch-track': { backgroundColor: '#1976d2', opacity: 1 }
          }
        },
        thumb: { boxShadow: 'none', height: 12, width: 12 },
        track: { backgroundColor: '#455565', borderRadius: 10, opacity: 1 }
      }
    },
    MuiTab: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          fontSize: 11,
          fontWeight: 750,
          letterSpacing: 0,
          minHeight: 34,
          minWidth: 0,
          padding: '6px 10px',
          textTransform: 'none'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: '#3d4b5e', fontSize: 12, padding: '7px 8px' },
        head: { color: '#b4c0cf', fontSize: 11, fontWeight: 750 }
      }
    },
    MuiToggleButton: {
      defaultProps: { disableRipple: true }
    },
    MuiTooltip: {
      defaultProps: { arrow: true, enterDelay: 450 },
      styleOverrides: {
        arrow: { color: '#263646' },
        tooltip: { backgroundColor: '#263646', color: '#f1f5f9', fontSize: 11 }
      }
    }
  }
});

export function StudioThemeProvider({ children }: PropsWithChildren) {
  return <ThemeProvider theme={studioTheme}><CssBaseline enableColorScheme />{children}</ThemeProvider>;
}
