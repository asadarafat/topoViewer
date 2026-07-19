import { useMemo, useRef, useState } from 'react';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { StudioHost } from '../../contracts/host';
import type { StudioSessionSnapshot } from '../../contracts/project';
import { createDocumentationSnippet, type DocumentationSnippetKind } from '../../export/documentationSnippets';
import { encodeDocumentationBundle } from '../../export/documentationBundle';
import { createStudioExportSnapshot } from '../../export/exportSnapshot';
import { encodeGrafanaBundle, validateGrafanaBundleSnapshot } from '../../export/grafanaBundle';
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
  StudioTab,
  StudioTabs,
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
  onConfigureMapper(): void;
  snapshot: StudioSessionSnapshot;
}

type ExportDestination = 'documentation' | 'grafana' | 'image';
type ImageBackground = 'canvas' | 'dark' | 'light' | 'transparent';
type ImageKind = 'png' | 'svg';
type ExportStage = 'encode' | 'fonts' | 'package' | 'render' | 'validate';

const destinationTabs: Array<{ icon: typeof ImageOutlinedIcon; id: ExportDestination; label: string }> = [
  { icon: ImageOutlinedIcon, id: 'image', label: 'Image' },
  { icon: ArticleOutlinedIcon, id: 'documentation', label: 'Documentation' },
  { icon: DashboardOutlinedIcon, id: 'grafana', label: 'Grafana' }
];

const stageLabels: Record<ExportStage, string> = {
  encode: 'Encoding artifact',
  fonts: 'Preparing typography',
  package: 'Packaging source files',
  render: 'Rendering topology',
  validate: 'Validating source files'
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

function resolvedBackground(background: ImageBackground, element: HTMLElement): string | undefined {
  if (background === 'transparent') return undefined;
  if (background === 'dark') return '#121212';
  if (background === 'light') return '#ffffff';
  const computed = getComputedStyle(element).backgroundColor;
  return computed && computed !== 'rgba(0, 0, 0, 0)' ? computed : '#121212';
}

function ReadinessRow({ ready, text }: { ready: boolean; text: string }) {
  return (
    <Stack direction="row" spacing={studioSpace.space8} sx={{ alignItems: 'center' }}>
      <CheckCircleOutlineIcon color={ready ? 'success' : 'disabled'} fontSize="small" />
      <Typography color={ready ? 'text.primary' : 'text.secondary'} variant="body2">
        {text}
      </Typography>
    </Stack>
  );
}

export default function ExportPanel({ canvasElement, host, onAnnouncement, onClose, onConfigureMapper, snapshot }: ExportPanelProps) {
  const box = canvasElement?.getBoundingClientRect();
  const [destination, setDestination] = useState<ExportDestination>('image');
  const [kind, setKind] = useState<ImageKind>('png');
  const [background, setBackground] = useState<ImageBackground>('canvas');
  const [documentationTarget, setDocumentationTarget] = useState<DocumentationSnippetKind>('mkdocs');
  const [width, setWidth] = useState(Math.max(1, Math.round(box?.width || 1280)));
  const [height, setHeight] = useState(Math.max(1, Math.round(box?.height || 720)));
  const [stage, setStage] = useState<ExportStage>();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const abortRef = useRef<AbortController>();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const source = useMemo(
    () => createStudioExportSnapshot(snapshot.project, snapshot.projection.sourceRevision),
    [snapshot.project, snapshot.projection.sourceRevision]
  );
  const grafanaReadiness = useMemo(() => {
    try {
      validateGrafanaBundleSnapshot(source);
      return { ready: true, reason: '' };
    } catch (readinessError) {
      return { ready: false, reason: readinessError instanceof Error ? readinessError.message : String(readinessError) };
    }
  }, [source]);
  const busy = Boolean(stage);

  function clearStatus() {
    setError(undefined);
    setSuccess(undefined);
  }

  function changeDestination(value: ExportDestination) {
    setDestination(value);
    clearStatus();
  }

  async function projectAssets() {
    const assets = await host.readProjectAssets({ id: snapshot.project.id });
    if (!assets.ok) throw new Error(assets.error.message);
    return assets.value;
  }

  async function exportArtifact(artifact: { bytes: Uint8Array; mediaType: string; name: string }, exportKind: 'documentation-bundle' | 'grafana-bundle' | ImageKind) {
    const exported = await host.exportArtifact({ artifact, kind: exportKind, suggestedName: artifact.name });
    if (!exported.ok) throw new Error(exported.error.message);
    const message = `${artifact.name} exported (${formatBytes(artifact.bytes.byteLength)})`;
    setSuccess(message);
    onAnnouncement(message);
  }

  async function runImageExport() {
    if (!canvasElement) {
      setError('The topology canvas is not ready for export.');
      return;
    }
    const abort = new AbortController();
    abortRef.current = abort;
    clearStatus();
    try {
      const artifact = await exportStudioImage({
        element: canvasElement,
        onProgress: setStage,
        options: {
          background: resolvedBackground(background, canvasElement),
          embedFonts: false,
          height,
          kind,
          width
        },
        signal: abort.signal,
        snapshot: source
      });
      await exportArtifact(artifact, kind);
    } catch (exportError) {
      setError(exportError instanceof DOMException && exportError.name === 'AbortError' ? 'Export cancelled.' : exportError instanceof Error ? exportError.message : String(exportError));
    } finally {
      setStage(undefined);
      abortRef.current = undefined;
    }
  }

  async function copySnippet() {
    clearStatus();
    const copied = await host.copyText(createDocumentationSnippet(source, documentationTarget));
    if (!copied.ok) {
      setError(copied.error.message);
      return;
    }
    const message = `${documentationTarget === 'mkdocs' ? 'MkDocs' : 'Static HTML'} snippet copied`;
    setSuccess(message);
    onAnnouncement(message);
  }

  async function runDocumentationExport() {
    const abort = new AbortController();
    abortRef.current = abort;
    clearStatus();
    setStage('validate');
    try {
      const assets = await projectAssets();
      if (abort.signal.aborted) throw new DOMException('Documentation export was cancelled.', 'AbortError');
      setStage('package');
      await exportArtifact(encodeDocumentationBundle(source, documentationTarget, assets), 'documentation-bundle');
    } catch (exportError) {
      setError(exportError instanceof DOMException && exportError.name === 'AbortError' ? 'Export cancelled.' : exportError instanceof Error ? exportError.message : String(exportError));
    } finally {
      setStage(undefined);
      abortRef.current = undefined;
    }
  }

  async function runGrafanaExport() {
    if (!grafanaReadiness.ready) return;
    const abort = new AbortController();
    abortRef.current = abort;
    clearStatus();
    setStage('validate');
    try {
      const assets = await projectAssets();
      if (abort.signal.aborted) throw new DOMException('Grafana export was cancelled.', 'AbortError');
      setStage('package');
      await exportArtifact(encodeGrafanaBundle(source, assets), 'grafana-bundle');
    } catch (exportError) {
      setError(exportError instanceof DOMException && exportError.name === 'AbortError' ? 'Export cancelled.' : exportError instanceof Error ? exportError.message : String(exportError));
    } finally {
      setStage(undefined);
      abortRef.current = undefined;
    }
  }

  const primaryAction = destination === 'image'
    ? { label: `Export ${kind.toUpperCase()}`, onClick: runImageExport }
    : destination === 'documentation'
      ? { label: 'Export documentation bundle', onClick: runDocumentationExport }
      : grafanaReadiness.ready
        ? { label: 'Export Grafana bundle', onClick: runGrafanaExport }
        : { label: 'Configure mapper', onClick: onConfigureMapper };

  return (
    <StudioDialog initialFocusRef={closeButtonRef} maxWidth="md" onClose={busy ? undefined : onClose} open slotProps={{ paper: { className: 'studio-mui-export-dialog' } }}>
      <StudioDialogTitle aria-label="Export project">
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack spacing={studioSpace.space2}>
            <Typography component="span" variant="h6">Export</Typography>
            <Stack direction="row" spacing={studioSpace.space8} sx={{ alignItems: 'center' }}>
              <Typography color="text.secondary" variant="body2">{snapshot.project.name}</Typography>
              <Chip color={snapshot.status === 'saved' ? 'success' : 'default'} label={snapshot.status === 'saved' ? 'Saved source' : 'Current draft'} size="small" variant="outlined" />
            </Stack>
          </Stack>
          <StudioIconButton aria-label="Close export panel" disabled={busy} onClick={onClose} ref={closeButtonRef} title="Close">
            <CloseIcon fontSize="small" />
          </StudioIconButton>
        </Stack>
      </StudioDialogTitle>
      <StudioTabs
        aria-label="Export destination"
        onChange={(_event, value: ExportDestination) => changeDestination(value)}
        value={destination}
        variant="fullWidth"
      >
        {destinationTabs.map(({ icon: Icon, id, label }) => (
          <StudioTab
            disabled={busy}
            icon={<Icon fontSize="small" sx={{ display: { sm: 'inline-flex', xs: 'none' } }} />}
            iconPosition="start"
            key={id}
            label={label}
            sx={{ flexGrow: { sm: 1, xs: id === 'documentation' ? 1.2 : 1 }, minWidth: 0, px: { sm: studioSpace.space16, xs: studioSpace.space4 } }}
            value={id}
          />
        ))}
      </StudioTabs>
      <StudioDialogContent sx={{ minHeight: 300 }}>
        {destination === 'image' ? (
          <Stack spacing={studioSpace.space16}>
            <StudioToggleButtonGroup aria-label="Image format" fullWidth onChange={(_event, value: ImageKind | null) => {
              if (!value) return;
              setKind(value);
              clearStatus();
            }} value={kind}>
              <StudioToggleButton aria-label="PNG" value="png">PNG</StudioToggleButton>
              <StudioToggleButton aria-label="SVG" value="svg">SVG</StudioToggleButton>
            </StudioToggleButtonGroup>
            <Stack direction={{ sm: 'row', xs: 'column' }} spacing={studioSpace.space12} sx={{ alignItems: 'flex-start' }}>
              <StudioTextField aria-label="Export width" label="Width" onChange={(event) => setWidth(Number(event.target.value))} slotProps={{ htmlInput: { max: 8192, min: 1 } }} type="number" value={width} />
              <StudioTextField aria-label="Export height" label="Height" onChange={(event) => setHeight(Number(event.target.value))} slotProps={{ htmlInput: { max: 8192, min: 1 } }} type="number" value={height} />
              <StudioFormControl>
                <StudioFormLabel>Background</StudioFormLabel>
                <StudioSelect aria-label="Export background" onChange={(event) => setBackground(event.target.value as ImageBackground)} value={background}>
                  <StudioOption value="canvas">Canvas</StudioOption>
                  <StudioOption value="transparent">Transparent</StudioOption>
                  <StudioOption value="light">Light</StudioOption>
                  <StudioOption value="dark">Dark</StudioOption>
                </StudioSelect>
              </StudioFormControl>
            </Stack>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" variant="body2">{width} x {height} px / {((width * height) / 1_000_000).toFixed(2)} MP</Typography>
              <StudioButton disabled={!box || busy} onClick={() => {
                setWidth(Math.max(1, Math.round(box?.width || 1280)));
                setHeight(Math.max(1, Math.round(box?.height || 720)));
                clearStatus();
              }}>Use viewport size</StudioButton>
            </Stack>
          </Stack>
        ) : null}

        {destination === 'documentation' ? (
          <Stack spacing={studioSpace.space16}>
            <StudioToggleButtonGroup aria-label="Documentation target" fullWidth onChange={(_event, value: DocumentationSnippetKind | null) => {
              if (!value) return;
              setDocumentationTarget(value);
              clearStatus();
            }} value={documentationTarget}>
              <StudioToggleButton value="mkdocs">MkDocs</StudioToggleButton>
              <StudioToggleButton value="static">Static HTML</StudioToggleButton>
            </StudioToggleButtonGroup>
            <Box>
              <Typography component="h3" sx={{ mb: studioSpace.space8 }} variant="subtitle2">Bundle contents</Typography>
              <Stack direction="row" sx={{ flexWrap: 'wrap', gap: studioSpace.space8 }}>
                <Chip label="Topology YAML" size="small" variant="outlined" />
                <Chip label="Stylesheet YAML" size="small" variant="outlined" />
                {source.project.documents.mapper ? <Chip label="Mapper YAML" size="small" variant="outlined" /> : null}
                {source.project.assets.length ? <Chip label={`${source.project.assets.length} assets`} size="small" variant="outlined" /> : null}
                <Chip label="Embed snippet" size="small" variant="outlined" />
                <Chip label="Deployment guide" size="small" variant="outlined" />
                <Chip label="Manifest" size="small" variant="outlined" />
              </Stack>
            </Box>
            <Divider />
            <StudioButton disabled={busy} onClick={() => void copySnippet()} startIcon={<ContentCopyOutlinedIcon />} variant="outlined">
              Copy {documentationTarget === 'mkdocs' ? 'MkDocs' : 'Static HTML'} snippet
            </StudioButton>
          </Stack>
        ) : null}

        {destination === 'grafana' ? (
          <Stack spacing={studioSpace.space16}>
            <Box>
              <Typography component="h3" sx={{ mb: studioSpace.space8 }} variant="subtitle2">Bundle readiness</Typography>
              <Stack spacing={studioSpace.space8}>
                <ReadinessRow ready text="Topology and stylesheet validated" />
                <ReadinessRow ready={Boolean(source.project.documents.mapper)} text="Mapper YAML configured" />
                <ReadinessRow ready={grafanaReadiness.ready} text="Grafana mapper contract validated" />
              </Stack>
            </Box>
            {!grafanaReadiness.ready ? <StudioAlert severity="warning">{grafanaReadiness.reason}</StudioAlert> : (
              <StudioAlert severity="success">Grafana bundle is ready for mounted-file deployment.</StudioAlert>
            )}
          </Stack>
        ) : null}

        {stage ? (
          <Box aria-live="polite" sx={{ mt: studioSpace.space16 }}>
            <Typography sx={{ mb: studioSpace.space8 }} variant="body2">{stageLabels[stage]}</Typography>
            <StudioLinearProgress />
          </Box>
        ) : null}
        {success ? <StudioAlert severity="success" sx={{ mt: studioSpace.space16 }}>{success}</StudioAlert> : null}
        {error ? <StudioAlert severity="error" sx={{ mt: studioSpace.space16 }}>{error}</StudioAlert> : null}
      </StudioDialogContent>
      <StudioDialogActions>
        {busy ? <StudioButton onClick={() => abortRef.current?.abort()}>Cancel</StudioButton> : null}
        <StudioButton
          disabled={busy}
          onClick={() => void primaryAction.onClick()}
          startIcon={destination === 'grafana' && !grafanaReadiness.ready ? <SettingsOutlinedIcon /> : <DownloadOutlinedIcon />}
          variant="contained"
        >
          {primaryAction.label}
        </StudioButton>
      </StudioDialogActions>
    </StudioDialog>
  );
}
