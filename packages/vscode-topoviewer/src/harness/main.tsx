import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, type PaletteMode } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { WebviewApp } from '../webview/WebviewApp';
import { BrowserHarnessHostAdapter } from '../webview/host';
import { createTopoViewerTheme } from '../webview/theme';

function classifyBenignBrowserLayoutNoise() {
  window.addEventListener('error', (event) => {
    if (String(event.message || '').includes('ResizeObserver loop completed with undelivered notifications')) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);
}

function browserSystemMode(): PaletteMode {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function useBrowserHarnessMode() {
  const [systemMode, setSystemMode] = useState<PaletteMode>(() => browserSystemMode());
  const [manualMode, setManualMode] = useState<PaletteMode | undefined>();

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event: MediaQueryListEvent) => setSystemMode(event.matches ? 'dark' : 'light');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const mode = manualMode || systemMode;
  return {
    mode,
    toggleMode: () => setManualMode(mode === 'dark' ? 'light' : 'dark')
  };
}

function BrowserHarnessRoot() {
  const { mode, toggleMode } = useBrowserHarnessMode();
  const host = useMemo(() => new BrowserHarnessHostAdapter(), []);
  const theme = useMemo(() => createTopoViewerTheme({ mode, browserHarness: true }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <WebviewApp host={host} themeMode={mode} onToggleThemeMode={toggleMode} />
    </ThemeProvider>
  );
}

classifyBenignBrowserLayoutNoise();

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserHarnessRoot />
  </React.StrictMode>
);
