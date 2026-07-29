import type {
  StudioAssetRequest,
  StudioAssetResult,
  StudioCreateProjectRequest,
  StudioDuplicateProjectRequest,
  StudioExportRequest,
  StudioExternalChange,
  StudioHost,
  StudioHostError,
  StudioHostEvent,
  StudioLoadResult,
  StudioProjectReference,
  StudioProjectSummary,
  StudioRenameProjectRequest,
  StudioResult,
  StudioSaveRequest,
  StudioSaveResult
} from 'topoviewer-studio/host';
import type {
  StudioAssetContent,
  StudioProject,
  StudioRecoverySnapshot,
  StudioSourceDocument
} from 'topoviewer-studio';
import { createStarterProject } from 'topoviewer-studio/starter-project';
import {
  desktopCommitRequest,
  DesktopDirectoryPort,
  normalizeDesktopNativeError,
  type NativeProjectReference
} from './desktopDirectoryPort';
import { DesktopStudioHost } from './DesktopStudioHost';
import type { DesktopNativeLifecycleClient } from './wailsDesktopClient';

function ok<T>(value: T): StudioResult<T> {
  return { ok: true, value };
}

function failed(error: unknown): { error: StudioHostError; ok: false } {
  const native = normalizeDesktopNativeError(error);
  return {
    error: {
      code: native.code,
      ...(native.details ? { details: native.details } : {}),
      message: native.message,
      retryable: native.retryable
    },
    ok: false
  };
}

function unsupported<T>(operation: string): Promise<StudioResult<T>> {
  return Promise.resolve({
    error: {
      code: 'unsupported',
      message: `${operation} is not available for a desktop directory project.`,
      retryable: false
    },
    ok: false
  });
}

function projectSummary(project: StudioProject): StudioProjectSummary {
  return {
    id: project.id,
    name: project.name,
    openedAt: project.metadata.createdAt,
    revision: project.revision,
    updatedAt: project.metadata.updatedAt
  };
}

function sourceWrites(project: StudioProject) {
  return Object.values(project.documents)
    .filter((document): document is StudioSourceDocument => Boolean(document))
    .map((document) => ({
      bytes: new TextEncoder().encode(document.text),
      path: document.path
    }));
}

export class DesktopApplicationHost implements StudioHost {
  readonly capabilities = { directoryProjects: true, projectCatalog: false };
  readonly displayName = 'Desktop directory';
  readonly kind = 'desktop' as const;
  private readonly client: DesktopNativeLifecycleClient;
  private delegate?: DesktopStudioHost;
  private project: StudioProject;
  private projectReference: NativeProjectReference;
  private readonly watchers = new Set<(event: StudioExternalChange) => void>();
  private delegateUnwatch?: () => void;

  private constructor(client: DesktopNativeLifecycleClient, reference: NativeProjectReference) {
    this.client = client;
    this.projectReference = reference;
    this.project = createStarterProject({
      id: reference.token,
      name: reference.name,
      template: 'blank'
    });
    this.project.revision = reference.revision;
    if (reference.revision !== 'untitled') this.useDirectory(reference);
  }

  static async create(client: DesktopNativeLifecycleClient): Promise<DesktopApplicationHost> {
    const host = new DesktopApplicationHost(client, await client.StartupProject());
    if (!host.delegate) return host;
    const loaded = await host.delegate.loadProject();
    if (loaded.ok) {
      host.project = structuredClone(loaded.value.project);
      return host;
    }
    const rejectedToken = host.projectReference.token;
    try {
      await client.ForgetRecentProject(rejectedToken);
    } finally {
      await client.ReleaseProject(rejectedToken).catch(() => undefined);
    }
    host.useUntitled(await client.NewUntitledProject());
    return host;
  }

  async chooseAssets(request: StudioAssetRequest): Promise<StudioResult<StudioAssetResult>> {
    try {
      const port = this.systemPort();
      return ok({ assets: await port.chooseAssets(request) });
    } catch (error) {
      return failed(error);
    }
  }

  async copyText(text: string): Promise<StudioResult<void>> {
    try {
      await this.systemPort().copyText(text);
      return ok(undefined);
    } catch (error) {
      return failed(error);
    }
  }

  async createProject(_request: StudioCreateProjectRequest): Promise<StudioResult<StudioLoadResult>> {
    try {
      const previousToken = this.projectReference.token;
      const reference = await this.client.NewUntitledProject();
      this.useUntitled(reference);
      await this.releaseReplacedAuthority(previousToken, reference.token);
      return ok({ project: structuredClone(this.project) });
    } catch (error) {
      return failed(error);
    }
  }

  deleteProject(_reference: StudioProjectReference): Promise<StudioResult<void>> {
    return unsupported('Deleting project directories');
  }

  duplicateProject(_request: StudioDuplicateProjectRequest): Promise<StudioResult<StudioLoadResult>> {
    return unsupported('Duplicating project directories');
  }

  async exportArtifact(request: StudioExportRequest): Promise<StudioResult<void>> {
    try {
      await this.systemPort().exportArtifact(request);
      return ok(undefined);
    } catch (error) {
      return failed(error);
    }
  }

  listProjects(): Promise<StudioResult<StudioProjectSummary[]>> {
    return Promise.resolve(ok([projectSummary(this.project)]));
  }

  async loadProject(reference?: StudioProjectReference): Promise<StudioResult<StudioLoadResult>> {
    if (reference?.id && reference.id !== this.project.id) {
      return Promise.resolve({
        error: {
          code: 'not-found',
          message: `Desktop project "${reference.id}" is not open.`,
          retryable: false
        },
        ok: false
      });
    }
    if (this.delegate) {
      const loaded = await this.delegate.loadProject(reference);
      if (loaded.ok) this.project = structuredClone(loaded.value.project);
      return loaded;
    }
    try {
      const recovery = await this.systemPort().readRecovery();
      return ok({
        project: structuredClone(this.project),
        ...(recovery?.project.id === this.project.id ? { recovery } : {})
      });
    } catch (error) {
      return failed(error);
    }
  }

  async openProjectFolder(): Promise<StudioResult<StudioLoadResult>> {
    try {
      const previousToken = this.projectReference.token;
      const reference = await this.client.OpenProjectFolder();
      const candidate = this.directoryHost(reference);
      const loaded = await candidate.loadProject();
      if (!loaded.ok) {
        await this.client.ReleaseProject(reference.token).catch(() => undefined);
        return loaded;
      }
      try {
        await this.client.PromoteRecent(reference.token);
      } catch (error) {
        await this.client.ReleaseProject(reference.token).catch(() => undefined);
        return failed(error);
      }
      this.useLoadedDirectory(reference, candidate, loaded.value.project);
      await this.releaseReplacedAuthority(previousToken, reference.token);
      return loaded;
    } catch (error) {
      return failed(error);
    }
  }

  readPreference<T>(key: string): Promise<StudioResult<T | undefined>> {
    return this.portResult(() => this.systemPort().readPreference<T>(key));
  }

  async readProjectAssets(reference: StudioProjectReference): Promise<StudioResult<StudioAssetContent[]>> {
    if (this.delegate) return this.delegate.readProjectAssets(reference);
    if (reference.id && reference.id !== this.project.id) {
      return {
        error: { code: 'not-found', message: `Desktop project "${reference.id}" is not open.`, retryable: false },
        ok: false
      };
    }
    return ok([]);
  }

  renameProject(_request: StudioRenameProjectRequest): Promise<StudioResult<StudioLoadResult>> {
    return unsupported('Renaming project directories');
  }

  report(_event: StudioHostEvent): void {}

  async saveRecovery(snapshot: StudioRecoverySnapshot): Promise<StudioResult<void>> {
    try {
      await this.systemPort().writeRecovery(snapshot);
      return ok(undefined);
    } catch (error) {
      return failed(error);
    }
  }

  async saveProject(request: StudioSaveRequest): Promise<StudioResult<StudioSaveResult>> {
    if (this.delegate) {
      const saved = await this.delegate.saveProject(request);
      if (saved.ok) {
        const loaded = await this.delegate.loadProject();
        if (loaded.ok) this.project = structuredClone(loaded.value.project);
      }
      return saved;
    }
    if (request.project.id !== this.projectReference.token || request.expectedRevision !== this.project.revision) {
      return {
        error: {
          code: 'conflict',
          message: 'The untitled project changed before its first save.',
          retryable: true
        },
        ok: false
      };
    }
    try {
      const reference = await this.client.SaveUntitledProject(desktopCommitRequest(
        this.projectReference.token,
        sourceWrites(request.project),
        request.expectedRevision
      ));
      this.useDirectory(reference);
      const loaded = await this.delegate!.loadProject();
      if (!loaded.ok) return loaded;
      this.project = structuredClone(loaded.value.project);
      return ok({
        revision: loaded.value.project.revision,
        savedAt: loaded.value.project.metadata.updatedAt
      });
    } catch (error) {
      return failed(error);
    }
  }

  watchProject(listener: (event: StudioExternalChange) => void): () => void {
    this.watchers.add(listener);
    this.rewireWatchers();
    return () => {
      this.watchers.delete(listener);
      this.rewireWatchers();
    };
  }

  writePreference<T>(key: string, value: T): Promise<StudioResult<void>> {
    return this.portResult(() => this.systemPort().writePreference(key, value));
  }

  private systemPort(): DesktopDirectoryPort {
    return new DesktopDirectoryPort({
      client: this.client,
      project: this.projectReference
    });
  }

  private async portResult<T>(operation: () => Promise<T>): Promise<StudioResult<T>> {
    try {
      return ok(await operation());
    } catch (error) {
      return failed(error);
    }
  }

  private useDirectory(reference: NativeProjectReference) {
    this.useLoadedDirectory(reference, this.directoryHost(reference));
  }

  private directoryHost(reference: NativeProjectReference): DesktopStudioHost {
    return new DesktopStudioHost({
      client: this.client,
      mapperPath: 'mapper.yaml',
      project: reference
    });
  }

  private useLoadedDirectory(
    reference: NativeProjectReference,
    delegate: DesktopStudioHost,
    project?: StudioProject
  ) {
    this.projectReference = reference;
    this.delegate = delegate;
    if (project) this.project = structuredClone(project);
    this.rewireWatchers();
  }

  private useUntitled(reference: NativeProjectReference) {
    this.delegateUnwatch?.();
    this.delegateUnwatch = undefined;
    this.delegate = undefined;
    this.projectReference = reference;
    this.project = createStarterProject({
      id: reference.token,
      name: reference.name,
      template: 'blank'
    });
    this.project.revision = reference.revision;
  }

  private rewireWatchers() {
    this.delegateUnwatch?.();
    this.delegateUnwatch = undefined;
    if (!this.delegate || this.watchers.size === 0) return;
    this.delegateUnwatch = this.delegate.watchProject?.((event) => {
      this.watchers.forEach((listener) => listener(event));
    });
  }

  private async releaseReplacedAuthority(previousToken: string, activeToken: string) {
    if (previousToken === activeToken) return;
    await this.client.ReleaseProject(previousToken).catch(() => undefined);
  }
}
