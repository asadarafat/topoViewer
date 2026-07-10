import type {
  AuthoringEditPlan,
  AuthoringObjectSelection,
  AuthoringValueUpdate
} from 'topoviewer/authoring';
import type { TopoViewerProps } from 'topoviewer';
import type { StudioSourceMutation } from '../contracts/commands';
import type { StudioHost } from '../contracts/host';
import type { StudioProject, StudioRecoverySnapshot, StudioSelection } from '../contracts/project';
import { createStudioDocumentSession } from '../session';

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
  return left.length === right.length && left.every((selection, index) => (
    selection.id === right[index]?.id && selection.kind === right[index]?.kind
  ));
}

export function valueAtNestedPath(path: string[], value: unknown): Record<string, unknown> {
  return path.reduceRight<Record<string, unknown>>((nested, segment, index) => ({
    [segment]: index === path.length - 1 ? value : nested
  }), {});
}

export function mutationForAuthoringUpdate(update: AuthoringValueUpdate, existing: boolean): StudioSourceMutation {
  const scalar = typeof update.value === 'string' || typeof update.value === 'number' || typeof update.value === 'boolean';
  return existing && scalar
    ? { document: 'topology', kind: 'set-value', path: update.path, value: update.value }
    : {
        document: 'topology', kind: 'upsert-value', path: update.path,
        scopePath: update.scopePath, value: update.value
      };
}

export function insertionPlan(
  path: Array<string | number>,
  selection: AuthoringObjectSelection,
  value: Record<string, unknown>
): AuthoringEditPlan {
  return { insertions: [{ path, selection, value }], removals: [], updates: [] };
}
