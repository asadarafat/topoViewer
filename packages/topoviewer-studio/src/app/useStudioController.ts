import type { AuthoringObjectSelection } from 'topoviewer/authoring';
import type { StudioProject, StudioRecoverySnapshot, StudioSelection } from '../contracts/project';
import type { StudioHost } from '../contracts/host';
import type { StudioEditPlanExecutor } from '../contracts/capabilities';
import { mutationsForAuthoringEditPlan } from '../commands/authoringPlans';
import { useStudioPaletteCapability } from '../features/palette/useStudioPaletteCapability';
import { useStudioMapperCapability } from '../features/mapper/useStudioMapperCapability';
import { createStudioExportCapability } from '../features/export/exportCapability';
import { createStudioViewportCapability } from '../features/viewport/viewportCapability';
import { createStudioProjectCapability } from '../features/projects/projectCapability';
import { useStudioSessionState } from '../features/projects/useStudioSessionState';
import { createStudioInspectorCapability } from '../features/inspector/inspectorCapability';
import { useStudioAuthoringProfile } from '../features/inspector/useStudioAuthoringProfile';
import { createStudioQuickEditCapability } from '../features/canvas/quickEditCapability';
import { useStudioCanvasCapability } from '../features/canvas/useStudioCanvasCapability';
import { createStudioIdentityActions } from '../features/inspector/identityCapability';
import { canUseStudioFormatPainter, createStudioFormatPainterAction } from '../features/styles/formatPainter';
import { useStudioStyleCapability } from '../features/styles/useStudioStyleCapability';

interface UseStudioControllerOptions {
  host: StudioHost;
  onReload(): Promise<void>;
  project: StudioProject;
  recovery?: StudioRecoverySnapshot;
}

export function useStudioController({ host, onReload, project, recovery }: UseStudioControllerOptions) {
  const {
    announcement,
    commandError,
    dispatcher,
    normalizationReview,
    normalizationReviewOwner,
    refresh,
    session,
    setAnnouncement,
    setCommandError,
    setNormalizationReview,
    setSnapshot,
    snapshot
  } = useStudioSessionState(project, recovery);
  const style = useStudioStyleCapability({
    announce: setAnnouncement,
    dispatcher,
    normalizationReview,
    normalizationReviewOwner,
    recovery: recovery?.stylesheetCandidate,
    refresh,
    session,
    setError: setCommandError,
    setNormalizationReview
  });
  const { candidate: stylesheetCandidate, execute } = style;

  const mapper = useStudioMapperCapability({
    announce: setAnnouncement,
    execute,
    session,
    setError: setCommandError
  });
  const authoringProfileCapability = useStudioAuthoringProfile({
    announce: setAnnouncement,
    host,
    setError: setCommandError
  });
  const viewport = createStudioViewportCapability({ execute, session });
  const quickEdit = createStudioQuickEditCapability({ execute, session });

  const { applyStylesheetCandidate } = style.actions;
  const exportCapability = createStudioExportCapability({
    announce: setAnnouncement,
    applyStylesheetCandidate,
    host,
    session,
    setError: setCommandError
  });
  const projectCapability = createStudioProjectCapability({
    announce: setAnnouncement,
    applyStylesheetCandidate,
    dispatcher,
    host,
    onReload,
    refresh,
    session,
    setError: setCommandError,
    stylesheetCandidate,
    synchronizeAfterHistory: style.synchronizeAfterHistory
  });

  const executeEditPlan: StudioEditPlanExecutor = (
    id,
    label,
    plan,
    selection,
    additionalMutations = []
  ) => {
    const mutations = mutationsForAuthoringEditPlan(plan, (path) => Boolean(session.sourceRange('topology', path)), additionalMutations);
    const preparedPlan = {
      mutations,
      selection: selection || plan.insertions.map((insertion) => insertion.selection as StudioSelection),
      summary: label
    };
    return execute({
      id,
      label,
      execute: () => preparedPlan,
      plan: preparedPlan
    });
  };

  const palette = useStudioPaletteCapability({
    announce: setAnnouncement,
    candidate: stylesheetCandidate,
    executeEditPlan,
    host,
    session,
    setError: setCommandError
  });

  const canvas = useStudioCanvasCapability({
    announce: setAnnouncement,
    candidate: stylesheetCandidate,
    execute,
    executeEditPlan,
    host,
    presets: palette.presets,
    rebaseCandidateAfterDelete: style.rebaseAfterObjectDeletion,
    session,
    setError: setCommandError,
    setSnapshot
  });
  const inspector = createStudioInspectorCapability({ execute, session, setSelection: canvas.setSelection });

  const { previewObjectIdRename, renameObjectId } = createStudioIdentityActions({
    execute,
    session,
    setAnnouncement,
    setError: setCommandError
  });

  const applyFormat = createStudioFormatPainterAction({
    candidate: stylesheetCandidate,
    executeEditPlan,
    refresh,
    session,
    setAnnouncement,
    setError: setCommandError
  });

  return {
    announce: (message: string) => setAnnouncement(message),
    announcement,
    ...style.actions,
    ...authoringProfileCapability,
    applyFormat,
    canCopyFormat: canUseStudioFormatPainter(snapshot.selection as AuthoringObjectSelection[]),
    ...canvas,
    commandError,
    ...inspector,
    ...quickEdit,
    ...viewport,
    ...exportCapability,
    ...mapper,
    normalizationReview,
    ...palette,
    renameObjectId,
    previewObjectIdRename,
    snapshot,
    stylesheetCandidate,
    ...projectCapability
  };
}
