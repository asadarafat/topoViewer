import type { StudioExternalChange } from '../../contracts/host';
import type { StudioDocumentKind, StudioProject } from '../../contracts/project';
import { useDialogFocus } from '../../accessibility/focus';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  StudioAccordion,
  StudioAccordionDetails,
  StudioAccordionSummary,
  StudioAlert,
  StudioButton,
  StudioCircularProgress
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
  const { dialogRef, onDialogKeyDown } = useDialogFocus<HTMLElement>();
  return (
    <div className="studio-external-change-backdrop">
      <section aria-describedby="studio-external-change-description" aria-labelledby="studio-external-change-title" aria-modal="true" className="studio-external-change-dialog" onKeyDown={onDialogKeyDown} ref={dialogRef} role="dialog" tabIndex={-1}>
        <header>
          <div>
            <span>Workspace conflict</span>
            <h2 id="studio-external-change-title">Project changed outside Studio</h2>
          </div>
        </header>
        <p id="studio-external-change-description">
          {event.kind === 'deleted'
            ? 'A project file was deleted on disk. Studio has kept the current draft in memory.'
            : 'Disk content changed while this Studio draft had unsaved work. Nothing has been overwritten.'}
        </p>
        {error ? <StudioAlert className="studio-external-change-error" severity="error">{error}</StudioAlert> : null}
        {diskProject ? (
          <div className="studio-external-differences" aria-label="External source differences">
            {differences.length ? differences.map((difference) => (
              <StudioAccordion defaultExpanded={differences.length === 1} key={difference.kind}>
                <StudioAccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>{difference.kind}.yaml differs{difference.truncated ? ' (preview truncated)' : ''}</StudioAccordionSummary>
                <StudioAccordionDetails><div>
                  <section><strong>Studio draft</strong><pre>{difference.studio}</pre></section>
                  <section><strong>Disk</strong><pre>{difference.disk}</pre></section>
                </div></StudioAccordionDetails>
              </StudioAccordion>
            )) : <p>Source files are equivalent; only workspace metadata or assets changed.</p>}
          </div>
        ) : null}
        <footer>
          <StudioButton disabled={loading || event.kind === 'deleted'} onClick={onInspect}>{loading ? <><StudioCircularProgress /> Reading disk...</> : 'Inspect diff'}</StudioButton>
          <StudioButton disabled={loading} onClick={onKeepDraft}>Keep Studio draft</StudioButton>
          <StudioButton className="studio-primary-action" disabled={loading || event.kind === 'deleted'} onClick={onReloadDisk}>Reload disk</StudioButton>
        </footer>
      </section>
    </div>
  );
}
