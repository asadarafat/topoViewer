import type { AuthoringEditPlan } from 'topoviewer/authoring';
import type { StudioCommand, StudioSourceMutation } from './commands';
import type { StudioSelection } from './project';

export type StudioCommandExecutor = (command: StudioCommand) => boolean;

export type StudioProjectionSyncPolicy = 'reconcile' | 'preserve-rendered-position';

export type StudioEditPlanExecutor = (
  id: string,
  label: string,
  plan: AuthoringEditPlan,
  selection?: StudioSelection[],
  additionalMutations?: StudioSourceMutation[],
  projectionSyncPolicy?: StudioProjectionSyncPolicy
) => boolean;
