import { useSyncExternalStore } from 'react';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type {
  StudioSourceDraftController,
  StudioSourceDraftState,
  StudioStylesheetCandidateController
} from '../../session';
import type { StudioProjectStatus } from '../../contracts/project';
import { StudioButton, StudioIconButton } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

interface StyleCandidateFooterProps {
  candidate: StudioStylesheetCandidateController;
  onApply(): boolean;
  onRevert(): boolean;
}

const statusText = {
  clean: 'Stylesheet applied',
  'invalid-dirty': 'Invalid Style draft',
  validating: 'Checking Style draft',
  'valid-dirty': 'Valid Style draft'
} as const;

export function StyleCandidateFooter({ candidate, onApply, onRevert }: StyleCandidateFooterProps) {
  const snapshot = useSyncExternalStore(candidate.subscribe, candidate.getSnapshot, candidate.getSnapshot);
  const errorCount = snapshot.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const label = snapshot.status === 'invalid-dirty' && errorCount ? `${statusText[snapshot.status]} · ${errorCount} error${errorCount === 1 ? '' : 's'}` : statusText[snapshot.status];

  if (snapshot.status === 'clean') return null;

  return (
    <Box
      className="studio-style-candidate-footer"
      data-generation={snapshot.generation}
      data-status={snapshot.status}
      data-validated-generation={snapshot.validatedGeneration}
      sx={{
        alignItems: 'center',
        borderTop: 1,
        borderColor: 'divider',
        display: 'grid',
        gap: studioSpace.space8,
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        minHeight: 40,
        px: studioSpace.space12,
        py: studioSpace.space4
      }}
    >
      <Box
        className="studio-style-candidate-status"
        sx={{
          alignItems: 'center',
          display: 'flex',
          gap: studioSpace.space8,
          minWidth: 0
        }}
      >
        <Box
          aria-hidden="true"
          component="span"
          sx={{
            bgcolor: snapshot.status === 'invalid-dirty' ? 'error.main' : snapshot.status === 'validating' ? 'warning.main' : 'success.main',
            borderRadius: '50%',
            height: 8,
            width: 8
          }}
        />
        <Typography aria-live="polite" color={snapshot.status === 'invalid-dirty' ? 'error' : 'text.secondary'} variant="caption">
          {label}
        </Typography>
      </Box>
      <Box
        className="studio-style-candidate-actions"
        sx={{
          display: 'flex',
          gap: studioSpace.space8,
          justifyContent: 'flex-end'
        }}
      >
        <StudioButton disabled={!snapshot.dirty || snapshot.status === 'validating'} onClick={onRevert}>
          Revert
        </StudioButton>
        <StudioButton disabled={!snapshot.dirty || snapshot.status !== 'valid-dirty'} onClick={onApply} variant="contained">
          Apply
        </StudioButton>
      </Box>
    </Box>
  );
}

const projectStatusText: Record<StudioProjectStatus, string> = {
  conflict: 'Conflict',
  'invalid-draft': 'Invalid Draft',
  modified: 'Modified',
  recovery: 'Recovery',
  saved: 'Saved',
  saving: 'Saving'
};

const cleanSourceDraftState: StudioSourceDraftState = Object.freeze({
  dirty: false,
  drafts: Object.freeze({}),
  revision: 0
});
const cleanSourceDraftStore = {
  getSnapshot: () => cleanSourceDraftState,
  subscribe: () => () => {}
};

function useSavePresentation(
  candidate: StudioStylesheetCandidateController,
  projectStatus: StudioProjectStatus,
  sourceDrafts?: StudioSourceDraftController
) {
  const snapshot = useSyncExternalStore(candidate.subscribe, candidate.getSnapshot, candidate.getSnapshot);
  const sourceDraftStore = sourceDrafts || cleanSourceDraftStore;
  const sourceDraftState = useSyncExternalStore(
    sourceDraftStore.subscribe,
    sourceDraftStore.getSnapshot,
    sourceDraftStore.getSnapshot
  );
  const label =
    snapshot.status === 'invalid-dirty'
      ? 'Invalid Style draft'
      : snapshot.status === 'validating'
        ? 'Checking Style draft'
        : sourceDraftState.dirty
          ? 'Source draft'
          : snapshot.dirty
            ? 'Style draft'
            : projectStatusText[projectStatus];
  const disabled =
    projectStatus === 'saving' ||
    (projectStatus === 'saved' && !snapshot.dirty && !sourceDraftState.dirty);
  const statusColor =
    snapshot.status === 'invalid-dirty' ||
    projectStatus === 'conflict' ||
    projectStatus === 'invalid-draft'
      ? 'error.main'
      : sourceDraftState.dirty || snapshot.dirty
        ? 'warning.main'
      : projectStatus === 'saved'
        ? 'success.main'
        : 'text.secondary';
  return { disabled, label, snapshot, sourceDraftState, statusColor };
}

export function StudioSavedState({
  candidate,
  projectStatus,
  sourceDrafts
}: {
  candidate: StudioStylesheetCandidateController;
  projectStatus: StudioProjectStatus;
  sourceDrafts?: StudioSourceDraftController;
}) {
  const { label, snapshot, sourceDraftState, statusColor } = useSavePresentation(
    candidate,
    projectStatus,
    sourceDrafts
  );
  return (
    <Box sx={{ alignItems: 'center', display: 'flex', gap: studioSpace.space6, justifyContent: 'center', minWidth: 0 }}>
      <Box
        aria-hidden="true"
        component="span"
        sx={{
          bgcolor: statusColor,
          borderRadius: '50%',
          flexShrink: 0,
          height: 7,
          width: 7
        }}
      />
      <Typography
        aria-live="polite"
        className="studio-saved-state"
        component="span"
        data-status={
          sourceDraftState.dirty
            ? 'source-draft'
            : snapshot.dirty
              ? snapshot.status
              : projectStatus
        }
        sx={{
          color: statusColor,
          '@media (forced-colors: active)': { color: 'CanvasText' }
        }}
        noWrap
        variant="caption"
      >
        {label === 'Saved' ? 'Saved · recovery current' : label}
      </Typography>
    </Box>
  );
}

export function StudioSaveButton({
  candidate,
  onSave,
  projectStatus,
  sourceDrafts
}: {
  candidate: StudioStylesheetCandidateController;
  onSave(): void;
  projectStatus: StudioProjectStatus;
  sourceDrafts?: StudioSourceDraftController;
}) {
  const { disabled } = useSavePresentation(candidate, projectStatus, sourceDrafts);
  return (
    <StudioButton
      aria-label="Save project"
      disabled={disabled}
      onClick={onSave}
      startIcon={<SaveOutlinedIcon fontSize="small" />}
      title="Save project"
      variant="contained"
    >
      Save
    </StudioButton>
  );
}

export function StyleAwareSaveControls({
  candidate,
  onSave,
  projectStatus,
  sourceDrafts
}: {
  candidate: StudioStylesheetCandidateController;
  onSave(): void;
  projectStatus: StudioProjectStatus;
  sourceDrafts?: StudioSourceDraftController;
}) {
  const { disabled } = useSavePresentation(candidate, projectStatus, sourceDrafts);
  return (
    <>
      <StudioSavedState
        candidate={candidate}
        projectStatus={projectStatus}
        sourceDrafts={sourceDrafts}
      />
      <StudioIconButton aria-label="Save project" disabled={disabled} onClick={onSave} title="Save project">
        <SaveOutlinedIcon fontSize="small" />
      </StudioIconButton>
    </>
  );
}
