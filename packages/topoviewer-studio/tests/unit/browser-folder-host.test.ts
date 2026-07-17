import { IDBFactory } from 'fake-indexeddb';
import { describe, expect, it } from 'vitest';
import { BrowserStudioHost } from '../../src/hosts/browserHost';

class FakeFileHandle {
  readonly kind = 'file' as const;
  constructor(
    readonly name: string,
    private content: Uint8Array,
    private readonly type = 'application/yaml'
  ) {}

  async createWritable() {
    return {
      close: async () => undefined,
      write: async (value: ArrayBuffer) => {
        this.content = new Uint8Array(value);
      }
    };
  }

  async getFile() {
    const content = this.content;
    return {
      arrayBuffer: async () => content.slice().buffer,
      name: this.name,
      size: content.byteLength,
      type: this.type
    } as File;
  }

  text() {
    return new TextDecoder().decode(this.content);
  }
}

class FakeDirectoryHandle {
  readonly kind = 'directory' as const;
  readonly entriesByName = new Map<string, FakeDirectoryHandle | FakeFileHandle>();
  permissionRequests = 0;

  constructor(readonly name: string) {}

  async *entries() {
    for (const entry of [...this.entriesByName.entries()].sort(([left], [right]) => left.localeCompare(right))) yield entry;
  }

  async getDirectoryHandle(name: string, options?: { create?: boolean }) {
    const current = this.entriesByName.get(name);
    if (current instanceof FakeDirectoryHandle) return current;
    if (!options?.create) throw new DOMException('missing', 'NotFoundError');
    const directory = new FakeDirectoryHandle(name);
    this.entriesByName.set(name, directory);
    return directory;
  }

  async getFileHandle(name: string, options?: { create?: boolean }) {
    const current = this.entriesByName.get(name);
    if (current instanceof FakeFileHandle) return current;
    if (!options?.create) throw new DOMException('missing', 'NotFoundError');
    const file = new FakeFileHandle(name, new Uint8Array());
    this.entriesByName.set(name, file);
    return file;
  }

  async queryPermission() {
    return 'prompt' as const;
  }
  async requestPermission() {
    this.permissionRequests += 1;
    return 'granted' as const;
  }
}

describe('BrowserStudioHost folder capability', () => {
  it('detects, explicitly grants, opens, and saves a local project folder', async () => {
    const directory = new FakeDirectoryHandle('edge-lab');
    directory.entriesByName.set('topology.yaml', new FakeFileHandle('topology.yaml', new TextEncoder().encode('graph:\n  id: edge-lab\n  nodes: []\n  links: []\n')));
    directory.entriesByName.set('stylesheet.yaml', new FakeFileHandle('stylesheet.yaml', new TextEncoder().encode('stylesheet: []\n')));
    const host = new BrowserStudioHost({
      databaseName: 'folder-host-test',
      directoryPicker: async () => directory as unknown as FileSystemDirectoryHandle,
      indexedDB: new IDBFactory(),
      storage: undefined
    });

    expect(host.capabilities.directoryProjects).toBe(true);
    const opened = await host.openProjectFolder();
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    expect(opened.value.project.name).toBe('edge-lab');
    expect(directory.permissionRequests).toBe(1);

    const project = structuredClone(opened.value.project);
    project.documents.topology.text = project.documents.topology.text.replace('nodes: []', 'nodes:\n    - id: leaf1');
    const saved = await host.saveProject({ expectedRevision: project.revision, project });
    expect(saved.ok).toBe(true);
    expect((directory.entriesByName.get('topology.yaml') as FakeFileHandle).text()).toContain('id: leaf1');
  });

  it('reports the optional capability as unavailable when no picker exists', () => {
    const host = new BrowserStudioHost({ databaseName: 'folder-host-none', indexedDB: new IDBFactory(), storage: undefined });
    expect(host.capabilities.directoryProjects).toBe(false);
  });
});
