import type { StudioCommandDispatcher, StudioCommandDispatcherOptions, StudioCommandPlan, StudioCommandResult, StudioCommandState, StudioSourceChange, StudioTransactionRecord } from '../contracts/commands';
import type { StudioSessionSnapshot } from '../contracts/project';
import type { StudioDocumentSession, StudioNormalizationReview } from '../session';

interface HistoryEntry {
  afterSnapshot: StudioSessionSnapshot;
  beforeSnapshot: StudioSessionSnapshot;
  commandIds: string[];
  committedAt: string;
  coalescingKey?: string;
  estimatedBytes: number;
  id: string;
  summary: string;
}

interface ActiveTransaction {
  beforeSnapshot: StudioSessionSnapshot;
  commandIds: string[];
  id: string;
  summary: string;
}

export class StudioCommandExecutionError extends Error {
  readonly review?: StudioNormalizationReview;

  constructor(message: string, review?: StudioNormalizationReview) {
    super(message);
    this.name = 'StudioCommandExecutionError';
    this.review = review;
  }
}

function commandState(snapshot: StudioSessionSnapshot): StudioCommandState {
  return {
    project: structuredClone(snapshot.project),
    selection: structuredClone(snapshot.selection)
  };
}

function sourceChanges(before: StudioSessionSnapshot, after: StudioSessionSnapshot): StudioSourceChange[] {
  return (['topology', 'stylesheet', 'mapper'] as const).flatMap((document) => {
    const beforeText = before.project.documents[document]?.text;
    const afterText = after.project.documents[document]?.text;
    return beforeText !== afterText
      ? [
          {
            after: afterText,
            before: beforeText,
            document,
            operation: beforeText === undefined ? ('create' as const) : afterText === undefined ? ('remove' as const) : ('update' as const)
          }
        ]
      : [];
  });
}

function estimatedSnapshotBytes(snapshot: StudioSessionSnapshot): number {
  const sourceBytes = (['topology', 'stylesheet', 'mapper'] as const).reduce((total, kind) => total + (snapshot.project.documents[kind]?.text.length || 0) * 2, 0);
  return sourceBytes + snapshot.project.assets.reduce((total, asset) => total + asset.size, 0) + 512;
}

function transactionRecord(entry: HistoryEntry): StudioTransactionRecord {
  return {
    after: commandState(entry.afterSnapshot),
    before: commandState(entry.beforeSnapshot),
    commandIds: [...entry.commandIds],
    committedAt: entry.committedAt,
    id: entry.id,
    summary: entry.summary
  };
}

export function createStudioCommandDispatcher(session: StudioDocumentSession, options: StudioCommandDispatcherOptions = {}): StudioCommandDispatcher {
  const clock = options.clock || (() => new Date().toISOString());
  const maxBytes = options.maxBytes ?? 8 * 1024 * 1024;
  const maxEntries = options.maxEntries ?? 100;
  const undoEntries: HistoryEntry[] = [];
  const redoEntries: HistoryEntry[] = [];
  let active: ActiveTransaction | undefined;
  let sequence = 0;

  function entry(before: StudioSessionSnapshot, after: StudioSessionSnapshot, commandIds: string[], summary: string, coalescingKey?: string, id?: string): HistoryEntry {
    return {
      afterSnapshot: after,
      beforeSnapshot: before,
      commandIds: [...commandIds],
      committedAt: clock(),
      coalescingKey,
      estimatedBytes: estimatedSnapshotBytes(before) + estimatedSnapshotBytes(after),
      id: id || `transaction-${++sequence}`,
      summary
    };
  }

  function totalBytes() {
    return [...undoEntries, ...redoEntries].reduce((total, item) => total + item.estimatedBytes, 0);
  }

  function trimHistory() {
    while (undoEntries.length > maxEntries) undoEntries.shift();
    while (undoEntries.length > 0 && totalBytes() > maxBytes) undoEntries.shift();
  }

  function applyPlan(plan: StudioCommandPlan) {
    if (plan.mutations.length > 1 && plan.mutations.every((mutation) => mutation.kind === 'replace-source')) {
      const replacements = Object.fromEntries(plan.mutations.map((mutation) => [mutation.document, mutation.kind === 'replace-source' ? mutation.text : '']));
      const result = session.replaceDrafts(replacements);
      if (result.status !== 'applied') {
        const detail = result.status === 'invalid' ? result.diagnostics.map((diagnostic) => diagnostic.message).join('; ') : result.review.reason;
        throw new StudioCommandExecutionError(detail || 'Source batch failed validation.', result.status === 'normalization-required' ? result.review : undefined);
      }
      if (plan.selection) session.setSelection(plan.selection);
      return;
    }
    for (let index = 0; index < plan.mutations.length;) {
      const mutation = plan.mutations[index];
      let batchEnd = index;
      if (mutation.kind === 'set-value') {
        while (batchEnd < plan.mutations.length && plan.mutations[batchEnd].kind === 'set-value' && plan.mutations[batchEnd].document === mutation.document) batchEnd += 1;
      }
      const batch = plan.mutations.slice(index, batchEnd);
      let result;
      if (mutation.kind === 'create-document') {
        result = session.createDocument({
          contentHash: '',
          kind: mutation.document,
          path: mutation.path,
          text: mutation.text
        });
      } else if (mutation.kind === 'remove-document') {
        result = session.removeDocument(mutation.document);
      } else if (mutation.kind === 'set-value' && batch.length > 1) {
        result = session.setValues(
          mutation.document,
          batch.map((candidate) => ({
            path: candidate.kind === 'set-value' ? candidate.path : [],
            value: candidate.kind === 'set-value' ? candidate.value : undefined
          }))
        );
      } else if (mutation.kind === 'set-value') {
        result = session.setValue(mutation.document, mutation.path, mutation.value);
      } else if (mutation.kind === 'insert-value') {
        result = session.insertValue(mutation.document, mutation.path, mutation.value);
      } else if (mutation.kind === 'move-sequence-value') {
        result = session.moveSequenceValue(mutation.document, mutation.path, mutation.from, mutation.to);
      } else if (mutation.kind === 'upsert-value') {
        result = session.upsertValue(mutation.document, mutation.path, mutation.value, mutation.scopePath);
      } else if (mutation.kind === 'remove-value') {
        result = session.removeValue(mutation.document, mutation.path, mutation.scopePath);
      } else {
        result = session.replaceDraft(mutation.document, mutation.text);
      }
      if (result.status !== 'applied') {
        const detail = result.status === 'invalid' ? result.diagnostics.map((diagnostic) => diagnostic.message).join('; ') : result.review.reason;
        throw new StudioCommandExecutionError(detail || `Command mutation for ${mutation.document} failed.`, result.status === 'normalization-required' ? result.review : undefined);
      }
      index += batch.length > 1 ? batch.length : 1;
    }
    if (plan.selection) session.setSelection(plan.selection);
  }

  function addHistory(next: HistoryEntry) {
    const previous = undoEntries.at(-1);
    if (next.coalescingKey && previous?.coalescingKey === next.coalescingKey) {
      previous.afterSnapshot = next.afterSnapshot;
      previous.estimatedBytes = estimatedSnapshotBytes(previous.beforeSnapshot) + estimatedSnapshotBytes(next.afterSnapshot);
      previous.commandIds.push(...next.commandIds);
      previous.committedAt = next.committedAt;
      previous.summary = next.summary;
    } else {
      undoEntries.push(next);
    }
    redoEntries.length = 0;
    trimHistory();
  }

  function requireNoActiveHistoryAction(action: string) {
    if (active) throw new StudioCommandExecutionError(`Cannot ${action} while transaction ${active.id} is active.`);
  }

  return {
    beginTransaction(id, summary) {
      if (active) throw new StudioCommandExecutionError(`Transaction ${active.id} is already active.`);
      active = {
        beforeSnapshot: session.snapshot(),
        commandIds: [],
        id,
        summary
      };
    },
    canRedo: () => !active && redoEntries.length > 0,
    canUndo: () => !active && undoEntries.length > 0,
    cancelActiveTransaction() {
      if (!active) return;
      session.restore(active.beforeSnapshot);
      active = undefined;
    },
    commitActiveTransaction() {
      if (!active) return undefined;
      const transaction = active;
      active = undefined;
      if (transaction.commandIds.length === 0) return undefined;
      const next = entry(transaction.beforeSnapshot, session.snapshot(), transaction.commandIds, transaction.summary, undefined, transaction.id);
      addHistory(next);
      return transactionRecord(next);
    },
    dispatch(command) {
      const before = session.snapshot();
      let plan: StudioCommandPlan;
      try {
        plan = command.execute(commandState(before));
        applyPlan(plan);
      } catch (error) {
        session.restore(before);
        throw error instanceof StudioCommandExecutionError ? error : new StudioCommandExecutionError(error instanceof Error ? error.message : String(error));
      }
      const after = session.snapshot();
      const changes = sourceChanges(before, after);
      if (active) active.commandIds.push(command.id);
      else addHistory(entry(before, after, [command.id], plan.summary, command.coalescingKey));
      return {
        changes,
        selection: [...after.selection],
        state: commandState(after),
        summary: plan.summary
      } satisfies StudioCommandResult;
    },
    historyState: () => ({
      estimatedBytes: totalBytes(),
      redoEntries: redoEntries.length,
      undoEntries: undoEntries.length
    }),
    historyEntries: () => [
      ...[...undoEntries].reverse().map(({ beforeSnapshot, afterSnapshot, commandIds, committedAt, id, summary }) => ({
        commandIds: [...commandIds],
        committedAt,
        documents: sourceChanges(beforeSnapshot, afterSnapshot).map((change) => change.document),
        id,
        state: 'undo' as const,
        summary
      })),
      ...[...redoEntries].reverse().map(({ beforeSnapshot, afterSnapshot, commandIds, committedAt, id, summary }) => ({
        commandIds: [...commandIds],
        committedAt,
        documents: sourceChanges(beforeSnapshot, afterSnapshot).map((change) => change.document),
        id,
        state: 'redo' as const,
        summary
      }))
    ],
    recoveryState: () => ({
      redo: redoEntries.map(({ commandIds, summary }) => ({
        commandIds: [...commandIds],
        summary
      })),
      snapshot: session.snapshot(),
      undo: undoEntries.map(({ commandIds, summary }) => ({
        commandIds: [...commandIds],
        summary
      }))
    }),
    redo() {
      requireNoActiveHistoryAction('redo');
      const next = redoEntries.pop();
      if (!next) return undefined;
      session.restore(next.afterSnapshot);
      undoEntries.push(next);
      return transactionRecord(next);
    },
    undo() {
      requireNoActiveHistoryAction('undo');
      const next = undoEntries.pop();
      if (!next) return undefined;
      session.restore(next.beforeSnapshot);
      redoEntries.push(next);
      return transactionRecord(next);
    }
  };
}
