import type { StudioDocumentKind, StudioProject, StudioSelection, StudioSessionSnapshot } from './project';

export interface StudioSourceChange {
  after?: string;
  before?: string;
  document: StudioDocumentKind;
  operation: 'create' | 'update' | 'remove';
}

export interface StudioCommandState {
  project: StudioProject;
  selection: StudioSelection[];
}

export interface StudioCommandResult {
  changes: StudioSourceChange[];
  selection: StudioSelection[];
  state: StudioCommandState;
  summary: string;
}

export type StudioSourceMutation =
  | {
      document: StudioDocumentKind;
      kind: 'create-document';
      path: string;
      text: string;
    }
  | {
      document: StudioDocumentKind;
      kind: 'remove-document';
    }
  | {
      document: StudioDocumentKind;
      kind: 'set-value';
      path: Array<string | number>;
      value: unknown;
    }
  | {
      document: StudioDocumentKind;
      kind: 'insert-value';
      path: Array<string | number>;
      value: unknown;
    }
  | {
      document: StudioDocumentKind;
      from: number;
      kind: 'move-sequence-value';
      path: Array<string | number>;
      to: number;
    }
  | {
      document: StudioDocumentKind;
      kind: 'upsert-value';
      path: Array<string | number>;
      scopePath: Array<string | number>;
      value: unknown;
    }
  | {
      document: StudioDocumentKind;
      kind: 'remove-value';
      path: Array<string | number>;
      scopePath: Array<string | number>;
    }
  | {
      document: StudioDocumentKind;
      kind: 'replace-source';
      text: string;
    };

export interface StudioCommandPlan {
  mutations: StudioSourceMutation[];
  selection?: StudioSelection[];
  summary: string;
}

export interface StudioCommand {
  readonly coalescingKey?: string;
  readonly id: string;
  readonly label: string;
  execute(state: StudioCommandState): StudioCommandPlan;
}

export interface StudioTransactionRecord {
  after: StudioCommandState;
  before: StudioCommandState;
  commandIds: string[];
  committedAt: string;
  id: string;
  summary: string;
}

export interface StudioCommandDispatcher {
  beginTransaction(id: string, summary: string): void;
  canRedo(): boolean;
  canUndo(): boolean;
  cancelActiveTransaction(): void;
  commitActiveTransaction(): StudioTransactionRecord | undefined;
  dispatch(command: StudioCommand): StudioCommandResult;
  historyState(): StudioHistoryState;
  historyEntries(): StudioHistoryEntry[];
  recoveryState(): StudioCommandRecoveryState;
  redo(): StudioTransactionRecord | undefined;
  undo(): StudioTransactionRecord | undefined;
}

export interface StudioHistoryEntry {
  commandIds: string[];
  committedAt: string;
  documents: StudioDocumentKind[];
  id: string;
  state: 'redo' | 'undo';
  summary: string;
}

export interface StudioCommandDispatcherOptions {
  clock?: () => string;
  maxBytes?: number;
  maxEntries?: number;
}

export interface StudioHistoryState {
  estimatedBytes: number;
  redoEntries: number;
  undoEntries: number;
}

export interface StudioCommandRecoveryState {
  redo: Array<{ commandIds: string[]; summary: string }>;
  snapshot: StudioSessionSnapshot;
  undo: Array<{ commandIds: string[]; summary: string }>;
}
