import { startTransition, useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type Ref } from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ControlPointDuplicateIcon from '@mui/icons-material/ControlPointDuplicate';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { defaultTopoViewerToggles, TopoViewer } from 'topoviewer';
import type {
  TopoViewerConnectionCreate,
  TopoViewerObjectClick,
  TopoViewerObjectDoubleClick,
  TopoViewerProps
} from 'topoviewer';
import { authoringRegionsForMember, resolveAuthoringSelection } from 'topoviewer/authoring';
import type {
  AuthoringDistributionAxis,
  TopoViewerNodeResizeChange,
  TopoViewerObjectContextMenu,
  TopoViewerSelectionChange
} from 'topoviewer/authoring';
import type { StudioSelection, StudioSessionSnapshot } from '../../contracts/project';
import { resolveStudioQuickEditTarget } from '../../app/controllerAuthoring';
import { LayerControls } from '../layers/LayerControls';
import type { StudioEdgeTemplateId, StudioPaletteTemplateId } from '../palette/types';
import type { StudioViewportPreferences } from '../viewport/types';
import { QuickTextEditor, type QuickTextEditorState } from './QuickTextEditor';
import {
  StudioFormControl,
  StudioFormLabel,
  StudioIconButton,
  StudioLabeledControl,
  StudioMenu,
  StudioMenuDivider,
  StudioMenuItem,
  StudioMenuItemIcon,
  StudioMenuItemText,
  StudioPopover,
  StudioSwitch
} from '../../ui/controls';

interface CanvasSurfaceProps {
  canvasRef?: Ref<HTMLElement>;
  canCopy: boolean;
  canPaste: boolean;
  connectSelected(): boolean;
  commitObjectText(selection: StudioSelection, value: string): boolean;
  copySelection(): boolean;
  cutSelection(): boolean;
  createConnection(connection: TopoViewerConnectionCreate, templateId?: StudioEdgeTemplateId): boolean;
  createLayer(name?: string): boolean;
  createNestedRegion(parentId: string): boolean;
  isConnectionValid(connection: TopoViewerConnectionCreate, templateId?: StudioEdgeTemplateId): boolean;
  createObject(templateId: StudioPaletteTemplateId, position: { x: number; y: number }): boolean;
  edgeAuthoringTemplate?: StudioEdgeTemplateId;
  deleteSelection(): boolean;
  deleteLayer(layerId: string, replacementLayerId?: string): boolean;
  distributeSelection(axis: AuthoringDistributionAxis): boolean;
  duplicateSelection(): boolean;
  moveObject(id: string, position: { x: number; y: number }, delta?: { x: number; y: number }): boolean;
  nudgeSelection(delta: { x: number; y: number }): boolean;
  onAnnouncement(message: string): void;
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
  selectFromCanvas(change: TopoViewerSelectionChange): void;
  selectObject(object: TopoViewerObjectClick): void;
  setSelection(selection: StudioSelection[]): void;
  setLayerMembership(layerId: string, assigned: boolean): boolean;
  setRegionExpanded(change: Parameters<NonNullable<TopoViewerProps['onRegionAggregateToggle']>>[0]): boolean;
  snapshot: StudioSessionSnapshot;
  viewportPreferences: StudioViewportPreferences;
  onCancelEdgeAuthoring(): void;
  onCompleteEdgeAuthoring(): void;
  onExitPresentation(): void;
  onPaneSelect(): void;
}

const builtInTemplateIds = new Set<StudioPaletteTemplateId>([
  'node', 'router', 'switch', 'service', 'controller', 'external', 'parent-child',
  'link', 'parallel-link', 'parent-link-pipe', 'directional-link', 'path', 'region', 'shape', 'callout', 'text'
]);
const aggregateLinkPrefix = 'aggregate-link-group:';

function droppedObjectFootprint(value: string): { height: number; width: number } {
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

function blocksCanvasShortcut(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLElement && target.isContentEditable) return true;
  return Boolean(target.closest([
    'a',
    'button',
    'input',
    'select',
    'textarea',
    '[contenteditable="true"]',
    '[role="dialog"]',
    '[role="menu"]',
    '.monaco-editor'
  ].join(',')));
}

export function CanvasSurface({
  canvasRef,
  canCopy,
  canPaste,
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
  deleteSelection,
  deleteLayer,
  distributeSelection,
  duplicateSelection,
  moveObject,
  nudgeSelection,
  onAnnouncement,
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
  selectFromCanvas,
  selectObject,
  setSelection,
  setLayerMembership,
  setRegionExpanded,
  snapshot,
  viewportPreferences,
  onCancelEdgeAuthoring,
  onCompleteEdgeAuthoring,
  onExitPresentation,
  onPaneSelect
}: CanvasSurfaceProps) {
  const [contextMenu, setContextMenu] = useState<{ objectId: string; x: number; y: number }>();
  const [quickEditor, setQuickEditor] = useState<QuickTextEditorState>();
  const [regionPreviewId, setRegionPreviewId] = useState<string>();
  const [layersOpen, setLayersOpen] = useState(false);
  const layersButtonRef = useRef<HTMLButtonElement>(null);
  const [hiddenLayerIds, setHiddenLayerIds] = useState<string[]>([]);
  const [linkGroupExpansion, setLinkGroupExpansion] = useState({
    groupIds: [] as string[],
    projectId: snapshot.project.id
  });
  const overlayDefinitions = (snapshot.projection.document.toggles || [])
    .filter((toggle) => toggle.id === 'physical-port' || toggle.id === 'bandwidth');
  const [overlayToggles, setOverlayToggles] = useState(() => defaultTopoViewerToggles(snapshot.projection.document));
  const overlayTogglesRef = useRef(overlayToggles);
  overlayTogglesRef.current = overlayToggles;
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [viewportMount, setViewportMount] = useState(0);
  const contextReturnFocusRef = useRef<HTMLElement | null>(null);
  const interactionOverlayOpenRef = useRef(false);
  const quickEditReturnFocusRef = useRef<HTMLElement | null>(null);
  const connectionAnnouncementRef = useRef('');
  const connectionAnnouncementFrameRef = useRef<number>();
  const pendingDropPaintRef = useRef(false);
  const previousObjectCountRef = useRef(0);
  const regionPreviewIdRef = useRef<string>();
  const authoringViewportRef = useRef(viewport);
  const previousPresentationRef = useRef(presentationMode);
  const overlayDefinitionSignature = overlayDefinitions
    .map((toggle) => `${toggle.id}:${toggle.default !== false}`)
    .join('|');
  const sourceTopologyDocument = snapshot.projection.document;
  const expandedLinkGroupIds = linkGroupExpansion.projectId === snapshot.project.id
    ? linkGroupExpansion.groupIds
    : [];
  const topologyDocument = useMemo(() => {
    if (!expandedLinkGroupIds.length || !sourceTopologyDocument.attention?.links?.grouping) {
      return sourceTopologyDocument;
    }
    const grouping = sourceTopologyDocument.attention.links.grouping;
    return {
      ...sourceTopologyDocument,
      attention: {
        ...sourceTopologyDocument.attention,
        links: {
          ...sourceTopologyDocument.attention.links,
          grouping: {
            ...grouping,
            expandedGroupIds: [...new Set([
              ...(grouping.expandedGroupIds || []),
              ...expandedLinkGroupIds
            ])]
          }
        }
      }
    };
  }, [expandedLinkGroupIds, sourceTopologyDocument]);
  const layerIds = useMemo(
    () => (topologyDocument.graph?.layers || []).map((layer) => layer.id),
    [topologyDocument]
  );
  const selectedLayerIds = useMemo(
    () => layerIds.filter((layerId) => !hiddenLayerIds.includes(layerId)),
    [hiddenLayerIds, layerIds]
  );
  const objectCount = (snapshot.projection.document.graph?.nodes?.length || 0)
    + (snapshot.projection.document.graph?.regions?.length || 0)
    + (snapshot.projection.document.diagram?.shapes?.length || 0)
    + (snapshot.projection.document.diagram?.callouts?.length || 0)
    + (snapshot.projection.document.diagram?.texts?.length || 0);
  const linkCount = snapshot.projection.document.graph?.links?.length || 0;
  const useViewportCulling = (snapshot.projection.document.graph?.nodes?.length || 0) >= 500
    || linkCount >= 1000;
  const authoredStarterViewport = useRef(
    snapshot.project.name === 'Backbone topology' && snapshot.project.revision === 'browser-initial'
  );
  const initialFitRef = useRef({
    // Fitting a dense graph makes every element visible and defeats React Flow viewport culling.
    enabled: viewportPreferences.fitViewOnOpen && objectCount > 0 && !authoredStarterViewport.current && !useViewportCulling,
    projectId: snapshot.project.id
  });
  if (initialFitRef.current.projectId !== snapshot.project.id) {
    initialFitRef.current = {
      enabled: viewportPreferences.fitViewOnOpen && objectCount > 0 && !authoredStarterViewport.current && !useViewportCulling,
      projectId: snapshot.project.id
    };
  }
  const fitViewOnInit = initialFitRef.current.enabled;
  const hasRegions = Boolean(snapshot.projection.document.graph?.regions?.length);
  const selectedObjectIds = useMemo(
    () => snapshot.selection.map((selection) => selection.id),
    [snapshot.selection]
  );
  const previewObjectIds = useMemo(() => regionPreviewId ? [regionPreviewId] : [], [regionPreviewId]);
  const helperLineConfiguration = useMemo(() => ({
    enabled: viewportPreferences.helperLinesEnabled,
    snap: viewportPreferences.snapToAlignment,
    snapMode: 'commit' as const
  }), [viewportPreferences.helperLinesEnabled, viewportPreferences.snapToAlignment]);
  const selectedNodeCount = snapshot.selection.filter((selection) => selection.kind === 'node').length;
  const contextSelection = contextMenu
    ? resolveAuthoringSelection(snapshot.projection.document, contextMenu.objectId)
      : undefined;
  interactionOverlayOpenRef.current = Boolean(contextMenu || quickEditor);
  const handleSelectionChange = useCallback((change: TopoViewerSelectionChange) => {
    if (interactionOverlayOpenRef.current && change.objects.length === 0) return;
    selectFromCanvas(change);
  }, [selectFromCanvas]);

  useEffect(() => {
    if (presentationMode) setLayersOpen(false);
    if (presentationMode && !previousPresentationRef.current) authoringViewportRef.current = viewport;
    if (!presentationMode && previousPresentationRef.current) {
      setViewport(authoringViewportRef.current);
      setViewportMount((value) => value + 1);
    }
    previousPresentationRef.current = presentationMode;
  }, [presentationMode, viewport]);
  const contextRegionId = contextSelection?.kind === 'node'
    ? authoringRegionsForMember(snapshot.projection.document, contextSelection.id)[0]
    : undefined;

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

  useEffect(() => () => {
    if (connectionAnnouncementFrameRef.current !== undefined) {
      cancelAnimationFrame(connectionAnnouncementFrameRef.current);
    }
  }, []);

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
      const target = event.target instanceof Element
        ? event.target.closest('.react-flow__node, .react-flow__edge') as HTMLElement | null
        : null;
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
    if (!snapshot.selection.some((selection) => selection.id === object.id)) selectObject(object);
    contextReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setContextMenu({ objectId: object.id, x: object.clientX, y: object.clientY });
  }

  function handleObjectClick(object: TopoViewerObjectClick) {
    if (object.element === 'edge' && object.id.startsWith(aggregateLinkPrefix)) {
      const groupId = object.id.slice(aggregateLinkPrefix.length);
      setLinkGroupExpanded(groupId, true);
      onAnnouncement(`Expanded parallel link group ${groupId}`);
      return;
    }
    selectObject(object);
  }

  function setLinkGroupExpanded(groupId: string, expanded: boolean) {
    setLinkGroupExpansion((current) => {
      const groupIds = current.projectId === snapshot.project.id ? current.groupIds : [];
      return {
        groupIds: expanded
          ? groupIds.includes(groupId) ? groupIds : [...groupIds, groupId]
          : groupIds.filter((item) => item !== groupId),
        projectId: snapshot.project.id
      };
    });
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
        onAnnouncement(valid
          ? `Valid ${templateId} connection from ${connection.sourceId} to ${connection.targetId}`
          : edgeAuthoringTemplate === 'parallel-link'
            ? 'Parallel links require two distinct nodes'
            : `Invalid connection from ${connection.sourceId} to ${connection.targetId}`);
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
    if (event.key === 'Escape' && layersOpen) {
      event.preventDefault();
      setLayersOpen(false);
      return;
    }
    const command = event.metaKey || event.ctrlKey;
    if (command && event.key.toLocaleLowerCase() === 'c' && canCopy) {
      event.preventDefault();
      copySelection();
      return;
    }
    if (command && event.key.toLocaleLowerCase() === 'v' && canPaste) {
      event.preventDefault();
      pasteClipboard();
      return;
    }
    if (command && event.key.toLocaleLowerCase() === 'x' && canCopy) {
      event.preventDefault();
      cutSelection();
      return;
    }
    if (command && event.key.toLocaleLowerCase() === 'd' && canCopy) {
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

  function keyDownCapture(event: KeyboardEvent<HTMLElement>) {
    if (!['Enter', ' '].includes(event.key) || blocksCanvasShortcut(event.target)) return;
    const target = event.target instanceof Element ? event.target : undefined;
    const flowObject = target?.closest<HTMLElement>('.react-flow__node, .react-flow__edge');
    if (!flowObject) return;
    const annotated = flowObject.querySelector<HTMLElement>('[data-topoviewer-object-id]');
    const link = flowObject.querySelector<HTMLElement>('[data-link-id]');
    const runtimeId = flowObject.dataset.id || '';
    const sourceId = annotated?.dataset.topoviewerObjectId
      || link?.dataset.linkId
      || runtimeId.replace(/^region:/, '');
    const selection = resolveAuthoringSelection(snapshot.projection.document, sourceId) as StudioSelection | undefined;
    if (!selection) return;
    event.preventDefault();
    event.stopPropagation();
    const additive = event.ctrlKey || event.metaKey || event.shiftKey;
    const selected = snapshot.selection.some((candidate) => (
      candidate.id === selection.id && candidate.kind === selection.kind
    ));
    setSelection(additive
      ? selected
        ? snapshot.selection.filter((candidate) => candidate.id !== selection.id || candidate.kind !== selection.kind)
        : [...snapshot.selection, selection]
      : [selection]);
  }

  return (
    <Box
      component="section"
      className={`studio-canvas${edgeAuthoringTemplate ? ' studio-canvas--edge-authoring' : ''}`}
      aria-label="Topology canvas"
      aria-describedby="studio-canvas-keyboard-help"
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight Shift+F10 L Control+C Meta+C Control+V Meta+V"
      data-testid="studio-canvas"
      data-edge-authoring-mode={edgeAuthoringTemplate}
      style={{ backgroundColor: viewportPreferences.backgroundColor }}
      ref={canvasRef}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={drop}
      onKeyDown={keyDown}
      onKeyDownCapture={keyDownCapture}
      tabIndex={0}
    >
      {presentationMode ? <Typography className="studio-visually-hidden" component="h1">{snapshot.project.name}</Typography> : null}
      <Typography className="studio-visually-hidden" component="span" id="studio-canvas-keyboard-help">
        Tab to topology objects. Arrow keys move the selection, Alt plus arrow keys resize one selected object,
        L connects two selected nodes, and Shift F10 opens selection actions.
      </Typography>
      {presentationMode ? (
        <StudioIconButton autoFocus className="studio-presentation-exit" aria-label="Exit presentation mode" onClick={onExitPresentation} title="Exit presentation mode"><FullscreenExitIcon fontSize="small" /></StudioIconButton>
      ) : null}

      {!presentationMode ? (
        <Paper aria-label="Canvas authoring tools" className="studio-canvas-toolbar" component="nav" elevation={1}>
          <StudioIconButton aria-label="Copy selection" disabled={!canCopy} onClick={copySelection} title="Copy"><ContentCopyIcon fontSize="small" /></StudioIconButton>
          <StudioIconButton aria-label="Cut selection" disabled={!canCopy} onClick={cutSelection} title="Cut"><ContentCutIcon fontSize="small" /></StudioIconButton>
          <StudioIconButton aria-label="Duplicate selection" disabled={!canCopy} onClick={duplicateSelection} title="Duplicate"><ControlPointDuplicateIcon fontSize="small" /></StudioIconButton>
          <Divider aria-hidden="true" className="studio-canvas-toolbar-separator" flexItem orientation="vertical" />
          <StudioIconButton aria-label="Distribute selection horizontally" disabled={snapshot.selection.length < 3} onClick={() => distributeSelection('horizontal')} title="Distribute horizontally"><SwapHorizIcon fontSize="small" /></StudioIconButton>
          <StudioIconButton aria-label="Distribute selection vertically" disabled={snapshot.selection.length < 3} onClick={() => distributeSelection('vertical')} title="Distribute vertically"><SwapVertIcon fontSize="small" /></StudioIconButton>
          <Divider aria-hidden="true" className="studio-canvas-toolbar-separator" flexItem orientation="vertical" />
          <StudioIconButton aria-label="Save selection as preset" disabled={!canCopy} onClick={saveSelectionAsPreset} title="Save as preset"><DiamondOutlinedIcon fontSize="small" /></StudioIconButton>
          <StudioIconButton aria-expanded={layersOpen} aria-label="Layers" onClick={() => setLayersOpen((value) => !value)} ref={layersButtonRef} title="Layers"><SettingsOutlinedIcon fontSize="small" /></StudioIconButton>
        </Paper>
      ) : null}

      <StudioPopover
        anchorEl={layersButtonRef.current}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        onClose={() => setLayersOpen(false)}
        open={layersOpen}
        slotProps={{ paper: { 'aria-label': 'Layers', className: 'studio-canvas-layers', role: 'dialog' } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
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
            <StudioFormControl className="studio-overlay-controls" component="fieldset">
              <StudioFormLabel component="legend">Overlays</StudioFormLabel>
              {overlayDefinitions.map((toggle) => (
                <StudioLabeledControl
                  key={toggle.id}
                  control={<StudioSwitch
                    checked={overlayToggles[toggle.id] !== false}
                    onChange={(event) => setOverlayToggles((current) => ({
                      ...current,
                      [toggle.id]: event.target.checked
                    }))}
                  />}
                  label={toggle.name || toggle.id}
                />
              ))}
            </StudioFormControl>
          ) : null}
      </StudioPopover>

      <TopoViewer
        connectionHandleMode="shape-handles"
        document={topologyDocument}
        fitViewOnInit={fitViewOnInit}
        grid={viewportPreferences.gridVisible ? {
          color: viewportPreferences.gridColor,
          gap: viewportPreferences.gridSize,
          size: 1
        } : false}
        helperLines={helperLineConfiguration}
        initialViewport={fitViewOnInit
          ? undefined
          : presentationMode ? authoringViewportRef.current : viewport}
        key={viewportMount}
        miniMap={viewportPreferences.miniMapVisible}
        nodesConnectable={!presentationMode}
        nodesDraggable
        nodesResizable
        onlyRenderVisibleElements={useViewportCulling}
        isConnectionValid={validateConnection}
        onConnectionCreate={(connection) => {
          const templateId = edgeAuthoringTemplate || 'link';
          if (createConnection(connection, templateId) && edgeAuthoringTemplate) onCompleteEdgeAuthoring();
        }}
        onNodePositionChange={(change) => {
          regionPreviewIdRef.current = undefined;
          setRegionPreviewId(undefined);
          let moved = false;
          startTransition(() => {
            moved = moveObject(change.id, change.position, change.delta);
          });
          if (moved) {
            performance.mark('topoviewer-studio-drag-commit');
          }
        }}
        onNodePositionPreview={hasRegions ? (change) => {
          const next = previewRegionForNode(change.id, change.position);
          if (regionPreviewIdRef.current === next) return;
          regionPreviewIdRef.current = next;
          onAnnouncement(next
            ? `${change.id} will join region ${next} when movement completes`
            : `${change.id} is outside an eligible region`);
          setRegionPreviewId(next);
        } : undefined}
        onNodeResizeChange={resizeObject}
        onObjectClick={handleObjectClick}
        onLinkAggregateToggle={(change) => {
          setLinkGroupExpanded(change.groupId, change.expanded);
          onAnnouncement(`${change.expanded ? 'Expanded' : 'Collapsed'} parallel link group ${change.groupId}`);
        }}
        onObjectDoubleClick={openQuickEditor}
        onObjectContextMenu={openContextMenu}
        onPaneClick={() => {
          closeContextMenu();
          closeQuickEditor();
          setSelection([]);
          onPaneSelect();
        }}
        onSelectionChange={handleSelectionChange}
        onRegionAggregateToggle={setRegionExpanded}
        onViewportChange={(nextViewport) => {
          setViewport(nextViewport);
          if (!presentationMode) authoringViewportRef.current = nextViewport;
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
        viewportControls={presentationMode && !viewportPreferences.viewportControlsVisible ? false : {
          className: 'studio-canvas-viewport-controls',
          position: 'top-right',
          showFitView: viewportPreferences.viewportControlsVisible,
          showZoom: viewportPreferences.viewportControlsVisible
        }}
      />

      <StudioMenu
        anchorPosition={contextMenu ? { left: contextMenu.x, top: contextMenu.y } : undefined}
        anchorReference="anchorPosition"
        disableRestoreFocus
        onClose={closeContextMenu}
        open={Boolean(contextMenu)}
        slotProps={{
          list: { 'aria-label': 'Selection actions', dense: true },
          paper: { className: 'studio-context-menu' }
        }}
      >
        <StudioMenuItem disabled={!canCopy} onClick={() => { copySelection(); closeContextMenu(); }}>
          <StudioMenuItemIcon><ContentCopyIcon fontSize="small" /></StudioMenuItemIcon>
          <StudioMenuItemText>Copy</StudioMenuItemText>
        </StudioMenuItem>
        <StudioMenuItem disabled={!canCopy} onClick={() => { cutSelection(); closeContextMenu(); }}>
          <StudioMenuItemIcon><ContentCutIcon fontSize="small" /></StudioMenuItemIcon>
          <StudioMenuItemText>Cut</StudioMenuItemText>
        </StudioMenuItem>
        <StudioMenuItem disabled={!canCopy} onClick={() => { duplicateSelection(); closeContextMenu(); }}>
          <StudioMenuItemIcon><ControlPointDuplicateIcon fontSize="small" /></StudioMenuItemIcon>
          <StudioMenuItemText>Duplicate</StudioMenuItemText>
        </StudioMenuItem>
        <StudioMenuItem disabled={!canCopy} onClick={() => { saveSelectionAsPreset(); closeContextMenu(); }}>
          <StudioMenuItemIcon><BookmarkAddOutlinedIcon fontSize="small" /></StudioMenuItemIcon>
          <StudioMenuItemText>Save as preset</StudioMenuItemText>
        </StudioMenuItem>
          {contextSelection?.kind === 'node' && contextRegionId ? (
            <StudioMenuItem onClick={() => { releaseNodeFromRegion(contextSelection.id, contextRegionId); closeContextMenu(); }}>
              <StudioMenuItemIcon><DriveFileMoveOutlinedIcon fontSize="small" /></StudioMenuItemIcon>
              <StudioMenuItemText>Release from region</StudioMenuItemText>
            </StudioMenuItem>
          ) : null}
          {contextSelection?.kind === 'region' ? (
            <>
              <StudioMenuItem onClick={() => { createNestedRegion(contextSelection.id); closeContextMenu(); }}>
                <StudioMenuItemIcon><AccountTreeOutlinedIcon fontSize="small" /></StudioMenuItemIcon>
                <StudioMenuItemText>Create nested region</StudioMenuItemText>
              </StudioMenuItem>
              <StudioMenuItem onClick={() => { setRegionExpanded({ data: {}, expanded: false, groupId: `summary-${contextSelection.id}`, regionId: contextSelection.id }); closeContextMenu(); }}>
                <StudioMenuItemIcon><UnfoldLessIcon fontSize="small" /></StudioMenuItemIcon>
                <StudioMenuItemText>Collapse region</StudioMenuItemText>
              </StudioMenuItem>
            </>
          ) : null}
        <StudioMenuDivider />
        <StudioMenuItem className="studio-context-menu-danger" disabled={!canCopy} onClick={() => { deleteSelection(); closeContextMenu(); }}>
          <StudioMenuItemIcon><DeleteOutlineIcon fontSize="small" /></StudioMenuItemIcon>
          <StudioMenuItemText>Delete</StudioMenuItemText>
        </StudioMenuItem>
      </StudioMenu>

      <QuickTextEditor
        onCancel={closeQuickEditor}
        onSave={(value) => {
          if (quickEditor && commitObjectText(quickEditor.selection, value)) closeQuickEditor();
        }}
        target={quickEditor}
      />

      {objectCount === 0 && (
        <Paper className="studio-canvas-placeholder" elevation={1}>
          <Stack spacing={0.25}>
            <Typography component="strong" variant="subtitle2">Empty topology</Typography>
            <Typography color="text.secondary" variant="caption">0 objects</Typography>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
