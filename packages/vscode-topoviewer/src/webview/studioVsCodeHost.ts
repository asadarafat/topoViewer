import type {
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
} from 'topoviewer-studio/host';
import type { StudioAssetContent, StudioRecoverySnapshot } from 'topoviewer-studio';
import {
  parseStudioHostResponse,
  parseStudioHostWatch,
  type StudioHostMethod,
  type StudioHostReportMessage,
  type StudioHostRequestMessage
} from '../shared/studioHostProtocol';

interface VsCodeApi {
  postMessage(message: unknown): void;
}

export interface StudioMessageTransport {
  listen(listener: (message: unknown) => void): () => void;
  post(message: unknown): void;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
  }
}

function windowTransport(): StudioMessageTransport | undefined {
  const api = window.acquireVsCodeApi?.();
  if (!api) return undefined;
  return {
    listen(listener) {
      const receive = (event: MessageEvent) => listener(event.data);
      window.addEventListener('message', receive);
      return () => window.removeEventListener('message', receive);
    },
    post(message) { api.postMessage(message); }
  };
}

function unavailable<T>(): StudioResult<T> {
  return {
    error: { code: 'unavailable', message: 'The VS Code Studio host is not connected.', retryable: true },
    ok: false
  };
}

export class VsCodeStudioHost implements StudioHost {
  readonly capabilities = { directoryProjects: false };
  readonly kind = 'vscode' as const;
  private nextRequest = 0;
  private readonly pending = new Map<string, {
    resolve(value: StudioResult<unknown>): void;
    timeout: ReturnType<typeof setTimeout>;
  }>();
  private readonly transport?: StudioMessageTransport;
  private readonly unlisten?: () => void;
  private readonly watchers = new Set<(event: StudioExternalChange) => void>();

  constructor(transport = windowTransport()) {
    this.transport = transport;
    this.unlisten = transport?.listen((message) => this.receive(message));
  }

  chooseAssets(request: StudioAssetRequest): Promise<StudioResult<StudioAssetResult>> { return this.request('chooseAssets', request); }
  copyText(text: string): Promise<StudioResult<void>> { return this.request('copyText', text); }
  createProject(request: StudioCreateProjectRequest): Promise<StudioResult<StudioLoadResult>> { return this.request('createProject', request); }
  deleteProject(reference: StudioProjectReference): Promise<StudioResult<void>> { return this.request('deleteProject', reference); }
  duplicateProject(request: StudioDuplicateProjectRequest): Promise<StudioResult<StudioLoadResult>> { return this.request('duplicateProject', request); }
  exportArtifact(request: StudioExportRequest): Promise<StudioResult<void>> { return this.request('exportArtifact', request); }
  listProjects(): Promise<StudioResult<StudioProjectSummary[]>> { return this.request('listProjects'); }
  loadProject(reference?: StudioProjectReference): Promise<StudioResult<StudioLoadResult>> {
    return reference ? this.request('loadProject', reference) : this.request('loadProject');
  }
  openProjectFolder(): Promise<StudioResult<StudioLoadResult>> { return this.request('openProjectFolder'); }
  readPreference<T>(key: string): Promise<StudioResult<T | undefined>> { return this.request('readPreference', key); }
  readProjectAssets(reference: StudioProjectReference): Promise<StudioResult<StudioAssetContent[]>> { return this.request('readProjectAssets', reference); }
  renameProject(request: StudioRenameProjectRequest): Promise<StudioResult<StudioLoadResult>> { return this.request('renameProject', request); }
  report(event: StudioHostEvent): void {
    const message: StudioHostReportMessage = { event, type: 'studio:host-report' };
    this.transport?.post(message);
  }
  saveRecovery(snapshot: StudioRecoverySnapshot): Promise<StudioResult<void>> { return this.request('saveRecovery', snapshot); }
  saveProject(request: StudioSaveRequest): Promise<StudioResult<StudioSaveResult>> { return this.request('saveProject', request); }
  watchProject(listener: (event: StudioExternalChange) => void): () => void {
    this.watchers.add(listener);
    return () => this.watchers.delete(listener);
  }
  writePreference<T>(key: string, value: T): Promise<StudioResult<void>> { return this.request('writePreference', key, value); }

  dispose() {
    this.unlisten?.();
    this.pending.forEach(({ resolve, timeout }) => {
      globalThis.clearTimeout(timeout);
      resolve(unavailable());
    });
    this.pending.clear();
    this.watchers.clear();
  }

  private request<T>(method: StudioHostMethod, ...args: unknown[]): Promise<StudioResult<T>> {
    if (!this.transport) return Promise.resolve(unavailable());
    const id = `studio-${Date.now().toString(36)}-${(this.nextRequest += 1).toString(36)}`;
    const message: StudioHostRequestMessage = { args, id, method, type: 'studio:host-request' };
    return new Promise((resolve) => {
      const timeout = globalThis.setTimeout(() => {
        this.pending.delete(id);
        resolve({ error: { code: 'unavailable', message: `VS Code host request "${method}" timed out.`, retryable: true }, ok: false });
      }, 15_000);
      this.pending.set(id, { resolve: resolve as (value: StudioResult<unknown>) => void, timeout });
      this.transport?.post(message);
    });
  }

  private receive(message: unknown) {
    const response = parseStudioHostResponse(message);
    if (response) {
      const pending = this.pending.get(response.id);
      if (!pending) return;
      globalThis.clearTimeout(pending.timeout);
      this.pending.delete(response.id);
      pending.resolve(response.result);
      return;
    }
    const watched = parseStudioHostWatch(message);
    if (watched) this.watchers.forEach((listener) => listener(watched.event));
  }
}
