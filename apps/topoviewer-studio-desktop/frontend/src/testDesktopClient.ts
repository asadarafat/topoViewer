import type { DesktopNativeLifecycleClient } from './wailsDesktopClient';
import type { NativeProjectReference } from './desktopDirectoryPort';

interface NativeCommitRequest {
  expectedRevision: string;
  files: Array<{ bytesBase64: string; path: string }>;
  token: string;
}

interface NativeExportRequest {
  artifact: {
    bytesBase64: string;
    mediaType: string;
    name: string;
  };
  suggestedName: string;
}

function asCommitRequest(value: unknown): NativeCommitRequest {
  return value as NativeCommitRequest;
}

function asExportRequest(value: unknown): NativeExportRequest {
  return value as NativeExportRequest;
}

export class TestDesktopClient implements DesktopNativeLifecycleClient {
  private commitSequence = 0;
  private readonly files = new Map<string, string>();
  private readonly listeners = new Map<string, Set<(payload: unknown) => void>>();
  private readonly preferences = new Map<string, unknown>();
  private readonly recoveries = new Map<string, unknown>();
  private project: NativeProjectReference = {
    name: 'Untitled topology',
    revision: 'untitled',
    token: 'desktop-test-project'
  };

  SaveUntitledProject(value: unknown): Promise<NativeProjectReference> {
    const request = asCommitRequest(value);
    if (request.token !== this.project.token) return Promise.reject(this.notFound());
    request.files.forEach((file) => this.files.set(file.path, atob(file.bytesBase64)));
    this.commitSequence += 1;
    this.project = {
      name: 'Desktop project',
      revision: `sha256-desktop-test-${this.commitSequence}`,
      token: request.token
    };
    return Promise.resolve(structuredClone(this.project));
  }

  ChooseAssets(): Promise<unknown> {
    return Promise.reject({
      code: 'cancelled',
      message: 'Asset selection was cancelled.',
      retryable: true
    });
  }

  CommitFiles(value: unknown): Promise<unknown> {
    const request = asCommitRequest(value);
    if (request.token !== this.project.token) return Promise.reject(this.notFound());
    if (request.expectedRevision !== this.project.revision) {
      return Promise.reject({
        code: 'conflict',
        details: {
          actualRevision: this.project.revision,
          expectedRevision: request.expectedRevision
        },
        message: 'The project changed before the save could begin.',
        retryable: true
      });
    }
    request.files.forEach((file) => this.files.set(file.path, atob(file.bytesBase64)));
    this.commitSequence += 1;
    this.project.revision = `sha256-desktop-test-${this.commitSequence}`;
    return Promise.resolve({ revision: this.project.revision });
  }

  CopyText(text: string): Promise<unknown> {
    return navigator.clipboard.writeText(text).then(() => ({}));
  }

  ExportArtifact(value: unknown): Promise<unknown> {
    const request = asExportRequest(value);
    const binary = atob(request.artifact.bytesBase64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: request.artifact.mediaType }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = request.suggestedName;
    anchor.click();
    queueMicrotask(() => URL.revokeObjectURL(url));
    return Promise.resolve({});
  }

  ForgetRecentProject(): Promise<unknown> {
    return Promise.resolve({});
  }

  ListFiles(token: string): Promise<unknown> {
    if (token !== this.project.token) return Promise.reject(this.notFound());
    return Promise.resolve([...this.files.entries()].map(([path, text]) => ({
      mediaType: 'application/yaml',
      modifiedAt: '2026-07-29T09:00:00Z',
      path,
      size: new TextEncoder().encode(text).byteLength
    })));
  }

  NewUntitledProject(): Promise<NativeProjectReference> {
    this.files.clear();
    this.project = {
      name: 'Untitled topology',
      revision: 'untitled',
      token: `desktop-test-project-${this.commitSequence + 1}`
    };
    return Promise.resolve(structuredClone(this.project));
  }

  OpenProjectFolder(): Promise<NativeProjectReference> {
    return Promise.reject({
      code: 'cancelled',
      message: 'Folder selection was cancelled.',
      retryable: true
    });
  }

  PromoteRecent(): Promise<unknown> {
    return Promise.resolve({});
  }

  ReadFile(token: string, path: string): Promise<unknown> {
    if (token !== this.project.token) return Promise.reject(this.notFound());
    const text = this.files.get(path);
    if (text === undefined) return Promise.reject(this.notFound());
    return Promise.resolve({ bytesBase64: btoa(text) });
  }

  ReadPreference(key: string): Promise<unknown> {
    return Promise.resolve({
      found: this.preferences.has(key),
      value: structuredClone(this.preferences.get(key))
    });
  }

  ReadRecovery(token: string): Promise<unknown> {
    return Promise.resolve({
      found: this.recoveries.has(token),
      value: structuredClone(this.recoveries.get(token))
    });
  }

  ReleaseProject(): Promise<unknown> {
    return Promise.resolve({});
  }

  Revision(token: string): Promise<unknown> {
    if (token !== this.project.token) return Promise.reject(this.notFound());
    return Promise.resolve({ revision: this.project.revision });
  }

  StartupProject(): Promise<NativeProjectReference> {
    return Promise.resolve(structuredClone(this.project));
  }

  SubscribeProjectChanges(token: string, listener: (payload: unknown) => void): () => void {
    const listeners = this.listeners.get(token) || new Set();
    listeners.add(listener);
    this.listeners.set(token, listeners);
    return () => listeners.delete(listener);
  }

  WritePreference(key: string, value: unknown): Promise<unknown> {
    this.preferences.set(key, structuredClone(value));
    return Promise.resolve({});
  }

  WriteRecovery(token: string, value: unknown): Promise<unknown> {
    this.recoveries.set(token, structuredClone(value));
    return Promise.resolve({});
  }

  private notFound() {
    return {
      code: 'not-found',
      message: 'The desktop test project is not open.',
      retryable: true
    };
  }
}
