import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type Ref } from 'react';
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
  pasteClipboard(): boolean;
  pathMode: NonNullable<CreateAuthoringPathOptions['mode']>;
  presentationMode: boolean;
  previewRegionForNode(id: string, position: { x: number; y: number }): string | undefined;
  proposeMapperMetric(metric: string, selection: StudioSelection): boolean;
  releaseNodeFromRegion(nodeId: string, regionId?: string): boolean;
  renameLayer(layerId: string, name: string): boolean;
  resizeObject(change: TopoViewerNodeResizeChange): boolean;
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
  pasteClipboard,
  pathMode,
  presentationMode,
  previewRegionForNode,
  proposeMapperMetric,
  releaseNodeFromRegion,
  renameLayer,
  resizeObject,
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
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [viewportMount, setViewportMount] = useState(0);
  const authoringViewportRef = useRef(viewport);
  const previousPresentationRef = useRef(presentationMode);
  const overlayDefinitionSignature = overlayDefinitions
    .map((toggle) => `${toggle.id}:${toggle.default !== false}`)
    .join('|');
  const layerIds = (snapshot.projection.document.graph?.layers || []).map((layer) => layer.id);
  const selectedLayerIds = layerIds.filter((layerId) => !hiddenLayerIds.includes(layerId));
  const objectCount = (snapshot.projection.document.graph?.nodes?.length || 0)
    + (snapshot.projection.document.graph?.regions?.length || 0)
    + (snapshot.projection.document.diagram?.shapes?.length || 0)
    + (snapshot.projection.document.diagram?.callouts?.length || 0);
  const selectedObjectIds = snapshot.selection.map((selection) => selection.id);
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
    const defaults = defaultTopoViewerToggles(snapshot.projection.document);
    setOverlayToggles((current) => ({
      ...defaults,
      ...Object.fromEntries(overlayDefinitions.map((toggle) => [toggle.id, current[toggle.id] ?? defaults[toggle.id]]))
    }));
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
      return;
    }
    const templateId = event.dataTransfer.getData('application/x-topoviewer-object') as StudioPaletteTemplateId;
    if (!builtInTemplateIds.has(templateId) && !templateId.startsWith('preset:')) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    createObject(templateId, {
      x: Math.max(0, event.clientX - bounds.left - 44),
      y: Math.max(0, event.clientY - bounds.top - 30)
    });
  }

  function openContextMenu(object: TopoViewerObjectContextMenu) {
    if (!snapshot.selection.some((selection) => selection.id === object.id)) selectObject(object);
    setContextMenu({ objectId: object.id, x: object.clientX, y: object.clientY });
  }

  function keyDown(event: KeyboardEvent<HTMLElement>) {
    if (blocksCanvasShortcut(event.target)) return;
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
    if (delta && canCopy) {
      event.preventDefault();
      nudgeSelection(delta);
    }
  }

  return (
    <section
      className="studio-canvas"
      aria-label="Topology canvas"
      data-testid="studio-canvas"
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
        <button className="studio-presentation-exit" aria-label="Exit presentation mode" onClick={onExitPresentation} title="Exit presentation mode" type="button"><FullscreenExitIcon fontSize="small" /></button>
      ) : null}
      <div className="studio-canvas-toolbar" role="toolbar" aria-label="Canvas actions">
        <button aria-label="Copy selection" disabled={!canCopy} onClick={copySelection} title="Copy" type="button"><ContentCopyIcon fontSize="small" /></button>
        <button aria-label="Cut selection" disabled={!canCopy} onClick={cutSelection} title="Cut" type="button"><ContentCutIcon fontSize="small" /></button>
        <button aria-label="Paste selection" disabled={!canPaste} onClick={pasteClipboard} title="Paste" type="button"><ContentPasteIcon fontSize="small" /></button>
        <button aria-label="Duplicate selection" disabled={!canCopy} onClick={duplicateSelection} title="Duplicate" type="button"><ControlPointDuplicateIcon fontSize="small" /></button>
        <button aria-label="Delete selection" disabled={!canCopy} onClick={deleteSelection} title="Delete" type="button"><DeleteIcon fontSize="small" /></button>
        <span className="studio-toolbar-separator" aria-hidden="true" />
        <button aria-label="Connect selected nodes" disabled={selectedNodeCount !== 2} onClick={connectSelected} title="Connect selected nodes" type="button"><LinkIcon fontSize="small" /></button>
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
        document={snapshot.projection.document}
        helperLines={{ enabled: helperLinesEnabled, snap: snapEnabled, snapMode: 'commit' }}
        initialViewport={presentationMode ? authoringViewportRef.current : viewport}
        key={viewportMount}
        nodesConnectable
        nodesDraggable
        nodesResizable
        isConnectionValid={isConnectionValid}
        onConnectionCreate={createConnection}
        onNodePositionChange={(change) => {
          setRegionPreviewId(undefined);
          moveObject(change.id, change.position, change.delta);
        }}
        onNodePositionPreview={(change) => {
          const next = previewRegionForNode(change.id, change.position);
          setRegionPreviewId((current) => current === next ? current : next);
        }}
        onNodeResizeChange={resizeObject}
        onObjectClick={selectObject}
        onObjectContextMenu={openContextMenu}
        onPaneClick={() => {
          setContextMenu(undefined);
          setSelection([]);
        }}
        onSelectionChange={selectFromCanvas}
        onRegionAggregateToggle={setRegionExpanded}
        onViewportChange={(nextViewport) => {
          setViewport(nextViewport);
          if (!presentationMode) authoringViewportRef.current = nextViewport;
        }}
        previewObjectIds={regionPreviewId ? [regionPreviewId] : []}
        selectedLayerIds={selectedLayerIds}
        selectedObjectIds={selectedObjectIds}
        style={{ height: '100%', width: '100%' }}
        toggles={overlayToggles}
      />

      {contextMenu ? (
        <div className="studio-context-menu" role="menu" aria-label="Selection actions" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button disabled={!canCopy} onClick={() => { copySelection(); setContextMenu(undefined); }} role="menuitem" type="button">Copy</button>
          <button disabled={!canCopy} onClick={() => { cutSelection(); setContextMenu(undefined); }} role="menuitem" type="button">Cut</button>
          <button disabled={!canCopy} onClick={() => { duplicateSelection(); setContextMenu(undefined); }} role="menuitem" type="button">Duplicate</button>
          <button disabled={!canCopy} onClick={() => { saveSelectionAsPreset(); setContextMenu(undefined); }} role="menuitem" type="button">Save as preset</button>
          {contextSelection?.kind === 'node' && contextRegionId ? (
            <button onClick={() => { releaseNodeFromRegion(contextSelection.id, contextRegionId); setContextMenu(undefined); }} role="menuitem" type="button">Release from region</button>
          ) : null}
          {contextSelection?.kind === 'region' ? (
            <>
              <button onClick={() => { createNestedRegion(contextSelection.id); setContextMenu(undefined); }} role="menuitem" type="button">Create nested region</button>
              <button onClick={() => { setRegionExpanded({ data: {}, expanded: false, groupId: `summary-${contextSelection.id}`, regionId: contextSelection.id }); setContextMenu(undefined); }} role="menuitem" type="button">Collapse region</button>
            </>
          ) : null}
          <button disabled={!canCopy} onClick={() => { deleteSelection(); setContextMenu(undefined); }} role="menuitem" type="button">Delete</button>
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
