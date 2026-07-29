import { describe, expect, it, vi } from 'vitest';
import type {
  StudioDirectoryFileEntry,
  StudioDirectoryFileWrite,
  StudioDirectoryPort
} from '../../src/hosts/directoryStudioHost';
import { DirectoryStudioHost } from '../../src/hosts/directoryStudioHost';
import type {
  StudioAssetContent,
  StudioAssetRequest,
  StudioExportRequest,
  StudioHostEvent
} from '../../src/contracts/host';
import type { StudioProject, StudioRecoverySnapshot } from '../../src/contracts/project';
import { defineStudioHostConformance } from '../../testing/hostConformance';

const encoder = new TextEncoder();

class MemoryDirectoryPort implements StudioDirectoryPort {
  readonly chosenAsset: StudioAssetContent = {
    bytes: encoder.encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"/>'),
    mediaType: 'image/svg+xml',
    name: 'chosen.svg'
  };
  readonly exported: StudioExportRequest[] = [];
  readonly files = new Map<string, {
    bytes: Uint8Array;
    mediaType?: string;
    modifiedAt?: string;
    symbolicLink?: boolean;
  }>([
    ['topology.yaml', {
      bytes: encoder.encode('graph:\n  id: desktop-project\n  nodes: []\n  links: []\n'),
      modifiedAt: '2026-07-29T08:00:00.000Z'
    }],
    ['stylesheet.yaml', {
      bytes: encoder.encode('stylesheet: []\n'),
      modifiedAt: '2026-07-29T08:00:00.000Z'
    }],
    ['mapper.yaml', {
      bytes: encoder.encode('mapper:\n  rules: []\n'),
      modifiedAt: '2026-07-29T08:00:00.000Z'
    }],
    ['assets/router.svg', {
      bytes: encoder.encode('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"/>'),
      mediaType: 'image/svg+xml'
    }]
  ]);
  readonly id = 'desktop-project-token';
  readonly name = 'Desktop project';
  readonly preferences = new Map<string, unknown>();
  readonly reports: StudioHostEvent[] = [];
  readonly watchers = new Set<(paths: string[]) => void>();
  trusted = true;
  recovery?: StudioRecoverySnapshot;
  commitCount = 0;
  commitExpectedRevision?: string;
  nextAssetError?: unknown;

  chooseAssets(_request: StudioAssetRequest): Promise<StudioAssetContent[]> {
    if (this.nextAssetError) return Promise.reject(this.nextAssetError);
    return Promise.resolve([structuredClone(this.chosenAsset)]);
  }

  copyText(_text: string): Promise<void> {
    return Promise.resolve();
  }

  exportArtifact(request: StudioExportRequest): Promise<void> {
    this.exported.push(request);
    return Promise.resolve();
  }

  listFiles(): Promise<StudioDirectoryFileEntry[]> {
    return Promise.resolve([...this.files.entries()].map(([path, value]) => ({
      mediaType: value.mediaType,
      modifiedAt: value.modifiedAt,
      path,
      size: value.bytes.byteLength,
      symbolicLink: value.symbolicLink
    })));
  }

  readFile(path: string): Promise<Uint8Array> {
    const file = this.files.get(path);
    return file
      ? Promise.resolve(Uint8Array.from(file.bytes))
      : Promise.reject(new Error(`Missing file: ${path}`));
  }

  readPreference<T>(key: string): Promise<T | undefined> {
    return Promise.resolve(this.preferences.get(key) as T | undefined);
  }

  readRecovery(): Promise<StudioRecoverySnapshot | undefined> {
    return Promise.resolve(this.recovery ? structuredClone(this.recovery) : undefined);
  }

  report(event: StudioHostEvent): void {
    this.reports.push(event);
  }

  watch(listener: (paths: string[]) => void): () => void {
    this.watchers.add(listener);
    return () => this.watchers.delete(listener);
  }

  commitFiles(files: StudioDirectoryFileWrite[], expectedRevision: string): Promise<void> {
    this.commitCount += 1;
    this.commitExpectedRevision = expectedRevision;
    const next = new Map(this.files);
    files.forEach(({ bytes, path }) => next.set(path, { bytes: Uint8Array.from(bytes) }));
    this.files.clear();
    next.forEach((value, path) => this.files.set(path, value));
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

  replaceDiskProject(project: StudioProject): Promise<void> {
    for (const document of Object.values(project.documents)) {
      if (document) this.files.set(document.path, { bytes: encoder.encode(document.text) });
    }
    return Promise.resolve();
  }

  trigger(paths = ['topology.yaml']): void {
    this.watchers.forEach((listener) => listener(paths));
  }
}

function fixture(port = new MemoryDirectoryPort()) {
  const host = new DirectoryStudioHost({
    displayName: 'Desktop directory',
    hostKind: 'desktop',
    mapperPath: 'mapper.yaml',
    now: () => '2026-07-29T08:00:00.000Z',
    port,
    stylesheetPath: 'stylesheet.yaml',
    topologyPath: 'topology.yaml'
  });
  return { host, port };
}

defineStudioHostConformance('Desktop directory', () => {
  const { host, port } = fixture();
  return {
    chosenAsset: port.chosenAsset,
    exported: port.exported,
    host,
    replaceDiskProject: (project) => port.replaceDiskProject(project),
    triggerExternalChange: async () => {
      port.trigger();
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
  };
});

describe('DirectoryStudioHost', () => {
  it('projects source documents and assets without exposing an absolute root', async () => {
    const { host } = fixture();

    expect(host.kind).toBe('desktop');
    expect(await host.loadProject()).toMatchObject({
      ok: true,
      value: {
        project: {
          assets: [{ path: 'assets/router.svg' }],
          documents: {
            mapper: { path: 'mapper.yaml' },
            stylesheet: { path: 'stylesheet.yaml' },
            topology: { path: 'topology.yaml' }
          },
          id: 'desktop-project-token',
          name: 'Desktop project'
        }
      }
    });
  });

  it('rejects traversal, absolute paths, symbolic links, and oversized bundles before reading content', async () => {
    const port = new MemoryDirectoryPort();
    expect(() => new DirectoryStudioHost({
      displayName: 'Desktop directory',
      hostKind: 'desktop',
      port,
      stylesheetPath: 'stylesheet.yaml',
      topologyPath: '../topology.yaml'
    })).toThrow(/trusted bundle root/i);
    expect(() => new DirectoryStudioHost({
      displayName: 'Desktop directory',
      hostKind: 'desktop',
      port,
      stylesheetPath: 'stylesheet.yaml',
      topologyPath: '/tmp/topology.yaml'
    })).toThrow(/trusted bundle root/i);

    port.files.set('assets/linked.svg', {
      bytes: encoder.encode('<svg/>'),
      symbolicLink: true
    });
    expect(await fixture(port).host.loadProject()).toMatchObject({
      error: { code: 'permission-denied' },
      ok: false
    });

    port.files.delete('assets/linked.svg');
    for (let index = 0; index < 260; index += 1) {
      port.files.set(`assets/icon-${index}.svg`, { bytes: encoder.encode('<svg/>') });
    }
    expect(await fixture(port).host.loadProject()).toMatchObject({
      error: { code: 'quota-exceeded' },
      ok: false
    });
  });

  it('changes revisions and commits all changed source documents together', async () => {
    const { host, port } = fixture();
    const loaded = await host.loadProject();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const changed = structuredClone(loaded.value.project);
    changed.documents.topology.text += '# topology change\n';
    changed.documents.stylesheet.text += '# stylesheet change\n';
    const saved = await host.saveProject({
      expectedRevision: loaded.value.project.revision,
      project: changed
    });

    expect(saved.ok).toBe(true);
    expect(port.commitCount).toBe(1);
    expect(port.commitExpectedRevision).toBe(loaded.value.project.revision);
    if (!saved.ok) return;
    expect(saved.value.revision).not.toBe(loaded.value.project.revision);
    expect(new TextDecoder().decode(port.files.get('topology.yaml')?.bytes)).toContain('# topology change');
    expect(new TextDecoder().decode(port.files.get('stylesheet.yaml')?.bytes)).toContain('# stylesheet change');
  });

  it('preserves disk state and returns a typed conflict for a stale revision', async () => {
    const { host, port } = fixture();
    const loaded = await host.loadProject();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const external = structuredClone(loaded.value.project);
    external.documents.topology.text += '# external\n';
    await port.replaceDiskProject(external);
    const stale = structuredClone(loaded.value.project);
    stale.documents.topology.text += '# stale\n';

    expect(await host.saveProject({
      expectedRevision: loaded.value.project.revision,
      project: stale
    })).toMatchObject({
      error: {
        code: 'conflict',
        details: {
          actualRevision: expect.any(String),
          expectedRevision: loaded.value.project.revision
        }
      },
      ok: false
    });
    expect(port.commitCount).toBe(0);
    expect(new TextDecoder().decode(port.files.get('topology.yaml')?.bytes)).toContain('# external');
  });

  it('accepts only newer recovery for the same project', async () => {
    const { host, port } = fixture();
    const loaded = await host.loadProject();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;

    const recovery: StudioRecoverySnapshot = {
      capturedAt: '2026-07-29T09:00:00.000Z',
      project: { ...structuredClone(loaded.value.project), name: 'Recovered draft' },
      reason: 'autosave',
      sourceRevision: loaded.value.project.revision
    };
    expect(await host.saveRecovery(recovery)).toEqual({ ok: true, value: undefined });
    expect(await host.loadProject()).toMatchObject({
      ok: true,
      value: { recovery: { project: { name: 'Recovered draft' } } }
    });

    port.recovery = { ...recovery, capturedAt: '2026-07-29T07:00:00.000Z' };
    const withoutStaleRecovery = await host.loadProject();
    expect(withoutStaleRecovery.ok).toBe(true);
    if (!withoutStaleRecovery.ok) return;
    expect(withoutStaleRecovery.value).not.toHaveProperty('recovery');
  });

  it('suppresses self-write notifications and emits later external changes', async () => {
    vi.useFakeTimers();
    try {
      const { host, port } = fixture();
      const loaded = await host.loadProject();
      expect(loaded.ok).toBe(true);
      if (!loaded.ok) return;
      const events: unknown[] = [];
      const unwatch = host.watchProject?.((event) => events.push(event));

      const changed = structuredClone(loaded.value.project);
      changed.documents.topology.text += '# own write\n';
      expect(await host.saveProject({
        expectedRevision: loaded.value.project.revision,
        project: changed
      })).toMatchObject({ ok: true });
      port.trigger();
      await vi.advanceTimersByTimeAsync(50);
      expect(events).toEqual([]);

      port.files.set('topology.yaml', {
        bytes: encoder.encode(`${changed.documents.topology.text}# external write\n`)
      });
      port.trigger();
      await vi.advanceTimersByTimeAsync(50);
      expect(events).toEqual([expect.objectContaining({ kind: 'changed' })]);

      unwatch?.();
      port.trigger();
      await vi.advanceTimersByTimeAsync(50);
      expect(events).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('maps native cancellation and trust failures into typed host errors', async () => {
    const port = new MemoryDirectoryPort();
    port.nextAssetError = { code: 'cancelled', message: 'Dialog closed' };
    expect(await fixture(port).host.chooseAssets?.({
      accept: ['image/svg+xml'],
      maximumBytes: 1024,
      multiple: false
    })).toMatchObject({
      error: { code: 'cancelled', retryable: true },
      ok: false
    });

    port.trusted = false;
    const loaded = await fixture(port).host.loadProject();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    expect(await fixture(port).host.saveProject({
      expectedRevision: loaded.value.project.revision,
      project: loaded.value.project
    })).toMatchObject({
      error: { code: 'permission-denied', retryable: true },
      ok: false
    });
  });

  it('preserves native retryability and rollback details', async () => {
    const port = new MemoryDirectoryPort();
    port.nextAssetError = {
      code: 'partial-failure',
      details: { rollbackSucceeded: false },
      message: 'The coordinated write could not be fully restored.',
      retryable: true
    };

    expect(await fixture(port).host.chooseAssets?.({
      accept: ['image/svg+xml'],
      maximumBytes: 1024,
      multiple: false
    })).toMatchObject({
      error: {
        code: 'partial-failure',
        details: { rollbackSucceeded: false },
        retryable: true
      },
      ok: false
    });
  });
});
