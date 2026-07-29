import type {
  StudioAssetContent,
  StudioAssetRequest,
  StudioExportRequest,
  StudioHostErrorCode,
  StudioHostEvent
} from 'topoviewer-studio/host';
import type { StudioProject, StudioRecoverySnapshot } from 'topoviewer-studio';
import {
  canonicalStudioPath,
  validateStudioProjectEnvelope
} from 'topoviewer-studio/host-security';
import type {
  StudioDirectoryFileEntry,
  StudioDirectoryFileWrite,
  StudioDirectoryPort
} from 'topoviewer-studio/directory-host';

export interface NativeProjectReference {
  name: string;
  revision: string;
  token: string;
}

export interface NativeCommitRequest {
  expectedRevision: string;
  files: Array<{ bytesBase64: string; path: string }>;
  token: string;
}

export interface DesktopNativeClient {
  ChooseAssets(request: unknown): Promise<unknown>;
  CommitFiles(request: unknown): Promise<unknown>;
  CopyText(text: string): Promise<unknown>;
  ExportArtifact(request: unknown): Promise<unknown>;
  ListFiles(token: string): Promise<unknown>;
  ReadFile(token: string, path: string): Promise<unknown>;
  ReadPreference(key: string): Promise<unknown>;
  ReadRecovery(token: string): Promise<unknown>;
  Revision(token: string): Promise<unknown>;
  SubscribeProjectChanges(token: string, listener: (payload: unknown) => void): () => void;
  WritePreference(key: string, value: unknown): Promise<unknown>;
  WriteRecovery(token: string, value: unknown): Promise<unknown>;
}

interface DesktopDirectoryPortOptions {
  client: DesktopNativeClient;
  project: NativeProjectReference;
}

const hostErrorCodes = new Set<StudioHostErrorCode>([
  'cancelled',
  'conflict',
  'corrupt-data',
  'invalid-request',
  'not-found',
  'partial-failure',
  'permission-denied',
  'quota-exceeded',
  'unsupported',
  'unavailable',
  'unknown'
]);

class DesktopNativeError extends Error {
  constructor(
    readonly code: StudioHostErrorCode,
    message: string,
    readonly retryable: boolean,
    readonly details?: Record<string, string | number | boolean | null>
  ) {
    super(message);
  }
}

function record(value: unknown, context: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new DesktopNativeError('corrupt-data', `${context} returned an invalid object.`, false);
  }
  return value as Record<string, unknown>;
}

function stringField(source: Record<string, unknown>, field: string, context: string): string {
  const value = source[field];
  if (typeof value !== 'string') {
    throw new DesktopNativeError('corrupt-data', `${context} returned an invalid ${field}.`, false);
  }
  return value;
}

function optionalStringField(source: Record<string, unknown>, field: string, context: string): string | undefined {
  const value = source[field];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new DesktopNativeError('corrupt-data', `${context} returned an invalid ${field}.`, false);
  }
  return value;
}

function canonicalPath(candidate: string, context: string): string {
  try {
    return canonicalStudioPath(candidate);
  } catch {
    throw new DesktopNativeError('corrupt-data', `${context} returned an unsafe relative path.`, false);
  }
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  const step = 0x8000;
  for (let offset = 0; offset < bytes.byteLength; offset += step) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + step));
  }
  return btoa(binary);
}

export function desktopCommitRequest(
  token: string,
  files: StudioDirectoryFileWrite[],
  expectedRevision: string
): NativeCommitRequest {
  return {
    expectedRevision,
    files: files.map(({ bytes, path }) => ({
      bytesBase64: encodeBase64(bytes),
      path: canonicalPath(path, 'CommitFiles')
    })),
    token
  };
}

function decodeBase64(value: unknown, context: string): Uint8Array {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length % 4 !== 0) {
    throw new DesktopNativeError('corrupt-data', `${context} returned invalid base64 content.`, false);
  }
  try {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new DesktopNativeError('corrupt-data', `${context} returned invalid base64 content.`, false);
  }
}

export function normalizeDesktopNativeError(error: unknown): DesktopNativeError {
  if (error instanceof DesktopNativeError) return error;
  if (error && typeof error === 'object') {
    const source = error as Record<string, unknown>;
    const code = typeof source.code === 'string' && hostErrorCodes.has(source.code as StudioHostErrorCode)
      ? source.code as StudioHostErrorCode
      : 'unknown';
    const details = source.details && typeof source.details === 'object' && !Array.isArray(source.details)
      ? source.details as Record<string, string | number | boolean | null>
      : undefined;
    return new DesktopNativeError(
      code,
      typeof source.message === 'string' ? source.message : 'The desktop host operation failed.',
      typeof source.retryable === 'boolean' ? source.retryable : code === 'unknown',
      details
    );
  }
  return new DesktopNativeError(
    'unknown',
    error instanceof Error ? error.message : String(error),
    true
  );
}

async function callNative<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw normalizeDesktopNativeError(error);
  }
}

function assetContent(value: unknown, context: string): StudioAssetContent {
  const source = record(value, context);
  return {
    bytes: decodeBase64(source.bytesBase64, context),
    mediaType: stringField(source, 'mediaType', context),
    name: canonicalPath(stringField(source, 'name', context), context)
  };
}

function optionalValue<T>(value: unknown, context: string): T | undefined {
  const source = record(value, context);
  if (typeof source.found !== 'boolean') {
    throw new DesktopNativeError('corrupt-data', `${context} returned an invalid found flag.`, false);
  }
  return source.found ? structuredClone(source.value) as T : undefined;
}

export class DesktopDirectoryPort implements StudioDirectoryPort {
  readonly id: string;
  readonly name: string;
  readonly trusted = true;
  private readonly client: DesktopNativeClient;

  constructor(options: DesktopDirectoryPortOptions) {
    this.client = options.client;
    this.id = options.project.token;
    this.name = options.project.name;
  }

  async chooseAssets(request: StudioAssetRequest): Promise<StudioAssetContent[]> {
    const response = record(await callNative(() => this.client.ChooseAssets(request)), 'ChooseAssets');
    if (!Array.isArray(response.assets)) {
      throw new DesktopNativeError('corrupt-data', 'ChooseAssets returned an invalid asset list.', false);
    }
    return response.assets.map((asset) => assetContent(asset, 'ChooseAssets'));
  }

  async commitFiles(files: StudioDirectoryFileWrite[], expectedRevision: string): Promise<void> {
    const response = record(
      await callNative(() => this.client.CommitFiles(desktopCommitRequest(this.id, files, expectedRevision))),
      'CommitFiles'
    );
    stringField(response, 'revision', 'CommitFiles');
  }

  async copyText(text: string): Promise<void> {
    await callNative(() => this.client.CopyText(text));
  }

  async exportArtifact(request: StudioExportRequest): Promise<void> {
    await callNative(() => this.client.ExportArtifact({
      artifact: {
        bytesBase64: encodeBase64(request.artifact.bytes),
        mediaType: request.artifact.mediaType,
        name: request.artifact.name
      },
      kind: request.kind,
      suggestedName: request.suggestedName
    }));
  }

  async listFiles(): Promise<StudioDirectoryFileEntry[]> {
    const response = await callNative(() => this.client.ListFiles(this.id));
    if (!Array.isArray(response)) {
      throw new DesktopNativeError('corrupt-data', 'ListFiles returned an invalid file list.', false);
    }
    return response.map((value) => {
      const source = record(value, 'ListFiles');
      const size = source.size;
      if (typeof size !== 'number' || !Number.isSafeInteger(size) || size < 0) {
        throw new DesktopNativeError('corrupt-data', 'ListFiles returned an invalid file size.', false);
      }
      return {
        mediaType: optionalStringField(source, 'mediaType', 'ListFiles'),
        modifiedAt: optionalStringField(source, 'modifiedAt', 'ListFiles'),
        path: canonicalPath(stringField(source, 'path', 'ListFiles'), 'ListFiles'),
        size
      };
    });
  }

  async readFile(path: string): Promise<Uint8Array> {
    const canonical = canonicalPath(path, 'ReadFile');
    const response = record(await callNative(() => this.client.ReadFile(this.id, canonical)), 'ReadFile');
    return decodeBase64(response.bytesBase64, 'ReadFile');
  }

  async readPreference<T>(key: string): Promise<T | undefined> {
    return optionalValue<T>(await callNative(() => this.client.ReadPreference(key)), 'ReadPreference');
  }

  async readRecovery(): Promise<StudioRecoverySnapshot | undefined> {
    const snapshot = optionalValue<StudioRecoverySnapshot>(
      await callNative(() => this.client.ReadRecovery(this.id)),
      'ReadRecovery'
    );
    if (snapshot) {
      const source = record(snapshot, 'ReadRecovery');
      if (
        typeof source.capturedAt !== 'string' ||
        typeof source.reason !== 'string' ||
        typeof source.sourceRevision !== 'string'
      ) {
        throw new DesktopNativeError('corrupt-data', 'ReadRecovery returned an invalid recovery snapshot.', false);
      }
      validateStudioProjectEnvelope(source.project as StudioProject);
    }
    return snapshot;
  }

  async readRevision(): Promise<string> {
    const response = record(await callNative(() => this.client.Revision(this.id)), 'Revision');
    return stringField(response, 'revision', 'Revision');
  }

  report(_event: StudioHostEvent): void {}

  watch(listener: (paths: string[]) => void): () => void {
    return this.client.SubscribeProjectChanges(this.id, (payload) => {
      try {
        const source = record(payload, 'Project change');
        if (!Array.isArray(source.paths)) return;
        const paths = source.paths.map((path) => canonicalPath(String(path), 'Project change'));
        listener(paths);
      } catch {
        // Invalid native events are ignored; request/response failures remain typed.
      }
    });
  }

  async writePreference<T>(key: string, value: T): Promise<void> {
    await callNative(() => this.client.WritePreference(key, structuredClone(value)));
  }

  async writeRecovery(snapshot: StudioRecoverySnapshot): Promise<void> {
    validateStudioProjectEnvelope(snapshot.project);
    await callNative(() => this.client.WriteRecovery(this.id, structuredClone(snapshot)));
  }
}
