import { useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { StudioHost } from '../../contracts/host';
import type { StudioSessionSnapshot } from '../../contracts/project';
import { createDocumentationSnippet, type DocumentationSnippetKind } from '../../export/documentationSnippets';
import { createStudioExportSnapshot } from '../../export/exportSnapshot';
import { encodeGrafanaBundle } from '../../export/grafanaBundle';
import { exportStudioImage } from '../../export/imageExport';
import {
  StudioAlert,
  StudioButton,
  StudioDialog,
  StudioDialogActions,
  StudioDialogContent,
  StudioDialogTitle,
  StudioFormControl,
  StudioFormLabel,
  StudioIconButton,
  StudioLinearProgress,
  StudioOption,
  StudioSelect,
  StudioTextField,
  StudioToggleButton,
  StudioToggleButtonGroup
} from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

interface ExportPanelProps {
  canvasElement: HTMLElement | null;
  host: StudioHost;
  onAnnouncement(message: string): void;
  onClose(): void;
  snapshot: StudioSessionSnapshot;
}

type ImageKind = 'png' | 'svg';
type ExportStage = 'validate' | 'fonts' | 'render' | 'encode' | 'package';
type ExportAction = 'grafana' | 'image' | 'snippet';

export default function ExportPanel({ canvasElement, host, onAnnouncement, onClose, snapshot }: ExportPanelProps) {
  const box = canvasElement?.getBoundingClientRect();
  const [kind, setKind] = useState<ImageKind>('png');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [width, setWidth] = useState(Math.max(1, Math.round(box?.width || 1280)));
  const [height, setHeight] = useState(Math.max(1, Math.round(box?.height || 720)));
  const [stage, setStage] = useState<ExportStage>();
  const [error, setError] = useState<string>();
  const [failedAction, setFailedAction] = useState<ExportAction>();
  const abortRef = useRef<AbortController>();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  async function runImageExport() {
    if (!canvasElement) {
      setError('The canvas is not ready for export.');
      return;
    }
    const abort = new AbortController();
    abortRef.current = abort;
    setError(undefined);
    setFailedAction(undefined);
    try {
      const artifact = await exportStudioImage({
        element: canvasElement,
        onProgress: setStage,
        options: {
          background: theme === 'dark' ? '#0b1118' : '#f8fafc',
          height,
          kind,
          theme,
          width
        },
        signal: abort.signal,
        snapshot: createStudioExportSnapshot(snapshot.project, snapshot.projection.sourceRevision)
      });
      const exported = await host.exportArtifact({
        artifact,
        kind,
        suggestedName: artifact.name
      });
      if (!exported.ok) throw new Error(exported.error.message);
      onAnnouncement(`${kind.toUpperCase()} exported`);
      setStage(undefined);
    } catch (exportError) {
      setFailedAction('image');
      if (exportError instanceof DOMException && exportError.name === 'AbortError') {
        setError('Export cancelled.');
      } else setError(exportError instanceof Error ? exportError.message : String(exportError));
      setStage(undefined);
    } finally {
      abortRef.current = undefined;
    }
  }

  async function copySnippet(snippetKind: DocumentationSnippetKind) {
    setError(undefined);
    setFailedAction(undefined);
    const source = createStudioExportSnapshot(snapshot.project, snapshot.projection.sourceRevision);
    const copied = await host.copyText(createDocumentationSnippet(source, snippetKind));
    if (!copied.ok) {
      setError(copied.error.message);
      setFailedAction('snippet');
    } else onAnnouncement(`${snippetKind === 'mkdocs' ? 'MkDocs' : 'Static HTML'} snippet copied`);
  }

  async function runGrafanaExport() {
    const abort = new AbortController();
    abortRef.current = abort;
    setError(undefined);
    setFailedAction(undefined);
    setStage('validate');
    try {
      const source = createStudioExportSnapshot(snapshot.project, snapshot.projection.sourceRevision);
      const assets = await host.readProjectAssets({ id: snapshot.project.id });
      if (!assets.ok) throw new Error(assets.error.message);
      if (abort.signal.aborted) throw new DOMException('Grafana export was cancelled.', 'AbortError');
      setStage('package');
      const artifact = encodeGrafanaBundle(source, assets.value);
      const exported = await host.exportArtifact({
        artifact,
        kind: 'grafana-bundle',
        suggestedName: artifact.name
      });
      if (!exported.ok) throw new Error(exported.error.message);
      onAnnouncement('Grafana bundle exported');
      setStage(undefined);
    } catch (exportError) {
      setFailedAction('grafana');
      if (exportError instanceof DOMException && exportError.name === 'AbortError') setError('Export cancelled.');
      else setError(exportError instanceof Error ? exportError.message : String(exportError));
      setStage(undefined);
    } finally {
      abortRef.current = undefined;
    }
  }

  return (
    <StudioDialog initialFocusRef={closeButtonRef} maxWidth="sm" onClose={stage ? undefined : onClose} open slotProps={{ paper: { className: 'studio-mui-export-dialog' } }}>
      <StudioDialogTitle aria-label="Export project">
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack spacing={studioSpace.space2}>
            <Typography component="span" variant="h6">
              Export
            </Typography>
            <Typography color="text.secondary" variant="caption">
              Current source revision
            </Typography>
          </Stack>
          <StudioIconButton aria-label="Close export panel" disabled={Boolean(stage)} onClick={onClose} ref={closeButtonRef} title="Close">
            <CloseIcon fontSize="small" />
          </StudioIconButton>
        </Stack>
      </StudioDialogTitle>
      <StudioDialogContent>
        <Stack spacing={studioSpace.space16}>
          <StudioToggleButtonGroup aria-label="Image format" fullWidth onChange={(_event, value: ImageKind | null) => value && setKind(value)} value={kind}>
            {(['png', 'svg'] as const).map((value) => (
              <StudioToggleButton aria-label={value.toUpperCase()} key={value} value={value}>
                {value.toUpperCase()}
              </StudioToggleButton>
            ))}
          </StudioToggleButtonGroup>
          <Stack direction={{ sm: 'row', xs: 'column' }} spacing={studioSpace.space12} sx={{ alignItems: 'flex-start' }}>
            <StudioTextField aria-label="Export width" label="Width" onChange={(event) => setWidth(Number(event.target.value))} slotProps={{ htmlInput: { max: 8192, min: 1 } }} type="number" value={width} />
            <StudioTextField aria-label="Export height" label="Height" onChange={(event) => setHeight(Number(event.target.value))} slotProps={{ htmlInput: { max: 8192, min: 1 } }} type="number" value={height} />
            <StudioFormControl>
              <StudioFormLabel>Theme</StudioFormLabel>
              <StudioSelect aria-label="Export theme" onChange={(event) => setTheme(event.target.value as 'light' | 'dark')} value={theme}>
                <StudioOption value="light">Light</StudioOption>
                <StudioOption value="dark">Dark</StudioOption>
              </StudioSelect>
            </StudioFormControl>
          </Stack>
          <Box
            component="section"
            sx={{
              borderTop: 1,
              borderColor: 'divider',
              display: 'grid',
              gap: studioSpace.space8,
              pt: studioSpace.space12
            }}
          >
            <Typography component="strong" variant="subtitle2">
              Documentation snippets
            </Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: studioSpace.space8 }}>
              <StudioButton disabled={Boolean(stage)} onClick={() => void copySnippet('mkdocs')}>
                Copy MkDocs snippet
              </StudioButton>
              <StudioButton disabled={Boolean(stage)} onClick={() => void copySnippet('static')}>
                Copy static HTML snippet
              </StudioButton>
            </Stack>
          </Box>
          <Box
            component="section"
            sx={{
              borderTop: 1,
              borderColor: 'divider',
              display: 'grid',
              gap: studioSpace.space8,
              pt: studioSpace.space12
            }}
          >
            <Typography component="strong" variant="subtitle2">
              Operational package
            </Typography>
            <StudioButton disabled={Boolean(stage)} onClick={() => void runGrafanaExport()}>
              {failedAction === 'grafana' ? 'Retry Grafana bundle' : 'Export Grafana bundle'}
            </StudioButton>
          </Box>
          {stage ? (
            <Box aria-live="polite">
              <Typography variant="body2">Exporting: {stage}</Typography>
              <StudioLinearProgress />
            </Box>
          ) : null}
          {error ? <StudioAlert severity="error">{error}</StudioAlert> : null}
        </Stack>
      </StudioDialogContent>
      <StudioDialogActions>
        {stage ? <StudioButton onClick={() => abortRef.current?.abort()}>Cancel</StudioButton> : null}
        <StudioButton disabled={Boolean(stage)} onClick={() => void runImageExport()} variant="contained">
          {failedAction === 'image' ? `Retry ${kind.toUpperCase()} export` : `Export ${kind.toUpperCase()}`}
        </StudioButton>
      </StudioDialogActions>
    </StudioDialog>
  );
}
