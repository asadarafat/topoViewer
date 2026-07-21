import type { StylesheetDocument, TopoDocument } from 'topoviewer';
import { planAuthoringBundleDeletion, type AuthoringObjectSelection } from 'topoviewer/authoring';
import type { StudioSourceMutation } from '../../contracts/commands';

export interface StudioSelectionDeletionPlan {
  additionalMutations: StudioSourceMutation[];
  deletedSelections: AuthoringObjectSelection[];
  plan: ReturnType<typeof planAuthoringBundleDeletion>['topology'];
}

export function planStudioSelectionDeletion(
  topology: TopoDocument,
  stylesheet: StylesheetDocument | undefined,
  selections: AuthoringObjectSelection[]
): StudioSelectionDeletionPlan {
  const deletion = planAuthoringBundleDeletion({ stylesheet, topology }, selections);
  return {
    additionalMutations: deletion.stylesheet.removals.map((removal) => ({
      document: 'stylesheet',
      kind: 'remove-value',
      path: removal.path,
      scopePath: removal.scopePath
    })),
    deletedSelections: deletion.deletedSelections,
    plan: deletion.topology
  };
}
