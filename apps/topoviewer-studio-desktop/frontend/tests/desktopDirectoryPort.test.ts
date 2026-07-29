import { describe, expect, it } from 'vitest';
import type { StudioExportRequest } from 'topoviewer-studio/host';
import {
  DesktopDirectoryPort,
  type DesktopNativeClient,
  type NativeProjectReference
} from '../src/desktopDirectoryPort';
import { DesktopStudioHost } from '../src/DesktopStudioHost';

const project: NativeProjectReference = {
  name: 'Desktop project',
  revision: 'revision-1',
  token: 'opaque-project-token'
};

class FakeNativeClient implements DesktopNativeClient {
  commits: unknown[] = [];
  exported: unknown[] = [];
  preferences = new Map<string, unknown>();
  recovery?: unknown;
  revision = 'revision-1';
  listeners = new Set<(payload: unknown) => void>();

  ChooseAssets(): Promise<unknown> {
    return Promise.resolve({
      assets: [{
        bytesBase64: btoa('<svg/>'),
        mediaType: 'image/svg+xml',
        name: 'router.svg'
      }]
    });
  }

  CommitFiles(request: unknown): Promise<unknown> {
    this.commits.push(request);
    this.revision = 'revision-2';
    return Promise.resolve({ revision: this.revision });
  }

  CopyText(_text: string): Promise<unknown> {
    return Promise.resolve({});
  }

  ExportArtifact(request: unknown): Promise<unknown> {
    this.exported.push(request);
    return Promise.resolve({});
  }

  ListFiles(_token: string): Promise<unknown> {
    return Promise.resolve([
      { mediaType: 'application/yaml', modifiedAt: '2026-07-29T08:00:00Z', path: 'stylesheet.yaml', size: 15 },
      { mediaType: 'application/yaml', modifiedAt: '2026-07-29T08:00:00Z', path: 'topology.yaml', size: 52 }
    ]);
  }

  ReadFile(_token: string, path: string): Promise<unknown> {
    const text = path === 'topology.yaml'
      ? 'graph:\n  id: desktop-project\n  nodes: []\n  links: []\n'
      : 'stylesheet: []\n';
    return Promise.resolve({ bytesBase64: btoa(text) });
  }

  ReadPreference(key: string): Promise<unknown> {
    return Promise.resolve({ found: this.preferences.has(key), value: this.preferences.get(key) });
  }

  ReadRecovery(): Promise<unknown> {
    return Promise.resolve({ found: this.recovery !== undefined, value: this.recovery });
  }

  Revision(): Promise<unknown> {
    return Promise.resolve({ revision: this.revision });
  }

  SubscribeProjectChanges(_token: string, listener: (payload: unknown) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  WritePreference(key: string, value: unknown): Promise<unknown> {
    this.preferences.set(key, structuredClone(value));
    return Promise.resolve({});
  }

  WriteRecovery(_token: string, value: unknown): Promise<unknown> {
    this.recovery = structuredClone(value);
    return Promise.resolve({});
  }
}

describe('DesktopDirectoryPort', () => {
  it('validates native DTOs and decodes relative directory files', async () => {
    const port = new DesktopDirectoryPort({ client: new FakeNativeClient(), project });

    expect(port.id).toBe('opaque-project-token');
    expect(port.name).toBe('Desktop project');
    await expect(port.listFiles()).resolves.toEqual([
      expect.objectContaining({ path: 'stylesheet.yaml', size: 15 }),
      expect.objectContaining({ path: 'topology.yaml', size: 52 })
    ]);
    await expect(port.readFile('topology.yaml')).resolves.toEqual(
      new TextEncoder().encode('graph:\n  id: desktop-project\n  nodes: []\n  links: []\n')
    );
  });

  it('encodes coordinated writes with the expected revision', async () => {
    const client = new FakeNativeClient();
    const port = new DesktopDirectoryPort({ client, project });

    await port.commitFiles([
      { bytes: new TextEncoder().encode('graph:\n  id: changed\n'), path: 'topology.yaml' }
    ], 'revision-1');

    expect(client.commits).toEqual([{
      expectedRevision: 'revision-1',
      files: [{
        bytesBase64: btoa('graph:\n  id: changed\n'),
        path: 'topology.yaml'
      }],
      token: 'opaque-project-token'
    }]);
  });

  it('round-trips preferences, recovery, exports, and validated watch events', async () => {
    const client = new FakeNativeClient();
    const port = new DesktopDirectoryPort({ client, project });
    await port.writePreference('studio.theme', 'dark');
    await expect(port.readPreference('studio.theme')).resolves.toBe('dark');
    const host = new DesktopStudioHost({ client, project });
    const loaded = await host.loadProject();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    await port.writeRecovery({
      capturedAt: '2026-07-29T09:00:00Z',
      project: loaded.value.project,
      reason: 'autosave',
      sourceRevision: loaded.value.project.revision
    });
    await expect(port.readRecovery()).resolves.toMatchObject({ capturedAt: '2026-07-29T09:00:00Z' });

    const request: StudioExportRequest = {
      artifact: {
        bytes: new TextEncoder().encode('<svg/>'),
        mediaType: 'image/svg+xml',
        name: 'topology.svg'
      },
      kind: 'svg',
      suggestedName: 'topology.svg'
    };
    await port.exportArtifact(request);
    expect(client.exported).toEqual([{
      artifact: {
        bytesBase64: btoa('<svg/>'),
        mediaType: 'image/svg+xml',
        name: 'topology.svg'
      },
      kind: 'svg',
      suggestedName: 'topology.svg'
    }]);

    const paths: string[][] = [];
    const unwatch = port.watch((changedPaths) => paths.push(changedPaths));
    client.listeners.forEach((listener) => listener({ paths: ['topology.yaml'], revision: 'revision-3' }));
    client.listeners.forEach((listener) => listener({ paths: ['../outside.yaml'] }));
    expect(paths).toEqual([['topology.yaml']]);
    unwatch();
    expect(client.listeners).toHaveLength(0);
  });

  it('rejects malformed native responses and preserves typed native errors', async () => {
    const client = new FakeNativeClient();
    client.ListFiles = () => Promise.resolve([{ path: '../outside.yaml', size: 1 }]);
    const port = new DesktopDirectoryPort({ client, project });
    await expect(port.listFiles()).rejects.toMatchObject({ code: 'corrupt-data' });

    client.ListFiles = () => Promise.reject({
      code: 'conflict',
      details: { actualRevision: 'revision-2' },
      message: 'Project changed.',
      retryable: true
    });
    await expect(port.listFiles()).rejects.toMatchObject({
      code: 'conflict',
      retryable: true
    });
  });
});

describe('DesktopStudioHost', () => {
  it('mounts the shared directory-project policy for an approved native root', async () => {
    const host = new DesktopStudioHost({ client: new FakeNativeClient(), project });

    expect(host.kind).toBe('desktop');
    expect(host.displayName).toBe('Desktop directory');
    expect(await host.loadProject()).toMatchObject({
      ok: true,
      value: {
        project: {
          id: 'opaque-project-token',
          documents: {
            stylesheet: { path: 'stylesheet.yaml' },
            topology: { path: 'topology.yaml' }
          }
        }
      }
    });
  });
});
