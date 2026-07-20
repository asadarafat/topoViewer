import type { AuthoringEditPlan, AuthoringObjectSelection, AuthoringValueUpdate } from 'topoviewer/authoring';
import type { TopoViewerProps } from 'topoviewer';
import type { StudioSourceMutation } from '../contracts/commands';
import type { StudioHost, StudioResult } from '../contracts/host';
import type { StudioProject, StudioRecoverySnapshot, StudioSelection } from '../contracts/project';
import { createStudioDocumentSession, serializeStylesheetCandidateRecovery, type StudioDocumentSession, type StudioStylesheetCandidateController } from '../session';

export interface UseStudioControllerOptions {
  host: StudioHost;
  onReload(): Promise<void>;
  project: StudioProject;
  recovery?: StudioRecoverySnapshot;
}

export type RegionAggregateToggle = Parameters<NonNullable<TopoViewerProps['onRegionAggregateToggle']>>[0];

export function createRecoveredStudioSession(project: StudioProject, recovery?: StudioRecoverySnapshot) {
  const session = createStudioDocumentSession(project);
  const invalidDrafts = Object.values(recovery?.invalidDrafts || {}).filter(Boolean);
  if (invalidDrafts.length) {
    invalidDrafts.forEach((draft) => {
      if (draft) session.replaceDraft(draft.document, draft.text);
    });
  } else if (recovery) session.setStatus('recovery');
  return session;
}

export function createExternalChangeActions(session: StudioDocumentSession, setError: (message?: string) => void, announce: (message: string) => void, refresh: () => void, stylesheetCandidate?: StudioStylesheetCandidateController) {
  return {
    keepDraftAfterExternalChange(revision: string) {
      session.rebaseRevision(revision);
      stylesheetCandidate?.acceptAppliedRevision(revision);
      setError(undefined);
      announce('Kept the Studio draft and accepted the current disk revision');
      refresh();
    },
    markExternalConflict() {
      session.setStatus('conflict');
      setError('The project changed outside Studio. Inspect the disk change, keep this draft, or reload disk.');
      announce('External project change detected');
      refresh();
    }
  };
}

export async function saveRecoveryBeforeReload(session: StudioDocumentSession, host: StudioHost, stylesheetCandidate?: StudioStylesheetCandidateController): Promise<StudioResult<void>> {
  const current = session.snapshot();
  const candidateRecovery = stylesheetCandidate ? serializeStylesheetCandidateRecovery(stylesheetCandidate.getSnapshot()) : undefined;
  if (current.status === 'saved' && !candidateRecovery) return { ok: true, value: undefined };
  return host.saveRecovery({
    capturedAt: new Date().toISOString(),
    invalidDrafts: structuredClone(current.invalidDrafts),
    project: structuredClone(current.project),
    reason: 'before-reload',
    sourceRevision: current.projection.sourceRevision,
    stylesheetCandidate: candidateRecovery
  });
}

export function positionOf(value: unknown): { x: number; y: number } | undefined {
  if (Array.isArray(value)) {
    const x = Number(value[0]);
    const y = Number(value[1]);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined;
  }
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as { x?: unknown; y?: unknown };
  const x = Number(candidate.x);
  const y = Number(candidate.y);
  return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : undefined;
}

export function sameSelection(left: StudioSelection[], right: StudioSelection[]) {
  if (left.length !== right.length) return false;
  const leftKeys = new Set(left.map((selection) => `${selection.kind}:${selection.id}`));
  const rightKeys = new Set(right.map((selection) => `${selection.kind}:${selection.id}`));
  return leftKeys.size === rightKeys.size && [...leftKeys].every((key) => rightKeys.has(key));
}

export function uniqueSelection(selection: StudioSelection[]) {
  const unique = new Map<string, StudioSelection>();
  selection.forEach((item) => {
    const key = `${item.kind}:${item.id}`;
    if (!unique.has(key)) unique.set(key, item);
  });
  return [...unique.values()];
}

export function mutationForAuthoringUpdate(update: AuthoringValueUpdate, existing: boolean): StudioSourceMutation {
  const scalar = typeof update.value === 'string' || typeof update.value === 'number' || typeof update.value === 'boolean';
  return existing && scalar
    ? {
        document: 'topology',
        kind: 'set-value',
        path: update.path,
        value: update.value
      }
    : {
        document: 'topology',
        kind: 'upsert-value',
        path: update.path,
        scopePath: update.scopePath,
        value: update.value
      };
}

export function mutationsForAuthoringEditPlan(plan: AuthoringEditPlan, sourcePathExists: (path: Array<string | number>) => boolean, additional: StudioSourceMutation[] = []): StudioSourceMutation[] {
  return [
    ...additional,
    ...plan.updates.map((update) => mutationForAuthoringUpdate(update, sourcePathExists(update.path))),
    ...plan.removals.map((removal): StudioSourceMutation => ({
      document: 'topology',
      kind: 'remove-value',
      path: removal.path,
      scopePath: removal.scopePath
    })),
    ...plan.insertions.map((insertion): StudioSourceMutation => ({
      document: 'topology',
      kind: 'insert-value',
      path: insertion.path,
      value: insertion.value
    }))
  ];
}

export function insertionPlan(path: Array<string | number>, selection: AuthoringObjectSelection, value: Record<string, unknown>): AuthoringEditPlan {
  return {
    insertions: [{ path, selection, value }],
    removals: [],
    updates: []
  };
}
