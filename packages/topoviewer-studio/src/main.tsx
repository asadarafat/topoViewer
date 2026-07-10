import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'topoviewer/style.css';
import { StudioApp } from './app/StudioApp';
import { StudioErrorBoundary } from './app/StudioErrorBoundary';
import { BrowserStudioHost } from './hosts/browserHost';
import { MemoryStudioHost } from './hosts/memoryHost';
import type { StudioExternalChange, StudioLoadResult, StudioProjectReference, StudioResult } from './contracts/host';

class ExternalChangeTestHost extends MemoryStudioHost {
  private external?: StudioLoadResult;
  private revision = 0;
  private watchers = new Set<(event: StudioExternalChange) => void>();

  override loadProject(reference?: StudioProjectReference): Promise<StudioResult<StudioLoadResult>> {
    if (this.external && (!reference?.id || reference.id === this.external.project.id)) {
      return Promise.resolve({ ok: true, value: structuredClone(this.external) });
    }
    return super.loadProject(reference);
  }

  watchProject(listener: (event: StudioExternalChange) => void): () => void {
    this.watchers.add(listener);
    return () => this.watchers.delete(listener);
  }

  async emitExternalChange() {
    const loaded = await super.loadProject();
    if (!loaded.ok) return;
    const project = structuredClone(loaded.value.project);
    this.revision += 1;
    project.documents.topology.text += `# external change ${this.revision}\n`;
    project.revision = `external-${this.revision}`;
    this.external = { project };
    this.watchers.forEach((listener) => listener({
      kind: 'changed',
      reference: { id: project.id, revision: project.revision },
      revision: project.revision
    }));
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('TopoViewer Studio root element is missing.');
const browserHost = new BrowserStudioHost();
const externalChangeTestHost = new ExternalChangeTestHost();
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
    : testState === 'external-change'
      ? externalChangeTestHost
    : testState === 'storage-quota' || testState === 'storage-interrupted'
      ? persistenceTestHost(testState)
      : browserHost;
  return <StudioApp forceEditorFailure={testState === 'editor-error'} host={host} />;
}

if (import.meta.env.DEV) {
  (window as typeof window & { __topoviewerStudioExternalChange?: () => Promise<void> })
    .__topoviewerStudioExternalChange = () => externalChangeTestHost.emitExternalChange();
}

createRoot(root).render(
  <StrictMode>
    <StudioErrorBoundary>
      <StudioRoot />
    </StudioErrorBoundary>
  </StrictMode>
);
