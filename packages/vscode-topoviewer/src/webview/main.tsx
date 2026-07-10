import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { StudioApp, StudioErrorBoundary } from 'topoviewer-studio/app';
import 'topoviewer/style.css';
import { VsCodeStudioHost } from './studioVsCodeHost';

const host = new VsCodeStudioHost();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <StudioErrorBoundary>
      <StudioApp host={host} />
    </StudioErrorBoundary>
  </StrictMode>
);
