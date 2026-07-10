import type { StudioAssetContent, StudioHostErrorCode, StudioProjectSummary, StudioSaveRequest, StudioSaveResult } from '../contracts/host';
import type { StudioProject, StudioRecoverySnapshot } from '../contracts/project';
import { stableProjectSourceRevision, stableTextHash } from '../session/hash';
import { currentStudioProjectSchemaVersion, migrateStudioProject } from './projectMigrations';

const databaseVersion = 2;

export const browserProjectStoreNames = {
  assets: 'assets',
  projects: 'projects',
  recoveries: 'recoveries'
} as const;

interface StoredProjectRecord {
  id: string;
  openedAt: string;
  project: StudioProject;
  updatedAt: string;
}

interface StoredAssetRecord {
  bytes: Uint8Array;
  id: string;
  mediaType: string;
  name: string;
  projectId: string;
}

interface StoredRecoveryRecord {
  capturedAt: string;
  id: string;
  projectId: string;
  snapshot: StudioRecoverySnapshot;
}

export interface BrowserProjectStoreOptions {
  beforeCommit?: (operation: string) => void;
  databaseName?: string;
  indexedDB?: IDBFactory;
  now?: () => string;
  recoveryLimit?: number;
}

export class BrowserProjectStoreError extends Error {
  readonly code: StudioHostErrorCode;
  readonly retryable: boolean;

  constructor(code: StudioHostErrorCode, message: string, retryable = false) {
    super(message);
    this.name = 'BrowserProjectStoreError';
    this.code = code;
    this.retryable = retryable;
  }
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error || new DOMException('IndexedDB transaction aborted.', 'AbortError'));
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed.'));
  });
}

function mappedError(error: unknown, operation: string): BrowserProjectStoreError {
  if (error instanceof BrowserProjectStoreError) return error;
  if (error instanceof DOMException) {
    if (error.name === 'QuotaExceededError') {
      return new BrowserProjectStoreError('quota-exceeded', `Cannot ${operation}: browser storage quota is exhausted.`, true);
    }
    if (error.name === 'AbortError' || error.name === 'InvalidStateError' || error.name === 'UnknownError') {
      return new BrowserProjectStoreError('unavailable', `Cannot ${operation}: the browser storage transaction did not complete.`, true);
    }
  }
  return new BrowserProjectStoreError(
    'unknown',
    `Cannot ${operation}: ${error instanceof Error ? error.message : String(error)}`,
    true
  );
}

function documentIsValid(value: unknown, kind: 'topology' | 'stylesheet'): boolean {
  if (!value || typeof value !== 'object') return false;
  const document = value as Record<string, unknown>;
  return document.kind === kind && typeof document.path === 'string' && typeof document.text === 'string';
}

function projectIsValid(value: unknown, allowLegacy = false): value is StudioProject {
  if (!value || typeof value !== 'object') return false;
  const project = value as Partial<StudioProject>;
  const schemaVersion = Number(project.metadata?.schemaVersion);
  return typeof project.id === 'string'
    && Boolean(project.id)
    && typeof project.name === 'string'
    && typeof project.revision === 'string'
    && Array.isArray(project.assets)
    && !!project.documents
    && documentIsValid(project.documents.topology, 'topology')
    && documentIsValid(project.documents.stylesheet, 'stylesheet')
    && !!project.metadata
    && typeof project.metadata.createdAt === 'string'
    && typeof project.metadata.updatedAt === 'string'
    && Number.isInteger(schemaVersion)
    && (allowLegacy ? schemaVersion >= 0 : schemaVersion === currentStudioProjectSchemaVersion);
}

function withContentHashes(project: StudioProject): StudioProject {
  const documents = Object.fromEntries(Object.entries(project.documents).map(([kind, document]) => [
    kind,
    document ? { ...document, contentHash: `fnv1a-${stableTextHash(document.text)}` } : document
  ])) as StudioProject['documents'];
  return structuredClone({ ...project, documents });
}

function nextRevision(project: StudioProject, savedAt: string): string {
  return `browser-${stableTextHash(`${project.id}\u0000${stableProjectSourceRevision(project)}\u0000${savedAt}`)}`;
}

function recoveryRecord(snapshot: StudioRecoverySnapshot): StoredRecoveryRecord {
  return {
    capturedAt: snapshot.capturedAt,
    id: `${snapshot.project.id}\u0000${snapshot.capturedAt}\u0000${snapshot.sourceRevision}`,
    projectId: snapshot.project.id,
    snapshot: structuredClone(snapshot)
  };
}

export class BrowserProjectStore {
  private readonly beforeCommit?: BrowserProjectStoreOptions['beforeCommit'];
  private database?: Promise<IDBDatabase>;
  private readonly databaseName: string;
  private readonly factory: IDBFactory;
  private readonly now: () => string;
  private readonly recoveryLimit: number;

  constructor(options: BrowserProjectStoreOptions = {}) {
    this.beforeCommit = options.beforeCommit;
    this.databaseName = options.databaseName || 'topoviewer-studio';
    this.factory = options.indexedDB || globalThis.indexedDB;
    this.now = options.now || (() => new Date().toISOString());
    this.recoveryLimit = Math.max(1, Math.floor(options.recoveryLimit || 5));
    if (!this.factory) throw new BrowserProjectStoreError('unsupported', 'IndexedDB is not available in this browser.');
  }

  private open(): Promise<IDBDatabase> {
    if (this.database) return this.database;
    this.database = new Promise((resolve, reject) => {
      const request = this.factory.open(this.databaseName, databaseVersion);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(browserProjectStoreNames.projects)) {
          database.createObjectStore(browserProjectStoreNames.projects, { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains(browserProjectStoreNames.assets)) {
          database.createObjectStore(browserProjectStoreNames.assets, { keyPath: 'id' });
        }
        if (!database.objectStoreNames.contains(browserProjectStoreNames.recoveries)) {
          database.createObjectStore(browserProjectStoreNames.recoveries, { keyPath: 'id' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(mappedError(request.error, 'open Studio storage'));
      request.onblocked = () => reject(new BrowserProjectStoreError(
        'unavailable',
        'Cannot open Studio storage while another tab is upgrading it.',
        true
      ));
    });
    return this.database;
  }

  private async readRecord(projectId: string): Promise<StoredProjectRecord> {
    try {
      const database = await this.open();
      const transaction = database.transaction(browserProjectStoreNames.projects, 'readonly');
      const result = await requestResult(transaction.objectStore(browserProjectStoreNames.projects).get(projectId));
      await transactionDone(transaction);
      if (!result) throw new BrowserProjectStoreError('not-found', `Project "${projectId}" does not exist.`);
      const record = result as StoredProjectRecord;
      if (!projectIsValid(record.project, true)) {
        throw new BrowserProjectStoreError('corrupt-data', `Project "${projectId}" is corrupt and was not opened.`);
      }
      return record;
    } catch (error) {
      throw mappedError(error, 'load the project');
    }
  }

  private commit(transaction: IDBTransaction, operation: string): Promise<void> {
    try {
      this.beforeCommit?.(operation);
    } catch (error) {
      transaction.abort();
      return Promise.reject(mappedError(error, operation));
    }
    return transactionDone(transaction).catch((error) => Promise.reject(mappedError(error, operation)));
  }

  async createProject(
    project: StudioProject,
    options: { allowLegacy?: boolean; assets?: StudioAssetContent[] } = {}
  ): Promise<void> {
    if (!projectIsValid(project, options.allowLegacy)) {
      throw new BrowserProjectStoreError('invalid-request', 'The project does not match the supported Studio project schema.');
    }
    try {
      const database = await this.open();
      const transaction = database.transaction(
        [browserProjectStoreNames.projects, browserProjectStoreNames.assets],
        'readwrite'
      );
      const now = this.now();
      transaction.objectStore(browserProjectStoreNames.projects).add({
        id: project.id,
        openedAt: now,
        project: withContentHashes(project),
        updatedAt: project.metadata.updatedAt
      } satisfies StoredProjectRecord);
      const assetStore = transaction.objectStore(browserProjectStoreNames.assets);
      (options.assets || []).forEach((asset) => assetStore.put({
        bytes: Uint8Array.from(asset.bytes),
        id: `${project.id}\u0000${asset.name}`,
        mediaType: asset.mediaType,
        name: asset.name,
        projectId: project.id
      } satisfies StoredAssetRecord));
      await this.commit(transaction, 'create the project');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'ConstraintError') {
        throw new BrowserProjectStoreError('conflict', `Project "${project.id}" already exists.`);
      }
      throw mappedError(error, 'create the project');
    }
  }

  async loadProject(projectId: string): Promise<StudioProject> {
    const record = await this.readRecord(projectId);
    const schemaVersion = record.project.metadata.schemaVersion;
    if (schemaVersion > currentStudioProjectSchemaVersion) {
      throw new BrowserProjectStoreError(
        'unsupported',
        `Project "${projectId}" uses schema ${schemaVersion}; this Studio supports ${currentStudioProjectSchemaVersion}.`
      );
    }
    if (schemaVersion < currentStudioProjectSchemaVersion) {
      const snapshot: StudioRecoverySnapshot = {
        capturedAt: this.now(),
        project: structuredClone(record.project),
        reason: 'before-migration',
        sourceRevision: stableProjectSourceRevision(withContentHashes(record.project))
      };
      await this.saveRecovery(snapshot);
      const migrated = migrateStudioProject(record.project).project;
      migrated.metadata.updatedAt = this.now();
      const saved = await this.saveProject({ expectedRevision: record.project.revision, project: migrated }, true);
      migrated.revision = saved.revision;
      return migrated;
    }
    await this.touchProject(record);
    return structuredClone(record.project);
  }

  private async touchProject(record: StoredProjectRecord): Promise<void> {
    try {
      const database = await this.open();
      const transaction = database.transaction(browserProjectStoreNames.projects, 'readwrite');
      transaction.objectStore(browserProjectStoreNames.projects).put({ ...record, openedAt: this.now() });
      await this.commit(transaction, 'record recent project access');
    } catch (error) {
      throw mappedError(error, 'record recent project access');
    }
  }

  async saveProject(request: StudioSaveRequest, allowLegacy = false): Promise<StudioSaveResult> {
    if (!projectIsValid(request.project, allowLegacy)) {
      throw new BrowserProjectStoreError('invalid-request', 'The project does not match the supported Studio project schema.');
    }
    try {
      const existing = await this.readRecord(request.project.id);
      if (request.expectedRevision && request.expectedRevision !== existing.project.revision) {
        throw new BrowserProjectStoreError('conflict', 'The project changed after it was opened. Reload or inspect the conflict before saving.');
      }
      const savedAt = this.now();
      const project = withContentHashes(request.project);
      project.metadata.updatedAt = savedAt;
      project.revision = nextRevision(project, savedAt);
      const database = await this.open();
      const transaction = database.transaction(browserProjectStoreNames.projects, 'readwrite');
      transaction.objectStore(browserProjectStoreNames.projects).put({
        ...existing,
        openedAt: savedAt,
        project,
        updatedAt: savedAt
      } satisfies StoredProjectRecord);
      await this.commit(transaction, 'save the project');
      return { revision: project.revision, savedAt };
    } catch (error) {
      throw mappedError(error, 'save the project');
    }
  }

  async listProjects(): Promise<StudioProjectSummary[]> {
    try {
      const database = await this.open();
      const transaction = database.transaction(browserProjectStoreNames.projects, 'readonly');
      const records = await requestResult(transaction.objectStore(browserProjectStoreNames.projects).getAll()) as StoredProjectRecord[];
      await transactionDone(transaction);
      return records.flatMap((record) => projectIsValid(record.project, true) ? [{
        id: record.project.id,
        name: record.project.name,
        openedAt: record.openedAt,
        revision: record.project.revision,
        updatedAt: record.updatedAt
      }] : []).sort((left, right) => right.openedAt.localeCompare(left.openedAt) || left.name.localeCompare(right.name));
    } catch (error) {
      throw mappedError(error, 'list browser projects');
    }
  }

  async saveRecovery(snapshot: StudioRecoverySnapshot): Promise<void> {
    if (!projectIsValid(snapshot.project, true)) {
      throw new BrowserProjectStoreError('invalid-request', 'The recovery snapshot contains an invalid project.');
    }
    try {
      const database = await this.open();
      const transaction = database.transaction(browserProjectStoreNames.recoveries, 'readwrite');
      const store = transaction.objectStore(browserProjectStoreNames.recoveries);
      const existing = await requestResult(store.getAll()) as StoredRecoveryRecord[];
      const next = recoveryRecord(snapshot);
      store.put(next);
      const retained = [...existing.filter((record) => record.projectId === snapshot.project.id), next]
        .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt) || right.id.localeCompare(left.id));
      retained.slice(this.recoveryLimit).forEach((record) => store.delete(record.id));
      await this.commit(transaction, 'save project recovery');
    } catch (error) {
      throw mappedError(error, 'save project recovery');
    }
  }

  async recoverySnapshots(projectId: string): Promise<StudioRecoverySnapshot[]> {
    try {
      const database = await this.open();
      const transaction = database.transaction(browserProjectStoreNames.recoveries, 'readonly');
      const records = await requestResult(transaction.objectStore(browserProjectStoreNames.recoveries).getAll()) as StoredRecoveryRecord[];
      await transactionDone(transaction);
      return records.filter((record) => record.projectId === projectId)
        .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt) || right.id.localeCompare(left.id))
        .map((record) => structuredClone(record.snapshot));
    } catch (error) {
      throw mappedError(error, 'load project recovery');
    }
  }

  async projectAssets(projectId: string): Promise<StudioAssetContent[]> {
    try {
      const database = await this.open();
      const transaction = database.transaction(browserProjectStoreNames.assets, 'readonly');
      const records = await requestResult(transaction.objectStore(browserProjectStoreNames.assets).getAll()) as StoredAssetRecord[];
      await transactionDone(transaction);
      return records.filter((record) => record.projectId === projectId).map((record) => ({
        bytes: Uint8Array.from(record.bytes),
        mediaType: record.mediaType,
        name: record.name
      }));
    } catch (error) {
      throw mappedError(error, 'load project assets');
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    try {
      const database = await this.open();
      const transaction = database.transaction(
        [browserProjectStoreNames.projects, browserProjectStoreNames.recoveries, browserProjectStoreNames.assets],
        'readwrite'
      );
      transaction.objectStore(browserProjectStoreNames.projects).delete(projectId);
      const recoveryStore = transaction.objectStore(browserProjectStoreNames.recoveries);
      const recoveries = await requestResult(recoveryStore.getAll()) as StoredRecoveryRecord[];
      recoveries.filter((record) => record.projectId === projectId).forEach((record) => recoveryStore.delete(record.id));
      const assetStore = transaction.objectStore(browserProjectStoreNames.assets);
      const assets = await requestResult(assetStore.getAll()) as StoredAssetRecord[];
      assets.filter((record) => record.projectId === projectId).forEach((record) => assetStore.delete(record.id));
      await this.commit(transaction, 'delete the project');
    } catch (error) {
      throw mappedError(error, 'delete the project');
    }
  }

  async reset(): Promise<void> {
    const database = await this.open();
    database.close();
    this.database = undefined;
    await new Promise<void>((resolve, reject) => {
      const request = this.factory.deleteDatabase(this.databaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(mappedError(request.error, 'reset browser project storage'));
      request.onblocked = () => reject(new BrowserProjectStoreError(
        'unavailable',
        'Close other Studio tabs before resetting browser project storage.',
        true
      ));
    });
  }
}
