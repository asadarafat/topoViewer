import {
  ChooseAssets,
  CommitFiles,
  CopyText,
  ExportArtifact,
  ForgetRecentProject,
  ListFiles,
  NewUntitledProject,
  OpenProjectFolder,
  PromoteRecentProject,
  ReadFile,
  ReadPreference,
  ReadRecovery,
  ReleaseProject,
  Revision,
  SaveUntitledProject,
  StartupProject,
  UnwatchProject,
  WatchProject,
  WritePreference,
  WriteRecovery
} from '../wailsjs/go/main/DesktopApp';
import { EventsOn } from '../wailsjs/runtime/runtime';
import type {
  DesktopNativeClient,
  NativeProjectReference
} from './desktopDirectoryPort';

const projectChangeEvent = 'topoviewer:desktop-project-change';

interface NativeEnvelope {
  error?: unknown;
}

function record(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw {
      code: 'corrupt-data',
      message: `${context} returned an invalid object.`,
      retryable: false
    };
  }
  return value as Record<string, unknown>;
}

function unwrap<T extends NativeEnvelope>(response: T): T {
  if (response.error) throw response.error;
  return response;
}

function requiredString(source: Record<string, unknown>, field: string, context: string): string {
  const value = source[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw {
      code: 'corrupt-data',
      message: `${context} returned an invalid ${field}.`,
      retryable: false
    };
  }
  return value;
}

function projectFrom(response: unknown): NativeProjectReference {
  const envelope = record(response, 'Project operation');
  if (envelope.error) throw envelope.error;
  const project = record(envelope.project, 'Project operation');
  return {
    name: requiredString(project, 'name', 'Project operation'),
    revision: requiredString(project, 'revision', 'Project operation'),
    token: requiredString(project, 'token', 'Project operation')
  };
}

export interface DesktopNativeLifecycleClient extends DesktopNativeClient {
  ForgetRecentProject(token: string): Promise<unknown>;
  NewUntitledProject(): Promise<NativeProjectReference>;
  OpenProjectFolder(): Promise<NativeProjectReference>;
  PromoteRecent(token: string): Promise<unknown>;
  ReleaseProject(token: string): Promise<unknown>;
  SaveUntitledProject(request: unknown): Promise<NativeProjectReference>;
  StartupProject(): Promise<NativeProjectReference>;
}

export class WailsDesktopClient implements DesktopNativeLifecycleClient {
  async ChooseAssets(request: unknown): Promise<unknown> {
    const response = unwrap(await ChooseAssets(request as never));
    return { assets: response.assets || [] };
  }

  async CommitFiles(request: unknown): Promise<unknown> {
    const response = unwrap(await CommitFiles(request as never));
    return { revision: response.revision };
  }

  async CopyText(text: string): Promise<unknown> {
    unwrap(await CopyText(text));
    return {};
  }

  async ExportArtifact(request: unknown): Promise<unknown> {
    unwrap(await ExportArtifact(request as never));
    return {};
  }

  async ForgetRecentProject(token: string): Promise<unknown> {
    unwrap(await ForgetRecentProject(token));
    return {};
  }

  async ListFiles(token: string): Promise<unknown> {
    const response = unwrap(await ListFiles(token));
    return response.files || [];
  }

  async NewUntitledProject(): Promise<NativeProjectReference> {
    return projectFrom(await NewUntitledProject());
  }

  async OpenProjectFolder(): Promise<NativeProjectReference> {
    return projectFrom(await OpenProjectFolder());
  }

  async PromoteRecent(token: string): Promise<unknown> {
    unwrap(await PromoteRecentProject(token));
    return {};
  }

  async ReadFile(token: string, path: string): Promise<unknown> {
    const response = unwrap(await ReadFile(token, path));
    return { bytesBase64: response.bytesBase64 };
  }

  async ReadPreference(key: string): Promise<unknown> {
    const response = unwrap(await ReadPreference(key));
    return {
      found: response.found,
      value: response.found && response.valueJSON ? JSON.parse(response.valueJSON) : undefined
    };
  }

  async ReadRecovery(token: string): Promise<unknown> {
    const response = unwrap(await ReadRecovery(token));
    return {
      found: response.found,
      value: response.found && response.valueJSON ? JSON.parse(response.valueJSON) : undefined
    };
  }

  async ReleaseProject(token: string): Promise<unknown> {
    unwrap(await ReleaseProject(token));
    return {};
  }

  async Revision(token: string): Promise<unknown> {
    const response = unwrap(await Revision(token));
    return { revision: response.revision };
  }

  async SaveUntitledProject(request: unknown): Promise<NativeProjectReference> {
    return projectFrom(await SaveUntitledProject(request as never));
  }

  async StartupProject(): Promise<NativeProjectReference> {
    return projectFrom(await StartupProject());
  }

  SubscribeProjectChanges(token: string, listener: (payload: unknown) => void): () => void {
    const cancelEvent = EventsOn(projectChangeEvent, (payload: unknown) => {
      if (
        payload &&
        typeof payload === 'object' &&
        'token' in payload &&
        (payload as { token?: unknown }).token === token
      ) {
        listener(payload);
      }
    });
    void WatchProject(token).then(unwrap).catch(() => cancelEvent());
    return () => {
      cancelEvent();
      void UnwatchProject(token).then(unwrap);
    };
  }

  async WritePreference(key: string, value: unknown): Promise<unknown> {
    unwrap(await WritePreference(key, JSON.stringify(value)));
    return {};
  }

  async WriteRecovery(token: string, value: unknown): Promise<unknown> {
    unwrap(await WriteRecovery(token, JSON.stringify(value)));
    return {};
  }
}
