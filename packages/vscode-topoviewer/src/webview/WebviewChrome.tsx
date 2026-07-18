import '@xyflow/react/dist/style.css';
import 'topoviewer/style.css';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
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
import { TopoViewer, defaultTopoViewerToggles, displayName, type TopoDocument, type TopoViewerConnectionCreate, type TopoViewerNodePositionChange, type TopoViewerObjectClick, type TopoViewerPaneClick } from 'topoviewer';
import { ViewportSettingsPanel, authoringHelperLinesOptions, layerIds, toggleSelectedLayerId } from 'topoviewer/integration';
import { memo, useCallback, useEffect, useMemo, useState, type ComponentType, type Dispatch, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type RefObject, type SetStateAction } from 'react';
import type { Theme } from '@mui/material/styles';
import type { TopoViewerWebviewHost } from '../shared/types';
import { graphHasReachabilityBetween, pathSegmentsWithoutDirectLinks, pathSegmentsWithoutReachability, type TopoObjectSelection } from '../shared/topologyMutations';
import type { DocumentTransaction } from './webviewAppSupport';
import { clientPointToTopologyPoint, defaultCanvasAuthoringState, layersForCanvasTool, nodeIdsWithinCanvasBounds, normalizedCanvasRect, objectSelectionsWithinCanvasBounds, reduceCanvasAuthoringState, snapTopologyPoint, type CanvasAuthoringPoint, type CanvasAuthoringRect, type CanvasAuthoringTool, type CanvasSelectionAlignment, type CanvasSelectionDistributionAxis } from './canvasAuthoring';
import { useRenderProfile } from './renderProfile';
import type { TopoViewerNodeResizeChange, TopoViewerRegionAggregateToggle } from './topoviewerEventTypes';

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
  alignSelectedObjects: (alignment: CanvasSelectionAlignment, gridSize?: number) => void;
  copySelectedObjects: () => void;
  deleteSelectedObjects: () => void;
  distributeSelectedObjects: (axis: CanvasSelectionDistributionAxis, gridSize?: number) => void;
  duplicateSelectedObjects: () => void;
  exportImage: () => Promise<void>;
  exportTooltip?: string;
  createCanvasConnection: (connection: TopoViewerConnectionCreate) => void;
  createCanvasPath: (sequence: string[]) => void;
  createCanvasRegion: (members: string[], bounds?: CanvasAuthoringRect) => void;
  handleNodePositionChange: (change: TopoViewerNodePositionChange) => void;
  handleNodeResizeChange: (change: TopoViewerNodeResizeChange) => void;
  handleObjectClick: (object: TopoViewerObjectClick) => void;
  handleRegionAggregateToggle: (change: TopoViewerRegionAggregateToggle) => void;
  hasErrors: boolean;
  hasExportBlockers: boolean;
  loading: boolean;
  pasteSelectedObjects: () => void;
  placeCanvasCallout: (position: { x: number; y: number }) => void;
  placeCanvasNode: (position: { x: number; y: number }) => void;
  placeCanvasShape: (position: { x: number; y: number }) => void;
  previewRef: RefObject<HTMLDivElement>;
  parityMode?: boolean;
  redoStack: DocumentTransaction[];
  redoTopology: () => void;
  releaseNodeFromRegion: (nodeId: string, regionId: string) => void;
  selectedLayerIds: string[];
  selectedObjectIds: string[];
  setSelectedLayerIds: Dispatch<SetStateAction<string[]>>;
  setSelectedObjects: Dispatch<SetStateAction<TopoObjectSelection[]>>;
  snapSelectedObjectsToGrid: (gridSize: number) => void;
  nudgeSelectedObjects: (delta: CanvasAuthoringPoint, gridSize?: number) => void;
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
const editableShortcutSelector = [
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="option"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '.monaco-editor',
  '.topoviewer-vscode-editor'
].join(',');

function isEditableShortcutContext(target: EventTarget | null) {
  const candidates = [
    target instanceof HTMLElement ? target : undefined,
    document.activeElement instanceof HTMLElement ? document.activeElement : undefined
  ];
  return candidates.some((candidate) => {
    if (!candidate) return false;
    if (candidate.matches(editableShortcutSelector)) return true;
    if (candidate.isContentEditable) return true;
    return Boolean(candidate.closest(editableShortcutSelector));
  });
}

type PendingRegionDrag = {
  currentClient: CanvasAuthoringPoint;
  currentTopology: CanvasAuthoringPoint;
  pointerId: number;
  startClient: CanvasAuthoringPoint;
  startTopology: CanvasAuthoringPoint;
};

type PendingSelectionDrag = PendingRegionDrag;

function reactFlowViewportFromPreview(preview: HTMLElement) {
  const pane = preview.querySelector<HTMLElement>('.react-flow__pane');
  const viewportElement = preview.querySelector<HTMLElement>('.react-flow__viewport');
  if (!pane || !viewportElement) return undefined;
  const paneBounds = pane.getBoundingClientRect();
  const transform = getComputedStyle(viewportElement).transform;
  const matrix = new DOMMatrixReadOnly(transform === 'none' ? undefined : transform);
  return {
    paneBounds,
    viewport: {
      x: matrix.m41,
      y: matrix.m42,
      zoom: matrix.a || 1
    }
  };
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

export const PreviewPanel = memo(function PreviewPanel({ alignSelectedObjects, copySelectedObjects, deleteSelectedObjects, distributeSelectedObjects, duplicateSelectedObjects, exportImage, exportTooltip, createCanvasConnection, createCanvasPath, createCanvasRegion, handleNodePositionChange, handleNodeResizeChange, handleObjectClick, handleRegionAggregateToggle, hasErrors, hasExportBlockers, loading, parityMode = false, pasteSelectedObjects, placeCanvasCallout, placeCanvasNode, placeCanvasShape, previewRef, redoStack, redoTopology, releaseNodeFromRegion, selectedLayerIds, selectedObjectIds, setSelectedLayerIds, setSelectedObjects, snapSelectedObjectsToGrid, nudgeSelectedObjects, undoStack, undoTopology, visibleDocument }: PreviewPanelProps) {
  const [canvasAuthoring, setCanvasAuthoring] = useState(defaultCanvasAuthoringState);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [gridSnapEnabled, setGridSnapEnabled] = useState(false);
  const [helperLinesEnabled, setHelperLinesEnabled] = useState(true);
  const [pendingPathNodeIds, setPendingPathNodeIds] = useState<string[]>([]);
  const [pendingPathMessage, setPendingPathMessage] = useState<string>();
  const [pendingRegionDrag, setPendingRegionDrag] = useState<PendingRegionDrag>();
  const [pendingRegionMessage, setPendingRegionMessage] = useState<string>();
  const [pendingSelectionDrag, setPendingSelectionDrag] = useState<PendingSelectionDrag>();
  const [regionContextMenu, setRegionContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    nodeId: string;
    regionIds: string[];
  }>();
  useRenderProfile('PreviewPanel', {
    hasDocument: !!visibleDocument,
    canvasTool: canvasAuthoring.activeTool,
    selectedLayers: selectedLayerIds.length,
    selectedObjects: selectedObjectIds.length
  });
  const gridSnapSize = 20;
  const selectCanvasTool = useCallback((tool: CanvasAuthoringTool, sticky = true) => {
    setCanvasAuthoring((current) => reduceCanvasAuthoringState(current, {
      sticky,
      tool,
      type: 'selectTool'
    }));
  }, []);
  const nodeNameById = useMemo(() => {
    const nodes = visibleDocument?.graph?.nodes || [];
    return new Map(nodes.map((node) => [String(node.id), displayName(node)]));
  }, [visibleDocument]);
  const regionNameById = useMemo(() => {
    const regions = visibleDocument?.graph?.regions || [];
    return new Map(regions.map((region) => [String(region.id), displayName(region)]));
  }, [visibleDocument]);
  const directRegionIdsByNodeId = useMemo(() => {
    const regions = visibleDocument?.graph?.regions || [];
    const regionIdsByNodeId = new Map<string, string[]>();
    regions.forEach((region) => {
      const regionId = String(region.id || '');
      if (!regionId || !Array.isArray(region.members)) return;
      region.members.forEach((memberId) => {
        const nodeId = String(memberId || '');
        if (!nodeId) return;
        const current = regionIdsByNodeId.get(nodeId) || [];
        current.push(regionId);
        regionIdsByNodeId.set(nodeId, current);
      });
    });
    return regionIdsByNodeId;
  }, [visibleDocument]);
  const pendingPathLabel = pendingPathNodeIds.length
    ? pendingPathNodeIds.map((id) => nodeNameById.get(id) || id).join(' -> ')
    : 'Click nodes to build a path';
  const selectedRegionMemberIds = useMemo(() => {
    const nodeIds = new Set((visibleDocument?.graph?.nodes || []).map((node) => String(node.id)));
    return selectedObjectIds.filter((id) => nodeIds.has(id));
  }, [selectedObjectIds, visibleDocument]);
  const regionSelectionLabel = selectedRegionMemberIds.length
    ? selectedRegionMemberIds.map((id) => nodeNameById.get(id) || id).join(', ')
    : 'Click the canvas to place a region, or drag an area';
  const commitPendingPath = useCallback(() => {
    if (pendingPathNodeIds.length < 2) {
      setPendingPathMessage('Path requires at least two nodes');
      return;
    }
    const unreachable = pathSegmentsWithoutReachability(visibleDocument, pendingPathNodeIds);
    if (unreachable.length) {
      setPendingPathMessage(`Path requires graph reachability between ${nodeNameById.get(unreachable[0].source) || unreachable[0].source} and ${nodeNameById.get(unreachable[0].target) || unreachable[0].target}`);
      return;
    }
    createCanvasPath(pendingPathNodeIds);
    setPendingPathNodeIds([]);
    setPendingPathMessage(undefined);
    setCanvasAuthoring((current) => reduceCanvasAuthoringState(current, { type: 'completeAction' }));
  }, [createCanvasPath, nodeNameById, pendingPathNodeIds, visibleDocument]);
  const cancelPendingPath = useCallback(() => {
    setPendingPathNodeIds([]);
    setPendingPathMessage(undefined);
    setCanvasAuthoring((current) => reduceCanvasAuthoringState(current, { type: 'cancel' }));
  }, []);
  const commitSelectedRegion = useCallback(() => {
    if (!selectedRegionMemberIds.length) return;
    createCanvasRegion(selectedRegionMemberIds);
    setPendingRegionMessage(undefined);
    setCanvasAuthoring((current) => reduceCanvasAuthoringState(current, { type: 'cancel' }));
  }, [createCanvasRegion, selectedRegionMemberIds]);
  const topologyPointFromPointer = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const preview = previewRef.current;
    if (!preview) return undefined;
    const geometry = reactFlowViewportFromPreview(preview);
    if (!geometry) return undefined;
    return clientPointToTopologyPoint(
      { x: event.clientX, y: event.clientY },
      { left: geometry.paneBounds.left, top: geometry.paneBounds.top },
      geometry.viewport
    );
  }, [previewRef]);
  const startPendingRegionDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (parityMode || canvasAuthoring.activeTool !== 'region' || event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.react-flow__pane')) return;
    const topologyPoint = topologyPointFromPointer(event);
    if (!topologyPoint) return;
    const clientPoint = { x: event.clientX, y: event.clientY };
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setPendingRegionDrag({
      currentClient: clientPoint,
      currentTopology: topologyPoint,
      pointerId: event.pointerId,
      startClient: clientPoint,
      startTopology: topologyPoint
    });
    setPendingRegionMessage(undefined);
  }, [canvasAuthoring.activeTool, parityMode, topologyPointFromPointer]);
  const updatePendingRegionDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!pendingRegionDrag || event.pointerId !== pendingRegionDrag.pointerId) return;
    const topologyPoint = topologyPointFromPointer(event);
    if (!topologyPoint) return;
    event.preventDefault();
    event.stopPropagation();
    setPendingRegionDrag((current) => current && current.pointerId === event.pointerId
      ? {
        ...current,
        currentClient: { x: event.clientX, y: event.clientY },
        currentTopology: topologyPoint
      }
      : current);
  }, [pendingRegionDrag, topologyPointFromPointer]);
  const cancelPendingRegionDrag = useCallback((event?: ReactPointerEvent<HTMLElement>) => {
    if (event && pendingRegionDrag && event.pointerId === pendingRegionDrag.pointerId) {
      event.preventDefault();
      event.stopPropagation();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setPendingRegionDrag(undefined);
  }, [pendingRegionDrag]);
  const commitPendingRegionDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!pendingRegionDrag || event.pointerId !== pendingRegionDrag.pointerId) return;
    const topologyPoint = topologyPointFromPointer(event) || pendingRegionDrag.currentTopology;
    const bounds = normalizedCanvasRect(pendingRegionDrag.startTopology, topologyPoint);
    const clientBounds = normalizedCanvasRect(pendingRegionDrag.startClient, { x: event.clientX, y: event.clientY });
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setPendingRegionDrag(undefined);
    if (clientBounds.width < 8 || clientBounds.height < 8 || bounds.width <= 0 || bounds.height <= 0) {
      const size = { width: 260, height: 160 };
      createCanvasRegion([], {
        height: size.height,
        width: size.width,
        x: Math.round(topologyPoint.x - size.width / 2),
        y: Math.round(topologyPoint.y - size.height / 2)
      });
      setPendingRegionMessage(undefined);
      setCanvasAuthoring((current) => reduceCanvasAuthoringState(current, { type: 'cancel' }));
      return;
    }
    const members = nodeIdsWithinCanvasBounds(visibleDocument, bounds, selectedLayerIds);
    createCanvasRegion(members, bounds);
    setPendingRegionMessage(undefined);
    setCanvasAuthoring((current) => reduceCanvasAuthoringState(current, { type: 'cancel' }));
  }, [createCanvasRegion, pendingRegionDrag, selectedLayerIds, topologyPointFromPointer, visibleDocument]);
  const startPendingSelectionDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (parityMode || canvasAuthoring.activeTool !== 'select' || event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (!target?.classList.contains('react-flow__pane')) return;
    const topologyPoint = topologyPointFromPointer(event);
    if (!topologyPoint) return;
    const clientPoint = { x: event.clientX, y: event.clientY };
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setPendingSelectionDrag({
      currentClient: clientPoint,
      currentTopology: topologyPoint,
      pointerId: event.pointerId,
      startClient: clientPoint,
      startTopology: topologyPoint
    });
  }, [canvasAuthoring.activeTool, parityMode, topologyPointFromPointer]);
  const updatePendingSelectionDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!pendingSelectionDrag || event.pointerId !== pendingSelectionDrag.pointerId) return;
    const topologyPoint = topologyPointFromPointer(event);
    if (!topologyPoint) return;
    event.preventDefault();
    event.stopPropagation();
    setPendingSelectionDrag((current) => current && current.pointerId === event.pointerId
      ? {
        ...current,
        currentClient: { x: event.clientX, y: event.clientY },
        currentTopology: topologyPoint
      }
      : current);
  }, [pendingSelectionDrag, topologyPointFromPointer]);
  const cancelPendingSelectionDrag = useCallback((event?: ReactPointerEvent<HTMLElement>) => {
    if (event && pendingSelectionDrag && event.pointerId === pendingSelectionDrag.pointerId) {
      event.preventDefault();
      event.stopPropagation();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setPendingSelectionDrag(undefined);
  }, [pendingSelectionDrag]);
  const commitPendingSelectionDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!pendingSelectionDrag || event.pointerId !== pendingSelectionDrag.pointerId) return;
    const topologyPoint = topologyPointFromPointer(event) || pendingSelectionDrag.currentTopology;
    const bounds = normalizedCanvasRect(pendingSelectionDrag.startTopology, topologyPoint);
    const clientBounds = normalizedCanvasRect(pendingSelectionDrag.startClient, { x: event.clientX, y: event.clientY });
    event.preventDefault();
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setPendingSelectionDrag(undefined);
    if (clientBounds.width < 8 || clientBounds.height < 8 || bounds.width <= 0 || bounds.height <= 0) return;
    setSelectedObjects(objectSelectionsWithinCanvasBounds(visibleDocument, bounds, selectedLayerIds));
  }, [pendingSelectionDrag, selectedLayerIds, setSelectedObjects, topologyPointFromPointer, visibleDocument]);
  useEffect(() => {
    if (parityMode) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableShortcutContext(event.target)) return;
      if ((event.metaKey || event.ctrlKey) && !event.altKey) {
        const key = event.key.toLowerCase();
        if (key === 'c') {
          event.preventDefault();
          copySelectedObjects();
          return;
        }
        if (key === 'd') {
          event.preventDefault();
          duplicateSelectedObjects();
          return;
        }
        if (key === 'v') {
          event.preventDefault();
          pasteSelectedObjects();
          return;
        }
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        deleteSelectedObjects();
        return;
      }
      if (canvasAuthoring.activeTool === 'select' && selectedObjectIds.length > 0 && event.key.startsWith('Arrow')) {
        const baseStep = gridSnapEnabled ? gridSnapSize : 1;
        const step = event.shiftKey ? baseStep * 10 : baseStep;
        const delta = {
          x: event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
          y: event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
        };
        event.preventDefault();
        nudgeSelectedObjects(delta, gridSnapEnabled ? gridSnapSize : undefined);
        return;
      }
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'Escape') {
        cancelPendingPath();
        return;
      }
      if (event.key === 'Enter' && canvasAuthoring.activeTool === 'path') {
        event.preventDefault();
        commitPendingPath();
        return;
      }
      const tool = canvasToolByShortcut.get(event.key.toLowerCase());
      if (!tool) return;
      event.preventDefault();
      selectCanvasTool(tool);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelPendingPath, canvasAuthoring.activeTool, commitPendingPath, copySelectedObjects, deleteSelectedObjects, duplicateSelectedObjects, gridSnapEnabled, nudgeSelectedObjects, parityMode, pasteSelectedObjects, selectCanvasTool, selectedObjectIds.length]);
  useEffect(() => {
    if (canvasAuthoring.activeTool !== 'path') {
      setPendingPathNodeIds([]);
      setPendingPathMessage(undefined);
    }
  }, [canvasAuthoring.activeTool]);
  useEffect(() => {
    if (canvasAuthoring.activeTool !== 'region') {
      setPendingRegionDrag(undefined);
      setPendingRegionMessage(undefined);
    }
  }, [canvasAuthoring.activeTool]);
  useEffect(() => {
    if (canvasAuthoring.activeTool !== 'select') {
      setPendingSelectionDrag(undefined);
    }
  }, [canvasAuthoring.activeTool]);
  const handlePaneClick = useCallback((event: TopoViewerPaneClick) => {
    if (!parityMode && canvasAuthoring.activeTool === 'node') {
      placeCanvasNode(event.position);
      setCanvasAuthoring((current) => reduceCanvasAuthoringState(current, { type: 'completeAction' }));
      return;
    }
    if (!parityMode && canvasAuthoring.activeTool === 'shape') {
      placeCanvasShape(event.position);
      setCanvasAuthoring((current) => reduceCanvasAuthoringState(current, { type: 'completeAction' }));
      return;
    }
    if (!parityMode && canvasAuthoring.activeTool === 'callout') {
      placeCanvasCallout(event.position);
      setCanvasAuthoring((current) => reduceCanvasAuthoringState(current, { type: 'completeAction' }));
      return;
    }
    if (!parityMode && canvasAuthoring.activeTool === 'path') {
      setPendingPathMessage('Click a node to add it to the path');
      return;
    }
    if (!parityMode && canvasAuthoring.activeTool === 'region') {
      const size = { width: 260, height: 160 };
      createCanvasRegion([], {
        height: size.height,
        width: size.width,
        x: Math.round(event.position.x - size.width / 2),
        y: Math.round(event.position.y - size.height / 2)
      });
      setPendingRegionMessage(undefined);
      setCanvasAuthoring((current) => reduceCanvasAuthoringState(current, { type: 'cancel' }));
      return;
    }
    if (canvasAuthoring.activeTool === 'select') setSelectedObjects([]);
  }, [canvasAuthoring.activeTool, createCanvasRegion, parityMode, placeCanvasCallout, placeCanvasNode, placeCanvasShape, setSelectedObjects]);
  const handlePreviewObjectClick = useCallback((object: TopoViewerObjectClick) => {
    if (!parityMode && canvasAuthoring.activeTool === 'path') {
      const nodeIds = new Set((visibleDocument?.graph?.nodes || []).map((node) => String(node.id)));
      if (!nodeIds.has(object.id)) {
        setPendingPathMessage('Path tool accepts node clicks only');
        return;
      }
      if (pendingPathNodeIds.includes(object.id)) {
        setPendingPathMessage(`${nodeNameById.get(object.id) || object.id} is already in the path`);
        return;
      }
      const previousNodeId = pendingPathNodeIds[pendingPathNodeIds.length - 1];
      if (previousNodeId && !graphHasReachabilityBetween(visibleDocument, previousNodeId, object.id)) {
        setPendingPathMessage(`Path requires graph reachability between ${nodeNameById.get(previousNodeId) || previousNodeId} and ${nodeNameById.get(object.id) || object.id}`);
        return;
      }
      const next = [...pendingPathNodeIds, object.id];
      const looseSegments = pathSegmentsWithoutDirectLinks(visibleDocument, next);
      setPendingPathNodeIds(next);
      if (looseSegments.length) {
        const latest = looseSegments[looseSegments.length - 1];
        setPendingPathMessage(`Loose tunnel segment: ${nodeNameById.get(latest.source) || latest.source} -> ${nodeNameById.get(latest.target) || latest.target}`);
      } else {
        setPendingPathMessage(undefined);
      }
      setSelectedObjects(next.map((id) => ({ kind: 'node', id })));
      return;
    }
    if (!parityMode && object.element === 'node' && object.data?.isAggregate === true && object.data.aggregateBy === 'region') {
      const regionId = String(object.data.aggregateSourceId || '');
      const groupId = String(object.data.aggregateId || '');
      if (regionId && groupId) {
        handleRegionAggregateToggle({
          data: object.data,
          expanded: true,
          groupId,
          regionId
        });
        return;
      }
    }
    handleObjectClick(object);
  }, [canvasAuthoring.activeTool, handleObjectClick, handleRegionAggregateToggle, nodeNameById, parityMode, pendingPathNodeIds, setSelectedObjects, visibleDocument]);
  const effectiveSelectedLayerIds = parityMode
    ? layerIds(visibleDocument?.graph?.layers)
    : selectedLayerIds;
  const visibleDocumentWithPendingPath = useMemo(() => {
    if (!visibleDocument || pendingPathNodeIds.length < 2 || canvasAuthoring.activeTool !== 'path') return visibleDocument;
    const pathLayerIds = layersForCanvasTool('path', selectedLayerIds);
    return {
      ...visibleDocument,
      graph: {
        ...visibleDocument.graph,
        paths: [
          ...(visibleDocument.graph?.paths || []),
          {
            id: '__pending-canvas-path',
            labels: { name: 'Pending path', path: 'pending' },
            layers: pathLayerIds,
            sequence: pendingPathNodeIds
          }
        ]
      }
    };
  }, [canvasAuthoring.activeTool, pendingPathNodeIds, selectedLayerIds, visibleDocument]);
  const previewSelectedObjectIds = useMemo(() => {
    if (canvasAuthoring.activeTool !== 'path' || !pendingPathNodeIds.length) return selectedObjectIds;
    return Array.from(new Set([...selectedObjectIds, ...pendingPathNodeIds, '__pending-canvas-path']));
  }, [canvasAuthoring.activeTool, pendingPathNodeIds, selectedObjectIds]);
  const viewportLayers = visibleDocument?.graph?.layers || [];
  const viewerToggles = visibleDocument
    ? {
      ...defaultTopoViewerToggles(visibleDocument),
      showRegions: true
    }
    : { showRegions: true };
  const setLayerEnabled = useCallback((layerId: string, enabled: boolean) => {
    setSelectedLayerIds((current) => toggleSelectedLayerId(current, layerId, enabled));
  }, [setSelectedLayerIds]);
  const snapNodePositionChange = useCallback((change: TopoViewerNodePositionChange): TopoViewerNodePositionChange => {
    if (!gridSnapEnabled) return change;
    const snappedPosition = snapTopologyPoint(change.position, gridSnapSize);
    if (snappedPosition.x === change.position.x && snappedPosition.y === change.position.y) return change;
    const delta = change.delta
      ? {
        x: change.delta.x + snappedPosition.x - change.position.x,
        y: change.delta.y + snappedPosition.y - change.position.y
      }
      : change.delta;
    return {
      ...change,
      delta,
      position: snappedPosition
    };
  }, [gridSnapEnabled]);
  const pendingRegionMarqueeStyle = useMemo(() => {
    const preview = previewRef.current;
    if (!preview || !pendingRegionDrag) return undefined;
    const previewBounds = preview.getBoundingClientRect();
    const bounds = normalizedCanvasRect(pendingRegionDrag.startClient, pendingRegionDrag.currentClient);
    return {
      height: `${bounds.height}px`,
      left: `${bounds.x - previewBounds.left}px`,
      top: `${bounds.y - previewBounds.top}px`,
      width: `${bounds.width}px`
    };
  }, [pendingRegionDrag, previewRef]);
  const pendingSelectionMarqueeStyle = useMemo(() => {
    const preview = previewRef.current;
    if (!preview || !pendingSelectionDrag) return undefined;
    const previewBounds = preview.getBoundingClientRect();
    const bounds = normalizedCanvasRect(pendingSelectionDrag.startClient, pendingSelectionDrag.currentClient);
    return {
      height: `${bounds.height}px`,
      left: `${bounds.x - previewBounds.left}px`,
      top: `${bounds.y - previewBounds.top}px`,
      width: `${bounds.width}px`
    };
  }, [pendingSelectionDrag, previewRef]);
  const closeRegionContextMenu = useCallback(() => setRegionContextMenu(undefined), []);
  const handleContextMenuCapture = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    if (parityMode) return;
    const target = event.target as HTMLElement | null;
    const nodeElement = target?.closest<HTMLElement>('.react-flow__node');
    const nodeId = nodeElement?.dataset.id;
    if (!nodeId || nodeId.startsWith('region:')) return;
    const regionIds = directRegionIdsByNodeId.get(nodeId) || [];
    if (!regionIds.length) return;
    event.preventDefault();
    event.stopPropagation();
    setRegionContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 6,
      nodeId,
      regionIds
    });
  }, [directRegionIdsByNodeId, parityMode]);
  const handlePanePointerDownCapture = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (parityMode || canvasAuthoring.activeTool !== 'select') return;
    const target = event.target as HTMLElement | null;
    if (target?.classList.contains('react-flow__pane')) setSelectedObjects([]);
  }, [canvasAuthoring.activeTool, parityMode, setSelectedObjects]);

  return (
    <Paper
      className={`topoviewer-vscode-preview topoviewer-vscode-preview--tool-${canvasAuthoring.activeTool}${parityMode ? ' topoviewer-vscode-preview--parity topoviewer-parity-theme' : ''}`}
      elevation={0}
      ref={previewRef}
      onContextMenuCapture={handleContextMenuCapture}
      onPointerDownCapture={(event) => {
        handlePanePointerDownCapture(event);
        startPendingRegionDrag(event);
        startPendingSelectionDrag(event);
      }}
      onPointerMoveCapture={(event) => {
        updatePendingRegionDrag(event);
        updatePendingSelectionDrag(event);
      }}
      onPointerUpCapture={(event) => {
        commitPendingRegionDrag(event);
        commitPendingSelectionDrag(event);
      }}
      onPointerCancelCapture={(event) => {
        cancelPendingRegionDrag(event);
        cancelPendingSelectionDrag(event);
      }}
    >
      {!parityMode && regionContextMenu ? (
        <Menu
          open
          onClose={closeRegionContextMenu}
          anchorReference="anchorPosition"
          anchorPosition={{ top: regionContextMenu.mouseY, left: regionContextMenu.mouseX }}
        >
          {regionContextMenu.regionIds.map((regionId) => (
            <MenuItem
              key={regionId}
              onClick={() => {
                releaseNodeFromRegion(regionContextMenu.nodeId, regionId);
                closeRegionContextMenu();
              }}
            >
              Release from {regionNameById.get(regionId) || regionId}
            </MenuItem>
          ))}
        </Menu>
      ) : null}
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
          {canvasAuthoring.activeTool === 'path' ? (
            <Box className="topoviewer-vscode-canvas-authoring-strip" role="status" aria-label="Path authoring sequence">
              <Typography className="topoviewer-vscode-canvas-authoring-summary" variant="caption">
                {pendingPathMessage || pendingPathLabel}
              </Typography>
              <Button size="small" disabled={hasErrors || pendingPathNodeIds.length < 2} onClick={commitPendingPath}>Create path</Button>
              <Button size="small" onClick={cancelPendingPath}>Cancel</Button>
            </Box>
          ) : null}
          {canvasAuthoring.activeTool === 'region' ? (
            <Box className="topoviewer-vscode-canvas-authoring-strip" role="status" aria-label="Region authoring selection">
              <Typography className="topoviewer-vscode-canvas-authoring-summary" variant="caption">
                {pendingRegionMessage || (pendingRegionDrag ? 'Release to create a region from these bounds' : regionSelectionLabel)}
              </Typography>
              <Button size="small" disabled={hasErrors || selectedRegionMemberIds.length < 1} onClick={commitSelectedRegion}>Create region</Button>
            </Box>
          ) : null}
          {canvasAuthoring.activeTool === 'select' && selectedObjectIds.length > 0 ? (
            <Box className="topoviewer-vscode-canvas-authoring-strip topoviewer-vscode-canvas-arrange-strip" role="toolbar" aria-label="Selection arrangement">
              <Typography className="topoviewer-vscode-canvas-authoring-summary" variant="caption">
                {selectedObjectIds.length} selected
              </Typography>
              <Button size="small" disabled={hasErrors || selectedObjectIds.length < 2} onClick={() => alignSelectedObjects('left', gridSnapEnabled ? gridSnapSize : undefined)}>Align left</Button>
              <Button size="small" disabled={hasErrors || selectedObjectIds.length < 2} onClick={() => alignSelectedObjects('center', gridSnapEnabled ? gridSnapSize : undefined)}>Center</Button>
              <Button size="small" disabled={hasErrors || selectedObjectIds.length < 2} onClick={() => alignSelectedObjects('right', gridSnapEnabled ? gridSnapSize : undefined)}>Align right</Button>
              <Button size="small" disabled={hasErrors || selectedObjectIds.length < 2} onClick={() => alignSelectedObjects('top', gridSnapEnabled ? gridSnapSize : undefined)}>Align top</Button>
              <Button size="small" disabled={hasErrors || selectedObjectIds.length < 2} onClick={() => alignSelectedObjects('middle', gridSnapEnabled ? gridSnapSize : undefined)}>Middle</Button>
              <Button size="small" disabled={hasErrors || selectedObjectIds.length < 2} onClick={() => alignSelectedObjects('bottom', gridSnapEnabled ? gridSnapSize : undefined)}>Align bottom</Button>
              <Button size="small" disabled={hasErrors || selectedObjectIds.length < 3} onClick={() => distributeSelectedObjects('horizontal', gridSnapEnabled ? gridSnapSize : undefined)}>Distribute H</Button>
              <Button size="small" disabled={hasErrors || selectedObjectIds.length < 3} onClick={() => distributeSelectedObjects('vertical', gridSnapEnabled ? gridSnapSize : undefined)}>Distribute V</Button>
              <Button size="small" disabled={hasErrors} onClick={() => snapSelectedObjectsToGrid(gridSnapSize)}>Snap</Button>
            </Box>
          ) : null}
        </>
      )}
      {loading && <CircularProgress />}
      {!loading && hasErrors && <Alert severity="error">Fix diagnostics before the preview can render.</Alert>}
      {!loading && !hasErrors && visibleDocument && (
        <>
          {pendingRegionMarqueeStyle ? (
            <Box className="topoviewer-vscode-region-marquee" aria-hidden="true" style={pendingRegionMarqueeStyle} />
          ) : null}
          {pendingSelectionMarqueeStyle ? (
            <Box className="topoviewer-vscode-selection-marquee" aria-hidden="true" style={pendingSelectionMarqueeStyle} />
          ) : null}
          {!parityMode && controlsOpen ? (
            <div className="topoviewer-embed-controls-overlay topoviewer-vscode-controls-overlay">
              <ViewportSettingsPanel
                gridSnapEnabled={gridSnapEnabled}
                layers={viewportLayers}
                selectedLayerIds={selectedLayerIds}
                helperLinesEnabled={helperLinesEnabled}
                onGridSnapChange={setGridSnapEnabled}
                onLayerChange={setLayerEnabled}
                onHelperLinesChange={setHelperLinesEnabled}
                onSelectAllLayers={() => setSelectedLayerIds(layerIds(viewportLayers))}
                onClearLayers={() => setSelectedLayerIds([])}
              />
            </div>
          ) : null}
          <TopoViewer
            document={visibleDocumentWithPendingPath || visibleDocument}
            selectedLayerIds={effectiveSelectedLayerIds}
            selectedObjectIds={previewSelectedObjectIds}
            exportDisabled={hasExportBlockers}
            exportTooltip={exportTooltip}
            onExport={parityMode ? undefined : exportImage}
            toggles={parityMode ? defaultTopoViewerToggles(visibleDocument) : viewerToggles}
            onObjectClick={handlePreviewObjectClick}
            onPaneClick={handlePaneClick}
            onNodePositionChange={(change) => handleNodePositionChange(snapNodePositionChange(change))}
            onNodeResizeChange={parityMode ? undefined : handleNodeResizeChange}
            onRegionAggregateToggle={parityMode ? undefined : handleRegionAggregateToggle}
            onConnectionCreate={canvasAuthoring.activeTool === 'link' ? createCanvasConnection : undefined}
            nodesResizable={!parityMode}
            nodesConnectable={canvasAuthoring.activeTool === 'link'}
            helperLines={parityMode || !helperLinesEnabled ? false : authoringHelperLinesOptions}
            controlPanelToggle={parityMode ? undefined : { enabled: true, open: controlsOpen, onToggle: () => setControlsOpen((current) => !current) }}
          />
        </>
      )}
    </Paper>
  );
});
