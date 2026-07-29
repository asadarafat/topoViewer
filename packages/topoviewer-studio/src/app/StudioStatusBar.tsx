import { useState, type MouseEvent } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import type { StudioDiagnostic, StudioDocumentKind } from '../contracts/project';
import { StudioButton, StudioButtonBase, StudioListItemButton, StudioPopover } from '../ui/controls';
import { studioSpace } from '../ui/muiSpacing';

interface StudioStatusBarProps {
  appearanceError?: string;
  autosaveError?: { message: string; retryable?: boolean };
  commandError?: string;
  diagnostics: StudioDiagnostic[];
  hostName: string;
  linkCount: number;
  nodeCount: number;
  onDismissAppearanceError(): void;
  onOpenProblem(document: StudioDocumentKind): void;
  onRetryAutosave(): void;
  zoom?: number;
}

function diagnosticLocation(diagnostic: StudioDiagnostic): string {
  const line = diagnostic.line ? `:${diagnostic.line}` : '';
  return `${diagnostic.document}.yaml${line}`;
}

/**
 * The readout states passive facts about the project and never competes with the
 * command bar: save state belongs beside the Save action, not here.
 */
export function StudioStatusBar({
  appearanceError,
  autosaveError,
  commandError,
  diagnostics,
  hostName,
  linkCount,
  nodeCount,
  onDismissAppearanceError,
  onOpenProblem,
  onRetryAutosave,
  zoom
}: StudioStatusBarProps) {
  const [problemsAnchor, setProblemsAnchor] = useState<HTMLElement | null>(null);
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const problemLabel = `${diagnostics.length} problem${diagnostics.length === 1 ? '' : 's'}`;

  function toggleProblems(event: MouseEvent<HTMLElement>) {
    setProblemsAnchor((current) => (current ? null : event.currentTarget));
  }

  return (
    <Box
      className="studio-status-bar"
      component="footer"
      sx={{
        alignItems: 'center',
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        gap: studioSpace.space12,
        gridArea: 'readout',
        minWidth: 0,
        overflow: 'hidden',
        px: studioSpace.space12
      }}
    >
      <StudioButtonBase
        aria-expanded={Boolean(problemsAnchor)}
        aria-haspopup="dialog"
        aria-label={problemLabel}
        className="studio-status-problems"
        disabled={diagnostics.length === 0}
        onClick={toggleProblems}
        sx={{ borderRadius: 1, flexShrink: 0, px: studioSpace.space4 }}
        title="Show problems"
      >
        <Typography color={errorCount ? 'error.main' : diagnostics.length ? 'warning.main' : 'text.secondary'} component="span" variant="caption">
          {problemLabel}
        </Typography>
      </StudioButtonBase>
      <Box sx={{ alignItems: 'center', display: 'flex', flex: 1, gap: studioSpace.space8, minWidth: 0 }}>
        {commandError ? (
          <Typography color="error" component="span" noWrap role="alert" variant="caption">
            {commandError}
          </Typography>
        ) : null}
        {autosaveError ? (
          <Typography color="error" component="span" noWrap role="alert" variant="caption">
            Recovery save failed: {autosaveError.message}
            {autosaveError.retryable ? (
              <StudioButton onClick={onRetryAutosave} sx={{ minHeight: 0 }}>
                Retry
              </StudioButton>
            ) : null}
          </Typography>
        ) : null}
        {appearanceError ? (
          <Typography color="error" component="span" noWrap role="alert" variant="caption">
            {appearanceError}
            <StudioButton onClick={onDismissAppearanceError} sx={{ minHeight: 0 }}>
              Dismiss
            </StudioButton>
          </Typography>
        ) : null}
      </Box>
      <Typography className="studio-status-counts" color="text.secondary" component="span" sx={{ flexShrink: 0 }} variant="caption">
        {nodeCount} nodes · {linkCount} links
      </Typography>
      {zoom !== undefined ? (
        <Typography className="studio-status-zoom" color="text.secondary" component="span" sx={{ flexShrink: 0 }} variant="caption">
          {Math.round(zoom * 100)}%
        </Typography>
      ) : null}
      <Typography color="text.secondary" component="span" sx={{ flexShrink: 0 }} variant="caption">
        {hostName}
      </Typography>

      <StudioPopover
        anchorEl={problemsAnchor}
        anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
        onClose={() => setProblemsAnchor(null)}
        open={Boolean(problemsAnchor)}
        slotProps={{
          paper: {
            'aria-label': 'Problems',
            role: 'dialog',
            sx: { maxHeight: 320, overflow: 'auto', width: 420 }
          }
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: studioSpace.space4 }}>
          {diagnostics.map((diagnostic, index) => (
            <Box component="li" key={`${diagnostic.document}-${diagnostic.code}-${index}`}>
              <StudioListItemButton
                onClick={() => {
                  setProblemsAnchor(null);
                  onOpenProblem(diagnostic.document);
                }}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText
                  primary={diagnostic.message}
                  secondary={diagnosticLocation(diagnostic)}
                  slotProps={{
                    primary: {
                      color: diagnostic.severity === 'error' ? 'error' : diagnostic.severity === 'warning' ? 'warning.main' : 'textPrimary',
                      variant: 'body2'
                    },
                    secondary: { variant: 'caption' }
                  }}
                />
              </StudioListItemButton>
            </Box>
          ))}
        </Box>
      </StudioPopover>
    </Box>
  );
}
