import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { WebviewApp } from './WebviewApp';
import { VsCodeHostAdapter } from './host';
import './monacoSetup';
import { createTopoViewerTheme } from './theme';

const theme = createTopoViewerTheme({ mode: 'light' });

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WebviewApp host={new VsCodeHostAdapter()} />
    </ThemeProvider>
  </React.StrictMode>
);
