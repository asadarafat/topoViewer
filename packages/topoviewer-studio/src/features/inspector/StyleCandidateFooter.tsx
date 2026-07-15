import { useSyncExternalStore } from 'react';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { StudioStylesheetCandidateController } from '../../session';
import type { StudioProjectStatus } from '../../contracts/project';
import { StudioButton, StudioIconButton } from '../../ui/controls';

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
  const snapshot = useSyncExternalStore(
    candidate.subscribe,
    candidate.getSnapshot,
    candidate.getSnapshot
  );
  const errorCount = snapshot.diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const label = snapshot.status === 'invalid-dirty' && errorCount
    ? `${statusText[snapshot.status]} · ${errorCount} error${errorCount === 1 ? '' : 's'}`
    : statusText[snapshot.status];

  return (
    <Box
      className="studio-style-candidate-footer"
      data-generation={snapshot.generation}
      data-status={snapshot.status}
      data-validated-generation={snapshot.validatedGeneration}
    >
      <Typography aria-live="polite" color={snapshot.status === 'invalid-dirty' ? 'error' : 'text.secondary'} variant="caption">
        {label}
      </Typography>
      <Box className="studio-style-candidate-actions">
        <StudioButton disabled={!snapshot.dirty || snapshot.status === 'validating'} onClick={onRevert}>Revert</StudioButton>
        <StudioButton
          className="studio-primary-button"
          disabled={!snapshot.dirty || snapshot.status !== 'valid-dirty'}
          onClick={onApply}
        >Apply</StudioButton>
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

export function StyleAwareSaveControls({
  candidate,
  onSave,
  projectStatus
}: {
  candidate: StudioStylesheetCandidateController;
  onSave(): void;
  projectStatus: StudioProjectStatus;
}) {
  const snapshot = useSyncExternalStore(
    candidate.subscribe,
    candidate.getSnapshot,
    candidate.getSnapshot
  );
  const label = snapshot.status === 'invalid-dirty'
    ? 'Invalid Style draft'
    : snapshot.status === 'validating'
      ? 'Checking Style draft'
      : snapshot.dirty
        ? 'Style draft'
        : projectStatusText[projectStatus];
  const disabled = projectStatus === 'saving'
    || (projectStatus === 'saved' && !snapshot.dirty);

  return (
    <>
      <Typography
        aria-live="polite"
        className={`studio-saved-state studio-saved-state--${snapshot.status === 'invalid-dirty' ? 'invalid-draft' : projectStatus}`}
        component="span"
        variant="body2"
      >{label}</Typography>
      <StudioIconButton
        aria-label="Save project"
        className="studio-icon-button"
        disabled={disabled}
        onClick={onSave}
        title="Save project"
      >
        <SaveOutlinedIcon fontSize="small" />
      </StudioIconButton>
    </>
  );
}
