import type { TopoDocument } from 'topoviewer';

export type StudioDocumentKind = 'topology' | 'stylesheet' | 'mapper';
export type StudioProjectStatus = 'saved' | 'modified' | 'saving' | 'invalid-draft' | 'conflict' | 'recovery';

export interface StudioSourceDocument {
  kind: StudioDocumentKind;
  path: string;
  text: string;
  contentHash: string;
}

export interface StudioAsset {
  contentHash: string;
  mediaType: string;
  path: string;
  size: number;
}

export interface StudioProjectMetadata {
  createdAt: string;
  profileVersion: number;
  schemaVersion: number;
  updatedAt: string;
}

export interface StudioProject {
  assets: StudioAsset[];
  documents: Partial<Record<StudioDocumentKind, StudioSourceDocument>> & {
    topology: StudioSourceDocument;
    stylesheet: StudioSourceDocument;
  };
  id: string;
  metadata: StudioProjectMetadata;
  name: string;
  revision: string;
}

export type StudioSelectionKind = 'graph' | 'layer' | 'node' | 'link' | 'linkDirection' | 'path' | 'region' | 'shape' | 'callout' | 'text';

export interface StudioSelection {
  id: string;
  kind: StudioSelectionKind;
}

export interface StudioDiagnostic {
  code: string;
  column?: number;
  document: StudioDocumentKind;
  endColumn?: number;
  endLine?: number;
  line?: number;
  message: string;
  path?: Array<string | number>;
  severity: 'error' | 'warning' | 'info';
}

export interface StudioInvalidDraft {
  diagnostics: StudioDiagnostic[];
  document: StudioDocumentKind;
  text: string;
}

export interface StudioValidProjection {
  diagnostics: StudioDiagnostic[];
  document: TopoDocument;
  sourceRevision: string;
}

export interface StudioSessionSnapshot {
  invalidDrafts: Partial<Record<StudioDocumentKind, StudioInvalidDraft>>;
  project: StudioProject;
  projection: StudioValidProjection;
  selection: StudioSelection[];
  status: StudioProjectStatus;
}

export interface StudioRecoverySnapshot {
  capturedAt: string;
  invalidDrafts?: Partial<Record<StudioDocumentKind, StudioInvalidDraft>>;
  project: StudioProject;
  reason: 'autosave' | 'before-migration' | 'before-reload' | 'crash-recovery';
  sourceRevision: string;
  stylesheetCandidate?: StudioStylesheetCandidateRecovery;
}

export interface StudioStylesheetCandidateRecovery {
  appliedSourceRevision: string;
  candidateText: string;
  capturedAt: string;
  mode: 'basic' | 'yaml';
}

export interface StudioProjectMigration {
  fromVersion: number;
  id: string;
  migrate(project: StudioProject): StudioProject;
  toVersion: number;
}
