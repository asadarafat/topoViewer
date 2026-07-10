import type { StudioProject, StudioRecoverySnapshot } from './project';

export type StudioHostKind = 'browser' | 'vscode';
export type StudioHostErrorCode =
  | 'cancelled'
  | 'conflict'
  | 'corrupt-data'
  | 'invalid-request'
  | 'not-found'
  | 'permission-denied'
  | 'quota-exceeded'
  | 'unsupported'
  | 'unavailable'
  | 'unknown';

export interface StudioHostError {
  code: StudioHostErrorCode;
  details?: Record<string, string | number | boolean | null>;
  message: string;
  retryable: boolean;
}

export type StudioResult<T> =
  | { ok: true; value: T }
  | { error: StudioHostError; ok: false };

export interface StudioProjectReference {
  id?: string;
  path?: string;
  revision?: string;
}

export interface StudioProjectSummary {
  id: string;
  name: string;
  openedAt: string;
  revision: string;
  updatedAt: string;
}

export interface StudioCreateProjectRequest {
  assets?: StudioAssetContent[];
  name?: string;
  project?: StudioProject;
}

export interface StudioDuplicateProjectRequest {
  id: string;
  name?: string;
}

export interface StudioRenameProjectRequest {
  id: string;
  name: string;
}

export interface StudioLoadResult {
  project: StudioProject;
  recovery?: StudioRecoverySnapshot;
}

export interface StudioSaveRequest {
  expectedRevision?: string;
  project: StudioProject;
}

export interface StudioSaveResult {
  revision: string;
  savedAt: string;
}

export interface StudioExternalChange {
  kind: 'changed' | 'deleted' | 'renamed';
  reference: StudioProjectReference;
  revision?: string;
}

export interface StudioAssetRequest {
  accept: string[];
  maximumBytes: number;
  multiple: boolean;
}

export interface StudioAssetContent {
  bytes: Uint8Array;
  mediaType: string;
  name: string;
}

export interface StudioAssetResult {
  assets: StudioAssetContent[];
}

export type StudioExportKind =
  | 'bundle'
  | 'files'
  | 'png'
  | 'svg'
  | 'mkdocs-snippet'
  | 'static-snippet'
  | 'grafana-bundle';

export interface StudioExportRequest {
  artifact: StudioAssetContent;
  kind: StudioExportKind;
  suggestedName: string;
}

export interface StudioHostEvent {
  category: 'lifecycle' | 'persistence' | 'export' | 'security' | 'performance';
  detail?: Record<string, string | number | boolean | null>;
  name: string;
}

export interface StudioHostCapabilities {
  directoryProjects: boolean;
}

export interface StudioHost {
  readonly capabilities: StudioHostCapabilities;
  readonly kind: StudioHostKind;
  chooseAssets?(request: StudioAssetRequest): Promise<StudioResult<StudioAssetResult>>;
  copyText(text: string): Promise<StudioResult<void>>;
  createProject(request: StudioCreateProjectRequest): Promise<StudioResult<StudioLoadResult>>;
  deleteProject(reference: StudioProjectReference): Promise<StudioResult<void>>;
  duplicateProject(request: StudioDuplicateProjectRequest): Promise<StudioResult<StudioLoadResult>>;
  exportArtifact(request: StudioExportRequest): Promise<StudioResult<void>>;
  listProjects(): Promise<StudioResult<StudioProjectSummary[]>>;
  loadProject(reference?: StudioProjectReference): Promise<StudioResult<StudioLoadResult>>;
  openProjectFolder?(): Promise<StudioResult<StudioLoadResult>>;
  readProjectAssets(reference: StudioProjectReference): Promise<StudioResult<StudioAssetContent[]>>;
  readPreference<T>(key: string): Promise<StudioResult<T | undefined>>;
  renameProject(request: StudioRenameProjectRequest): Promise<StudioResult<StudioLoadResult>>;
  resetStorage?(): Promise<StudioResult<void>>;
  report(event: StudioHostEvent): void;
  saveRecovery(snapshot: StudioRecoverySnapshot): Promise<StudioResult<void>>;
  saveProject(request: StudioSaveRequest): Promise<StudioResult<StudioSaveResult>>;
  watchProject?(listener: (event: StudioExternalChange) => void): () => void;
  writePreference<T>(key: string, value: T): Promise<StudioResult<void>>;
}
