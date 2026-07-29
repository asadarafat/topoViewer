import type {
  StudioAssetContent,
  StudioAssetRequest,
  StudioAssetResult,
  StudioCreateProjectRequest,
  StudioDuplicateProjectRequest,
  StudioExportRequest,
  StudioExternalChange,
  StudioHost,
  StudioHostError,
  StudioHostEvent,
  StudioHostKind,
  StudioLoadResult,
  StudioProjectReference,
  StudioProjectSummary,
  StudioRenameProjectRequest,
  StudioResult,
  StudioSaveRequest,
  StudioSaveResult
} from '../contracts/host';
import type { StudioProject, StudioRecoverySnapshot, StudioSourceDocument } from '../contracts/project';
import {
  canonicalStudioPath,
  studioSecurityLimits,
  validateStudioAssetContent,
  validateStudioProjectEnvelope
} from '../hostSecurity';

const MAX_PROJECT_FILES = studioSecurityLimits.archiveFiles;
const MAX_PROJECT_BYTES = studioSecurityLimits.archiveExpandedBytes;
const MAX_SOURCE_BYTES = studioSecurityLimits.sourceBytes;
const MAX_RECOVERY_BYTES = 10 * 1024 * 1024;

export interface StudioDirectoryFileEntry {
  mediaType?: string;
  modifiedAt?: string;
  path: string;
  size: number;
  symbolicLink?: boolean;
}

export interface StudioDirectoryFileWrite {
  bytes: Uint8Array;
  path: string;
}

export interface StudioDirectoryPort {
  readonly id: string;
  readonly name: string;
  readonly trusted: boolean;
  chooseAssets?(request: StudioAssetRequest): Promise<StudioAssetContent[]>;
  copyText(text: string): Promise<void>;
  exportArtifact(request: StudioExportRequest): Promise<void>;
  listFiles(): Promise<StudioDirectoryFileEntry[]>;
  readFile(path: string): Promise<Uint8Array>;
  readPreference<T>(key: string): Promise<T | undefined>;
  readRecovery(): Promise<StudioRecoverySnapshot | undefined>;
  readRevision?(): Promise<string>;
  report(event: StudioHostEvent): void;
  watch(listener: (paths: string[]) => void): () => void;
  commitFiles(files: StudioDirectoryFileWrite[], expectedRevision: string): Promise<void>;
  writePreference<T>(key: string, value: T): Promise<void>;
  writeRecovery(snapshot: StudioRecoverySnapshot): Promise<void>;
}

export interface DirectoryStudioHostOptions {
  displayName: string;
  hostKind: Exclude<StudioHostKind, 'browser'>;
  mapperPath?: string;
  now?: () => string;
  port: StudioDirectoryPort;
  stylesheetPath: string;
  topologyPath: string;
}

class DirectoryStudioHostError extends Error {
  constructor(
    readonly code: StudioHostError['code'],
    message: string,
    readonly retryable = false,
    readonly details?: StudioHostError['details']
  ) {
    super(message);
  }
}

function ok<T>(value: T): StudioResult<T> {
  return { ok: true, value };
}

function toHostError(error: unknown): StudioHostError {
  if (error instanceof DirectoryStudioHostError) {
    return {
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
      message: error.message,
      retryable: error.retryable
    };
  }
  if (error && typeof error === 'object' && 'code' in error) {
    const source = error as {
      code?: unknown;
      details?: unknown;
      message?: unknown;
      retryable?: unknown;
    };
    const code = String(source.code);
    const hostCodes: StudioHostError['code'][] = [
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
    ];
    const mapped = hostCodes.includes(code as StudioHostError['code'])
      ? code as StudioHostError['code']
      : code === 'FileNotFound'
        ? 'not-found'
        : code === 'NoPermissions'
          ? 'permission-denied'
          : undefined;
    if (mapped) {
      const details = source.details && typeof source.details === 'object' && !Array.isArray(source.details)
        ? Object.fromEntries(Object.entries(source.details).filter((entry): entry is [
            string,
            string | number | boolean | null
          ] => {
            const value = entry[1];
            return value === null || ['boolean', 'number', 'string'].includes(typeof value);
          }))
        : undefined;
      return {
        code: mapped,
        ...(details && Object.keys(details).length > 0 ? { details } : {}),
        message: typeof source.message === 'string'
          ? source.message
          : error instanceof Error
            ? error.message
            : String(error),
        retryable: typeof source.retryable === 'boolean'
          ? source.retryable
          : mapped === 'cancelled' || mapped === 'permission-denied'
      };
    }
  }
  return {
    code: 'unknown',
    message: error instanceof Error ? error.message : String(error),
    retryable: true
  };
}

async function result<T>(operation: () => Promise<T>): Promise<StudioResult<T>> {
  try {
    return ok(await operation());
  } catch (error) {
    return { error: toHostError(error), ok: false };
  }
}

function canonicalRelativePath(candidate: string): string {
  try {
    return canonicalStudioPath(candidate);
  } catch {
    throw new DirectoryStudioHostError('invalid-request', `Project path "${candidate}" is outside the trusted bundle root.`);
  }
}

function stableHash(value: Uint8Array | string): string {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function mediaTypeForPath(path: string): string {
  const extension = path.toLowerCase().split('.').at(-1);
  if (extension === 'svg') return 'image/svg+xml';
  if (extension === 'gif') return 'image/gif';
  if (extension === 'png') return 'image/png';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'yaml' || extension === 'yml') return 'application/yaml';
  if (extension === 'json') return 'application/json';
  return 'application/octet-stream';
}

function decodeSource(path: string, bytes: Uint8Array): string {
  if (bytes.byteLength > MAX_SOURCE_BYTES) {
    throw new DirectoryStudioHostError('quota-exceeded', `Source file "${path}" exceeds the ${MAX_SOURCE_BYTES} byte limit.`);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new DirectoryStudioHostError('corrupt-data', `Source file "${path}" is not valid UTF-8.`);
  }
}

function sourceDocument(kind: StudioSourceDocument['kind'], path: string, text: string): StudioSourceDocument {
  return { contentHash: `fnv1a-${stableHash(text)}`, kind, path, text };
}

function revisionFor(project: Pick<StudioProject, 'assets' | 'documents'>): string {
  const source = Object.values(project.documents)
    .filter((document): document is StudioSourceDocument => Boolean(document))
    .sort((left, right) => left.kind.localeCompare(right.kind))
    .map((document) => `${document.kind}\0${document.path}\0${document.contentHash}`);
  const assets = [...project.assets]
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((asset) => `${asset.path}\0${asset.contentHash}\0${asset.size}`);
  return `directory-${stableHash([...source, ...assets].join('\n'))}`;
}

function unsupported<T>(operation: string): Promise<StudioResult<T>> {
  return Promise.resolve({
    error: {
      code: 'unsupported',
      message: `${operation} is not available for the opened directory project.`,
      retryable: false
    },
    ok: false
  });
}

function ensureTrusted(port: StudioDirectoryPort, operation: string) {
  if (!port.trusted) {
    throw new DirectoryStudioHostError(
      'permission-denied',
      `${operation} is disabled until the directory project is trusted.`,
      true
    );
  }
}

export class DirectoryStudioHost implements StudioHost {
  readonly capabilities = { directoryProjects: false, projectCatalog: false };
  readonly displayName: string;
  readonly kind: DirectoryStudioHostOptions['hostKind'];
  private readonly createdAt: string;
  private lastSavedRevision?: string;
  private readonly mapperPath?: string;
  private readonly now: () => string;
  private readonly port: StudioDirectoryPort;
  private readonly stylesheetPath: string;
  private readonly topologyPath: string;
  private writing = false;

  constructor(options: DirectoryStudioHostOptions) {
    this.displayName = options.displayName;
    this.kind = options.hostKind;
    this.port = options.port;
    this.now = options.now || (() => new Date().toISOString());
    this.createdAt = this.now();
    this.topologyPath = canonicalRelativePath(options.topologyPath);
    this.stylesheetPath = canonicalRelativePath(options.stylesheetPath);
    this.mapperPath = options.mapperPath ? canonicalRelativePath(options.mapperPath) : undefined;
  }

  chooseAssets(request: StudioAssetRequest): Promise<StudioResult<StudioAssetResult>> {
    return result(async () => {
      ensureTrusted(this.port, 'Selecting project assets');
      if (!this.port.chooseAssets) throw new DirectoryStudioHostError('unsupported', 'The directory host does not provide an asset picker.');
      const assets = await this.port.chooseAssets(request);
      if (!request.multiple && assets.length > 1) {
        throw new DirectoryStudioHostError('invalid-request', 'The host selected more than one asset for a single-file request.');
      }
      for (const asset of assets) {
        if (asset.bytes.byteLength > request.maximumBytes) {
          throw new DirectoryStudioHostError(
            'quota-exceeded',
            `Selected asset "${asset.name}" exceeds the ${request.maximumBytes} byte limit.`
          );
        }
      }
      return { assets };
    });
  }

  copyText(text: string): Promise<StudioResult<void>> {
    return result(() => this.port.copyText(text));
  }

  createProject(_request: StudioCreateProjectRequest): Promise<StudioResult<StudioLoadResult>> {
    return unsupported('Creating a sibling project');
  }

  deleteProject(_reference: StudioProjectReference): Promise<StudioResult<void>> {
    return unsupported('Deleting the directory project');
  }

  duplicateProject(_request: StudioDuplicateProjectRequest): Promise<StudioResult<StudioLoadResult>> {
    return unsupported('Duplicating the directory project');
  }

  exportArtifact(request: StudioExportRequest): Promise<StudioResult<void>> {
    return result(async () => {
      ensureTrusted(this.port, 'Exporting Studio artifacts');
      if (request.artifact.bytes.byteLength > MAX_PROJECT_BYTES) {
        throw new DirectoryStudioHostError('quota-exceeded', 'The export exceeds the 25 MiB host limit.');
      }
      if (/[/\\]/.test(request.suggestedName) || !request.suggestedName.trim()) {
        throw new DirectoryStudioHostError('invalid-request', 'The export name must be a plain filename.');
      }
      await this.port.exportArtifact(request);
    });
  }

  listProjects(): Promise<StudioResult<StudioProjectSummary[]>> {
    return result(async () => {
      const loaded = await this.loadFromDisk();
      return [{
        id: loaded.project.id,
        name: loaded.project.name,
        openedAt: this.createdAt,
        revision: loaded.project.revision,
        updatedAt: loaded.project.metadata.updatedAt
      }];
    });
  }

  loadProject(reference?: StudioProjectReference): Promise<StudioResult<StudioLoadResult>> {
    return result(async () => {
      if (reference?.id && reference.id !== this.port.id) {
        throw new DirectoryStudioHostError('not-found', `Directory project "${reference.id}" is not open.`);
      }
      if (reference?.path && canonicalRelativePath(reference.path) !== this.topologyPath) {
        throw new DirectoryStudioHostError('not-found', `Directory project "${reference.path}" is not open.`);
      }
      return this.loadFromDisk();
    });
  }

  openProjectFolder(): Promise<StudioResult<StudioLoadResult>> {
    return unsupported('Opening another project folder');
  }

  readPreference<T>(key: string): Promise<StudioResult<T | undefined>> {
    return result(() => this.port.readPreference<T>(key));
  }

  readProjectAssets(reference: StudioProjectReference): Promise<StudioResult<StudioAssetContent[]>> {
    return result(async () => {
      if (reference.id && reference.id !== this.port.id) {
        throw new DirectoryStudioHostError('not-found', `Directory project "${reference.id}" is not open.`);
      }
      const entries = await this.validatedEntries();
      const sourcePaths = new Set([this.topologyPath, this.stylesheetPath, this.mapperPath].filter(Boolean));
      return Promise.all(entries
        .filter((entry) => !sourcePaths.has(entry.path))
        .map(async (entry) => validateStudioAssetContent({
          bytes: await this.port.readFile(entry.path),
          mediaType: entry.mediaType || mediaTypeForPath(entry.path),
          name: entry.path
        }, { allowMediaTypeSniffing: true })));
    });
  }

  renameProject(_request: StudioRenameProjectRequest): Promise<StudioResult<StudioLoadResult>> {
    return unsupported('Renaming the directory');
  }

  report(event: StudioHostEvent): void {
    this.port.report(event);
  }

  saveRecovery(snapshot: StudioRecoverySnapshot): Promise<StudioResult<void>> {
    return result(async () => {
      const encoded = new TextEncoder().encode(JSON.stringify(snapshot));
      if (encoded.byteLength > MAX_RECOVERY_BYTES) {
        throw new DirectoryStudioHostError('quota-exceeded', 'The recovery snapshot exceeds the 10 MiB host limit.');
      }
      await this.port.writeRecovery(structuredClone(snapshot));
    });
  }

  saveProject(request: StudioSaveRequest): Promise<StudioResult<StudioSaveResult>> {
    return result(async () => {
      ensureTrusted(this.port, 'Saving the Studio project');
      validateStudioProjectEnvelope(request.project);
      if (request.project.id !== this.port.id) {
        throw new DirectoryStudioHostError('invalid-request', 'The project does not belong to the open directory.');
      }
      const disk = await this.loadFromDisk();
      if (request.expectedRevision && request.expectedRevision !== disk.project.revision) {
        throw new DirectoryStudioHostError(
          'conflict',
          'The TopoViewer bundle changed on disk. Inspect the change, keep the Studio draft, or reload disk before saving.',
          true,
          { actualRevision: disk.project.revision, expectedRevision: request.expectedRevision }
        );
      }
      const documents = Object.values(request.project.documents)
        .filter((document): document is StudioSourceDocument => Boolean(document));
      const paths = new Set<string>();
      const writes = documents.map((document) => {
        const path = canonicalRelativePath(document.path);
        if (paths.has(path)) throw new DirectoryStudioHostError('invalid-request', `Multiple source documents target "${path}".`);
        paths.add(path);
        const bytes = new TextEncoder().encode(document.text);
        if (bytes.byteLength > MAX_SOURCE_BYTES) {
          throw new DirectoryStudioHostError('quota-exceeded', `Source file "${path}" exceeds the ${MAX_SOURCE_BYTES} byte limit.`);
        }
        return { bytes, path };
      });
      this.writing = true;
      try {
        await this.port.commitFiles(writes, disk.project.revision);
        const saved = await this.loadFromDisk();
        this.lastSavedRevision = saved.project.revision;
        return { revision: saved.project.revision, savedAt: saved.project.metadata.updatedAt };
      } finally {
        this.writing = false;
      }
    });
  }

  watchProject(listener: (event: StudioExternalChange) => void): () => void {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unwatch = this.port.watch((paths) => {
      if (!active || this.writing || !paths.some((path) => this.isProjectPath(path))) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void this.loadFromDisk().then((loaded) => {
        if (!active || loaded.project.revision === this.lastSavedRevision) {
          this.lastSavedRevision = undefined;
          return;
        }
        listener({
          kind: 'changed',
          reference: { id: this.port.id, path: this.topologyPath, revision: loaded.project.revision },
          revision: loaded.project.revision
        });
      }).catch(() => {
        if (active) listener({ kind: 'deleted', reference: { id: this.port.id, path: this.topologyPath } });
      }), 40);
    });
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      unwatch();
    };
  }

  writePreference<T>(key: string, value: T): Promise<StudioResult<void>> {
    return result(() => this.port.writePreference(key, value));
  }

  private isProjectPath(path: string): boolean {
    canonicalRelativePath(path);
    return true;
  }

  private async validatedEntries(): Promise<StudioDirectoryFileEntry[]> {
    const entries = (await this.port.listFiles()).map((entry) => ({ ...entry, path: canonicalRelativePath(entry.path) }));
    if (entries.some((entry) => entry.symbolicLink)) {
      throw new DirectoryStudioHostError('permission-denied', 'Symbolic links are not supported inside a TopoViewer directory project.');
    }
    if (entries.some((entry) => !Number.isSafeInteger(entry.size) || entry.size < 0 || entry.size > studioSecurityLimits.assetBytes)) {
      throw new DirectoryStudioHostError('quota-exceeded', 'A directory project file exceeds the per-file host limit.');
    }
    const bytes = entries.reduce((total, entry) => total + entry.size, 0);
    if (entries.length > MAX_PROJECT_FILES || bytes > MAX_PROJECT_BYTES) {
      throw new DirectoryStudioHostError('quota-exceeded', 'The directory project exceeds the 256-file or 25 MiB host limit.');
    }
    return entries;
  }

  private async loadFromDisk(): Promise<StudioLoadResult> {
    const entries = await this.validatedEntries();
    const byPath = new Map(entries.map((entry) => [entry.path, entry]));
    if (!byPath.has(this.topologyPath) || !byPath.has(this.stylesheetPath)) {
      throw new DirectoryStudioHostError('not-found', 'The directory project must contain topology and stylesheet YAML files.');
    }
    const topologyText = decodeSource(this.topologyPath, await this.port.readFile(this.topologyPath));
    const stylesheetText = decodeSource(this.stylesheetPath, await this.port.readFile(this.stylesheetPath));
    const mapperText = this.mapperPath && byPath.has(this.mapperPath)
      ? decodeSource(this.mapperPath, await this.port.readFile(this.mapperPath))
      : undefined;
    const sourcePaths = new Set([this.topologyPath, this.stylesheetPath, this.mapperPath].filter(Boolean));
    const assetContent = await Promise.all(entries
      .filter((entry) => !sourcePaths.has(entry.path))
      .map(async (entry) => {
        const bytes = await this.port.readFile(entry.path);
        return validateStudioAssetContent({
          bytes,
          mediaType: entry.mediaType || mediaTypeForPath(entry.path),
          name: entry.path
        }, { allowMediaTypeSniffing: true });
      }));
    const assets = assetContent.map((asset) => ({
      contentHash: `fnv1a-${stableHash(asset.bytes)}`,
      mediaType: asset.mediaType,
      path: asset.name,
      size: asset.bytes.byteLength
    }));
    const updatedAt = entries
      .map((entry) => entry.modifiedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) || this.createdAt;
    const project: StudioProject = {
      assets,
      documents: {
        topology: sourceDocument('topology', this.topologyPath, topologyText),
        stylesheet: sourceDocument('stylesheet', this.stylesheetPath, stylesheetText),
        ...(mapperText !== undefined && this.mapperPath
          ? { mapper: sourceDocument('mapper', this.mapperPath, mapperText) }
          : {})
      },
      id: this.port.id,
      metadata: { createdAt: this.createdAt, profileVersion: 1, schemaVersion: 1, updatedAt },
      name: this.port.name,
      revision: ''
    };
    project.revision = this.port.readRevision
      ? await this.port.readRevision()
      : revisionFor(project);
    validateStudioProjectEnvelope(project, assetContent);
    const recovery = await this.port.readRecovery();
    return {
      project,
      ...(recovery && recovery.project.id === project.id && recovery.capturedAt > project.metadata.updatedAt
        ? { recovery }
        : {})
    };
  }
}
