/**
 * Canonical Studio color contract. This is the only Studio source file that
 * may own color literals for application chrome; createStudioTheme consumes it
 * to populate MUI's light and dark color schemes, and every other surface
 * consumes semantic MUI palette tokens.
 *
 * The workbench language keeps chrome out of the way of the topology: warm
 * paper neutrals form a quiet field, white (or graphite) cards carry the
 * tools, and one functional burnt-orange accent is reserved strictly for
 * interaction (selection, focus, primary actions). Status colors stay muted.
 * Canvas content owns its own colors through project stylesheets and never
 * borrows the chrome accent.
 */

export interface StudioColorScheme {
  action: {
    focus: string;
    hover: string;
    selected: string;
  };
  background: {
    default: string;
    paper: string;
  };
  divider: string;
  error: { main: string };
  info: { main: string };
  primary: {
    contrastText: string;
    dark: string;
    light: string;
    main: string;
  };
  success: { main: string };
  text: {
    disabled: string;
    primary: string;
    secondary: string;
  };
  warning: { main: string };
}

export const studioColors: Readonly<{ dark: StudioColorScheme; light: StudioColorScheme }> = Object.freeze({
  dark: {
    action: {
      focus: 'rgba(224, 133, 74, 0.28)',
      hover: 'rgba(255, 255, 255, 0.05)',
      selected: 'rgba(224, 133, 74, 0.16)'
    },
    background: {
      default: '#121110',
      paper: '#1b1a18'
    },
    divider: '#2d2a27',
    error: { main: '#d4736a' },
    info: { main: '#93a1ab' },
    primary: {
      contrastText: '#1c120a',
      dark: '#c46a33',
      light: '#ecaa7d',
      main: '#e0854a'
    },
    success: { main: '#86b389' },
    text: {
      disabled: '#6d675f',
      primary: '#eae6e1',
      secondary: '#a29b92'
    },
    warning: { main: '#cfa25c' }
  },
  light: {
    action: {
      focus: 'rgba(176, 76, 16, 0.20)',
      hover: 'rgba(31, 28, 25, 0.05)',
      selected: 'rgba(176, 76, 16, 0.10)'
    },
    background: {
      default: '#eceae7',
      paper: '#ffffff'
    },
    divider: '#dcd9d4',
    error: { main: '#b23e35' },
    info: { main: '#55636e' },
    primary: {
      contrastText: '#ffffff',
      dark: '#8a3b0c',
      light: '#d47a3e',
      main: '#b04c10'
    },
    success: { main: '#3f7a48' },
    text: {
      disabled: '#a39e96',
      primary: '#1f1c19',
      secondary: '#6b665f'
    },
    warning: { main: '#96690f' }
  }
});
