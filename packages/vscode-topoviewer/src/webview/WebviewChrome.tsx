import '@xyflow/react/dist/style.css';
import '../../../topoviewer/src/styles.css';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LaunchIcon from '@mui/icons-material/Launch';
import { TopoViewer, defaultTopoViewerToggles, type TopoDocument, type TopoViewerNodePositionChange, type TopoViewerObjectClick } from 'topoviewer';
import { memo, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { Theme } from '@mui/material/styles';
import type { TopoViewerWebviewHost } from '../shared/types';
import type { TopoObjectSelection } from '../shared/topologyMutations';
import type { DocumentTransaction } from './webviewAppSupport';
import { useRenderProfile } from './renderProfile';

interface ShellHeaderProps {
  host: TopoViewerWebviewHost;
  nextThemeMode: 'light' | 'dark';
  onToggleThemeMode?: () => void;
  themeMode?: 'light' | 'dark';
}

interface ResizeDividerProps {
  defaultSplitPercent: number;
  maxSplitPercent: number;
  minSplitPercent: number;
  setResizing: Dispatch<SetStateAction<boolean>>;
  setSplitPercent: Dispatch<SetStateAction<number>>;
  splitPercent: number;
  updateSplitFromClientX: (clientX: number) => void;
  clamp: (value: number, min: number, max: number) => number;
}

interface PreviewPanelProps {
  exportImage: () => Promise<void>;
  exportTooltip?: string;
  handleNodePositionChange: (change: TopoViewerNodePositionChange) => void;
  handleObjectClick: (object: TopoViewerObjectClick) => void;
  hasErrors: boolean;
  hasExportBlockers: boolean;
  loading: boolean;
  previewRef: RefObject<HTMLDivElement>;
  parityMode?: boolean;
  redoStack: DocumentTransaction[];
  redoTopology: () => void;
  selectedLayerIds: string[];
  selectedObjectIds: string[];
  setSelectedObjects: Dispatch<SetStateAction<TopoObjectSelection[]>>;
  undoStack: DocumentTransaction[];
  undoTopology: () => void;
  visibleDocument?: TopoDocument;
}

export function webviewShellSx(theme: Theme) {
  return {
    '--topoviewer-vscode-canvas-min': theme.spacing(60),
    '--topoviewer-vscode-control-min': theme.spacing(3.75),
    '--topoviewer-vscode-divider-size': theme.spacing(1),
    '--topoviewer-vscode-focus-width': theme.spacing(0.25),
    '--topoviewer-vscode-radius': theme.spacing(0.75),
    '--topoviewer-vscode-radius-lg': theme.spacing(1),
    '--topoviewer-vscode-space-half': theme.spacing(0.5),
    '--topoviewer-vscode-space-1': theme.spacing(1),
    '--topoviewer-vscode-space-1-5': theme.spacing(1.5),
    '--topoviewer-vscode-space-2': theme.spacing(2),
    '--topoviewer-vscode-space-3-5': theme.spacing(3.5),
    '--topoviewer-vscode-stacked-panel-min': theme.spacing(28),
    '--topoviewer-vscode-stacked-panel-max': theme.spacing(54),
    '--topoviewer-vscode-stacked-yaml-min': theme.spacing(44),
    '--topoviewer-vscode-stacked-preview-min': theme.spacing(65)
  };
}

export const ShellHeader = memo(function ShellHeader({ host, nextThemeMode, onToggleThemeMode, themeMode }: ShellHeaderProps) {
  useRenderProfile('ShellHeader', { host: host.kind });
  return (
    <AppBar position="static" elevation={0} color="default">
      <Toolbar variant="dense" className="topoviewer-vscode-toolbar">
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>TopoViewer</Typography>
        <Chip size="small" label={host.kind === 'browser' ? 'Browser harness' : 'VS Code webview'} color={host.kind === 'browser' ? 'info' : 'primary'} />
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Open TopoViewer Zensical docs">
          <Button
            aria-label="Open TopoViewer Zensical docs"
            color="inherit"
            endIcon={<LaunchIcon fontSize="small" />}
            size="small"
            onClick={() => host.openDocs('docs/zensical/')}
          >
            Docs
          </Button>
        </Tooltip>
        {themeMode && onToggleThemeMode && (
          <Tooltip title={`Switch to ${nextThemeMode} mode`}>
            <IconButton aria-label={`Switch to ${nextThemeMode} mode`} color="inherit" size="small" onClick={onToggleThemeMode}>
              {themeMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
    </AppBar>
  );
});

export const ResizeDivider = memo(function ResizeDivider({ clamp, defaultSplitPercent, maxSplitPercent, minSplitPercent, setResizing, setSplitPercent, splitPercent, updateSplitFromClientX }: ResizeDividerProps) {
  useRenderProfile('ResizeDivider', { splitPercent: Math.round(splitPercent) });
  return (
    <Box
      className="topoviewer-vscode-divider"
      role="separator"
      aria-label="Resize authoring column and canvas"
      aria-orientation="vertical"
      aria-valuemin={minSplitPercent}
      aria-valuemax={maxSplitPercent}
      aria-valuenow={Math.round(splitPercent)}
      tabIndex={0}
      onPointerDown={(event) => {
        if (event.detail > 1) return;
        event.preventDefault();
        setResizing(true);
        updateSplitFromClientX(event.clientX);
      }}
      onClick={(event) => {
        if (event.detail === 2) setSplitPercent(defaultSplitPercent);
      }}
      onDoubleClick={() => setSplitPercent(defaultSplitPercent)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') setSplitPercent((current) => clamp(current - 2, minSplitPercent, maxSplitPercent));
        if (event.key === 'ArrowRight') setSplitPercent((current) => clamp(current + 2, minSplitPercent, maxSplitPercent));
        if (event.key === 'Home') setSplitPercent(defaultSplitPercent);
      }}
    />
  );
});

export const PreviewPanel = memo(function PreviewPanel({ exportImage, exportTooltip, handleNodePositionChange, handleObjectClick, hasErrors, hasExportBlockers, loading, parityMode = false, previewRef, redoStack, redoTopology, selectedLayerIds, selectedObjectIds, setSelectedObjects, undoStack, undoTopology, visibleDocument }: PreviewPanelProps) {
  useRenderProfile('PreviewPanel', {
    hasDocument: !!visibleDocument,
    selectedLayers: selectedLayerIds.length,
    selectedObjects: selectedObjectIds.length
  });
  const effectiveSelectedLayerIds = parityMode
    ? (visibleDocument?.graph?.layers || []).map((layer) => layer.id)
    : selectedLayerIds;
  const viewerToggles = visibleDocument
    ? {
      ...defaultTopoViewerToggles(visibleDocument),
      showRegions: true
    }
    : { showRegions: true };

  return (
    <Paper className={`topoviewer-vscode-preview${parityMode ? ' topoviewer-vscode-preview--parity topoviewer-parity-theme' : ''}`} elevation={0} ref={previewRef}>
      {parityMode ? null : (
        <Box className="topoviewer-vscode-preview-actions">
          <Button size="small" disabled={!undoStack.length} onClick={undoTopology}>Undo</Button>
          <Button size="small" disabled={!redoStack.length} onClick={redoTopology}>Redo</Button>
        </Box>
      )}
      {loading && <CircularProgress />}
      {!loading && hasErrors && <Alert severity="error">Fix diagnostics before the preview can render.</Alert>}
      {!loading && !hasErrors && visibleDocument && (
        <TopoViewer
          document={visibleDocument}
          selectedLayerIds={effectiveSelectedLayerIds}
          selectedObjectIds={selectedObjectIds}
          exportDisabled={hasExportBlockers}
          exportTooltip={exportTooltip}
          onExport={parityMode ? undefined : exportImage}
          toggles={parityMode ? defaultTopoViewerToggles(visibleDocument) : viewerToggles}
          onObjectClick={handleObjectClick}
          onPaneClick={() => setSelectedObjects([])}
          onNodePositionChange={handleNodePositionChange}
          helperLines={parityMode ? false : { enabled: true, snap: true, snapMode: 'commit', showMidpoints: true }}
        />
      )}
    </Paper>
  );
});
