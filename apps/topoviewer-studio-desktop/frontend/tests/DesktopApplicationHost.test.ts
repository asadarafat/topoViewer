import { describe, expect, it } from 'vitest';
import type { StudioProject } from 'topoviewer-studio';
import type {
  DesktopNativeLifecycleClient
} from '../src/wailsDesktopClient';
import type { NativeProjectReference } from '../src/desktopDirectoryPort';
import { DesktopApplicationHost } from '../src/DesktopApplicationHost';

const untitledReference: NativeProjectReference = {
  name: 'Untitled topology',
  revision: 'untitled',
  token: 'opaque-project-token'
};

class FakeLifecycleClient implements DesktopNativeLifecycleClient {
  cancelFirstSave = false;
  commits: Record<string, unknown>[] = [];
  failFirstSave = false;
  files = new Map<string, string>();
  firstSaveCalls = 0;
  forgotten: string[] = [];
  listeners = new Set<(payload: unknown) => void>();
  newReference?: NativeProjectReference;
  openReference?: NativeProjectReference;
  promotions: string[] = [];
  releases: string[] = [];
  revision = 'sha256-empty';
  startupReference?: NativeProjectReference;

  SaveUntitledProject(value: unknown): Promise<NativeProjectReference> {
    this.firstSaveCalls += 1;
    if (this.cancelFirstSave) {
      return Promise.reject({
        code: 'cancelled',
        message: 'Folder selection was cancelled.',
        retryable: true
      });
    }
    if (this.failFirstSave) {
      return Promise.reject({
        code: 'partial-failure',
        details: { rollbackSucceeded: true },
        message: 'The project could not be created.',
        retryable: true
      });
    }
    const source = value as {
      expectedRevision: string;
      files: { bytesBase64: string; path: string }[];
      token: string;
    };
    this.commits.push(structuredClone(source));
    source.files.forEach((file) => this.files.set(file.path, atob(file.bytesBase64)));
    this.revision = `sha256-saved-${this.commits.length}`;
    return Promise.resolve({ name: 'Chosen project', revision: this.revision, token: source.token });
  }

  ChooseAssets(): Promise<unknown> {
    return Promise.resolve({ assets: [] });
  }

  CommitFiles(request: unknown): Promise<unknown> {
    const source = request as {
      expectedRevision: string;
      files: { bytesBase64: string; path: string }[];
      token: string;
    };
    this.commits.push(structuredClone(source));
    source.files.forEach((file) => this.files.set(file.path, atob(file.bytesBase64)));
    this.revision = `sha256-saved-${this.commits.length}`;
    return Promise.resolve({ revision: this.revision });
  }

  CopyText(): Promise<unknown> {
    return Promise.resolve({});
  }

  ExportArtifact(): Promise<unknown> {
    return Promise.resolve({});
  }

  ForgetRecentProject(token: string): Promise<unknown> {
    this.forgotten.push(token);
    return Promise.resolve({});
  }

  ListFiles(): Promise<unknown> {
    return Promise.resolve([...this.files.entries()].map(([path, text]) => ({
      mediaType: 'application/yaml',
      modifiedAt: '2026-07-29T09:00:00Z',
      path,
      size: new TextEncoder().encode(text).byteLength
    })));
  }

  NewUntitledProject(): Promise<NativeProjectReference> {
    return Promise.resolve(structuredClone(this.newReference || untitledReference));
  }

  OpenProjectFolder(): Promise<NativeProjectReference> {
    if (this.openReference) return Promise.resolve(structuredClone(this.openReference));
    return Promise.reject({
      code: 'cancelled',
      message: 'Folder selection was cancelled.',
      retryable: true
    });
  }

  PromoteRecent(token: string): Promise<unknown> {
    this.promotions.push(token);
    return Promise.resolve({});
  }

  ReadFile(_token: string, path: string): Promise<unknown> {
    const text = this.files.get(path);
    if (text === undefined) {
      return Promise.reject({ code: 'not-found', message: 'File not found.', retryable: true });
    }
    return Promise.resolve({ bytesBase64: btoa(text) });
  }

  ReadPreference(): Promise<unknown> {
    return Promise.resolve({ found: false });
  }

  ReadRecovery(): Promise<unknown> {
    return Promise.resolve({ found: false });
  }

  Revision(): Promise<unknown> {
    return Promise.resolve({ revision: this.revision });
  }

  StartupProject(): Promise<NativeProjectReference> {
    return Promise.resolve(structuredClone(this.startupReference || untitledReference));
  }

  ReleaseProject(token: string): Promise<unknown> {
    this.releases.push(token);
    return Promise.resolve({});
  }

  SubscribeProjectChanges(_token: string, listener: (payload: unknown) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  WritePreference(): Promise<unknown> {
    return Promise.resolve({});
  }

  WriteRecovery(): Promise<unknown> {
    return Promise.resolve({});
  }
}

async function loadProject(host: DesktopApplicationHost): Promise<StudioProject> {
  const loaded = await host.loadProject();
  expect(loaded.ok).toBe(true);
  if (!loaded.ok) throw new Error(loaded.error.message);
  return loaded.value.project;
}

describe('DesktopApplicationHost', () => {
  it('keeps one opaque project identity through first save and later saves', async () => {
    const client = new FakeLifecycleClient();
    const host = await DesktopApplicationHost.create(client);
    const untitled = await loadProject(host);
    expect(untitled).toMatchObject({ id: untitledReference.token, revision: 'untitled' });

    const firstSave = await host.saveProject({
      expectedRevision: untitled.revision,
      project: untitled
    });
    expect(firstSave).toMatchObject({ ok: true, value: { revision: 'sha256-saved-1' } });
    expect(client.firstSaveCalls).toBe(1);
    expect(client.commits[0]).toMatchObject({
      expectedRevision: 'untitled',
      token: untitledReference.token
    });
    expect((client.commits[0]?.files as unknown[])).toHaveLength(2);

    const saved = await loadProject(host);
    expect(saved).toMatchObject({
      id: untitledReference.token,
      name: 'Chosen project',
      revision: 'sha256-saved-1'
    });
    const secondSave = await host.saveProject({
      expectedRevision: saved.revision,
      project: saved
    });
    expect(secondSave.ok).toBe(true);
    expect(client.firstSaveCalls).toBe(1);
  });

  it('keeps the untitled project unchanged when first-save folder selection is cancelled', async () => {
    const client = new FakeLifecycleClient();
    client.cancelFirstSave = true;
    const host = await DesktopApplicationHost.create(client);
    const before = await loadProject(host);

    const saved = await host.saveProject({
      expectedRevision: before.revision,
      project: before
    });
    expect(saved).toMatchObject({
      error: { code: 'cancelled' },
      ok: false
    });
    expect(client.commits).toHaveLength(0);
    await expect(loadProject(host)).resolves.toEqual(before);
  });

  it('keeps the untitled project retryable when the native first-save transaction fails', async () => {
    const client = new FakeLifecycleClient();
    client.failFirstSave = true;
    const host = await DesktopApplicationHost.create(client);
    const before = await loadProject(host);

    const failed = await host.saveProject({
      expectedRevision: before.revision,
      project: before
    });
    expect(failed).toMatchObject({
      error: {
        code: 'partial-failure',
        details: { rollbackSucceeded: true }
      },
      ok: false
    });
    await expect(loadProject(host)).resolves.toEqual(before);

    client.failFirstSave = false;
    const retried = await host.saveProject({
      expectedRevision: before.revision,
      project: before
    });
    expect(retried.ok).toBe(true);
    expect(client.firstSaveCalls).toBe(2);
  });

  it('wires an existing listener only after the untitled project gains a directory', async () => {
    const client = new FakeLifecycleClient();
    const host = await DesktopApplicationHost.create(client);
    const unwatch = host.watchProject(() => {});
    expect(client.listeners).toHaveLength(0);

    const untitled = await loadProject(host);
    const saved = await host.saveProject({
      expectedRevision: untitled.revision,
      project: untitled
    });
    expect(saved.ok).toBe(true);
    expect(client.listeners).toHaveLength(1);
    unwatch();
    expect(client.listeners).toHaveLength(0);
  });

  it('promotes an opened directory only after its canonical bundle loads', async () => {
    const client = new FakeLifecycleClient();
    client.openReference = {
      name: 'Validated project',
      revision: 'sha256-opened',
      token: 'opened-project-token'
    };
    client.revision = 'sha256-opened';
    client.files.set('topology.yaml', 'graph:\n  id: opened\n  nodes: []\n  links: []\n');
    client.files.set('stylesheet.yaml', 'stylesheet: []\n');
    const host = await DesktopApplicationHost.create(client);

    const opened = await host.openProjectFolder();

    expect(opened.ok).toBe(true);
    expect(client.promotions).toEqual(['opened-project-token']);
    expect(client.releases).toEqual([untitledReference.token]);
    await expect(loadProject(host)).resolves.toMatchObject({
      id: 'opened-project-token',
      name: 'Validated project'
    });
  });

  it('releases the replaced directory authority after creating a new untitled project', async () => {
    const client = new FakeLifecycleClient();
    client.startupReference = {
      name: 'Current project',
      revision: 'sha256-current',
      token: 'current-project-token'
    };
    client.newReference = {
      name: 'Untitled topology',
      revision: 'untitled',
      token: 'new-untitled-token'
    };
    client.revision = 'sha256-current';
    client.files.set('topology.yaml', 'graph:\n  id: current\n  nodes: []\n  links: []\n');
    client.files.set('stylesheet.yaml', 'stylesheet: []\n');
    const host = await DesktopApplicationHost.create(client);

    const created = await host.createProject({ name: 'Untitled topology' });

    expect(created).toMatchObject({
      ok: true,
      value: { project: { id: 'new-untitled-token', revision: 'untitled' } }
    });
    expect(client.releases).toEqual(['current-project-token']);
  });

  it('keeps the current project and releases authority when an opened directory is invalid', async () => {
    const client = new FakeLifecycleClient();
    const host = await DesktopApplicationHost.create(client);
    const before = await loadProject(host);
    client.openReference = {
      name: 'Invalid project',
      revision: 'sha256-invalid',
      token: 'invalid-project-token'
    };
    client.revision = 'sha256-invalid';
    client.files.set('topology.yaml', 'graph:\n  id: invalid\n  nodes: []\n  links: []\n');

    const opened = await host.openProjectFolder();

    expect(opened.ok).toBe(false);
    expect(client.promotions).toEqual([]);
    expect(client.releases).toEqual(['invalid-project-token']);
    await expect(loadProject(host)).resolves.toEqual(before);
  });

  it('forgets an invalid recent directory and starts with a recoverable untitled project', async () => {
    const client = new FakeLifecycleClient();
    client.startupReference = {
      name: 'Invalid recent project',
      revision: 'sha256-invalid-recent',
      token: 'invalid-recent-token'
    };
    client.revision = 'sha256-invalid-recent';
    client.files.set('topology.yaml', 'graph:\n  id: invalid-recent\n  nodes: []\n  links: []\n');

    const host = await DesktopApplicationHost.create(client);

    expect(client.forgotten).toEqual(['invalid-recent-token']);
    expect(client.releases).toEqual(['invalid-recent-token']);
    await expect(loadProject(host)).resolves.toMatchObject({
      id: untitledReference.token,
      revision: 'untitled'
    });
  });
});
