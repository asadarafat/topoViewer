import type { StudioExternalChange } from '../../contracts/host';
import type { StudioDocumentKind, StudioProject } from '../../contracts/project';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRef } from 'react';
import { StudioCodeBlock } from '../../ui/StudioCodeBlock';
import { StudioAccordion, StudioAccordionDetails, StudioAccordionSummary, StudioAlert, StudioButton, StudioCircularProgress, StudioDialog, StudioDialogActions, StudioDialogContent, StudioDialogTitle } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

const documentKinds: StudioDocumentKind[] = ['topology', 'stylesheet', 'mapper'];
const MAX_DIFF_CHARACTERS = 12_000;

export interface ExternalDocumentDifference {
  disk: string;
  kind: StudioDocumentKind;
  studio: string;
  truncated: boolean;
}

function boundedText(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_DIFF_CHARACTERS) return { text, truncated: false };
  return {
    text: `${text.slice(0, MAX_DIFF_CHARACTERS)}\n# Diff preview truncated by Studio.`,
    truncated: true
  };
}

export function externalDocumentDifferences(studio: StudioProject, disk: StudioProject): ExternalDocumentDifference[] {
  return documentKinds.flatMap((kind) => {
    const studioText = studio.documents[kind]?.text || '';
    const diskText = disk.documents[kind]?.text || '';
    if (studioText === diskText) return [];
    const studioBounded = boundedText(studioText);
    const diskBounded = boundedText(diskText);
    return [
      {
        disk: diskBounded.text,
        kind,
        studio: studioBounded.text,
        truncated: studioBounded.truncated || diskBounded.truncated
      }
    ];
  });
}

interface ExternalChangeDialogProps {
  diskProject?: StudioProject;
  error?: string;
  event: StudioExternalChange;
  loading: boolean;
  onInspect(): void;
  onKeepDraft(): void;
  onReloadDisk(): void;
  studioProject: StudioProject;
}

export function ExternalChangeDialog({ diskProject, error, event, loading, onInspect, onKeepDraft, onReloadDisk, studioProject }: ExternalChangeDialogProps) {
  const differences = diskProject ? externalDocumentDifferences(studioProject, diskProject) : [];
  const inspectButtonRef = useRef<HTMLButtonElement>(null);
  return (
    <StudioDialog
      aria-describedby="studio-external-change-description"
      aria-labelledby="studio-external-change-title"
      initialFocusRef={inspectButtonRef}
      maxWidth="md"
      open
      slotProps={{ paper: { className: 'studio-mui-external-change-dialog' } }}
    >
      <StudioDialogTitle aria-label="Project changed outside Studio" id="studio-external-change-title">
        <Stack spacing={studioSpace.space4}>
          <Typography color="text.secondary" variant="caption">
            Workspace conflict
          </Typography>
          <Typography component="span" variant="h6">
            Project changed outside Studio
          </Typography>
        </Stack>
      </StudioDialogTitle>
      <StudioDialogContent>
        <Typography id="studio-external-change-description" variant="body2">
          {event.kind === 'deleted' ? 'A project file was deleted on disk. Studio has kept the current draft in memory.' : 'Disk content changed while this Studio draft had unsaved work. Nothing has been overwritten.'}
        </Typography>
        {error ? (
          <StudioAlert className="studio-external-change-error" severity="error">
            {error}
          </StudioAlert>
        ) : null}
        {diskProject ? (
          <Box
            aria-label="External source differences"
            sx={{
              display: 'grid',
              gap: studioSpace.space8,
              minHeight: 0,
              mt: studioSpace.space16
            }}
          >
            {differences.length ? (
              differences.map((difference, index) => (
                <StudioAccordion defaultExpanded={index === 0} key={difference.kind}>
                  <StudioAccordionSummary aria-controls={`studio-external-${difference.kind}-content`} expandIcon={<ExpandMoreIcon fontSize="small" />} id={`studio-external-${difference.kind}-heading`}>
                    {difference.kind}.yaml differs
                    {difference.truncated ? ' (preview truncated)' : ''}
                  </StudioAccordionSummary>
                  <StudioAccordionDetails aria-labelledby={`studio-external-${difference.kind}-heading`} id={`studio-external-${difference.kind}-content`}>
                    <Stack direction={{ md: 'row', xs: 'column' }} spacing={studioSpace.space8}>
                      <Box component="section" sx={{ flex: '1 1 0', minWidth: 0 }}>
                        <Typography component="strong" variant="subtitle2">
                          Studio draft
                        </Typography>
                        <StudioCodeBlock
                          sx={{
                            bgcolor: 'background.default',
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            maxHeight: 260,
                            mt: studioSpace.space8,
                            overflow: 'auto',
                            p: studioSpace.space8,
                            whiteSpace: 'pre'
                          }}
                        >
                          {difference.studio}
                        </StudioCodeBlock>
                      </Box>
                      <Box component="section" sx={{ flex: '1 1 0', minWidth: 0 }}>
                        <Typography component="strong" variant="subtitle2">
                          Disk
                        </Typography>
                        <StudioCodeBlock
                          sx={{
                            bgcolor: 'background.default',
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            maxHeight: 260,
                            mt: studioSpace.space8,
                            overflow: 'auto',
                            p: studioSpace.space8,
                            whiteSpace: 'pre'
                          }}
                        >
                          {difference.disk}
                        </StudioCodeBlock>
                      </Box>
                    </Stack>
                  </StudioAccordionDetails>
                </StudioAccordion>
              ))
            ) : (
              <Typography variant="body2">Source files are equivalent; only workspace metadata or assets changed.</Typography>
            )}
          </Box>
        ) : null}
      </StudioDialogContent>
      <StudioDialogActions>
        <StudioButton disabled={loading || event.kind === 'deleted'} onClick={onInspect} ref={inspectButtonRef}>
          {loading ? (
            <>
              <StudioCircularProgress /> Reading disk...
            </>
          ) : (
            'Inspect diff'
          )}
        </StudioButton>
        <StudioButton disabled={loading} onClick={onKeepDraft}>
          Keep Studio draft
        </StudioButton>
        <StudioButton disabled={loading || event.kind === 'deleted'} onClick={onReloadDisk} variant="contained">
          Reload disk
        </StudioButton>
      </StudioDialogActions>
    </StudioDialog>
  );
}
