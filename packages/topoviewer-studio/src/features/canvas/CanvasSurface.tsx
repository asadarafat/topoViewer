import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type Ref } from 'react';
import AlignHorizontalLeftIcon from '@mui/icons-material/AlignHorizontalLeft';
import AlignVerticalTopIcon from '@mui/icons-material/AlignVerticalTop';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ControlPointDuplicateIcon from '@mui/icons-material/ControlPointDuplicate';
import DeleteIcon from '@mui/icons-material/Delete';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import { defaultTopoViewerToggles, TopoViewer } from 'topoviewer';
import type {
  TopoViewerConnectionCreate,
  TopoViewerObjectClick,
  TopoViewerProps
} from 'topoviewer';
import { authoringRegionsForMember, resolveAuthoringSelection } from 'topoviewer/authoring';
import type {
  AuthoringAlignment,
  AuthoringDistributionAxis,
  CreateAuthoringPathOptions,
  TopoViewerNodeResizeChange,
  TopoViewerObjectContextMenu,
  TopoViewerSelectionChange
} from 'topoviewer/authoring';
import type { StudioSelection, StudioSessionSnapshot } from '../../contracts/project';
import { focusFirstAvailable } from '../../accessibility/focus';
import { LayerControls } from '../layers/LayerControls';
import type { StudioPaletteTemplateId } from '../palette/types';

interface CanvasSurfaceProps {
  alignSelection(alignment: AuthoringAlignment): boolean;
  canvasRef?: Ref<HTMLElement>;
  canCopy: boolean;
  canPaste: boolean;
  connectSelected(): boolean;
  copySelection(): boolean;
  cutSelection(): boolean;
  createConnection(connection: TopoViewerConnectionCreate): boolean;
  createLayer(name?: string): boolean;
  createNestedRegion(parentId: string): boolean;
  isConnectionValid(connection: TopoViewerConnectionCreate): boolean;
  createObject(templateId: StudioPaletteTemplateId, position: { x: number; y: number }): boolean;
  deleteSelection(): boolean;
  deleteLayer(layerId: string, replacementLayerId?: string): boolean;
  distributeSelection(axis: AuthoringDistributionAxis): boolean;
  duplicateSelection(): boolean;
  moveObject(id: string, position: { x: number; y: number }, delta?: { x: number; y: number }): boolean;
  nudgeSelection(delta: { x: number; y: number }): boolean;
  onAnnouncement(message: string): void;
  pasteClipboard(): boolean;
  pathMode: NonNullable<CreateAuthoringPathOptions['mode']>;
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
  setPathMode(mode: NonNullable<CreateAuthoringPathOptions['mode']>): void;
  setRegionExpanded(change: Parameters<NonNullable<TopoViewerProps['onRegionAggregateToggle']>>[0]): boolean;
  snapshot: StudioSessionSnapshot;
  onExitPresentation(): void;
}

const builtInTemplateIds = new Set<StudioPaletteTemplateId>([
  'node', 'router', 'service', 'controller', 'external', 'path', 'region', 'shape', 'callout', 'asset-router'
]);

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
  alignSelection,
  canvasRef,
  canCopy,
  canPaste,
  connectSelected,
  copySelection,
  cutSelection,
  createConnection,
  createLayer,
  createNestedRegion,
  isConnectionValid,
  createObject,
  deleteSelection,
  deleteLayer,
  distributeSelection,
  duplicateSelection,
  moveObject,
  nudgeSelection,
  onAnnouncement,
  pasteClipboard,
  pathMode,
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
  setPathMode,
  setRegionExpanded,
  snapshot,
  onExitPresentation
}: CanvasSurfaceProps) {
  const [contextMenu, setContextMenu] = useState<{ objectId: string; x: number; y: number }>();
  const [regionPreviewId, setRegionPreviewId] = useState<string>();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helperLinesEnabled, setHelperLinesEnabled] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [hiddenLayerIds, setHiddenLayerIds] = useState<string[]>([]);
  const overlayDefinitions = (snapshot.projection.document.toggles || [])
    .filter((toggle) => toggle.id === 'physical-port' || toggle.id === 'bandwidth');
  const [overlayToggles, setOverlayToggles] = useState(() => defaultTopoViewerToggles(snapshot.projection.document));
  const overlayTogglesRef = useRef(overlayToggles);
  overlayTogglesRef.current = overlayToggles;
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [viewportMount, setViewportMount] = useState(0);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const contextReturnFocusRef = useRef<HTMLElement | null>(null);
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
  const topologyDocument = snapshot.projection.document;
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
    + (snapshot.projection.document.diagram?.callouts?.length || 0);
  const linkCount = snapshot.projection.document.graph?.links?.length || 0;
  const useViewportCulling = (snapshot.projection.document.graph?.nodes?.length || 0) >= 500
    || (snapshot.projection.document.graph?.links?.length || 0) >= 1000;
  const selectedObjectIds = useMemo(
    () => snapshot.selection.map((selection) => selection.id),
    [snapshot.selection]
  );
  const previewObjectIds = useMemo(() => regionPreviewId ? [regionPreviewId] : [], [regionPreviewId]);
  const helperLineConfiguration = useMemo(() => ({
    enabled: helperLinesEnabled,
    snap: snapEnabled,
    snapMode: 'commit' as const
  }), [helperLinesEnabled, snapEnabled]);
  const selectedNodeCount = snapshot.selection.filter((selection) => selection.kind === 'node').length;
  const contextSelection = contextMenu
    ? resolveAuthoringSelection(snapshot.projection.document, contextMenu.objectId)
      : undefined;

  useEffect(() => {
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

  useEffect(() => {
    if (contextMenu) focusFirstAvailable(contextMenuRef.current);
  }, [contextMenu]);

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
    performance.clearMarks('topoviewer-studio-drop-start');
    performance.clearMarks('topoviewer-studio-drop-visible');
    performance.mark('topoviewer-studio-drop-start');
    pendingDropPaintRef.current = true;
    const created = createObject(templateId, {
      x: Math.max(0, event.clientX - bounds.left - 44),
      y: Math.max(0, event.clientY - bounds.top - 30)
    });
    if (!created) pendingDropPaintRef.current = false;
  }

  function openContextMenu(object: TopoViewerObjectContextMenu) {
    if (!snapshot.selection.some((selection) => selection.id === object.id)) selectObject(object);
    contextReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setContextMenu({ objectId: object.id, x: object.clientX, y: object.clientY });
  }

  function closeContextMenu() {
    setContextMenu(undefined);
    const target = contextReturnFocusRef.current;
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
    setContextMenu({
      objectId: selection.id,
      x: Math.min(window.innerWidth - 190, Math.max(8, bounds.left + Math.min(bounds.width, 32))),
      y: Math.min(window.innerHeight - 220, Math.max(8, bounds.top + Math.min(bounds.height, 32)))
    });
  }

  function contextMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeContextMenu();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not([disabled])')];
    if (!items.length) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    const next = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : (Math.max(0, current) + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next].focus();
  }

  function validateConnection(connection: TopoViewerConnectionCreate) {
    const valid = isConnectionValid(connection);
    const key = `${connection.sourceId}:${connection.targetId}:${valid}`;
    if (connectionAnnouncementRef.current !== key) {
      connectionAnnouncementRef.current = key;
      if (connectionAnnouncementFrameRef.current !== undefined) {
        cancelAnimationFrame(connectionAnnouncementFrameRef.current);
      }
      connectionAnnouncementFrameRef.current = requestAnimationFrame(() => {
        onAnnouncement(valid
          ? `Valid connection from ${connection.sourceId} to ${connection.targetId}`
          : `Invalid or duplicate connection from ${connection.sourceId} to ${connection.targetId}`);
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
    if (blocksCanvasShortcut(event.target)) return;
    if (event.key === 'Escape' && settingsOpen) {
      event.preventDefault();
      setSettingsOpen(false);
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
    <section
      className="studio-canvas"
      aria-label="Topology canvas"
      aria-describedby="studio-canvas-keyboard-help"
      aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight Shift+F10 L Control+C Meta+C Control+V Meta+V"
      data-testid="studio-canvas"
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
      <span className="studio-visually-hidden" id="studio-canvas-keyboard-help">
        Tab to topology objects. Arrow keys move the selection, Alt plus arrow keys resize one selected object,
        L connects two selected nodes, and Shift F10 opens selection actions.
      </span>
      {presentationMode ? (
        <button autoFocus className="studio-presentation-exit" aria-label="Exit presentation mode" onClick={onExitPresentation} title="Exit presentation mode" type="button"><FullscreenExitIcon fontSize="small" /></button>
      ) : null}
      <div className="studio-canvas-toolbar" role="toolbar" aria-label="Canvas actions">
        <button aria-label="Copy selection" disabled={!canCopy} onClick={copySelection} title="Copy" type="button"><ContentCopyIcon fontSize="small" /></button>
        <button aria-label="Cut selection" disabled={!canCopy} onClick={cutSelection} title="Cut" type="button"><ContentCutIcon fontSize="small" /></button>
        <button aria-label="Paste selection" disabled={!canPaste} onClick={pasteClipboard} title="Paste" type="button"><ContentPasteIcon fontSize="small" /></button>
        <button aria-label="Duplicate selection" disabled={!canCopy} onClick={duplicateSelection} title="Duplicate" type="button"><ControlPointDuplicateIcon fontSize="small" /></button>
        <button aria-label="Delete selection" disabled={!canCopy} onClick={deleteSelection} title="Delete" type="button"><DeleteIcon fontSize="small" /></button>
        <span className="studio-toolbar-separator" aria-hidden="true" />
        <button aria-keyshortcuts="L" aria-label="Connect selected nodes" disabled={selectedNodeCount !== 2} onClick={connectSelected} title="Connect selected nodes" type="button"><LinkIcon fontSize="small" /></button>
        <button aria-label="Align selection left" disabled={snapshot.selection.length < 2} onClick={() => alignSelection('left')} title="Align left" type="button"><AlignHorizontalLeftIcon fontSize="small" /></button>
        <button aria-label="Align selection top" disabled={snapshot.selection.length < 2} onClick={() => alignSelection('top')} title="Align top" type="button"><AlignVerticalTopIcon fontSize="small" /></button>
        <button aria-label="Distribute selection horizontally" disabled={snapshot.selection.length < 3} onClick={() => distributeSelection('horizontal')} title="Distribute horizontally" type="button"><SwapHorizIcon fontSize="small" /></button>
        <button aria-label="Distribute selection vertically" disabled={snapshot.selection.length < 3} onClick={() => distributeSelection('vertical')} title="Distribute vertically" type="button"><SwapVertIcon fontSize="small" /></button>
        <button aria-label="Save selection as preset" disabled={!canCopy} onClick={saveSelectionAsPreset} title="Save as preset" type="button"><BookmarkAddIcon fontSize="small" /></button>
        <span className="studio-toolbar-separator" aria-hidden="true" />
        <button aria-expanded={settingsOpen} aria-label="Viewport settings" onClick={() => setSettingsOpen((value) => !value)} title="Viewport settings" type="button"><SettingsIcon fontSize="small" /></button>
      </div>

      {settingsOpen ? (
        <div className="studio-canvas-settings" role="dialog" aria-label="Viewport settings">
          <label><input checked={helperLinesEnabled} onChange={(event) => setHelperLinesEnabled(event.target.checked)} type="checkbox" />Helper lines</label>
          <label><input checked={snapEnabled} disabled={!helperLinesEnabled} onChange={(event) => setSnapEnabled(event.target.checked)} type="checkbox" />Snap to alignment</label>
          <label>Path mode
            <select aria-label="Path mode" onChange={(event) => setPathMode(event.target.value as NonNullable<CreateAuthoringPathOptions['mode']>)} value={pathMode}>
              <option value="loose">Loose endpoints</option>
              <option value="shortest">Shortest traversal</option>
              <option value="explicit">Explicit hops</option>
            </select>
          </label>
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
            <fieldset className="studio-overlay-controls">
              <legend>Overlays</legend>
              {overlayDefinitions.map((toggle) => (
                <label key={toggle.id}>
                  <input
                    checked={overlayToggles[toggle.id] !== false}
                    onChange={(event) => setOverlayToggles((current) => ({
                      ...current,
                      [toggle.id]: event.target.checked
                    }))}
                    type="checkbox"
                  />
                  {toggle.name || toggle.id}
                </label>
              ))}
            </fieldset>
          ) : null}
        </div>
      ) : null}

      <TopoViewer
        connectionHandleMode="handles"
        document={topologyDocument}
        helperLines={helperLineConfiguration}
        initialViewport={presentationMode ? authoringViewportRef.current : viewport}
        key={viewportMount}
        nodesConnectable
        nodesDraggable
        nodesResizable
        onlyRenderVisibleElements={useViewportCulling}
        isConnectionValid={validateConnection}
        onConnectionCreate={createConnection}
        onNodePositionChange={(change) => {
          regionPreviewIdRef.current = undefined;
          setRegionPreviewId(undefined);
          if (moveObject(change.id, change.position, change.delta)) {
            performance.mark('topoviewer-studio-drag-commit');
          }
        }}
        onNodePositionPreview={(change) => {
          const next = previewRegionForNode(change.id, change.position);
          if (regionPreviewIdRef.current === next) return;
          regionPreviewIdRef.current = next;
          onAnnouncement(next
            ? `${change.id} will join region ${next} when movement completes`
            : `${change.id} is outside an eligible region`);
          setRegionPreviewId(next);
        }}
        onNodeResizeChange={resizeObject}
        onObjectClick={selectObject}
        onObjectContextMenu={openContextMenu}
        onPaneClick={() => {
          closeContextMenu();
          setSelection([]);
        }}
        onSelectionChange={selectFromCanvas}
        onRegionAggregateToggle={setRegionExpanded}
        onViewportChange={(nextViewport) => {
          setViewport(nextViewport);
          if (!presentationMode) authoringViewportRef.current = nextViewport;
        }}
        previewObjectIds={previewObjectIds}
        selectedLayerIds={selectedLayerIds}
        selectedObjectIds={selectedObjectIds}
        style={{ height: '100%', width: '100%' }}
        toggles={overlayToggles}
      />

      {contextMenu ? (
        <div className="studio-context-menu" onKeyDown={contextMenuKeyDown} ref={contextMenuRef} role="menu" aria-label="Selection actions" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button disabled={!canCopy} onClick={() => { copySelection(); closeContextMenu(); }} role="menuitem" type="button">Copy</button>
          <button disabled={!canCopy} onClick={() => { cutSelection(); closeContextMenu(); }} role="menuitem" type="button">Cut</button>
          <button disabled={!canCopy} onClick={() => { duplicateSelection(); closeContextMenu(); }} role="menuitem" type="button">Duplicate</button>
          <button disabled={!canCopy} onClick={() => { saveSelectionAsPreset(); closeContextMenu(); }} role="menuitem" type="button">Save as preset</button>
          {contextSelection?.kind === 'node' && contextRegionId ? (
            <button onClick={() => { releaseNodeFromRegion(contextSelection.id, contextRegionId); closeContextMenu(); }} role="menuitem" type="button">Release from region</button>
          ) : null}
          {contextSelection?.kind === 'region' ? (
            <>
              <button onClick={() => { createNestedRegion(contextSelection.id); closeContextMenu(); }} role="menuitem" type="button">Create nested region</button>
              <button onClick={() => { setRegionExpanded({ data: {}, expanded: false, groupId: `summary-${contextSelection.id}`, regionId: contextSelection.id }); closeContextMenu(); }} role="menuitem" type="button">Collapse region</button>
            </>
          ) : null}
          <button disabled={!canCopy} onClick={() => { deleteSelection(); closeContextMenu(); }} role="menuitem" type="button">Delete</button>
        </div>
      ) : null}

      {objectCount === 0 && (
        <div className="studio-canvas-placeholder">
          <strong>Empty topology</strong>
          <span>0 objects</span>
        </div>
      )}
    </section>
  );
}
