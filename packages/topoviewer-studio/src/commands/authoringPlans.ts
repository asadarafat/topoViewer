import type { AuthoringEditPlan, AuthoringObjectSelection, AuthoringValueUpdate } from 'topoviewer/authoring';
import type { StudioSourceMutation } from '../contracts/commands';

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

export function mutationsForAuthoringEditPlan(
  plan: AuthoringEditPlan,
  sourcePathExists: (path: Array<string | number>) => boolean,
  additional: StudioSourceMutation[] = []
): StudioSourceMutation[] {
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

export function insertionPlan(
  path: Array<string | number>,
  selection: AuthoringObjectSelection,
  value: Record<string, unknown>
): AuthoringEditPlan {
  return {
    insertions: [{ path, selection, value }],
    removals: [],
    updates: []
  };
}
