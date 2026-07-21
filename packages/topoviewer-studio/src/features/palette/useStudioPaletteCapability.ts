import { useState } from 'react';
import type { CreateAuthoringPathOptions, AuthoringObjectSelection } from 'topoviewer/authoring';
import type { StudioEditPlanExecutor } from '../../contracts/capabilities';
import type { StudioHost } from '../../contracts/host';
import type { StudioDocumentSession, StudioStylesheetCandidateController } from '../../session';
import { planStudioPaletteCreation } from './paletteAuthoring';
import type { StudioPaletteTemplateId } from './types';
import { useStudioUserPresets } from './useStudioUserPresets';

interface StudioPaletteCapabilityOptions {
  announce(message: string): void;
  candidate: StudioStylesheetCandidateController;
  executeEditPlan: StudioEditPlanExecutor;
  host: StudioHost;
  session: StudioDocumentSession;
  setError(message?: string): void;
}

export function useStudioPaletteCapability({
  announce,
  candidate,
  executeEditPlan,
  host,
  session,
  setError
}: StudioPaletteCapabilityOptions) {
  const [pathMode, setPathMode] = useState<NonNullable<CreateAuthoringPathOptions['mode']>>('shortest');
  const userPresets = useStudioUserPresets({ host, onAnnouncement: announce, onError: setError });

  function createPaletteObject(templateId: StudioPaletteTemplateId, position?: { x: number; y: number }) {
    const current = session.snapshot();
    try {
      const creation = planStudioPaletteCreation({
        document: current.projection.document,
        pathMode,
        position,
        presets: userPresets.presets,
        selection: current.selection,
        stylesheet: session.sourceValue('stylesheet'),
        templateId
      });
      return executeEditPlan(creation.commandId, creation.label, creation.plan, undefined, creation.additionalMutations);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setError(message);
      const family = templateId === 'path'
        ? 'Path'
        : templateId === 'link' || templateId === 'parallel-link' || templateId === 'parent-link-pipe'
          ? 'Link'
          : 'Object';
      announce(`${family} rejected: ${message}`);
      return false;
    }
  }

  return {
    canSaveSelectionAsPreset: userPresets.canSave(session.snapshot().selection as AuthoringObjectSelection[]),
    createPaletteObject,
    deletePreset: userPresets.remove,
    pathMode,
    presets: userPresets.presets,
    renamePreset: userPresets.rename,
    saveSelectionAsPreset() {
      const current = session.snapshot();
      return userPresets.save(candidate.getSnapshot().latestValid.projection.document, current.selection as AuthoringObjectSelection[]);
    },
    setPathMode
  };
}
