import type {
  StudioDiagnostic,
  StudioDocumentKind,
  StudioSessionSnapshot,
  StudioSourceDocument
} from '../contracts/project';
import type { LineCounter, Node, parseDocument } from 'yaml';

export type StudioYamlPath = Array<string | number>;

export interface ParsedStudioSource {
  document: ReturnType<typeof parseDocument>;
  kind: StudioDocumentKind;
  lineCounter: LineCounter;
  lineEnding: '\n' | '\r\n';
  rangedNodes: Node[];
  text: string;
  value: Record<string, unknown>;
}

export interface StudioSourceRange {
  column: number;
  endColumn: number;
  endLine: number;
  endOffset: number;
  line: number;
  startOffset: number;
}

export interface StudioSourceLocation {
  document: StudioDocumentKind;
  path: StudioYamlPath;
}

export interface StudioNormalizationReview {
  after: string;
  before: string;
  diff: StudioNormalizationDiff;
  document: StudioDocumentKind;
  id: string;
  path: StudioYamlPath;
  reason: string;
}

export interface StudioNormalizationDiff {
  afterLines: string[];
  beforeLines: string[];
  startLine: number;
}

export interface StudioAppliedChange {
  afterText?: string;
  beforeText?: string;
  document: StudioDocumentKind;
  path?: StudioYamlPath;
  sourceRevision: string;
}

export type StudioSessionUpdateResult =
  | { change: StudioAppliedChange; snapshot: StudioSessionSnapshot; status: 'applied' }
  | { diagnostics: StudioDiagnostic[]; snapshot: StudioSessionSnapshot; status: 'invalid' }
  | { review: StudioNormalizationReview; snapshot: StudioSessionSnapshot; status: 'normalization-required' };

export interface StudioDocumentSession {
  createDocument(document: StudioSourceDocument): StudioSessionUpdateResult;
  confirmNormalization(reviewId: string): StudioSessionUpdateResult;
  discardInvalidDraft(document: StudioDocumentKind): void;
  insertValue(document: StudioDocumentKind, path: StudioYamlPath, value: unknown): StudioSessionUpdateResult;
  markSaved(revision: string, savedAt: string): void;
  moveSequenceValue(
    document: StudioDocumentKind,
    path: StudioYamlPath,
    from: number,
    to: number
  ): StudioSessionUpdateResult;
  parsedSource(document: StudioDocumentKind): ParsedStudioSource | undefined;
  rebaseRevision(revision: string): void;
  removeValue(
    document: StudioDocumentKind,
    path: StudioYamlPath,
    scopePath: StudioYamlPath
  ): StudioSessionUpdateResult;
  removeDocument(document: StudioDocumentKind): StudioSessionUpdateResult;
  replaceDraft(document: StudioDocumentKind, text: string): StudioSessionUpdateResult;
  restore(snapshot: StudioSessionSnapshot): void;
  semanticIdForPath(document: StudioDocumentKind, path: StudioYamlPath): string | undefined;
  setValue(document: StudioDocumentKind, path: StudioYamlPath, value: unknown): StudioSessionUpdateResult;
  snapshot(): StudioSessionSnapshot;
  setSelection(selection: StudioSessionSnapshot['selection']): void;
  setStatus(status: StudioSessionSnapshot['status']): void;
  setValues(
    document: StudioDocumentKind,
    edits: Array<{ path: StudioYamlPath; value: unknown }>
  ): StudioSessionUpdateResult;
  sourcePathForSelection(selection: { id: string; kind: string }): StudioSourceLocation | undefined;
  sourcePathAtOffset(document: StudioDocumentKind, offset: number): StudioYamlPath | undefined;
  sourceRange(document: StudioDocumentKind, path: StudioYamlPath): StudioSourceRange | undefined;
  sourceValue(document: StudioDocumentKind): Record<string, unknown> | undefined;
  upsertValue(
    document: StudioDocumentKind,
    path: StudioYamlPath,
    value: unknown,
    scopePath: StudioYamlPath
  ): StudioSessionUpdateResult;
}
