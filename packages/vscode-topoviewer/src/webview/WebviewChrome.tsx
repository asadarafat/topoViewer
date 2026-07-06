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
import Typography from '@mui/material/Typography';
import AddBoxIcon from '@mui/icons-material/AddBox';
import CableIcon from '@mui/icons-material/Cable';
import CategoryIcon from '@mui/icons-material/Category';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import CropFreeIcon from '@mui/icons-material/CropFree';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LaunchIcon from '@mui/icons-material/Launch';
import MouseIcon from '@mui/icons-material/Mouse';
import PanToolAltIcon from '@mui/icons-material/PanToolAlt';
import PolylineIcon from '@mui/icons-material/Polyline';
import { TopoViewer, defaultTopoViewerToggles, type TopoDocument, type TopoViewerNodePositionChange, type TopoViewerObjectClick } from 'topoviewer';
import { memo, useCallback, useEffect, useState, type ComponentType, type Dispatch, type RefObject, type SetStateAction } from 'react';
import type { Theme } from '@mui/material/styles';
import type { TopoViewerWebviewHost } from '../shared/types';
import type { TopoObjectSelection } from '../shared/topologyMutations';
import type { DocumentTransaction } from './webviewAppSupport';
import { defaultCanvasAuthoringState, reduceCanvasAuthoringState, type CanvasAuthoringTool } from './canvasAuthoring';
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

const canvasToolDefinitions: Array<{
  icon: ComponentType<{ fontSize?: 'inherit' | 'small' | 'medium' | 'large' }>;
  label: string;
  shortcut: string;
  tool: CanvasAuthoringTool;
}> = [
  { icon: MouseIcon, label: 'Select tool', shortcut: 'V', tool: 'select' },
  { icon: PanToolAltIcon, label: 'Pan tool', shortcut: 'H', tool: 'pan' },
  { icon: AddBoxIcon, label: 'Node tool', shortcut: 'N', tool: 'node' },
  { icon: CableIcon, label: 'Link tool', shortcut: 'L', tool: 'link' },
  { icon: PolylineIcon, label: 'Path tool', shortcut: 'P', tool: 'path' },
  { icon: CategoryIcon, label: 'Region tool', shortcut: 'G', tool: 'region' },
  { icon: CropFreeIcon, label: 'Shape tool', shortcut: 'D', tool: 'shape' },
  { icon: ChatBubbleIcon, label: 'Callout tool', shortcut: 'A', tool: 'callout' }
];

const canvasToolByShortcut = new Map(canvasToolDefinitions.map((definition) => [definition.shortcut.toLowerCase(), definition.tool]));

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
        <Button
          aria-label="Open TopoViewer Zensical docs"
          color="inherit"
          endIcon={<LaunchIcon fontSize="small" />}
          size="small"
          title="Open TopoViewer Zensical docs"
          onClick={() => host.openDocs('docs/zensical/')}
        >
          Docs
        </Button>
        {themeMode && onToggleThemeMode && (
          <IconButton aria-label={`Switch to ${nextThemeMode} mode`} color="inherit" size="small" title={`Switch to ${nextThemeMode} mode`} onClick={onToggleThemeMode}>
            {themeMode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
          </IconButton>
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
  const [canvasAuthoring, setCanvasAuthoring] = useState(defaultCanvasAuthoringState);
  useRenderProfile('PreviewPanel', {
    hasDocument: !!visibleDocument,
    canvasTool: canvasAuthoring.activeTool,
    selectedLayers: selectedLayerIds.length,
    selectedObjects: selectedObjectIds.length
  });
  const selectCanvasTool = useCallback((tool: CanvasAuthoringTool, sticky = true) => {
    setCanvasAuthoring((current) => reduceCanvasAuthoringState(current, {
      sticky,
      tool,
      type: 'selectTool'
    }));
  }, []);
  useEffect(() => {
    if (parityMode) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Escape') {
        setCanvasAuthoring((current) => reduceCanvasAuthoringState(current, { type: 'cancel' }));
        return;
      }
      const tool = canvasToolByShortcut.get(event.key.toLowerCase());
      if (!tool) return;
      event.preventDefault();
      selectCanvasTool(tool);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [parityMode, selectCanvasTool]);
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
    <Paper className={`topoviewer-vscode-preview topoviewer-vscode-preview--tool-${canvasAuthoring.activeTool}${parityMode ? ' topoviewer-vscode-preview--parity topoviewer-parity-theme' : ''}`} elevation={0} ref={previewRef}>
      {parityMode ? null : (
        <>
          <Box className="topoviewer-vscode-preview-actions">
            <Button size="small" disabled={!undoStack.length} onClick={undoTopology}>Undo</Button>
            <Button size="small" disabled={!redoStack.length} onClick={redoTopology}>Redo</Button>
          </Box>
          <Box className="topoviewer-vscode-canvas-toolbar" role="toolbar" aria-label="Canvas authoring tools">
            {canvasToolDefinitions.map(({ icon: Icon, label, shortcut, tool }) => {
              const active = canvasAuthoring.activeTool === tool;
              return (
                <IconButton
                  key={tool}
                  aria-label={label}
                  aria-pressed={active}
                  className={active ? 'topoviewer-vscode-canvas-tool topoviewer-vscode-canvas-tool--active' : 'topoviewer-vscode-canvas-tool'}
                  color={active ? 'primary' : 'default'}
                  size="small"
                  title={`${label} (${shortcut})`}
                  onClick={() => selectCanvasTool(tool)}
                >
                  <Icon fontSize="small" />
                </IconButton>
              );
            })}
          </Box>
        </>
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
