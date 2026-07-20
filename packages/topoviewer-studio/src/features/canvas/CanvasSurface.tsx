import { lazy, startTransition, Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type DragEvent, type KeyboardEvent, type Ref } from 'react';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import AlignHorizontalLeftOutlinedIcon from '@mui/icons-material/AlignHorizontalLeftOutlined';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import FormatPaintOutlinedIcon from '@mui/icons-material/FormatPaintOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import PanToolIcon from '@mui/icons-material/PanTool';
import PanToolAltIcon from '@mui/icons-material/PanToolAlt';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ControlButton } from '@xyflow/react';
import { defaultTopoViewerToggles, TopoViewer } from 'topoviewer';
import type { TopoViewerConnectionCreate, TopoViewerNodePositionChange, TopoViewerObjectClick, TopoViewerObjectDoubleClick, TopoViewerProps } from 'topoviewer';
import { authoringRegionsForMember, findAuthoringObject, resolveAuthoringSelection } from 'topoviewer/authoring';
import type { AuthoringAlignment, AuthoringDistributionAxis, TopoViewerNodeResizeChange, TopoViewerObjectContextMenu, TopoViewerSelectionContextMenu, TopoViewerSelectionChange } from 'topoviewer/authoring';
import type { StudioSelection, StudioSessionSnapshot } from '../../contracts/project';
import type { StudioStylesheetCandidateController } from '../../session';
import { resolveStudioQuickEditTarget } from '../../app/controllerAuthoring';
import { LayerControls } from '../layers/LayerControls';
import type { StudioEdgeAuthoringTemplateId, StudioPaletteTemplateId } from '../palette/types';
import type { StudioViewportPreferences } from '../viewport/types';
import type { QuickTextEditorState } from './QuickTextEditor';
import type { CanvasAlignmentMenuState, CanvasContextMenuState } from './CanvasActionMenus';
import { StudioFormControl, StudioFormLabel, StudioLabeledControl, StudioPopover, StudioSwitch } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

interface CanvasSurfaceProps {
  alignSelection(alignment: AuthoringAlignment): boolean;
  applyFormat(object: TopoViewerObjectClick): boolean;
  canvasRef?: Ref<HTMLElement>;
  canCopy: boolean;
  canCopyFormat: boolean;
  canPaste: boolean;
  canSaveSelectionAsPreset: boolean;
  connectSelected(): boolean;
  commitObjectText(selection: StudioSelection, value: string): boolean;
  copySelection(): boolean;
  cutSelection(): boolean;
  createConnection(connection: TopoViewerConnectionCreate, templateId?: StudioEdgeAuthoringTemplateId): boolean;
  createLayer(name?: string): boolean;
  createNestedRegion(parentId: string): boolean;
  isConnectionValid(connection: TopoViewerConnectionCreate, templateId?: StudioEdgeAuthoringTemplateId): boolean;
  createObject(templateId: StudioPaletteTemplateId, position: { x: number; y: number }): boolean;
  edgeAuthoringTemplate?: StudioEdgeAuthoringTemplateId;
  formatPainterActive: boolean;
  deleteSelection(): boolean;
  deleteLayer(layerId: string, replacementLayerId?: string): boolean;
  distributeSelection(axis: AuthoringDistributionAxis): boolean;
  duplicateSelection(): boolean;
  moveObjects(changes: TopoViewerNodePositionChange[]): boolean;
  nudgeSelection(delta: { x: number; y: number }): boolean;
  onAnnouncement(message: string): void;
  onCancelFormatPainter(): void;
  pasteClipboard(): boolean;
  presentationMode: boolean;
  previewRegionForNode(id: string, position: { x: number; y: number }): string | undefined;
  proposeMapperMetric(metric: string, selection: StudioSelection): boolean;
  releaseNodeFromRegion(nodeId: string, regionId?: string): boolean;
  renameLayer(layerId: string, name: string): boolean;
  resizeObject(change: TopoViewerNodeResizeChange): boolean;
  resizeSelection(delta: { width: number; height: number }): boolean;
  reorderLayer(layerId: string, targetIndex: number): boolean;
  saveSelectionAsPreset(): boolean;
  startFormatPainter(): void;
  selectFromCanvas(change: TopoViewerSelectionChange): void;
  selectObject(object: TopoViewerObjectClick): void;
  setSelection(selection: StudioSelection[]): void;
  setLayerMembership(layerId: string, assigned: boolean): boolean;
  setRegionExpanded(change: Parameters<NonNullable<TopoViewerProps['onRegionAggregateToggle']>>[0]): boolean;
  snapshot: StudioSessionSnapshot;
  stylesheetCandidate: StudioStylesheetCandidateController;
  viewportPreferences: StudioViewportPreferences;
  onCancelEdgeAuthoring(): void;
  onCompleteEdgeAuthoring(): void;
  onExitPresentation(): void;
  onPaneSelect(): void;
}

const builtInTemplateIds = new Set<StudioPaletteTemplateId>([
  'node',
  'router',
  'switch',
  'service',
  'controller',
  'external',
  'parent-child',
  'link',
  'parallel-link',
  'parent-link-pipe',
  'directional-link',
  'path',
  'region',
  'shape',
  'callout',
  'text'
]);
const aggregateLinkPrefix = 'aggregate-link-group:';
const presentationExitButtonId = 'studio-exit-presentation';
const CanvasActionMenus = lazy(() => import('./CanvasActionMenus'));
function droppedObjectFootprint(value: string): {
  height: number;
  width: number;
} {
  try {
    const parsed = JSON.parse(value) as { height?: unknown; width?: unknown };
    const height = Number(parsed.height);
    const width = Number(parsed.width);
    if (Number.isFinite(height) && height > 0 && Number.isFinite(width) && width > 0) return { height, width };
  } catch {
    // Invalid drag metadata falls back to the canonical node footprint.
  }
  return { height: 60, width: 82 };
}

function hasEditablePosition(value: unknown) {
  if (Array.isArray(value)) return Number.isFinite(Number(value[0])) && Number.isFinite(Number(value[1]));
  if (!value || typeof value !== 'object') return false;
  const position = value as { x?: unknown; y?: unknown };
  return Number.isFinite(Number(position.x)) && Number.isFinite(Number(position.y));
}

function blocksCanvasShortcut(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return Boolean(target.closest(['a', 'button', 'input', 'select', 'textarea', '[contenteditable="true"]', '[role="dialog"]', '[role="menu"]', '.monaco-editor'].join(',')));
}

export function CanvasSurface({
  alignSelection,
  applyFormat,
  canvasRef,
  canCopy,
  canCopyFormat,
  canPaste,
  canSaveSelectionAsPreset,
  connectSelected,
  commitObjectText,
  copySelection,
  cutSelection,
  createConnection,
  createLayer,
  createNestedRegion,
  isConnectionValid,
  createObject,
  edgeAuthoringTemplate,
  formatPainterActive,
  deleteSelection,
  deleteLayer,
  distributeSelection,
  duplicateSelection,
  moveObjects,
  nudgeSelection,
  onAnnouncement,
  onCancelFormatPainter,
  pasteClipboard,
  presentationMode,
  previewRegionForNode,
  proposeMapperMetric,
  releaseNodeFromRegion,
  renameLayer,
  resizeObject,
  resizeSelection,
  reorderLayer,
  saveSelectionAsPreset,
  startFormatPainter,
  selectFromCanvas,
  selectObject,
  setSelection,
  setLayerMembership,
  setRegionExpanded,
  snapshot: appliedSnapshot,
  stylesheetCandidate,
  viewportPreferences,
  onCancelEdgeAuthoring,
  onCompleteEdgeAuthoring,
  onExitPresentation,
  onPaneSelect
}: CanvasSurfaceProps) {
  const candidateProjection = useSyncExternalStore(
    stylesheetCandidate.subscribe,
    () => stylesheetCandidate.getSnapshot().latestValid.projection,
    () => stylesheetCandidate.getSnapshot().latestValid.projection
  );
  const snapshot = useMemo<StudioSessionSnapshot>(
    () => ({
      ...appliedSnapshot,
      projection: candidateProjection
    }),
    [appliedSnapshot, candidateProjection]
  );
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState>();
  const [quickEditor, setQuickEditor] = useState<QuickTextEditorState>();
  const [regionPreviewId, setRegionPreviewId] = useState<string>();
  const [layersOpen, setLayersOpen] = useState(false);
  const [layersAnchor, setLayersAnchor] = useState<HTMLElement | null>(null);
  const [alignmentMenu, setAlignmentMenu] = useState<CanvasAlignmentMenuState>();
  const [canvasTool, setCanvasTool] = useState<'pan' | 'select'>('select');
  const [hiddenLayerIds, setHiddenLayerIds] = useState<string[]>([]);
  const overlayDefinitions = (snapshot.projection.document.toggles || []).filter((toggle) => toggle.id === 'physical-port' || toggle.id === 'bandwidth');
  const [overlayToggles, setOverlayToggles] = useState(() => defaultTopoViewerToggles(snapshot.projection.document));
  const overlayTogglesRef = useRef(overlayToggles);
  overlayTogglesRef.current = overlayToggles;
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [fitViewRequestId, setFitViewRequestId] = useState(0);
  const contextReturnFocusRef = useRef<HTMLElement | null>(null);
  const interactionOverlayOpenRef = useRef(false);
  const quickEditReturnFocusRef = useRef<HTMLElement | null>(null);
  const connectionAnnouncementRef = useRef('');
  const connectionAnnouncementFrameRef = useRef<number>();
  const pendingDropPaintRef = useRef(false);
  const previousObjectCountRef = useRef(0);
  const regionPreviewIdRef = useRef<string>();
  const previousPresentationRef = useRef(presentationMode);
  const overlayDefinitionSignature = overlayDefinitions.map((toggle) => `${toggle.id}:${toggle.default !== false}`).join('|');
  const topologyDocument = snapshot.projection.document;
  const layerIds = useMemo(() => (topologyDocument.graph?.layers || []).map((layer) => layer.id), [topologyDocument]);
  const selectedLayerIds = useMemo(() => layerIds.filter((layerId) => !hiddenLayerIds.includes(layerId)), [hiddenLayerIds, layerIds]);
  const objectCount =
    (snapshot.projection.document.graph?.nodes?.length || 0) +
    (snapshot.projection.document.graph?.regions?.length || 0) +
    (snapshot.projection.document.diagram?.shapes?.length || 0) +
    (snapshot.projection.document.diagram?.callouts?.length || 0) +
    (snapshot.projection.document.diagram?.texts?.length || 0);
  const linkCount = snapshot.projection.document.graph?.links?.length || 0;
  const useViewportCulling = (snapshot.projection.document.graph?.nodes?.length || 0) >= 500 || linkCount >= 1000;
  const initialFitRef = useRef({
    enabled: objectCount > 0,
    projectId: snapshot.project.id
  });
  if (initialFitRef.current.projectId !== snapshot.project.id) {
    initialFitRef.current = {
      enabled: objectCount > 0,
      projectId: snapshot.project.id
    };
  }
  const fitViewOnInit = initialFitRef.current.enabled;
  const hasRegions = Boolean(snapshot.projection.document.graph?.regions?.length);
  const selectedObjectIds = useMemo(() => snapshot.selection.map((selection) => selection.id), [snapshot.selection]);
  const previewObjectIds = useMemo(() => (regionPreviewId ? [regionPreviewId] : []), [regionPreviewId]);
  const helperLineConfiguration = useMemo(
    () => ({
      enabled: viewportPreferences.helperLinesEnabled,
      snap: viewportPreferences.snapToAlignment,
      snapMode: 'commit' as const
    }),
    [viewportPreferences.helperLinesEnabled, viewportPreferences.snapToAlignment]
  );
  const selectedNodeCount = snapshot.selection.filter((selection) => selection.kind === 'node').length;
  const positionedSelectionCount = snapshot.selection.filter((selection) => {
    if (selection.kind === 'graph') return false;
    const object = findAuthoringObject(snapshot.projection.document, {
      id: selection.id,
      kind: selection.kind
    });
    return hasEditablePosition(object?.position);
  }).length;
  const contextSelection = contextMenu?.scope === 'object' ? resolveAuthoringSelection(snapshot.projection.document, contextMenu.objectId) : undefined;
  const contextSelectionCount = contextMenu?.scope === 'selection' ? snapshot.selection.length : 1;
  interactionOverlayOpenRef.current = Boolean(contextMenu || quickEditor);
  const handleSelectionChange = useCallback(
    (change: TopoViewerSelectionChange) => {
      if (interactionOverlayOpenRef.current && change.objects.length === 0) return;
      selectFromCanvas(change);
    },
    [selectFromCanvas]
  );

  useEffect(() => {
    if (presentationMode) setLayersOpen(false);
    if (presentationMode) setAlignmentMenu(undefined);
    if (!presentationMode && previousPresentationRef.current) {
      setFitViewRequestId((value) => value + 1);
    }
    previousPresentationRef.current = presentationMode;
  }, [presentationMode]);

  useEffect(() => {
    if (positionedSelectionCount < 2) setAlignmentMenu(undefined);
  }, [positionedSelectionCount]);

  useEffect(() => {
    if (!presentationMode) return undefined;
    const frame = requestAnimationFrame(() => document.getElementById(presentationExitButtonId)?.focus());
    return () => cancelAnimationFrame(frame);
  }, [presentationMode]);
  const contextRegionId = contextSelection?.kind === 'node' ? authoringRegionsForMember(snapshot.projection.document, contextSelection.id)[0] : undefined;

  useEffect(() => {
    const frame = requestAnimationFrame(() => performance.mark('topoviewer-studio-canvas-ready'));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    performance.clearMarks('topoviewer-studio-graph-visible');
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => performance.mark('topoviewer-studio-graph-visible'));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [linkCount, objectCount]);

  useEffect(() => {
    const previousCount = previousObjectCountRef.current;
    previousObjectCountRef.current = objectCount;
    if (!pendingDropPaintRef.current || objectCount <= previousCount) return undefined;
    pendingDropPaintRef.current = false;
    const frame = requestAnimationFrame(() => performance.mark('topoviewer-studio-drop-visible'));
    return () => cancelAnimationFrame(frame);
  }, [objectCount]);

  useEffect(
    () => () => {
      if (connectionAnnouncementFrameRef.current !== undefined) {
        cancelAnimationFrame(connectionAnnouncementFrameRef.current);
      }
    },
    []
  );

  useEffect(() => {
    const defaults = defaultTopoViewerToggles(snapshot.projection.document);
    const current = overlayTogglesRef.current;
    const next = {
      ...defaults,
      ...Object.fromEntries(overlayDefinitions.map((toggle) => [toggle.id, current[toggle.id] ?? defaults[toggle.id]]))
    };
    const currentKeys = Object.keys(current);
    const nextKeys = Object.keys(next);
    if (currentKeys.length === nextKeys.length && nextKeys.every((key) => current[key] === next[key])) return;
    overlayTogglesRef.current = next;
    setOverlayToggles(next);
  }, [overlayDefinitionSignature, snapshot.projection.document]);

  function drop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    const metric = event.dataTransfer.getData('application/x-topoviewer-metric');
    if (metric) {
      const target = event.target instanceof Element ? (event.target.closest('.react-flow__node, .react-flow__edge') as HTMLElement | null) : null;
      const runtimeId = target?.dataset.id;
      const selection = runtimeId ? resolveAuthoringSelection(snapshot.projection.document, runtimeId) : undefined;
      if (selection) proposeMapperMetric(metric, selection as StudioSelection);
      else onAnnouncement(`Mapper metric ${metric} was not placed because the drop target is not a topology object`);
      return;
    }
    const templateId = event.dataTransfer.getData('application/x-topoviewer-object') as StudioPaletteTemplateId;
    if (!builtInTemplateIds.has(templateId) && !templateId.startsWith('preset:')) {
      onAnnouncement('Object placement rejected because the palette template is not supported');
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    const footprint = droppedObjectFootprint(event.dataTransfer.getData('application/x-topoviewer-object-footprint'));
    const flowPoint = {
      x: (event.clientX - bounds.left - viewport.x) / viewport.zoom,
      y: (event.clientY - bounds.top - viewport.y) / viewport.zoom
    };
    performance.clearMarks('topoviewer-studio-drop-start');
    performance.clearMarks('topoviewer-studio-drop-visible');
    performance.mark('topoviewer-studio-drop-start');
    pendingDropPaintRef.current = true;
    const created = createObject(templateId, {
      x: Math.max(0, flowPoint.x - footprint.width / 2),
      y: Math.max(0, flowPoint.y - footprint.height / 2)
    });
    if (!created) pendingDropPaintRef.current = false;
  }

  function openContextMenu(object: TopoViewerObjectContextMenu) {
    const selected = snapshot.selection.some((selection) => selection.id === object.id);
    if (!selected) selectObject(object);
    contextReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setContextMenu({
      objectId: object.id,
      scope: selected && snapshot.selection.length > 1 ? 'selection' : 'object',
      x: object.clientX,
      y: object.clientY
    });
  }

  function openSelectionContextMenu(selection: TopoViewerSelectionContextMenu) {
    const first = snapshot.selection[0] || selection.objects[0];
    if (!first) return;
    if (!snapshot.selection.length) selectFromCanvas({ objects: selection.objects });
    contextReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setContextMenu({
      objectId: first.id,
      scope: 'selection',
      x: selection.clientX,
      y: selection.clientY
    });
  }

  function handleObjectClick(object: TopoViewerObjectClick) {
    if (formatPainterActive) {
      applyFormat(object);
      return;
    }
    if (object.element === 'edge' && object.id.startsWith(aggregateLinkPrefix)) {
      onAnnouncement('Edit attention.links.grouping.expandedGroupIds in topology YAML to expand parallel links.');
      return;
    }
    selectObject(object);
  }

  function closeContextMenu() {
    setContextMenu(undefined);
    const target = contextReturnFocusRef.current;
    if (target?.isConnected) queueMicrotask(() => target.focus());
  }

  function openQuickEditor(object: TopoViewerObjectDoubleClick) {
    const selection = resolveAuthoringSelection(snapshot.projection.document, object.id) as StudioSelection | undefined;
    if (!selection) return;
    const target = resolveStudioQuickEditTarget(snapshot.projection.document, selection);
    if (!target) return;
    quickEditReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    selectObject(object);
    setQuickEditor({ ...target, x: object.clientX, y: object.clientY });
  }

  function closeQuickEditor() {
    setQuickEditor(undefined);
    const target = quickEditReturnFocusRef.current;
    if (target?.isConnected) queueMicrotask(() => target.focus());
  }

  function openKeyboardContextMenu(container: HTMLElement) {
    const selection = snapshot.selection[0];
    if (!selection) {
      onAnnouncement('Select an object before opening selection actions');
      return;
    }
    contextReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : container;
    const selectedElement = container.querySelector<HTMLElement>('.react-flow__node.selected, .react-flow__edge.selected');
    const bounds = selectedElement?.getBoundingClientRect() || container.getBoundingClientRect();
    const view = container.ownerDocument.defaultView;
    const viewportWidth = view?.innerWidth ?? container.ownerDocument.documentElement.clientWidth;
    const viewportHeight = view?.innerHeight ?? container.ownerDocument.documentElement.clientHeight;
    setContextMenu({
      objectId: selection.id,
      scope: snapshot.selection.length > 1 ? 'selection' : 'object',
      x: Math.min(viewportWidth - 190, Math.max(8, bounds.left + Math.min(bounds.width, 32))),
      y: Math.min(viewportHeight - 220, Math.max(8, bounds.top + Math.min(bounds.height, 32)))
    });
  }

  function validateConnection(connection: TopoViewerConnectionCreate) {
    const templateId = edgeAuthoringTemplate || 'link';
    const valid = isConnectionValid(connection, templateId);
    const key = `${templateId}:${connection.sourceId}:${connection.targetId}:${valid}`;
    if (connectionAnnouncementRef.current !== key) {
      connectionAnnouncementRef.current = key;
      if (connectionAnnouncementFrameRef.current !== undefined) {
        cancelAnimationFrame(connectionAnnouncementFrameRef.current);
      }
      connectionAnnouncementFrameRef.current = requestAnimationFrame(() => {
        onAnnouncement(
          valid
            ? `Valid ${templateId} connection from ${connection.sourceId} to ${connection.targetId}`
            : edgeAuthoringTemplate === 'parallel-link'
              ? 'Parallel links require two distinct nodes'
              : `Invalid connection from ${connection.sourceId} to ${connection.targetId}`
        );
      });
    }
    return valid;
  }

  function keyDown(event: KeyboardEvent<HTMLElement>) {
    if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
      event.preventDefault();
      openKeyboardContextMenu(event.currentTarget);
      return;
    }
    if (event.key === 'Escape' && edgeAuthoringTemplate) {
      event.preventDefault();
      onCancelEdgeAuthoring();
      return;
    }
    if (blocksCanvasShortcut(event.target)) return;
    if (event.key === 'Escape' && formatPainterActive) {
      event.preventDefault();
      onCancelFormatPainter();
      return;
    }
    if (event.key === 'Escape' && layersOpen) {
      event.preventDefault();
      setLayersOpen(false);
      return;
    }
    const command = event.metaKey || event.ctrlKey;
    const key = event.key.toLocaleLowerCase();
    if (!command && !event.altKey && !event.shiftKey && key === 'v') {
      event.preventDefault();
      setCanvasTool('select');
      onAnnouncement('Select and lasso tool active');
      return;
    }
    if (!command && !event.altKey && !event.shiftKey && key === 'h') {
      event.preventDefault();
      setCanvasTool('pan');
      onAnnouncement('Pan tool active');
      return;
    }
    if (command && key === 'c' && canCopy) {
      event.preventDefault();
      copySelection();
      return;
    }
    if (command && key === 'v' && canPaste) {
      event.preventDefault();
      pasteClipboard();
      return;
    }
    if (command && key === 'x' && canCopy) {
      event.preventDefault();
      cutSelection();
      return;
    }
    if (command && key === 'd' && canCopy) {
      event.preventDefault();
      duplicateSelection();
      return;
    }
    if ((event.key === 'Delete' || event.key === 'Backspace') && canCopy) {
      event.preventDefault();
      deleteSelection();
      return;
    }
    const amount = event.shiftKey ? 10 : 1;
    const deltaByKey: Partial<Record<string, { x: number; y: number }>> = {
      ArrowDown: { x: 0, y: amount },
      ArrowLeft: { x: -amount, y: 0 },
      ArrowRight: { x: amount, y: 0 },
      ArrowUp: { x: 0, y: -amount }
    };
    const delta = deltaByKey[event.key];
    if (delta && event.altKey && snapshot.selection.length === 1) {
      event.preventDefault();
      resizeSelection({ height: delta.y, width: delta.x });
      return;
    }
    if (delta && canCopy) {
      event.preventDefault();
      nudgeSelection(delta);
      return;
    }
    if (event.key.toLocaleLowerCase() === 'l' && selectedNodeCount === 2) {
      event.preventDefault();
      connectSelected();
    }
  }

  return (
    <Box
      component="section"
      className={`studio-canvas${edgeAuthoringTemplate ? ' studio-canvas--edge-authoring' : ''}${formatPainterActive ? ' studio-canvas--format-painter' : ''}`}
      aria-label="Topology canvas"
      aria-describedby="studio-canvas-keyboard-help"
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight Shift+F10 H L V Control+C Meta+C Control+X Meta+X Control+V Meta+V"
      data-canvas-tool={canvasTool}
      data-format-painter={formatPainterActive || undefined}
      data-testid="studio-canvas"
      data-edge-authoring-mode={edgeAuthoringTemplate}
      style={{ backgroundColor: viewportPreferences.backgroundColor }}
      sx={{
        gridArea: 'canvas',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative'
      }}
      ref={canvasRef}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={drop}
      onKeyDown={keyDown}
      tabIndex={0}
    >
      {presentationMode ? (
        <Typography className="studio-visually-hidden" component="h1">
          {snapshot.project.name}
        </Typography>
      ) : null}
      <Typography className="studio-visually-hidden" component="span" id="studio-canvas-keyboard-help">
        Use V for the Select and lasso tool or H for the Pan tool. Drag a selection box to select multiple objects, then drag any selected object to move the group. Arrow keys move the selection, Alt plus arrow keys resize one selected object, L connects two selected nodes, standard copy, cut, and paste shortcuts edit the selection, and Shift F10 opens selection actions.
      </Typography>
      <StudioPopover
        anchorEl={layersAnchor}
        anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        onClose={() => setLayersOpen(false)}
        open={layersOpen}
        slotProps={{
          paper: {
            'aria-label': 'Layers',
            className: 'studio-canvas-layers',
            role: 'dialog',
            sx: {
              maxHeight: 'min(560px, calc(100vh - 80px))',
              overflow: 'auto',
              p: studioSpace.space16,
              width: 380
            }
          }
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
      >
        <LayerControls
          createLayer={createLayer}
          deleteLayer={deleteLayer}
          hiddenLayerIds={hiddenLayerIds}
          renameLayer={renameLayer}
          reorderLayer={reorderLayer}
          setHiddenLayerIds={setHiddenLayerIds}
          setLayerMembership={setLayerMembership}
          snapshot={snapshot}
        />
        {overlayDefinitions.length ? (
          <StudioFormControl
            component="fieldset"
            sx={{
              border: 0,
              borderTop: 1,
              borderColor: 'divider',
              gap: studioSpace.space8,
              mt: studioSpace.space12,
              pt: studioSpace.space12
            }}
          >
            <StudioFormLabel component="legend">Overlays</StudioFormLabel>
            {overlayDefinitions.map((toggle) => (
              <StudioLabeledControl
                key={toggle.id}
                control={
                  <StudioSwitch
                    checked={overlayToggles[toggle.id] !== false}
                    onChange={(event) =>
                      setOverlayToggles((current) => ({
                        ...current,
                        [toggle.id]: event.target.checked
                      }))
                    }
                  />
                }
                label={String(toggle.labels?.name || toggle.id)}
              />
            ))}
          </StudioFormControl>
        ) : null}
      </StudioPopover>

      <TopoViewer
        connectionHandleMode="shape-handles"
        document={topologyDocument}
        fitViewOnInit={fitViewOnInit}
        fitViewRequestId={fitViewRequestId}
        grid={
          viewportPreferences.gridVisible
            ? {
                color: viewportPreferences.gridColor,
                gap: viewportPreferences.gridSize,
                size: 1
              }
            : false
        }
        helperLines={helperLineConfiguration}
        initialViewport={fitViewOnInit ? undefined : viewport}
        miniMap={viewportPreferences.miniMapVisible}
        nodesConnectable={!presentationMode}
        nodesDraggable
        nodesResizable
        onlyRenderVisibleElements={useViewportCulling}
        panOnDrag={presentationMode || canvasTool === 'pan' ? true : [1, 2]}
        selectionMode="partial"
        selectionOnDrag={!presentationMode && canvasTool === 'select'}
        isConnectionValid={validateConnection}
        onConnectionCreate={(connection) => {
          const templateId = edgeAuthoringTemplate || 'link';
          if (createConnection(connection, templateId) && edgeAuthoringTemplate) onCompleteEdgeAuthoring();
        }}
        onNodesPositionChange={(changes) => {
          regionPreviewIdRef.current = undefined;
          setRegionPreviewId(undefined);
          let moved = false;
          startTransition(() => {
            moved = moveObjects(changes);
          });
          if (moved) {
            performance.mark('topoviewer-studio-drag-commit');
          }
        }}
        onNodePositionPreview={
          hasRegions
            ? (change) => {
                const next = previewRegionForNode(change.id, change.position);
                if (regionPreviewIdRef.current === next) return;
                regionPreviewIdRef.current = next;
                onAnnouncement(next ? `${change.id} will join region ${next} when movement completes` : `${change.id} is outside an eligible region`);
                setRegionPreviewId(next);
              }
            : undefined
        }
        onNodeResizeChange={resizeObject}
        onObjectClick={handleObjectClick}
        onObjectDoubleClick={openQuickEditor}
        onObjectContextMenu={openContextMenu}
        onSelectionContextMenu={openSelectionContextMenu}
        onPaneClick={() => {
          if (formatPainterActive) onCancelFormatPainter();
          closeContextMenu();
          closeQuickEditor();
          setSelection([]);
          onPaneSelect();
        }}
        onSelectionChange={handleSelectionChange}
        onRegionAggregateToggle={setRegionExpanded}
        onViewportChange={(nextViewport) => {
          setViewport(nextViewport);
        }}
        previewObjectIds={previewObjectIds}
        selectedLayerIds={selectedLayerIds}
        selectedObjectIds={selectedObjectIds}
        style={{
          background: viewportPreferences.backgroundColor,
          height: '100%',
          width: '100%'
        }}
        toggles={overlayToggles}
        viewportControls={{
          children: presentationMode ? (
            <>
              {viewportPreferences.viewportControlsVisible ? <Divider className="studio-canvas-control-separator" flexItem /> : null}
              <ControlButton aria-label="Exit presentation mode" id={presentationExitButtonId} onClick={onExitPresentation} title="Exit presentation mode">
                <FullscreenExitIcon fontSize="small" />
              </ControlButton>
            </>
          ) : (
                  <>
                    {viewportPreferences.viewportControlsVisible ? <Divider className="studio-canvas-control-separator" flexItem /> : null}
                    <ControlButton
                      aria-label="Select and lasso"
                      aria-pressed={canvasTool === 'select'}
                      onClick={() => {
                        setCanvasTool('select');
                        onAnnouncement('Select and lasso tool active');
                      }}
                      title="Select and lasso (V)"
                    >
                      <PanToolAltIcon fontSize="small" />
                    </ControlButton>
                    <ControlButton
                      aria-label="Pan canvas"
                      aria-pressed={canvasTool === 'pan'}
                      onClick={() => {
                        setCanvasTool('pan');
                        onAnnouncement('Pan tool active');
                      }}
                      title="Pan canvas (H)"
                    >
                      <PanToolIcon fontSize="small" />
                    </ControlButton>
                    {snapshot.selection.length > 0 ? <Divider className="studio-canvas-control-separator" flexItem /> : null}
                    {snapshot.selection.length > 0 ? (
                      <>
                        <ControlButton aria-label="Duplicate selection" disabled={!canCopy} onClick={duplicateSelection} title="Duplicate">
                          <ContentCopyOutlinedIcon fontSize="small" />
                        </ControlButton>
                        {canCopyFormat ? (
                          <ControlButton aria-label="Copy formatting" aria-pressed={formatPainterActive} onClick={startFormatPainter} title="Format Painter">
                            <FormatPaintOutlinedIcon fontSize="small" />
                          </ControlButton>
                        ) : null}
                        {positionedSelectionCount >= 2 ? (
                          <ControlButton
                            aria-expanded={alignmentMenu?.source === 'toolbar'}
                            aria-label="Align and distribute selection"
                            onClick={(event) => setAlignmentMenu({ anchor: event.currentTarget, source: 'toolbar' })}
                            title="Align and distribute"
                          >
                            <AlignHorizontalLeftOutlinedIcon fontSize="small" />
                          </ControlButton>
                        ) : null}
                        {canSaveSelectionAsPreset ? (
                          <ControlButton aria-label="Save selection to Object Palette" onClick={saveSelectionAsPreset} title="Save to Object Palette">
                            <BookmarkAddOutlinedIcon fontSize="small" />
                          </ControlButton>
                        ) : null}
                      </>
                    ) : null}
                    <Divider className="studio-canvas-control-separator" flexItem />
                    <ControlButton
                      aria-expanded={layersOpen}
                      aria-label="Layers"
                      onClick={(event) => {
                        setLayersAnchor(event.currentTarget);
                        setLayersOpen((value) => !value);
                      }}
                      title="Layers"
                    >
                      <LayersOutlinedIcon fontSize="small" />
                    </ControlButton>
                  </>
                ),
          className: 'studio-canvas-viewport-controls studio-canvas-unified-controls',
          fitViewOptions: {
            padding: {
              top: '6%',
              right: '6%',
              bottom: '6%',
              left: '72px'
            }
          },
          position: 'top-left',
          showFitView: viewportPreferences.viewportControlsVisible,
          showZoom: viewportPreferences.viewportControlsVisible
        }}
      />

      {alignmentMenu || contextMenu || quickEditor ? (
        <Suspense fallback={null}>
          <CanvasActionMenus
            alignSelection={alignSelection}
            alignmentMenu={alignmentMenu}
            canCopy={canCopy}
            canSaveSelectionAsPreset={canSaveSelectionAsPreset}
            closeContextMenu={closeContextMenu}
            closeQuickEditor={closeQuickEditor}
            commitObjectText={commitObjectText}
            contextMenu={contextMenu}
            contextRegionId={contextRegionId}
            contextSelection={contextSelection as StudioSelection | undefined}
            contextSelectionCount={contextSelectionCount}
            createNestedRegion={createNestedRegion}
            deleteSelection={deleteSelection}
            distributeSelection={distributeSelection}
            duplicateSelection={duplicateSelection}
            positionedSelectionCount={positionedSelectionCount}
            quickEditor={quickEditor}
            releaseNodeFromRegion={releaseNodeFromRegion}
            saveSelectionAsPreset={saveSelectionAsPreset}
            setAlignmentMenu={setAlignmentMenu}
            setRegionExpanded={setRegionExpanded}
          />
        </Suspense>
      ) : null}

      {objectCount === 0 && (
        <Paper
          elevation={1}
          sx={{
            left: '50%',
            maxWidth: 'calc(100% - 32px)',
            p: studioSpace.space16,
            pointerEvents: 'none',
            position: 'absolute',
            textAlign: 'center',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 320,
            zIndex: 20
          }}
        >
          <Stack spacing={studioSpace.space2}>
            <Typography component="strong" variant="subtitle2">
              Empty topology
            </Typography>
            <Typography color="text.secondary" variant="caption">
              0 objects
            </Typography>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
