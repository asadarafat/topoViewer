import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import { alpha, ThemeProvider, useColorScheme, useTheme } from '@mui/material/styles';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react';
import type { StudioHost } from '../contracts/host';
import { createStudioTheme, type StudioIconColors } from './createStudioTheme';
import {
  normalizeStudioColorModePreference,
  resolveStudioEffectiveColorMode,
  studioColorModePreferenceKey,
  type StudioColorModePreference,
  type StudioEffectiveColorMode
} from './themePreference';

const studioTheme = createStudioTheme();

interface StudioColorSchemeContextValue {
  clearError(): void;
  effectiveMode: StudioEffectiveColorMode;
  error?: string;
  preference: StudioColorModePreference;
  setPreference(preference: StudioColorModePreference): Promise<void>;
}

const StudioColorSchemeContext = createContext<StudioColorSchemeContextValue | undefined>(undefined);

interface StudioThemeProviderProps extends PropsWithChildren {
  host: StudioHost;
}

interface StudioThemeBridgeProps extends StudioThemeProviderProps {
  initialError?: string;
  initialPreference: StudioColorModePreference;
}

function StudioThemeBridge({
  children,
  host,
  initialError,
  initialPreference
}: StudioThemeBridgeProps) {
  const { mode, setMode, systemMode } = useColorScheme();
  const [preference, setPreferenceState] = useState(initialPreference);
  const [error, setError] = useState(initialError);
  const effectiveMode = resolveStudioEffectiveColorMode(
    preference,
    systemMode === 'light' ? 'light' : 'dark'
  );

  useEffect(() => {
    if (mode !== preference) setMode(preference);
  }, [mode, preference, setMode]);

  const setPreference = useCallback(
    async (next: StudioColorModePreference) => {
      setPreferenceState(next);
      setMode(next);
      setError(undefined);
      const result = await host.writePreference(studioColorModePreferenceKey, next);
      if (result.ok) return;
      setError(`Appearance preference was not saved: ${result.error.message}`);
      host.report({
        category: 'persistence',
        detail: { code: result.error.code, retryable: result.error.retryable },
        name: 'studio-appearance-preference-write-failed'
      });
    },
    [host, setMode]
  );

  const value = useMemo<StudioColorSchemeContextValue>(
    () => ({
      clearError: () => setError(undefined),
      effectiveMode,
      error,
      preference,
      setPreference
    }),
    [effectiveMode, error, preference, setPreference]
  );

  return (
    <StudioColorSchemeContext.Provider value={value}>
      {children}
    </StudioColorSchemeContext.Provider>
  );
}

export function StudioThemeProvider({ children, host }: StudioThemeProviderProps) {
  const [loaded, setLoaded] = useState<{
    error?: string;
    preference: StudioColorModePreference;
  }>();

  useEffect(() => {
    let active = true;
    void host.readPreference<unknown>(studioColorModePreferenceKey).then((result) => {
      if (!active) return;
      if (result.ok) {
        setLoaded({ preference: normalizeStudioColorModePreference(result.value) });
        return;
      }
      host.report({
        category: 'persistence',
        detail: { code: result.error.code, retryable: result.error.retryable },
        name: 'studio-appearance-preference-read-failed'
      });
      setLoaded({
        error: `Appearance preference could not be restored: ${result.error.message}`,
        preference: 'system'
      });
    });
    return () => {
      active = false;
    };
  }, [host]);

  if (!loaded) {
    return (
      <ThemeProvider
        defaultMode="system"
        disableTransitionOnChange
        noSsr
        storageManager={null}
        theme={studioTheme}
      >
        <CssBaseline enableColorScheme />
        <Box
          aria-label="Opening TopoViewer Studio"
          component="main"
          sx={{ bgcolor: 'background.default', height: '100vh', width: '100vw' }}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider
      defaultMode={loaded.preference}
      disableTransitionOnChange
      noSsr
      storageManager={null}
      theme={studioTheme}
    >
      <CssBaseline enableColorScheme />
      <StudioThemeBridge
        host={host}
        initialError={loaded.error}
        initialPreference={loaded.preference}
      >
        {children}
      </StudioThemeBridge>
    </ThemeProvider>
  );
}

export function useStudioColorScheme(): StudioColorSchemeContextValue {
  const value = useContext(StudioColorSchemeContext);
  if (!value) throw new Error('useStudioColorScheme must be used inside StudioThemeProvider.');
  return value;
}

export function useStudioMonochromeIconColors(): StudioIconColors {
  const theme = useTheme();
  const { effectiveMode } = useStudioColorScheme();
  return useMemo(() => {
    const foreground = effectiveMode === 'dark'
      ? theme.palette.common.white
      : theme.palette.common.black;
    return { fill: alpha(foreground, 0.08), stroke: foreground };
  }, [effectiveMode, theme.palette.common.black, theme.palette.common.white]);
}
