import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'topoviewer/style.css';
import { StudioApp } from './app/StudioApp';
import { StudioErrorBoundary } from './app/StudioErrorBoundary';
import { BrowserStudioHost } from './hosts/browserHost';
import { MemoryStudioHost } from './hosts/memoryHost';

const root = document.getElementById('root');
if (!root) throw new Error('TopoViewer Studio root element is missing.');
const browserHost = new BrowserStudioHost();
const persistenceTestHosts = new Map<string, BrowserStudioHost>();

function persistenceTestHost(state: string) {
  const current = persistenceTestHosts.get(state);
  if (current) return current;
  const host = new BrowserStudioHost({
    beforeCommit(operation) {
      if (state === 'storage-quota' && operation === 'save project recovery') {
        throw new DOMException('Intentional quota failure', 'QuotaExceededError');
      }
      if (state === 'storage-interrupted' && operation === 'save the project') {
        throw new DOMException('Intentional interrupted write', 'AbortError');
      }
    },
    databaseName: `topoviewer-studio-${state}`
  });
  persistenceTestHosts.set(state, host);
  return host;
}

function StudioRoot() {
  const testState = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get('__studio-test-state')
    : undefined;
  if (
    testState === 'render-error'
  ) {
    throw new Error('Intentional development render failure.');
  }
  const fixture = testState === 'dense' || testState === 'overlay' || testState === 'future-style' || testState === 'mapper-future' || testState === 'mapper-coverage'
    ? testState
    : undefined;
  const host = fixture
    ? new MemoryStudioHost({ fixture })
    : testState === 'storage-quota' || testState === 'storage-interrupted'
      ? persistenceTestHost(testState)
      : browserHost;
  return <StudioApp forceEditorFailure={testState === 'editor-error'} host={host} />;
}

createRoot(root).render(
  <StrictMode>
    <StudioErrorBoundary>
      <StudioRoot />
    </StudioErrorBoundary>
  </StrictMode>
);
