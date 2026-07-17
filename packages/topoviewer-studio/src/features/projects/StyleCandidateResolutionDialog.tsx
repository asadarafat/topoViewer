import { useSyncExternalStore } from 'react';
import Typography from '@mui/material/Typography';
import type { StudioStylesheetCandidateController } from '../../session';
import { StudioButton, StudioDialog, StudioDialogActions, StudioDialogContent, StudioDialogTitle } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

interface StyleCandidateResolutionDialogProps {
  candidate: StudioStylesheetCandidateController;
  context: string;
  onApply(): void;
  onCancel(): void;
  onDiscard(): void;
  open: boolean;
}

export function StyleCandidateResolutionDialog({ candidate, context, onApply, onCancel, onDiscard, open }: StyleCandidateResolutionDialogProps) {
  const state = useSyncExternalStore(candidate.subscribe, candidate.getSnapshot, candidate.getSnapshot);
  return (
    <StudioDialog maxWidth="xs" onClose={onCancel} open={open}>
      <StudioDialogTitle>Resolve Style draft</StudioDialogTitle>
      <StudioDialogContent>
        <Typography variant="body2">{context} would replace the current project while stylesheet changes are still unapplied. Apply the valid draft, or explicitly discard it before continuing.</Typography>
        {state.status === 'invalid-dirty' ? (
          <Typography color="error" sx={{ mt: studioSpace.space8 }} variant="body2">
            The Style draft is invalid and cannot be applied. Return to YAML to fix it, or discard it.
          </Typography>
        ) : null}
      </StudioDialogContent>
      <StudioDialogActions>
        <StudioButton onClick={onCancel}>Cancel</StudioButton>
        <StudioButton onClick={onDiscard}>Discard Style draft</StudioButton>
        <StudioButton disabled={state.status !== 'valid-dirty'} onClick={onApply} variant="contained">
          Apply and continue
        </StudioButton>
      </StudioDialogActions>
    </StudioDialog>
  );
}
