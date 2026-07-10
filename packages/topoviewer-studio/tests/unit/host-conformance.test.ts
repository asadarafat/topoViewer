import type {
  StudioAssetContent,
  StudioAssetRequest,
  StudioAssetResult,
  StudioCreateProjectRequest,
  StudioDuplicateProjectRequest,
  StudioExportRequest,
  StudioExternalChange,
  StudioHost,
  StudioHostEvent,
  StudioLoadResult,
  StudioProjectReference,
  StudioProjectSummary,
  StudioRenameProjectRequest,
  StudioResult,
  StudioSaveRequest,
  StudioSaveResult
} from '../../src/contracts/host';
import type { StudioProject, StudioRecoverySnapshot } from '../../src/contracts/project';
import { createStarterProject } from '../../src/hosts/starterProject';
import { defineStudioHostConformance } from '../../testing/hostConformance';

function ok<T>(value: T): StudioResult<T> {
  return { ok: true, value };
}

class ConformanceHost implements StudioHost {
  readonly capabilities = { directoryProjects: false };
  readonly kind = 'browser' as const;
  readonly exported: StudioExportRequest[] = [];
  readonly chosenAsset: StudioAssetContent = {
    bytes: new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"/>'),
    mediaType: 'image/svg+xml',
    name: 'router.svg'
  };
  private disk = createStarterProject({ id: 'conformance-project', name: 'Conformance project' });
  private preferences = new Map<string, unknown>();
  private watchers = new Set<(event: StudioExternalChange) => void>();

  chooseAssets(request: StudioAssetRequest): Promise<StudioResult<StudioAssetResult>> {
    if (this.chosenAsset.bytes.byteLength > request.maximumBytes) {
      return Promise.resolve({
        error: { code: 'quota-exceeded', message: 'Selected asset exceeds the host limit.', retryable: false },
        ok: false
      });
    }
    return Promise.resolve(ok({ assets: [this.chosenAsset] }));
  }

  copyText(): Promise<StudioResult<void>> { return Promise.resolve(ok(undefined)); }
  createProject(_request: StudioCreateProjectRequest): Promise<StudioResult<StudioLoadResult>> { return this.loadProject(); }
  deleteProject(_reference: StudioProjectReference): Promise<StudioResult<void>> { return Promise.resolve(ok(undefined)); }
  duplicateProject(_request: StudioDuplicateProjectRequest): Promise<StudioResult<StudioLoadResult>> { return this.loadProject(); }
  exportArtifact(request: StudioExportRequest): Promise<StudioResult<void>> {
    this.exported.push(request);
    return Promise.resolve(ok(undefined));
  }
  listProjects(): Promise<StudioResult<StudioProjectSummary[]>> {
    return Promise.resolve(ok([{
      id: this.disk.id,
      name: this.disk.name,
      openedAt: this.disk.metadata.updatedAt,
      revision: this.disk.revision,
      updatedAt: this.disk.metadata.updatedAt
    }]));
  }
  loadProject(reference?: StudioProjectReference): Promise<StudioResult<StudioLoadResult>> {
    if (reference?.id && reference.id !== this.disk.id) {
      return Promise.resolve({ error: { code: 'not-found', message: 'Project not found.', retryable: false }, ok: false });
    }
    return Promise.resolve(ok({ project: structuredClone(this.disk) }));
  }
  readPreference<T>(key: string): Promise<StudioResult<T | undefined>> {
    return Promise.resolve(ok(this.preferences.get(key) as T | undefined));
  }
  readProjectAssets(): Promise<StudioResult<StudioAssetContent[]>> { return Promise.resolve(ok([this.chosenAsset])); }
  renameProject(_request: StudioRenameProjectRequest): Promise<StudioResult<StudioLoadResult>> { return this.loadProject(); }
  report(_event: StudioHostEvent): void {}
  saveRecovery(_snapshot: StudioRecoverySnapshot): Promise<StudioResult<void>> { return Promise.resolve(ok(undefined)); }
  saveProject(request: StudioSaveRequest): Promise<StudioResult<StudioSaveResult>> {
    if (request.expectedRevision !== this.disk.revision) {
      return Promise.resolve({ error: { code: 'conflict', message: 'Project changed on disk.', retryable: true }, ok: false });
    }
    const savedAt = new Date().toISOString();
    this.disk = structuredClone(request.project);
    this.disk.revision = `revision-${Number(this.disk.revision.split('-').at(-1) || 0) + 1}`;
    this.disk.metadata.updatedAt = savedAt;
    return Promise.resolve(ok({ revision: this.disk.revision, savedAt }));
  }
  watchProject(listener: (event: StudioExternalChange) => void): () => void {
    this.watchers.add(listener);
    return () => this.watchers.delete(listener);
  }
  writePreference<T>(key: string, value: T): Promise<StudioResult<void>> {
    this.preferences.set(key, value);
    return Promise.resolve(ok(undefined));
  }
  replaceDiskProject(project: StudioProject) { this.disk = structuredClone(project); }
  trigger(event: StudioExternalChange) { this.watchers.forEach((listener) => listener(event)); }
}

defineStudioHostConformance('reference', () => {
  const host = new ConformanceHost();
  return {
    chosenAsset: host.chosenAsset,
    exported: host.exported,
    host,
    replaceDiskProject: async (project) => host.replaceDiskProject(project),
    triggerExternalChange: async (event) => host.trigger(event)
  };
});
