import type { StudioCommandDispatcher } from '../../contracts/commands';
import type { StudioHost, StudioResult } from '../../contracts/host';
import type { StudioSessionSnapshot } from '../../contracts/project';
import {
  serializeStylesheetCandidateRecovery,
  serializeStudioSourceDraftRecovery,
  type StudioDocumentSession,
  type StudioSourceDraftController,
  type StudioStylesheetCandidateController
} from '../../session';

interface StudioProjectCapabilityOptions {
  announce(message: string): void;
  applyStylesheetCandidate(): boolean;
  dispatcher: StudioCommandDispatcher;
  host: StudioHost;
  onReload(): Promise<void>;
  refresh(): void;
  session: StudioDocumentSession;
  setError(message?: string): void;
  sourceDrafts: StudioSourceDraftController;
  stylesheetCandidate: StudioStylesheetCandidateController;
  synchronizeAfterHistory(before: StudioSessionSnapshot, after: StudioSessionSnapshot): void;
}

async function saveRecoveryBeforeReload(
  session: StudioDocumentSession,
  host: StudioHost,
  sourceDrafts: StudioSourceDraftController,
  stylesheetCandidate: StudioStylesheetCandidateController
): Promise<StudioResult<void>> {
  const current = session.snapshot();
  const candidateRecovery = serializeStylesheetCandidateRecovery(stylesheetCandidate.getSnapshot());
  const sourceDraftRecovery = serializeStudioSourceDraftRecovery(sourceDrafts.getSnapshot());
  if (current.status === 'saved' && !candidateRecovery && !sourceDraftRecovery) {
    return { ok: true, value: undefined };
  }
  return host.saveRecovery({
    capturedAt: new Date().toISOString(),
    invalidDrafts: structuredClone(current.invalidDrafts),
    project: structuredClone(current.project),
    reason: 'before-reload',
    sourceRevision: current.projection.sourceRevision,
    sourceDrafts: sourceDraftRecovery,
    stylesheetCandidate: candidateRecovery
  });
}

export function createStudioProjectCapability({
  announce,
  applyStylesheetCandidate,
  dispatcher,
  host,
  onReload,
  refresh,
  session,
  setError,
  sourceDrafts,
  stylesheetCandidate,
  synchronizeAfterHistory
}: StudioProjectCapabilityOptions) {
  return {
    canRedo: dispatcher.canRedo(),
    canUndo: dispatcher.canUndo(),
    discardInvalidDraft(document: 'topology' | 'stylesheet' | 'mapper') {
      session.discardInvalidDraft(document);
      setError(undefined);
      announce(`Reverted invalid ${document} draft`);
      refresh();
    },
    async flushRecovery() {
      const result = await saveRecoveryBeforeReload(
        session,
        host,
        sourceDrafts,
        stylesheetCandidate
      );
      if (result.ok) return true;
      setError(`Recovery save failed: ${result.error.message}`);
      announce(`Project switch blocked: ${result.error.message}`);
      return false;
    },
    historyEntries: dispatcher.historyEntries(),
    keepDraftAfterExternalChange(revision: string) {
      session.rebaseRevision(revision);
      stylesheetCandidate.acceptAppliedRevision(revision);
      setError(undefined);
      announce('Kept the Studio draft and accepted the current disk revision');
      refresh();
    },
    markExternalConflict() {
      session.setStatus('conflict');
      setError('The project changed outside Studio. Inspect the disk change, keep this draft, or reload disk.');
      announce('External project change detected');
      refresh();
    },
    redo() {
      const before = session.snapshot();
      const result = dispatcher.redo();
      if (result) {
        announce(`Redid ${result.summary}`);
        synchronizeAfterHistory(before, session.snapshot());
      }
      refresh();
    },
    reload: onReload,
    async save() {
      if (sourceDrafts.getSnapshot().dirty) {
        setError('Apply or revert the unapplied topology or mapper source before saving.');
        announce('Project save blocked by an unapplied source draft');
        return false;
      }
      if (!applyStylesheetCandidate()) return false;
      session.setStatus('saving');
      refresh();
      const current = session.snapshot();
      const result = await host.saveProject({
        expectedRevision: current.project.revision,
        project: current.project
      });
      if (!result.ok) {
        session.setStatus(result.error.code === 'conflict' ? 'conflict' : 'modified');
        const message = `Save failed: ${result.error.message}`;
        setError(message);
        announce(message);
        refresh();
        return false;
      }
      session.markSaved(result.value.revision, result.value.savedAt);
      setError(undefined);
      announce('Project saved');
      refresh();
      return true;
    },
    undo() {
      const before = session.snapshot();
      const result = dispatcher.undo();
      if (result) {
        announce(`Undid ${result.summary}`);
        synchronizeAfterHistory(before, session.snapshot());
      }
      refresh();
    }
  };
}
