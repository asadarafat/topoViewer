import type { StudioExternalChange, StudioHost, StudioLoadResult, StudioProjectReference, StudioResult } from '../contracts/host';
import { BrowserStudioHost } from './browserHost';
import { isMemoryStudioFixture, MemoryStudioHost } from './memoryHost';

class ExternalChangeTestHost extends MemoryStudioHost {
  private external?: StudioLoadResult;
  private revision = 0;
  private watchers = new Set<(event: StudioExternalChange) => void>();

  override loadProject(reference?: StudioProjectReference): Promise<StudioResult<StudioLoadResult>> {
    if (this.external && (!reference?.id || reference.id === this.external.project.id)) {
      return Promise.resolve({
        ok: true,
        value: structuredClone(this.external)
      });
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
    this.watchers.forEach((listener) =>
      listener({
        kind: 'changed',
        reference: { id: project.id, revision: project.revision },
        revision: project.revision
      })
    );
  }
}

const externalChangeHost = new ExternalChangeTestHost();
const persistenceHosts = new Map<string, BrowserStudioHost>();

function persistenceHost(state: 'storage-interrupted' | 'storage-quota'): BrowserStudioHost {
  const current = persistenceHosts.get(state);
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
  persistenceHosts.set(state, host);
  return host;
}

export interface StudioTestHostResolution {
  emitExternalChange?: () => Promise<void>;
  host?: StudioHost;
}

export function resolveStudioTestHost(state: string): StudioTestHostResolution {
  if (isMemoryStudioFixture(state)) return { host: new MemoryStudioHost({ fixture: state }) };
  if (state === 'external-change') {
    return {
      emitExternalChange: () => externalChangeHost.emitExternalChange(),
      host: externalChangeHost
    };
  }
  if (state === 'storage-interrupted' || state === 'storage-quota') {
    return { host: persistenceHost(state) };
  }
  return {};
}
