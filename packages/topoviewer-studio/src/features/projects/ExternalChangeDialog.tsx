import type { StudioExternalChange } from '../../contracts/host';
import type { StudioDocumentKind, StudioProject } from '../../contracts/project';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useRef } from 'react';
import {
  StudioAccordion,
  StudioAccordionDetails,
  StudioAccordionSummary,
  StudioAlert,
  StudioButton,
  StudioCircularProgress,
  StudioDialog,
  StudioDialogActions,
  StudioDialogContent,
  StudioDialogTitle
} from '../../ui/controls';

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
  return { text: `${text.slice(0, MAX_DIFF_CHARACTERS)}\n# Diff preview truncated by Studio.`, truncated: true };
}

export function externalDocumentDifferences(studio: StudioProject, disk: StudioProject): ExternalDocumentDifference[] {
  return documentKinds.flatMap((kind) => {
    const studioText = studio.documents[kind]?.text || '';
    const diskText = disk.documents[kind]?.text || '';
    if (studioText === diskText) return [];
    const studioBounded = boundedText(studioText);
    const diskBounded = boundedText(diskText);
    return [{
      disk: diskBounded.text,
      kind,
      studio: studioBounded.text,
      truncated: studioBounded.truncated || diskBounded.truncated
    }];
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

export function ExternalChangeDialog({
  diskProject,
  error,
  event,
  loading,
  onInspect,
  onKeepDraft,
  onReloadDisk,
  studioProject
}: ExternalChangeDialogProps) {
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
        <Stack spacing={0.5}>
          <Typography color="text.secondary" variant="caption">Workspace conflict</Typography>
          <Typography component="span" variant="h6">Project changed outside Studio</Typography>
        </Stack>
      </StudioDialogTitle>
      <StudioDialogContent>
        <Typography id="studio-external-change-description" variant="body2">
          {event.kind === 'deleted'
            ? 'A project file was deleted on disk. Studio has kept the current draft in memory.'
            : 'Disk content changed while this Studio draft had unsaved work. Nothing has been overwritten.'}
        </Typography>
        {error ? <StudioAlert className="studio-external-change-error" severity="error">{error}</StudioAlert> : null}
        {diskProject ? (
          <Box aria-label="External source differences" className="studio-external-differences">
            {differences.length ? differences.map((difference) => (
              <StudioAccordion defaultExpanded={differences.length === 1} key={difference.kind}>
                <StudioAccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>{difference.kind}.yaml differs{difference.truncated ? ' (preview truncated)' : ''}</StudioAccordionSummary>
                <StudioAccordionDetails><Stack className="studio-external-difference-columns" direction={{ md: 'row', xs: 'column' }} spacing={1}>
                  <Box component="section"><Typography component="strong" variant="subtitle2">Studio draft</Typography><Box component="pre">{difference.studio}</Box></Box>
                  <Box component="section"><Typography component="strong" variant="subtitle2">Disk</Typography><Box component="pre">{difference.disk}</Box></Box>
                </Stack></StudioAccordionDetails>
              </StudioAccordion>
            )) : <Typography variant="body2">Source files are equivalent; only workspace metadata or assets changed.</Typography>}
          </Box>
        ) : null}
      </StudioDialogContent>
      <StudioDialogActions>
        <StudioButton disabled={loading || event.kind === 'deleted'} onClick={onInspect} ref={inspectButtonRef}>{loading ? <><StudioCircularProgress /> Reading disk...</> : 'Inspect diff'}</StudioButton>
        <StudioButton disabled={loading} onClick={onKeepDraft}>Keep Studio draft</StudioButton>
        <StudioButton className="studio-primary-action" disabled={loading || event.kind === 'deleted'} onClick={onReloadDisk}>Reload disk</StudioButton>
      </StudioDialogActions>
    </StudioDialog>
  );
}
