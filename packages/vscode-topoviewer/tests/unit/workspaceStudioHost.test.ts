import { describe, expect, it } from 'vitest';
import type {
  StudioAssetContent,
  StudioAssetRequest,
  StudioExportRequest,
  StudioExternalChange,
  StudioHostEvent
} from 'topoviewer-studio/host';
import type { StudioProject, StudioRecoverySnapshot } from 'topoviewer-studio';
import { defineStudioHostConformance } from '../../../topoviewer-studio/testing/hostConformance';
import {
  WorkspaceStudioHost,
  type WorkspaceFileEntry,
  type WorkspaceFileWrite,
  type WorkspaceStudioPort
} from '../../src/extension/workspaceStudioHost';

const encoder = new TextEncoder();

class MemoryWorkspacePort implements WorkspaceStudioPort {
  readonly exported: StudioExportRequest[] = [];
  readonly id = 'workspace-project';
  readonly name = 'Workspace project';
  trusted = true;
  readonly chosenAsset: StudioAssetContent = {
    bytes: encoder.encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"/>'),
    mediaType: 'image/svg+xml',
    name: 'chosen.svg'
  };
  readonly files = new Map<string, { bytes: Uint8Array; mediaType?: string; symbolicLink?: boolean }>([
    ['topology.yaml', { bytes: encoder.encode('graph:\n  id: workspace-project\n  nodes: []\n  links: []\n') }],
    ['stylesheet.yaml', { bytes: encoder.encode('stylesheet: []\n') }],
    ['assets/router.svg', { bytes: encoder.encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"/>'), mediaType: 'image/svg+xml' }]
  ]);
  readonly preferences = new Map<string, unknown>();
  readonly reports: StudioHostEvent[] = [];
  readonly watchers = new Set<(paths: string[]) => void>();
  recovery?: StudioRecoverySnapshot;
  atomicWriteCount = 0;

  chooseAssets(_request: StudioAssetRequest): Promise<StudioAssetContent[]> {
    return Promise.resolve([structuredClone(this.chosenAsset)]);
  }
  copyText(_text: string): Promise<void> { return Promise.resolve(); }
  exportArtifact(request: StudioExportRequest): Promise<void> {
    this.exported.push(request);
    return Promise.resolve();
  }
  listFiles(): Promise<WorkspaceFileEntry[]> {
    return Promise.resolve([...this.files.entries()].map(([path, value]) => ({
      mediaType: value.mediaType,
      path,
      size: value.bytes.byteLength,
      symbolicLink: value.symbolicLink
    })));
  }
  readFile(path: string): Promise<Uint8Array> {
    const file = this.files.get(path);
    if (!file) return Promise.reject(new Error(`Missing file: ${path}`));
    return Promise.resolve(Uint8Array.from(file.bytes));
  }
  readPreference<T>(key: string): Promise<T | undefined> {
    return Promise.resolve(this.preferences.get(key) as T | undefined);
  }
  readRecovery(): Promise<StudioRecoverySnapshot | undefined> {
    return Promise.resolve(this.recovery ? structuredClone(this.recovery) : undefined);
  }
  report(event: StudioHostEvent): void { this.reports.push(event); }
  watch(listener: (paths: string[]) => void): () => void {
    this.watchers.add(listener);
    return () => this.watchers.delete(listener);
  }
  writeFilesAtomically(files: WorkspaceFileWrite[]): Promise<void> {
    this.atomicWriteCount += 1;
    const next = new Map(this.files);
    files.forEach((file) => next.set(file.path, { bytes: Uint8Array.from(file.bytes) }));
    this.files.clear();
    next.forEach((value, key) => this.files.set(key, value));
    return Promise.resolve();
  }
  writePreference<T>(key: string, value: T): Promise<void> {
    this.preferences.set(key, structuredClone(value));
    return Promise.resolve();
  }
  writeRecovery(snapshot: StudioRecoverySnapshot): Promise<void> {
    this.recovery = structuredClone(snapshot);
    return Promise.resolve();
  }
  async replaceDiskProject(project: StudioProject) {
    for (const document of Object.values(project.documents)) {
      if (document) this.files.set(document.path, { bytes: encoder.encode(document.text) });
    }
  }
  async trigger(event: StudioExternalChange) {
    const path = event.reference.path || 'topology.yaml';
    this.watchers.forEach((listener) => listener([path]));
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
}

function fixture(port = new MemoryWorkspacePort()) {
  const host = new WorkspaceStudioHost({
    now: () => '2026-07-10T08:00:00.000Z',
    port,
    stylesheetPath: 'stylesheet.yaml',
    topologyPath: 'topology.yaml'
  });
  return { host, port };
}

defineStudioHostConformance('VS Code workspace', () => {
  const { host, port } = fixture();
  return {
    chosenAsset: port.chosenAsset,
    exported: port.exported,
    host,
    replaceDiskProject: (project) => port.replaceDiskProject(project),
    triggerExternalChange: (event) => port.trigger(event)
  };
});

describe('WorkspaceStudioHost policy', () => {
  it('writes all source documents through one atomic port operation', async () => {
    const { host, port } = fixture();
    const loaded = await host.loadProject();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    loaded.value.project.documents.topology.text += '# changed\n';
    const saved = await host.saveProject({ expectedRevision: loaded.value.project.revision, project: loaded.value.project });
    expect(saved.ok).toBe(true);
    expect(port.atomicWriteCount).toBe(1);
    expect(new TextDecoder().decode(port.files.get('topology.yaml')?.bytes)).toContain('# changed');
  });

  it('blocks writes in an untrusted workspace while keeping reads available', async () => {
    const port = new MemoryWorkspacePort();
    port.trusted = false;
    const { host } = fixture(port);
    const loaded = await host.loadProject();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(await host.saveProject({ expectedRevision: loaded.value.project.revision, project: loaded.value.project }))
      .toMatchObject({ error: { code: 'permission-denied', retryable: true }, ok: false });
  });

  it('restores a newer bounded recovery snapshot without replacing disk source', async () => {
    const { host, port } = fixture();
    const loaded = await host.loadProject();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const recovery: StudioRecoverySnapshot = {
      capturedAt: '2026-07-10T09:00:00.000Z',
      project: { ...structuredClone(loaded.value.project), name: 'Recovered draft' },
      reason: 'autosave',
      sourceRevision: 'recovery-source'
    };
    expect(await host.saveRecovery(recovery)).toEqual({ ok: true, value: undefined });
    expect(port.recovery?.project.name).toBe('Recovered draft');
    expect(await host.loadProject()).toMatchObject({
      ok: true,
      value: { project: { name: 'Workspace project' }, recovery: { project: { name: 'Recovered draft' } } }
    });
  });

  it('rejects traversal and oversized source files with typed errors', async () => {
    const port = new MemoryWorkspacePort();
    expect(() => new WorkspaceStudioHost({
      port,
      stylesheetPath: 'stylesheet.yaml',
      topologyPath: '../topology.yaml'
    })).toThrow(/trusted bundle root/i);

    port.files.set('topology.yaml', { bytes: new Uint8Array(10 * 1024 * 1024 + 1) });
    const { host } = fixture(port);
    expect(await host.loadProject()).toMatchObject({ error: { code: 'quota-exceeded' }, ok: false });
  });

  it('rejects excessive project file cardinality before reading content', async () => {
    const port = new MemoryWorkspacePort();
    for (let index = 0; index < 255; index += 1) {
      port.files.set(`assets/icon-${index}.svg`, { bytes: encoder.encode('<svg/>') });
    }
    const { host } = fixture(port);
    expect(await host.loadProject()).toMatchObject({ error: { code: 'quota-exceeded' }, ok: false });
  });

  it('rejects symbolic links before reading workspace content', async () => {
    const port = new MemoryWorkspacePort();
    port.files.set('assets/linked.svg', {
      bytes: encoder.encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"/>'),
      mediaType: 'image/svg+xml',
      symbolicLink: true
    });
    const { host } = fixture(port);
    expect(await host.loadProject()).toMatchObject({ error: { code: 'permission-denied' }, ok: false });
  });
});
