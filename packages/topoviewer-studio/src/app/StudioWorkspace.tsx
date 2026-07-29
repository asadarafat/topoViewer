import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import CoPresentIcon from '@mui/icons-material/CoPresent';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import IosShareIcon from '@mui/icons-material/IosShare';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RedoIcon from '@mui/icons-material/Redo';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import UndoIcon from '@mui/icons-material/Undo';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { StudioExternalChange, StudioHost } from '../contracts/host';
import type { StudioDocumentKind, StudioProject, StudioRecoverySnapshot, StudioSelection } from '../contracts/project';
import { useStableActions } from '../contracts/useStableActions';
import { CanvasSurface } from '../features/canvas/CanvasSurface';
import type { StudioCanvasActions, StudioCanvasModel } from '../features/canvas/contracts';
import type { PropertiesCodeDocument } from '../features/inspector/PropertiesWorkspace';
import { StyleAwareSaveControls } from '../features/inspector/StyleCandidateFooter';
import { ObjectPalette } from '../features/palette/ObjectPalette';
import type { StudioEdgeAuthoringTemplateId } from '../features/palette/types';
import { StudioNavigator } from '../features/workspace/StudioNavigator';
import { WorkspaceRail, type StudioWorkspaceView } from '../features/workspace/WorkspaceRail';
import {
  defaultStudioWorkspaceLayoutPreferences,
  normalizeStudioWorkspaceLayoutPreferences,
  normalizeStudioWorkspaceWidth,
  studioWorkspaceMaximumWidth,
  studioWorkspaceMinimumWidth,
  studioWorkspaceWidthFromPointer
} from '../features/workspace/workspaceLayout';
import { defaultStudioViewportPreferences, normalizeStudioViewportPreferences, type StudioViewportPreferences } from '../features/viewport/types';
import type { StudioProjectLifecycleActions } from '../features/projects/ProjectMenu';
import { StudioIconButton, StudioMenu, StudioMenuItem, StudioMenuItemIcon, StudioMenuItemText } from '../ui/controls';
import { serializeStylesheetCandidateRecovery } from '../session';
import { useStudioController } from './useStudioController';
import { useStudioAutosave } from './useStudioAutosave';
import { studioSpace } from '../ui/muiSpacing';
import { studioCssVariables } from '../ui/studioCssVariables';
import { studioGeometry, studioLayer } from '../ui/studioTokens';
import { useStudioColorScheme } from '../ui/StudioThemeProvider';
import { StudioAppearanceControl } from './StudioAppearanceControl';
import { StudioCommandPalette } from './StudioCommandPalette';
import { StudioStatusBar } from './StudioStatusBar';

const MapperWorkspace = lazy(() => import('../features/mapper/MapperWorkspace'));
const PropertiesWorkspace = lazy(() => import('../features/inspector/PropertiesWorkspace').then((module) => ({ default: module.PropertiesWorkspace })));
const ExportPanel = lazy(() => import('../features/export/ExportPanel'));
const ProjectDialogs = lazy(() => import('../features/projects/ProjectDialogs'));
const ProjectMenu = lazy(() => import('../features/projects/ProjectDialogs').then((module) => ({ default: module.ProjectMenu })));
const studioFeedbackUrl = 'https://github.com/asadarafat/topoviewer/issues/new?template=studio_preview_feedback.yml';
const studioWorkspaceLayoutPreferenceKey = 'workspace-layout';
const studioWorkspaceKeyboardStep = 16;

interface StudioWorkspaceProps {
  forceEditorFailure?: boolean;
  host: StudioHost;
  onReload(): Promise<void>;
  project: StudioProject;
  projectLifecycle: StudioProjectLifecycleActions;
  recovery?: StudioRecoverySnapshot;
}

/** Every destination fills the one panel, so they all share the same box. */
const workspaceViewSx = {
  display: 'grid',
  gridTemplateRows: 'minmax(0, 1fr)',
  height: '100%',
  minHeight: 0,
  minWidth: 0,
  overflow: 'hidden',
  width: '100%',
  '&[hidden]': { display: 'none' }
} as const;

export function StudioWorkspace({ forceEditorFailure, host, onReload, project, projectLifecycle, recovery }: StudioWorkspaceProps) {
  const controller = useStudioController({ host, onReload, project, recovery });
  const theme = useTheme();
  /** Below the desktop breakpoint the dock overlays the canvas instead of dividing it. */
  const compact = useMediaQuery(theme.breakpoints.down('md'));
  const [panelOpen, setPanelOpen] = useState(defaultStudioWorkspaceLayoutPreferences.panelOpen);
  const [compactPanelOpen, setCompactPanelOpen] = useState(false);
  const [workspaceView, setWorkspaceView] = useState<StudioWorkspaceView>('add');
  const [propertiesCodeDocument, setPropertiesCodeDocument] = useState<PropertiesCodeDocument>('topology');
  const [workspaceWidth, setWorkspaceWidth] = useState(defaultStudioWorkspaceLayoutPreferences.workspaceWidth);
  const [workspaceLayoutReady, setWorkspaceLayoutReady] = useState(false);
  const [visitedWorkspaceViews, setVisitedWorkspaceViews] = useState<Set<StudioWorkspaceView>>(() => new Set(['add']));
  const [presentationMode, setPresentationMode] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [externalChange, setExternalChange] = useState<StudioExternalChange>();
  const [externalDiskProject, setExternalDiskProject] = useState<StudioProject>();
  const [externalChangeError, setExternalChangeError] = useState<string>();
  const [externalChangeLoading, setExternalChangeLoading] = useState(false);
  const [viewportPreferences, setViewportPreferences] = useState<StudioViewportPreferences>(defaultStudioViewportPreferences);
  const [viewportPreferencesReady, setViewportPreferencesReady] = useState(false);
  const [hiddenLayerIds, setHiddenLayerIds] = useState<string[]>([]);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [edgeAuthoringTemplate, setEdgeAuthoringTemplate] = useState<StudioEdgeAuthoringTemplateId>();
  const [formatPainterSource, setFormatPainterSource] = useState<StudioSelection>();
  const [headerActionsAnchor, setHeaderActionsAnchor] = useState<HTMLElement | null>(null);
  const [pendingProjectAction, setPendingProjectAction] = useState<{
    action(): Promise<void>;
    context: string;
  }>();
  const canvasRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const workspaceWidthRef = useRef(workspaceWidth);
  const viewportPreferencesEditedRef = useRef(false);
  const presentationTriggerRef = useRef<HTMLButtonElement>(null);
  const { snapshot } = controller;
  const snapshotRef = useRef(snapshot);
  const autosave = useStudioAutosave(host, snapshot, controller.stylesheetCandidate);
  const appearance = useStudioColorScheme();
  /** The panel is showing when the width-appropriate dock is open. */
  const panelVisible = compact ? compactPanelOpen : panelOpen;
  const beforeProjectSwitch = async (action: () => Promise<void>, context = 'Switching projects') => {
    if (controller.stylesheetCandidate.getSnapshot().dirty) {
      setPendingProjectAction({ action, context });
      return;
    }
    if (await controller.flushRecovery()) await action();
  };
  const guardedProjectLifecycle: StudioProjectLifecycleActions = {
    ...projectLifecycle,
    ...(projectLifecycle.create
      ? {
          create: () => beforeProjectSwitch(projectLifecycle.create!, 'Creating a project')
        }
      : {}),
    ...(projectLifecycle.delete
      ? {
          delete: (id: string) => beforeProjectSwitch(() => projectLifecycle.delete!(id), id === projectLifecycle.activeProjectId ? 'Deleting this project' : 'Deleting a project')
        }
      : {}),
    ...(projectLifecycle.duplicate
      ? {
          duplicate: (id: string) => beforeProjectSwitch(() => projectLifecycle.duplicate!(id), 'Duplicating a project')
        }
      : {}),
    ...(projectLifecycle.open
      ? {
          open: (id: string) => beforeProjectSwitch(() => projectLifecycle.open!(id), 'Opening another project')
        }
      : {}),
    ...(projectLifecycle.openArchive
      ? {
          openArchive: () => projectLifecycle.openArchive!((activate) => beforeProjectSwitch(activate, 'Opening an archive'))
        }
      : {}),
    ...(projectLifecycle.openFolder
      ? {
          openFolder: () => projectLifecycle.openFolder!((activate) => beforeProjectSwitch(activate, 'Opening a folder'))
        }
      : {})
  };

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    workspaceWidthRef.current = workspaceWidth;
  }, [workspaceWidth]);

  useEffect(() => {
    let active = true;
    void host.readPreference<unknown>(studioWorkspaceLayoutPreferenceKey).then((result) => {
      if (!active) return;
      if (result.ok && result.value !== undefined) {
        const layout = normalizeStudioWorkspaceLayoutPreferences(result.value);
        setPanelOpen(layout.panelOpen);
        setWorkspaceWidth(layout.workspaceWidth);
        setWorkspaceView(layout.workspaceView);
        setVisitedWorkspaceViews((current) => (current.has(layout.workspaceView) ? current : new Set(current).add(layout.workspaceView)));
      }
      setWorkspaceLayoutReady(true);
    });
    return () => {
      active = false;
    };
  }, [host]);

  useEffect(() => {
    if (!workspaceLayoutReady) return;
    const timer = setTimeout(() => {
      void host
        .writePreference(studioWorkspaceLayoutPreferenceKey, {
          panelOpen,
          workspaceView,
          workspaceWidth
        })
        .then((result) => {
          if (!result.ok)
            host.report({
              category: 'persistence',
              detail: { code: result.error.code },
              name: 'studio-workspace-layout-write-failed'
            });
        });
    }, 150);
    return () => clearTimeout(timer);
  }, [host, panelOpen, workspaceLayoutReady, workspaceView, workspaceWidth]);

  useEffect(() => {
    let active = true;
    void host.readPreference<StudioViewportPreferences>('canvas-display').then((result) => {
      if (!active) return;
      if (result.ok && result.value && !viewportPreferencesEditedRef.current) {
        setViewportPreferences(normalizeStudioViewportPreferences(result.value));
      }
      setViewportPreferencesReady(true);
    });
    return () => {
      active = false;
    };
  }, [host]);

  useEffect(() => {
    if (!viewportPreferencesReady) return;
    const timer = setTimeout(() => {
      void host.writePreference('canvas-display', viewportPreferences).then((result) => {
        if (!result.ok)
          host.report({
            category: 'persistence',
            detail: { code: result.error.code },
            name: 'studio-viewport-preference-write-failed'
          });
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [host, viewportPreferences, viewportPreferencesReady]);

  useEffect(
    () =>
      host.watchProject?.((event) => {
        const current = snapshotRef.current;
        host.report({
          category: 'persistence',
          detail: { kind: event.kind },
          name: 'studio-external-change-detected'
        });
        if (current.status === 'saved' && !controller.stylesheetCandidate.getSnapshot().dirty && event.kind === 'changed') {
          void onReload();
          return;
        }
        controller.markExternalConflict();
        setExternalChange(event);
        setExternalDiskProject(undefined);
        setExternalChangeError(undefined);
      }),
    [host, onReload]
  );

  async function loadExternalProject() {
    if (!externalChange) return undefined;
    setExternalChangeLoading(true);
    const loaded = await host.loadProject(externalChange.reference);
    setExternalChangeLoading(false);
    if (!loaded.ok) {
      setExternalChangeError(loaded.error.message);
      return undefined;
    }
    setExternalDiskProject(loaded.value.project);
    setExternalChangeError(undefined);
    return loaded.value.project;
  }

  async function keepExternalDraft() {
    if (!externalChange) return;
    const disk = externalDiskProject || (await loadExternalProject());
    const revision = disk?.revision || externalChange.revision;
    if (!revision) {
      setExternalChangeError('Studio cannot rebase this draft because the disk revision is unavailable. Export the project before closing it.');
      return;
    }
    controller.keepDraftAfterExternalChange(revision);
    setExternalChange(undefined);
    setExternalDiskProject(undefined);
  }

  async function reloadExternalProject() {
    if (!externalChange) return;
    setExternalChangeLoading(true);
    const current = snapshotRef.current;
    const recovery = await host.saveRecovery({
      capturedAt: new Date().toISOString(),
      invalidDrafts: structuredClone(current.invalidDrafts),
      project: structuredClone(current.project),
      reason: 'before-reload',
      sourceRevision: current.projection.sourceRevision,
      stylesheetCandidate: serializeStylesheetCandidateRecovery(controller.stylesheetCandidate.getSnapshot())
    });
    if (!recovery.ok) {
      setExternalChangeLoading(false);
      setExternalChangeError(`Studio could not preserve the current draft before reload: ${recovery.error.message}`);
      return;
    }
    await onReload();
    setExternalChangeLoading(false);
    setExternalChange(undefined);
    setExternalDiskProject(undefined);
  }

  function createFromPalette(templateId: Parameters<typeof controller.createPaletteObject>[0]) {
    const created = controller.createPaletteObject(templateId);
    if (created) requestAnimationFrame(() => canvasRef.current?.focus());
    return created;
  }

  function changeEdgeAuthoringTemplate(templateId?: StudioEdgeAuthoringTemplateId) {
    if (templateId) setFormatPainterSource(undefined);
    setEdgeAuthoringTemplate(templateId);
    controller.announce(
      templateId
        ? `${templateId.startsWith('preset:') ? 'Saved link' : templateId === 'directional-link' ? 'Directional traffic' : templateId === 'parallel-link' ? 'Parallel link' : templateId === 'parent-link-pipe' ? 'Parent link pipe' : 'Link'} authoring active`
        : 'Edge authoring cancelled'
    );
    if (templateId) requestAnimationFrame(() => canvasRef.current?.focus());
  }

  function startFormatPainter() {
    const source = snapshot.selection.length === 1 ? snapshot.selection[0] : undefined;
    if (!source || !controller.canCopyFormat) return;
    setEdgeAuthoringTemplate(undefined);
    setFormatPainterSource(source);
    controller.announce(`Copied ${source.id} format. Select another ${source.kind} to apply it; press Escape to cancel.`);
  }

  function cancelFormatPainter() {
    if (!formatPainterSource) return;
    setFormatPainterSource(undefined);
    controller.announce('Format Painter cancelled');
  }

  function shellKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.defaultPrevented) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
      event.preventDefault();
      setCommandPaletteOpen(true);
      return;
    }
    if (event.key !== 'Escape' || (!edgeAuthoringTemplate && !formatPainterSource)) return;
    const target = event.target instanceof Element ? event.target : undefined;
    if (target?.closest('input, select, textarea, [contenteditable="true"], [role="dialog"], [role="menu"], .monaco-editor')) return;
    event.preventDefault();
    if (formatPainterSource) cancelFormatPainter();
    else changeEdgeAuthoringTemplate(undefined);
  }

  function exitPresentation() {
    setPresentationMode(false);
    requestAnimationFrame(() => presentationTriggerRef.current?.focus());
  }

  /** Change the visible destination without reopening a panel the user closed. */
  function selectWorkspace(view: StudioWorkspaceView) {
    setVisitedWorkspaceViews((current) => {
      if (current.has(view)) return current;
      const next = new Set(current);
      next.add(view);
      return next;
    });
    setWorkspaceView(view);
  }

  function setPanelVisible(open: boolean) {
    if (compact) setCompactPanelOpen(open);
    else setPanelOpen(open);
  }

  /** Explicit navigation: change the destination and make sure the panel is visible. */
  function openWorkspace(view: StudioWorkspaceView) {
    selectWorkspace(view);
    setPanelVisible(true);
  }

  /**
   * Selecting an object points the panel at Properties, except while Mapper is
   * open: that specialist destination stays active across selection changes.
   * A narrow dock is never forced open over the object the user just clicked.
   */
  function revealProperties() {
    if (workspaceView === 'mapper') return;
    selectWorkspace('properties');
    if (!compact) setPanelOpen(true);
  }

  function openCodeDocument(kind: StudioDocumentKind) {
    if (kind === 'mapper') {
      openWorkspace('mapper');
      return;
    }
    setPropertiesCodeDocument(kind);
    controller.stylesheetCandidate.setMode('yaml');
    openWorkspace('properties');
  }

  function applyWorkspaceWidth(value: number, separator?: HTMLElement) {
    const width = normalizeStudioWorkspaceWidth(value);
    workspaceWidthRef.current = width;
    shellRef.current?.style.setProperty('--studio-panel-width', `${width}px`);
    separator?.setAttribute('aria-valuenow', String(width));
    separator?.setAttribute('aria-valuetext', `${width} pixels wide`);
    return width;
  }

  function resizeWorkspacePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !panelOpen) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function resizeWorkspacePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const shellRight = shellRef.current?.getBoundingClientRect().right;
    if (shellRight === undefined) return;
    applyWorkspaceWidth(studioWorkspaceWidthFromPointer(event.clientX, shellRight), event.currentTarget);
  }

  function finishWorkspacePointerResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setWorkspaceWidth(workspaceWidthRef.current);
  }

  /** The panel grows toward the canvas, so Left widens it and Right narrows it. */
  function resizeWorkspaceWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    let next: number | undefined;
    if (event.key === 'ArrowLeft') next = workspaceWidthRef.current + studioWorkspaceKeyboardStep;
    if (event.key === 'ArrowRight') next = workspaceWidthRef.current - studioWorkspaceKeyboardStep;
    if (event.key === 'Home') next = studioWorkspaceMinimumWidth;
    if (event.key === 'End') next = studioWorkspaceMaximumWidth;
    if (next === undefined) return;
    event.preventDefault();
    setWorkspaceWidth(applyWorkspaceWidth(next, event.currentTarget));
  }

  function resetWorkspaceWidth(event: ReactPointerEvent<HTMLDivElement>) {
    setWorkspaceWidth(applyWorkspaceWidth(defaultStudioWorkspaceLayoutPreferences.workspaceWidth, event.currentTarget));
  }

  async function saveProject() {
    const saved = await controller.save();
    if (saved === false && controller.stylesheetCandidate.getSnapshot().status === 'invalid-dirty') {
      setPropertiesCodeDocument('stylesheet');
      controller.stylesheetCandidate.setMode('yaml');
      openWorkspace('properties');
    }
  }

  function openExportPanel() {
    if (controller.applyStylesheetCandidate()) {
      setExportOpen(true);
      return;
    }
    setPropertiesCodeDocument('stylesheet');
    controller.stylesheetCandidate.setMode('yaml');
    openWorkspace('properties');
  }

  async function continuePendingProjectAction(discard: boolean) {
    const pending = pendingProjectAction;
    if (!pending) return;
    if (discard) controller.revertStylesheetCandidate();
    else if (!controller.applyStylesheetCandidate()) return;
    setPendingProjectAction(undefined);
    if (await controller.flushRecovery()) await pending.action();
  }

  function changeViewportPreferences(patch: Partial<StudioViewportPreferences>) {
    viewportPreferencesEditedRef.current = true;
    setViewportPreferences((current) => ({ ...current, ...patch }));
  }

  const diagnostics = useMemo(
    () => [
      ...snapshot.projection.diagnostics,
      ...Object.values(snapshot.invalidDrafts).flatMap((draft) => draft?.diagnostics || [])
    ],
    [snapshot.invalidDrafts, snapshot.projection.diagnostics]
  );
  const nodeCount = snapshot.projection.document.graph?.nodes?.length || 0;
  const linkCount = snapshot.projection.document.graph?.links?.length || 0;

  const canvasModel = useMemo<StudioCanvasModel>(
    () => ({
      canvasRef,
      canCopy: controller.canCopy,
      canCopyFormat: controller.canCopyFormat,
      canPaste: controller.canPaste,
      canSaveSelectionAsPreset: controller.canSaveSelectionAsPreset,
      edgeAuthoringTemplate,
      formatPainterActive: Boolean(formatPainterSource),
      hiddenLayerIds,
      presentationMode,
      snapshot,
      stylesheetCandidate: controller.stylesheetCandidate,
      viewportPreferences
    }),
    [
      controller.canCopy,
      controller.canCopyFormat,
      controller.canPaste,
      controller.canSaveSelectionAsPreset,
      controller.stylesheetCandidate,
      edgeAuthoringTemplate,
      formatPainterSource,
      hiddenLayerIds,
      presentationMode,
      snapshot,
      viewportPreferences
    ]
  );
  const canvasActions = useStableActions<StudioCanvasActions>({
    alignSelection: controller.alignSelection,
    applyFormat: (object) => {
      if (!formatPainterSource) return false;
      const applied = controller.applyFormat(formatPainterSource, object);
      if (applied) setFormatPainterSource(undefined);
      return applied;
    },
    commitObjectText: controller.commitObjectText,
    connectSelected: controller.connectSelected,
    copySelection: controller.copySelection,
    createConnection: controller.createConnection,
    createNestedRegion: controller.createNestedRegion,
    createObject: controller.createPaletteObject,
    cutSelection: controller.cutSelection,
    deleteSelection: controller.deleteSelection,
    distributeSelection: controller.distributeSelection,
    duplicateSelection: controller.duplicateSelection,
    isConnectionValid: controller.isConnectionValid,
    moveObjects: controller.moveObjects,
    nudgeSelection: controller.nudgeSelection,
    onAnnouncement: controller.announce,
    onCancelEdgeAuthoring: () => {
      changeEdgeAuthoringTemplate(undefined);
    },
    onCancelFormatPainter: cancelFormatPainter,
    onCompleteEdgeAuthoring: () => {
      setEdgeAuthoringTemplate(undefined);
    },
    onExitPresentation: exitPresentation,
    onPaneSelect: () => undefined,
    onViewportZoomChange: setCanvasZoom,
    pasteClipboard: controller.pasteClipboard,
    previewRegionForNode: controller.previewRegionForNode,
    proposeMapperMetric: controller.proposeMapperMetric,
    releaseNodeFromRegion: controller.releaseNodeFromRegion,
    resizeObject: controller.resizeObject,
    resizeSelection: controller.resizeSelection,
    saveSelectionAsPreset: controller.saveSelectionAsPreset,
    selectFromCanvas: controller.selectFromCanvas,
    selectObject: (object) => {
      controller.selectObject(object);
      revealProperties();
    },
    setRegionExpanded: controller.setRegionExpanded,
    startFormatPainter
  });

  const workspaceViewContent = (
    <>
      {visitedWorkspaceViews.has('add') ? (
        <Box hidden={workspaceView !== 'add'} id="studio-add-workspace" sx={workspaceViewSx}>
          <ObjectPalette
            activeEdgeTemplate={edgeAuthoringTemplate}
            onCollapse={() => setPanelVisible(false)}
            onCreate={createFromPalette}
            onDeletePreset={controller.deletePreset}
            onEdgeTemplateChange={changeEdgeAuthoringTemplate}
            onPathModeChange={controller.setPathMode}
            onRenamePreset={controller.renamePreset}
            pathMode={controller.pathMode}
            presets={controller.presets}
            selectedNodeCount={snapshot.selection.filter((item) => item.kind === 'node').length}
            state={panelVisible ? 'default' : 'closed'}
          />
        </Box>
      ) : null}
      {visitedWorkspaceViews.has('properties') ? (
        <Box hidden={workspaceView !== 'properties'} id="studio-properties-workspace" sx={workspaceViewSx}>
          <Suspense fallback={<Box>Opening Properties...</Box>}>
            <PropertiesWorkspace
              candidate={controller.stylesheetCandidate}
              codeDocument={propertiesCodeDocument}
              forceEditorFailure={forceEditorFailure}
              onApplySource={controller.applySourceDraft}
              onApplyStyle={controller.applyStylesheetCandidate}
              onCandidateTextChange={controller.replaceStylesheetCandidateRaw}
              onCandidateTextReplace={controller.replaceStylesheetCandidateStructured}
              onCodeDocumentChange={setPropertiesCodeDocument}
              onCollapse={() => setPanelVisible(false)}
              onCommitObject={controller.commitInspector}
              onCommitStyle={controller.commitCandidateStyle}
              onCommitViewport={controller.commitViewport}
              onCopyId={(id) => {
                void controller.copyObjectId(id);
              }}
              onDiscardInvalid={controller.discardInvalidDraft}
              onPreviewObjectIdRename={controller.previewObjectIdRename}
              onRenameObjectId={controller.renameObjectId}
              onRevertStyle={controller.revertStylesheetCandidate}
              onSelectSourceOffset={controller.selectSourceOffset}
              onUnsetObject={controller.unsetInspector}
              onUnsetStyle={controller.unsetCandidateStyle}
              onViewportPreferencesChange={changeViewportPreferences}
              snapshot={snapshot}
              sourceRange={controller.sourceRange}
              viewportPreferences={viewportPreferences}
            />
          </Suspense>
        </Box>
      ) : null}
      {visitedWorkspaceViews.has('mapper') ? (
        <Box hidden={workspaceView !== 'mapper'} id="studio-mapper-workspace" sx={workspaceViewSx}>
          <Suspense fallback={<Box>Opening telemetry mapper...</Box>}>
            <MapperWorkspace
              forceEditorFailure={forceEditorFailure}
              onApplySource={(text) => controller.applySourceDraft('mapper', text)}
              onClose={() => setPanelVisible(false)}
              onCommitField={controller.commitMapperField}
              onCommitProposal={controller.commitMapperProposal}
              onCommitStyle={controller.commitMapperStyle}
              onCreateRule={controller.createMapperRule}
              onDiscardInvalid={() => controller.discardInvalidDraft('mapper')}
              onExport={() => void controller.exportMapper()}
              onIngestSamples={controller.setMapperSampleInput}
              onRemove={controller.removeMapper}
              onProposeMetric={controller.proposeMapperMetric}
              onSelectCoverageObject={(kind, id) => controller.setSelection([{ id, kind: kind as StudioSelection['kind'] }])}
              onSelectSourceOffset={(offset) => controller.selectSourceOffset('mapper', offset)}
              onUnsetField={controller.unsetMapperField}
              onUnsetStyle={controller.unsetMapperStyle}
              profile={controller.authoringProfile}
              proposal={controller.mapperProposal}
              snapshot={snapshot}
              sourceRange={(path) => controller.sourceRange('mapper', path)}
              variant="panel"
            />
          </Suspense>
        </Box>
      ) : null}
      {visitedWorkspaceViews.has('project') ? (
        <Box hidden={workspaceView !== 'project'} id="studio-project-workspace" sx={workspaceViewSx}>
          <StudioNavigator
            hiddenLayerIds={hiddenLayerIds}
            layerActions={{
              createLayer: controller.createLayer,
              deleteLayer: controller.deleteLayer,
              renameLayer: controller.renameLayer,
              reorderLayer: controller.reorderLayer,
              setLayerMembership: controller.setLayerMembership
            }}
            onCollapse={() => setPanelVisible(false)}
            onOpenDocument={openCodeDocument}
            setHiddenLayerIds={setHiddenLayerIds}
            snapshot={snapshot}
          />
        </Box>
      ) : null}
    </>
  );

  return (
    <Box
      component="main"
      className={`studio-shell${presentationMode ? ' studio-shell--presentation' : ''}`}
      data-ui-system="material"
      onKeyDown={shellKeyDown}
      ref={shellRef}
      style={
        {
          ...studioCssVariables,
          '--studio-panel-width': `${workspaceWidth}px`
        } as CSSProperties
      }
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        display: 'grid',
        height: '100vh',
        position: 'relative',
        width: '100vw',
        ...(presentationMode
          ? {
              gridTemplate: '"canvas" minmax(0, 1fr) / minmax(0, 1fr)'
            }
          : {
              gridTemplateAreas: {
                md: '"header header header" "canvas resizer dock" "readout readout readout"',
                xs: '"header" "canvas" "readout"'
              },
              gridTemplateColumns: {
                md: `minmax(var(--studio-canvas-min-width), 1fr) ${panelOpen ? 'var(--studio-resizer-width)' : '0px'} auto`,
                xs: 'minmax(0, 1fr)'
              },
              gridTemplateRows: {
                md: 'var(--studio-command-bar-height) minmax(0, 1fr) var(--studio-readout-height)',
                xs: 'auto minmax(0, 1fr) var(--studio-readout-height)'
              }
            })
      }}
    >
      <Box
        className="studio-header"
        component="header"
        sx={{
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
          display: presentationMode ? 'none' : 'grid',
          gridArea: 'header',
          gridTemplateAreas: {
            md: '"product project actions"',
            xs: '"product project" "actions actions"'
          },
          gridTemplateColumns: {
            md: 'auto auto minmax(0, 1fr)',
            xs: 'auto minmax(0, 1fr)'
          },
          gridTemplateRows: {
            md: 'var(--studio-command-bar-height)',
            xs: 'var(--studio-command-bar-height) var(--studio-command-bar-height)'
          },
          minWidth: 0,
          px: studioSpace.space8
        }}
      >
        <Box
          className="studio-product"
          sx={{
            alignItems: 'baseline',
            display: 'flex',
            gap: studioSpace.space6,
            gridArea: 'product',
            minWidth: 0,
            pr: studioSpace.space8
          }}
        >
          <Typography component="h1" noWrap variant="subtitle2">
            TopoViewer Studio
          </Typography>
          <Typography color="text.secondary" component="span" noWrap sx={{ display: { md: 'inline', xs: 'none' } }} variant="caption">
            Beta Preview
          </Typography>
        </Box>
        <Suspense
          fallback={
            <Typography
              component="span"
              noWrap
              sx={{ alignSelf: 'center', gridArea: 'project', maxWidth: studioGeometry.projectNameMaximumWidth }}
              variant="body2"
            >
              {snapshot.project.name}
            </Typography>
          }
        >
          <ProjectMenu actions={guardedProjectLifecycle} project={snapshot.project} />
        </Suspense>
        <Box
          className="studio-header-actions"
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: studioSpace.space2,
            gridArea: 'actions',
            justifySelf: 'end',
            minWidth: 0
          }}
        >
          <StyleAwareSaveControls candidate={controller.stylesheetCandidate} onSave={() => void saveProject()} projectStatus={snapshot.status} />
          <Divider flexItem orientation="vertical" sx={{ mx: studioSpace.space4, my: studioSpace.space8 }} />
          <StudioIconButton aria-label="Undo" disabled={!controller.canUndo} onClick={controller.undo} title="Undo">
            <UndoIcon fontSize="small" />
          </StudioIconButton>
          <StudioIconButton aria-label="Redo" disabled={!controller.canRedo} onClick={controller.redo} title="Redo">
            <RedoIcon fontSize="small" />
          </StudioIconButton>
          <Divider flexItem orientation="vertical" sx={{ mx: studioSpace.space4, my: studioSpace.space8 }} />
          <StudioIconButton aria-label="Search objects and commands" onClick={() => setCommandPaletteOpen(true)} title="Search and commands (Ctrl+K)">
            <SearchIcon fontSize="small" />
          </StudioIconButton>
          <StudioAppearanceControl appearance={appearance} />
          <StudioIconButton aria-label="Open export panel" onClick={openExportPanel} title="Export">
            <IosShareIcon fontSize="small" />
          </StudioIconButton>
          <StudioIconButton
            aria-expanded={compactPanelOpen}
            aria-label={`${compactPanelOpen ? 'Close' : 'Open'} workspace panel`}
            onClick={() => setCompactPanelOpen((open) => !open)}
            sx={{ display: { md: 'none', xs: 'inline-flex' } }}
            title={`${compactPanelOpen ? 'Close' : 'Open'} workspace panel`}
          >
            <ViewSidebarOutlinedIcon fontSize="small" />
          </StudioIconButton>
          <StudioIconButton
            aria-controls={headerActionsAnchor ? 'studio-more-actions' : undefined}
            aria-expanded={Boolean(headerActionsAnchor)}
            aria-haspopup="menu"
            aria-label="More Studio actions"
            onClick={(event) => setHeaderActionsAnchor(event.currentTarget)}
            ref={presentationTriggerRef}
            title="More actions"
          >
            <MoreVertIcon fontSize="small" />
          </StudioIconButton>
          <StudioMenu
            anchorEl={headerActionsAnchor}
            disableRestoreFocus
            id="studio-more-actions"
            onClose={() => {
              setHeaderActionsAnchor(null);
              requestAnimationFrame(() => presentationTriggerRef.current?.focus());
            }}
            open={Boolean(headerActionsAnchor)}
          >
            <StudioMenuItem
              onClick={() => {
                setHeaderActionsAnchor(null);
                setEdgeAuthoringTemplate(undefined);
                setPresentationMode(true);
              }}
            >
              <StudioMenuItemIcon>
                <CoPresentIcon fontSize="small" />
              </StudioMenuItemIcon>
              <StudioMenuItemText>Presentation mode</StudioMenuItemText>
            </StudioMenuItem>
            <StudioMenuItem
              onClick={() => {
                setHeaderActionsAnchor(null);
                void controller.reload();
              }}
            >
              <StudioMenuItemIcon>
                <RefreshIcon fontSize="small" />
              </StudioMenuItemIcon>
              <StudioMenuItemText>Reload project</StudioMenuItemText>
            </StudioMenuItem>
            <StudioMenuItem component="a" href={studioFeedbackUrl} onClick={() => setHeaderActionsAnchor(null)} rel="noopener noreferrer" target="_blank">
              <StudioMenuItemIcon>
                <FeedbackOutlinedIcon fontSize="small" />
              </StudioMenuItemIcon>
              <StudioMenuItemText>Preview feedback</StudioMenuItemText>
            </StudioMenuItem>
          </StudioMenu>
        </Box>
      </Box>

      <CanvasSurface actions={canvasActions} model={canvasModel} />

      <Box
        aria-label="Resize workspace panel"
        aria-orientation="vertical"
        aria-valuemax={studioWorkspaceMaximumWidth}
        aria-valuemin={studioWorkspaceMinimumWidth}
        aria-valuenow={workspaceWidth}
        aria-valuetext={`${workspaceWidth} pixels wide`}
        component="div"
        onDoubleClick={resetWorkspaceWidth}
        onKeyDown={resizeWorkspaceWithKeyboard}
        onPointerCancel={finishWorkspacePointerResize}
        onPointerDown={resizeWorkspacePointerDown}
        onPointerMove={resizeWorkspacePointerMove}
        onPointerUp={finishWorkspacePointerResize}
        role="separator"
        tabIndex={panelOpen ? 0 : -1}
        title="Resize workspace panel; double-click to reset"
        sx={{
          bgcolor: 'background.paper',
          cursor: 'col-resize',
          display: presentationMode ? 'none' : { md: panelOpen ? 'block' : 'none', xs: 'none' },
          gridArea: 'resizer',
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
          touchAction: 'none',
          zIndex: studioLayer.panelResizer,
          '&::after': {
            bgcolor: 'divider',
            bottom: 0,
            content: '""',
            left: 0,
            position: 'absolute',
            top: 0,
            width: 1
          },
          '&:hover::after, &:focus-visible::after, &:active::after': {
            bgcolor: 'primary.main',
            width: 2
          }
        }}
      />

      {/* Rail and panel form one instrument: the rail names the destination, the panel shows it. */}
      <Box
        className="studio-dock"
        sx={{
          display: presentationMode ? 'none' : { md: 'grid', xs: compactPanelOpen ? 'grid' : 'none' },
          minHeight: 0,
          minWidth: 0,
          '@media (min-width: 900px)': {
            gridArea: 'dock',
            gridTemplateColumns: `var(--studio-rail-width) ${panelOpen ? 'clamp(var(--studio-panel-min-width), var(--studio-panel-width), var(--studio-panel-max-width))' : '0px'}`
          },
          '@media (max-width: 899px)': {
            bgcolor: 'background.paper',
            borderLeft: 1,
            borderColor: 'divider',
            bottom: 'var(--studio-readout-height)',
            gridTemplateRows: 'auto minmax(0, 1fr)',
            position: 'fixed',
            right: 0,
            top: 'calc(2 * var(--studio-command-bar-height))',
            width: 'min(var(--studio-panel-max-width), 100vw)',
            zIndex: studioLayer.drawer
          }
        }}
      >
        <WorkspaceRail
          compact={compact}
          onSelect={(view) => {
            selectWorkspace(view);
            setPanelVisible(true);
          }}
          onToggle={() => setPanelVisible(!panelVisible)}
          panelOpen={panelVisible}
          value={workspaceView}
        />
        <Box
          className="studio-panel"
          sx={{
            bgcolor: 'background.paper',
            containerName: 'studio-workspace',
            containerType: 'inline-size',
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden',
            position: 'relative',
            visibility: panelVisible ? 'visible' : 'hidden',
            zIndex: studioLayer.workspaceContent
          }}
        >
          {workspaceViewContent}
        </Box>
      </Box>

      <StudioCommandPalette
        canRedo={controller.canRedo}
        canUndo={controller.canUndo}
        onClose={() => setCommandPaletteOpen(false)}
        onExport={openExportPanel}
        onOpenWorkspace={openWorkspace}
        onPresentation={() => {
          setEdgeAuthoringTemplate(undefined);
          setPresentationMode(true);
        }}
        onRedo={controller.redo}
        onReload={() => void controller.reload()}
        onSelectObject={(selection) => {
          controller.setSelection([selection]);
          openWorkspace('properties');
        }}
        onUndo={controller.undo}
        open={commandPaletteOpen}
        snapshot={snapshot}
      />

      {exportOpen ? (
        <Suspense
          fallback={
            <Box
              sx={{
                bgcolor: 'action.disabledBackground',
                display: 'grid',
                inset: 0,
                placeItems: 'center',
                position: 'fixed',
                zIndex: studioLayer.scrim
              }}
            >
              Opening export tools...
            </Box>
          }
        >
          <ExportPanel
            canvasElement={canvasRef.current}
            host={host}
            onAnnouncement={controller.announce}
            onClose={() => setExportOpen(false)}
            onConfigureMapper={() => {
              setExportOpen(false);
              openWorkspace('mapper');
            }}
            snapshot={snapshot}
          />
        </Suspense>
      ) : null}

      {externalChange || pendingProjectAction || controller.normalizationReview ? (
        <Suspense fallback={null}>
          <ProjectDialogs
            externalChange={externalChange ? {
              diskProject: externalDiskProject,
              error: externalChangeError,
              event: externalChange,
              loading: externalChangeLoading,
              onInspect: () => void loadExternalProject(),
              onKeepDraft: () => void keepExternalDraft(),
              onReloadDisk: () => void reloadExternalProject(),
              studioProject: snapshot.project
            } : undefined}
            normalizationReview={controller.normalizationReview ? {
              onCancel: controller.cancelNormalizationReview,
              onConfirm: controller.confirmNormalizationReview,
              review: controller.normalizationReview
            } : undefined}
            styleResolution={pendingProjectAction ? {
              candidate: controller.stylesheetCandidate,
              context: pendingProjectAction.context,
              onApply: () => void continuePendingProjectAction(false),
              onCancel: () => setPendingProjectAction(undefined),
              onDiscard: () => void continuePendingProjectAction(true),
              open: true
            } : undefined}
          />
        </Suspense>
      ) : null}

      {presentationMode ? null : (
        <StudioStatusBar
          appearanceError={appearance.error}
          autosaveError={autosave.error}
          commandError={controller.commandError}
          diagnostics={diagnostics}
          hostName={host.displayName}
          linkCount={linkCount}
          nodeCount={nodeCount}
          onDismissAppearanceError={appearance.clearError}
          onOpenProblem={openCodeDocument}
          onRetryAutosave={autosave.retry}
          zoom={canvasZoom}
        />
      )}
      <Typography className="studio-visually-hidden" aria-atomic="true" aria-live="polite" component="span">
        {controller.announcement}
      </Typography>
    </Box>
  );
}
