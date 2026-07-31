/**
 * Canonical Studio color contract. This is the only Studio source file that
 * may own color literals for application chrome; createStudioTheme consumes it
 * to populate MUI's light and dark color schemes, and every other surface
 * consumes semantic MUI palette tokens.
 *
 * The workbench language keeps chrome out of the way of the topology: cool
 * neutral surfaces separate project source, editor, preview, and evidence
 * without decorative cards. One functional blue accent is reserved strictly
 * for interaction, selection, focus, and primary actions. Status colors stay
 * legible but subordinate.
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
      focus: 'rgba(143, 195, 255, 0.28)',
      hover: 'rgba(255, 255, 255, 0.05)',
      selected: 'rgba(25, 118, 210, 0.22)'
    },
    background: {
      default: '#101216',
      paper: '#16191f'
    },
    divider: '#2d333d',
    error: { main: '#ed6a73' },
    info: { main: '#8fc3ff' },
    primary: {
      contrastText: '#0c1b2a',
      dark: '#5a92c8',
      light: '#c7e0ff',
      main: '#8fc3ff'
    },
    success: { main: '#48c78e' },
    text: {
      disabled: '#667080',
      primary: '#edf1f6',
      secondary: '#aeb8c6'
    },
    warning: { main: '#e8b25d' }
  },
  light: {
    action: {
      focus: 'rgba(0, 95, 184, 0.20)',
      hover: 'rgba(28, 37, 48, 0.05)',
      selected: 'rgba(11, 103, 194, 0.12)'
    },
    background: {
      default: '#eef1f4',
      paper: '#ffffff'
    },
    divider: '#d7dde5',
    error: { main: '#b93641' },
    info: { main: '#005fb8' },
    primary: {
      contrastText: '#ffffff',
      dark: '#075aa9',
      light: '#dcecff',
      main: '#0b67c2'
    },
    success: { main: '#147a50' },
    text: {
      disabled: '#98a2b1',
      primary: '#1c2530',
      secondary: '#566274'
    },
    warning: { main: '#93600f' }
  }
});
