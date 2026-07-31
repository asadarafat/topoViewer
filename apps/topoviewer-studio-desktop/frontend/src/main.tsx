import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'topoviewer/style.css';
import {
  installStudioBrandIcon,
  StudioApp,
  StudioErrorBoundary
} from 'topoviewer-studio/app';
import { DesktopApplicationHost } from './DesktopApplicationHost';
import type { DesktopNativeLifecycleClient } from './wailsDesktopClient';
import studioFaviconUrl from '../../../../docs/assets/logo/topoviewer-favicon-dark.svg?url';

installStudioBrandIcon(studioFaviconUrl);

function hasWailsRuntime(): boolean {
  const candidate = window as typeof window & {
    go?: { main?: { DesktopApp?: unknown } };
    runtime?: unknown;
  };
  return Boolean(candidate.go?.main?.DesktopApp && candidate.runtime);
}

async function nativeClient(): Promise<DesktopNativeLifecycleClient> {
  if (hasWailsRuntime()) {
    const { WailsDesktopClient } = await import('./wailsDesktopClient');
    return new WailsDesktopClient();
  }
  if (import.meta.env.DEV || import.meta.env.VITE_DESKTOP_TEST_CLIENT === 'true') {
    const { TestDesktopClient } = await import('./testDesktopClient');
    return new TestDesktopClient();
  }
  throw new Error('The TopoViewer Studio desktop bridge is unavailable.');
}

const root = document.getElementById('root');
if (!root) throw new Error('TopoViewer Studio root element is missing.');

try {
  const host = await DesktopApplicationHost.create(await nativeClient());
  createRoot(root).render(
    <StrictMode>
      <StudioErrorBoundary>
        <StudioApp host={host} />
      </StudioErrorBoundary>
    </StrictMode>
  );
} catch (error) {
  const alert = document.createElement('main');
  alert.setAttribute('role', 'alert');
  const title = document.createElement('h1');
  title.textContent = 'Studio could not start';
  const detail = document.createElement('p');
  detail.textContent = error instanceof Error ? error.message : String(error);
  alert.append(title, detail);
  root.replaceChildren(alert);
}
