import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import 'topoviewer/style.css';
import { StudioApp } from './app/StudioApp';
import { StudioErrorBoundary } from './app/StudioErrorBoundary';
import type { StudioHost } from './contracts/host';
import { BrowserStudioHost } from './hosts/browserHost';

const root = document.getElementById('root');
if (!root) throw new Error('TopoViewer Studio root element is missing.');
const browserHost = new BrowserStudioHost();
const testMode = import.meta.env.DEV || import.meta.env.MODE === 'performance';
const testState = testMode
  ? new URLSearchParams(window.location.search).get('__studio-test-state') || undefined
  : undefined;
const requiresTestHost = Boolean(testState && !['editor-error', 'render-error'].includes(testState));

function StudioRoot() {
  const [testHost, setTestHost] = useState<StudioHost>();
  const [testHostReady, setTestHostReady] = useState(!requiresTestHost);

  useEffect(() => {
    if (!requiresTestHost || !testState) return;
    let active = true;
    void import('./hosts/testHost').then(({ resolveStudioTestHost }) => {
      if (!active) return;
      const resolved = resolveStudioTestHost(testState);
      setTestHost(resolved.host);
      if (resolved.emitExternalChange) {
        (window as typeof window & { __topoviewerStudioExternalChange?: () => Promise<void> })
          .__topoviewerStudioExternalChange = resolved.emitExternalChange;
      }
      setTestHostReady(true);
    });
    return () => {
      active = false;
      delete (window as typeof window & { __topoviewerStudioExternalChange?: () => Promise<void> })
        .__topoviewerStudioExternalChange;
    };
  }, []);

  if (testState === 'render-error') throw new Error('Intentional development render failure.');
  if (!testHostReady) return <Box className="studio-startup-state" component="main"><Typography variant="body2">Opening test project...</Typography></Box>;
  return <StudioApp forceEditorFailure={testState === 'editor-error'} host={testHost || browserHost} />;
}

createRoot(root).render(
  <StrictMode>
    <StudioErrorBoundary>
      <StudioRoot />
    </StudioErrorBoundary>
  </StrictMode>
);
