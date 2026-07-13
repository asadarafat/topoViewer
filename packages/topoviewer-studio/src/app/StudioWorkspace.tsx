import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import CodeIcon from '@mui/icons-material/Code';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import IosShareIcon from '@mui/icons-material/IosShare';
import MenuIcon from '@mui/icons-material/Menu';
import RedoIcon from '@mui/icons-material/Redo';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import UndoIcon from '@mui/icons-material/Undo';
import type { StudioExternalChange, StudioHost } from '../contracts/host';
import type { StudioDocumentKind, StudioProject, StudioRecoverySnapshot, StudioSelection } from '../contracts/project';
import { CanvasSurface } from '../features/canvas/CanvasSurface';
import { Inspector } from '../features/inspector/Inspector';
import { ObjectPalette } from '../features/palette/ObjectPalette';
import type { StudioEdgeTemplateId } from '../features/palette/types';
import { WorkspaceRail, type StudioWorkspaceView } from '../features/workspace/WorkspaceRail';
import {
  defaultStudioViewportPreferences,
  normalizeStudioViewportPreferences,
  type StudioViewportPreferences
} from '../features/viewport/types';
import { ProjectMenu, type StudioProjectLifecycleActions } from '../features/projects/ProjectMenu';
import { ExternalChangeDialog } from '../features/projects/ExternalChangeDialog';
import { StudioButton, StudioIconButton } from '../ui/controls';
import { useStudioController } from './useStudioController';
import { useStudioAutosave } from './useStudioAutosave';

const WorkspaceDrawer = lazy(() => import('../features/workspace/WorkspaceDrawer'));
const MapperWorkspace = lazy(() => import('../features/mapper/MapperWorkspace'));
const ExportPanel = lazy(() => import('../features/export/ExportPanel'));

interface StudioWorkspaceProps {
  forceEditorFailure?: boolean;
  host: StudioHost;
  onReload(): Promise<void>;
  project: StudioProject;
  projectLifecycle: StudioProjectLifecycleActions;
  recovery?: StudioRecoverySnapshot;
}

const statusLabels = {
  conflict: 'Conflict',
  'invalid-draft': 'Invalid Draft',
  modified: 'Modified',
  recovery: 'Recovery',
  saved: 'Saved',
  saving: 'Saving'
} as const;

type PanelState = 'default' | 'open' | 'closed';

export function StudioWorkspace({ forceEditorFailure, host, onReload, project, projectLifecycle, recovery }: StudioWorkspaceProps) {
  const controller = useStudioController({ host, onReload, project, recovery });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<'source'>('source');
  const [drawerHeight, setDrawerHeight] = useState(300);
  const [sourceRequest, setSourceRequest] = useState<{
    document: StudioDocumentKind;
    path: Array<string | number>;
  }>();
  const [workspaceState, setWorkspaceState] = useState<PanelState>('default');
  const [workspaceView, setWorkspaceView] = useState<StudioWorkspaceView>('topo');
  const [visitedWorkspaceViews, setVisitedWorkspaceViews] = useState<Set<StudioWorkspaceView>>(() => new Set(['topo']));
  const [presentationMode, setPresentationMode] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [externalChange, setExternalChange] = useState<StudioExternalChange>();
  const [externalDiskProject, setExternalDiskProject] = useState<StudioProject>();
  const [externalChangeError, setExternalChangeError] = useState<string>();
  const [externalChangeLoading, setExternalChangeLoading] = useState(false);
  const [viewportPreferences, setViewportPreferences] = useState<StudioViewportPreferences>(defaultStudioViewportPreferences);
  const [viewportPreferencesReady, setViewportPreferencesReady] = useState(false);
  const [edgeAuthoringTemplate, setEdgeAuthoringTemplate] = useState<StudioEdgeTemplateId>();
  const canvasRef = useRef<HTMLElement>(null);
  const drawerReturnFocusRef = useRef<HTMLElement | null>(null);
  const presentationTriggerRef = useRef<HTMLButtonElement>(null);
  const { snapshot } = controller;
  const snapshotRef = useRef(snapshot);
  const autosave = useStudioAutosave(host, snapshot);

  const beforeProjectSwitch = async (action: () => Promise<void>) => {
    if (await controller.flushRecovery()) await action();
  };
  const guardedProjectLifecycle: StudioProjectLifecycleActions = {
    ...projectLifecycle,
    ...(projectLifecycle.create ? { create: () => beforeProjectSwitch(projectLifecycle.create!) } : {}),
    ...(projectLifecycle.delete ? { delete: () => beforeProjectSwitch(projectLifecycle.delete!) } : {}),
    ...(projectLifecycle.duplicate ? { duplicate: () => beforeProjectSwitch(projectLifecycle.duplicate!) } : {}),
    ...(projectLifecycle.open ? { open: (id: string) => beforeProjectSwitch(() => projectLifecycle.open!(id)) } : {}),
    ...(projectLifecycle.openArchive ? { openArchive: () => beforeProjectSwitch(projectLifecycle.openArchive!) } : {}),
    ...(projectLifecycle.openFolder ? { openFolder: () => beforeProjectSwitch(projectLifecycle.openFolder!) } : {})
  };

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    let active = true;
    void host.readPreference<StudioViewportPreferences>('canvas-display').then((result) => {
      if (!active) return;
      if (result.ok && result.value) setViewportPreferences(normalizeStudioViewportPreferences(result.value));
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
        if (!result.ok) host.report({
          category: 'persistence',
          detail: { code: result.error.code },
          name: 'studio-viewport-preference-write-failed'
        });
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [host, viewportPreferences, viewportPreferencesReady]);

  useEffect(() => host.watchProject?.((event) => {
    const current = snapshotRef.current;
    host.report({ category: 'persistence', detail: { kind: event.kind }, name: 'studio-external-change-detected' });
    if (current.status === 'saved' && event.kind === 'changed') {
      void onReload();
      return;
    }
    controller.markExternalConflict();
    setExternalChange(event);
    setExternalDiskProject(undefined);
    setExternalChangeError(undefined);
  }), [host, onReload]);

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
    const disk = externalDiskProject || await loadExternalProject();
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
      sourceRevision: current.projection.sourceRevision
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

  useEffect(() => {
    if (!controller.normalizationReview) return;
    if (!drawerOpen && document.activeElement instanceof HTMLElement) {
      drawerReturnFocusRef.current = document.activeElement;
    }
    setDrawerView('source');
    setDrawerOpen(true);
  }, [controller.normalizationReview, drawerOpen]);

  function openDrawer(view: 'source') {
    if (!drawerOpen && document.activeElement instanceof HTMLElement) {
      drawerReturnFocusRef.current = document.activeElement;
    }
    setDrawerView(view);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    const target = drawerReturnFocusRef.current;
    if (target?.isConnected) queueMicrotask(() => target.focus());
  }

  function toggleDrawer(view: 'source') {
    if (drawerOpen && drawerView === view) {
      closeDrawer();
      return;
    }
    openDrawer(view);
  }

  function createFromPalette(templateId: Parameters<typeof controller.createPaletteObject>[0]) {
    const created = controller.createPaletteObject(templateId);
    if (created) requestAnimationFrame(() => canvasRef.current?.focus());
    return created;
  }

  function changeEdgeAuthoringTemplate(templateId?: StudioEdgeTemplateId) {
    setEdgeAuthoringTemplate(templateId);
    controller.announce(templateId
      ? `${templateId === 'directional-link'
        ? 'Directional traffic'
        : templateId === 'parallel-link'
          ? 'Parallel link'
          : templateId === 'parent-link-pipe'
            ? 'Parent link pipe'
            : 'Link'} authoring active`
      : 'Edge authoring cancelled');
    if (templateId) requestAnimationFrame(() => canvasRef.current?.focus());
  }

  function exitPresentation() {
    setPresentationMode(false);
    requestAnimationFrame(() => presentationTriggerRef.current?.focus());
  }

  function selectWorkspace(view: StudioWorkspaceView) {
    setVisitedWorkspaceViews((current) => {
      if (current.has(view)) return current;
      const next = new Set(current);
      next.add(view);
      return next;
    });
    setWorkspaceView(view);
    setWorkspaceState((state) => state === 'open' ? 'open' : 'default');
  }

  const inspectorBindings = {
    profile: controller.authoringProfile,
    onCommit: controller.commitInspector,
    onCommitViewport: controller.commitViewport,
    onCreateStyleRule: controller.createStyleRule,
    onCopyId: (id: string) => { void controller.copyObjectId(id); },
    onDeleteStyleRule: controller.deleteStyleRule,
    onDuplicateStyleRule: controller.duplicateStyleRule,
    onMoveStyleRule: controller.moveStyleRule,
    onReorderFieldProfile: controller.reorderFieldProfile,
    onResetProfile: controller.resetAuthoringProfile,
    onRenameStyleRule: controller.renameStyleRule,
    onCommitStyle: controller.commitStyleInspector,
    onOpenMapper: () => selectWorkspace('mapper'),
    onOpenSource: (document: StudioDocumentKind, path: Array<string | number>) => {
      setSourceRequest({ document, path });
      openDrawer('source');
    },
    onUnsetStyle: controller.unsetStyleInspector,
    onUpdateFieldProfile: controller.updateFieldProfile,
    onViewportPreferencesChange: (patch: Partial<StudioViewportPreferences>) => setViewportPreferences((current) => ({ ...current, ...patch })),
    snapshot,
    sourceRange: controller.sourceRange,
    viewportPreferences
  };

  return (
    <main
      className={`studio-shell${drawerOpen ? ' studio-shell--drawer' : ''}${workspaceState === 'closed' ? ' studio-shell--workspace-closed' : ''}${presentationMode ? ' studio-shell--presentation' : ''}`}
      data-ui-system="material"
      style={{ '--studio-drawer-height': `${drawerHeight}px` } as CSSProperties}
    >
      <header className="studio-header">
        <div className="studio-product">
          <StudioIconButton className="studio-icon-button studio-desktop-control" aria-expanded={workspaceState !== 'closed'} aria-label={`${workspaceState === 'closed' ? 'Open' : 'Close'} workspace panel`} onClick={() => setWorkspaceState((state) => state === 'closed' ? 'default' : 'closed')} title="Workspaces"><MenuIcon fontSize="small" /></StudioIconButton>
          <StudioIconButton className="studio-icon-button studio-mobile-control" aria-expanded={workspaceState === 'open'} aria-label={`${workspaceState === 'open' ? 'Close' : 'Open'} workspace panel`} onClick={() => setWorkspaceState((state) => state === 'open' ? 'default' : 'open')} title="Workspaces"><MenuIcon fontSize="small" /></StudioIconButton>
          <h1>TopoViewer Studio</h1>
          <span className="studio-status">Experimental</span>
        </div>
        <ProjectMenu actions={guardedProjectLifecycle} project={snapshot.project} />
        <div className="studio-header-actions">
          <span aria-live="polite" className={`studio-saved-state studio-saved-state--${snapshot.status}`}>{statusLabels[snapshot.status]}</span>
          <StudioIconButton
            aria-label="Save project"
            className="studio-icon-button"
            disabled={snapshot.status === 'saved' || snapshot.status === 'saving' || snapshot.status === 'invalid-draft'}
            onClick={() => void controller.save()}
            title="Save project"
          >
            <SaveOutlinedIcon fontSize="small" />
          </StudioIconButton>
          <StudioIconButton className="studio-icon-button" aria-label="Undo" disabled={!controller.canUndo} onClick={controller.undo} title="Undo"><UndoIcon fontSize="small" /></StudioIconButton>
          <StudioIconButton className="studio-icon-button" aria-label="Redo" disabled={!controller.canRedo} onClick={controller.redo} title="Redo"><RedoIcon fontSize="small" /></StudioIconButton>
          <StudioIconButton className="studio-icon-button" aria-label="Enter presentation mode" onClick={() => { setDrawerOpen(false); setEdgeAuthoringTemplate(undefined); setPresentationMode(true); }} ref={presentationTriggerRef} title="Presentation mode"><CropSquareIcon fontSize="small" /></StudioIconButton>
          <StudioIconButton className="studio-icon-button" aria-label="Reload project" onClick={() => void controller.reload()} title="Reload"><RefreshIcon fontSize="small" /></StudioIconButton>
          <StudioIconButton className="studio-icon-button" aria-label="Open export panel" onClick={() => setExportOpen(true)} title="Export"><IosShareIcon fontSize="small" /></StudioIconButton>
        </div>
      </header>

      <section className="studio-left-workspace" data-state={workspaceState}>
        <WorkspaceRail onChange={selectWorkspace} value={workspaceView} />
        <div className="studio-left-workspace-content">
          {visitedWorkspaceViews.has('topo') ? <section className="studio-workspace-view studio-workspace-view--topo" hidden={workspaceView !== 'topo'} id="studio-topo-workspace">
            <ObjectPalette
              activeEdgeTemplate={edgeAuthoringTemplate}
              onCollapse={() => setWorkspaceState('closed')}
              onCreate={createFromPalette}
              onEdgeTemplateChange={changeEdgeAuthoringTemplate}
              onPathModeChange={controller.setPathMode}
              pathMode={controller.pathMode}
              presets={controller.presets}
              selectedNodeCount={snapshot.selection.filter((item) => item.kind === 'node').length}
              state={workspaceState}
            />
          </section> : null}
          {visitedWorkspaceViews.has('object') ? <section aria-label="Object panel" className="studio-workspace-view studio-workspace-view--object" hidden={workspaceView !== 'object'} id="studio-object-workspace">
            <div className="studio-panel-heading">
              <h2>Object</h2>
              <StudioIconButton aria-label="Collapse workspace panel" onClick={() => setWorkspaceState('closed')} title="Collapse workspace"><ChevronLeftIcon fontSize="small" /></StudioIconButton>
            </div>
            <Inspector {...inspectorBindings} ariaLabel="Object properties" documentView="object" showDocumentTabs={false} state="default" />
          </section> : null}
          {visitedWorkspaceViews.has('style') ? <section aria-label="Style panel" className="studio-workspace-view studio-workspace-view--style" hidden={workspaceView !== 'style'} id="studio-style-workspace">
            <div className="studio-panel-heading">
              <h2>Style</h2>
              <StudioIconButton aria-label="Collapse workspace panel" onClick={() => setWorkspaceState('closed')} title="Collapse workspace"><ChevronLeftIcon fontSize="small" /></StudioIconButton>
            </div>
            <Inspector {...inspectorBindings} ariaLabel="Style workspace" documentView="style" showDocumentTabs={false} state="default" />
          </section> : null}
          {visitedWorkspaceViews.has('viewport') ? <section aria-label="Viewport panel" className="studio-workspace-view" hidden={workspaceView !== 'viewport'} id="studio-viewport-workspace">
            <div className="studio-panel-heading">
              <h2>Viewport</h2>
              <StudioIconButton aria-label="Collapse workspace panel" onClick={() => setWorkspaceState('closed')} title="Collapse workspace"><ChevronLeftIcon fontSize="small" /></StudioIconButton>
            </div>
            <Inspector {...inspectorBindings} ariaLabel="Viewport workspace" documentView="viewport" showDocumentTabs={false} state="default" />
          </section> : null}
          {visitedWorkspaceViews.has('mapper') ? <section aria-label="Mapper panel" className="studio-workspace-view" hidden={workspaceView !== 'mapper'} id="studio-mapper-workspace">
            <Suspense fallback={<section className="studio-workspace-loading">Opening telemetry mapper...</section>}>
              <MapperWorkspace
                onClose={() => setWorkspaceState('closed')}
                onCommitField={controller.commitMapperField}
                onCommitProposal={controller.commitMapperProposal}
                onCommitStyle={controller.commitMapperStyle}
                onCreateRule={controller.createMapperRule}
                onExport={() => void controller.exportMapper()}
                onIngestSamples={controller.setMapperSampleInput}
                onOpenSource={(path) => {
                  setSourceRequest({ document: 'mapper', path });
                  openDrawer('source');
                }}
                onRemove={controller.removeMapper}
                onProposeMetric={controller.proposeMapperMetric}
                onSelectCoverageObject={(kind, id) => controller.setSelection([{ id, kind: kind as StudioSelection['kind'] }])}
                onUnsetField={controller.unsetMapperField}
                onUnsetStyle={controller.unsetMapperStyle}
                profile={controller.authoringProfile}
                proposal={controller.mapperProposal}
                sampleInput={controller.mapperSampleInput}
                snapshot={snapshot}
                variant="panel"
              />
            </Suspense>
          </section> : null}
        </div>
      </section>
      <CanvasSurface
        canvasRef={canvasRef}
        canCopy={controller.canCopy}
        canPaste={controller.canPaste}
        connectSelected={controller.connectSelected}
        commitObjectText={controller.commitObjectText}
        copySelection={controller.copySelection}
        cutSelection={controller.cutSelection}
        createConnection={controller.createConnection}
        createLayer={controller.createLayer}
        createNestedRegion={controller.createNestedRegion}
        isConnectionValid={controller.isConnectionValid}
        createObject={controller.createPaletteObject}
        edgeAuthoringTemplate={edgeAuthoringTemplate}
        deleteSelection={controller.deleteSelection}
        deleteLayer={controller.deleteLayer}
        distributeSelection={controller.distributeSelection}
        duplicateSelection={controller.duplicateSelection}
        moveObject={controller.moveObject}
        nudgeSelection={controller.nudgeSelection}
        onAnnouncement={controller.announce}
        pasteClipboard={controller.pasteClipboard}
        presentationMode={presentationMode}
        previewRegionForNode={controller.previewRegionForNode}
        proposeMapperMetric={controller.proposeMapperMetric}
        releaseNodeFromRegion={controller.releaseNodeFromRegion}
        renameLayer={controller.renameLayer}
        resizeObject={controller.resizeObject}
        resizeSelection={controller.resizeSelection}
        reorderLayer={controller.reorderLayer}
        saveSelectionAsPreset={controller.saveSelectionAsPreset}
        selectFromCanvas={controller.selectFromCanvas}
        selectObject={(object) => {
          controller.selectObject(object);
          if (workspaceView === 'topo') selectWorkspace('object');
        }}
        setSelection={controller.setSelection}
        setLayerMembership={controller.setLayerMembership}
        setRegionExpanded={controller.setRegionExpanded}
        snapshot={snapshot}
        viewportPreferences={viewportPreferences}
        onExitPresentation={exitPresentation}
        onCancelEdgeAuthoring={() => changeEdgeAuthoringTemplate(undefined)}
        onCompleteEdgeAuthoring={() => setEdgeAuthoringTemplate(undefined)}
      />

      {exportOpen ? (
        <Suspense fallback={<section className="studio-export-loading">Opening export tools...</section>}>
          <ExportPanel
            canvasElement={canvasRef.current}
            host={host}
            onAnnouncement={controller.announce}
            onClose={() => setExportOpen(false)}
            snapshot={snapshot}
          />
        </Suspense>
      ) : null}

      {externalChange ? (
        <ExternalChangeDialog
          diskProject={externalDiskProject}
          error={externalChangeError}
          event={externalChange}
          loading={externalChangeLoading}
          onInspect={() => void loadExternalProject()}
          onKeepDraft={() => void keepExternalDraft()}
          onReloadDisk={() => void reloadExternalProject()}
          studioProject={snapshot.project}
        />
      ) : null}

      {drawerOpen && drawerView === 'source' && (
        <Suspense fallback={<section className="studio-workspace-loading">Opening workspace...</section>}>
          <WorkspaceDrawer
            forceEditorFailure={forceEditorFailure}
            height={drawerHeight}
            history={controller.historyEntries}
            initialDocument={sourceRequest?.document}
            normalizationReview={controller.normalizationReview}
            onApply={controller.applySourceDraft}
            onCancelNormalization={controller.cancelNormalizationReview}
            onClose={closeDrawer}
            onConfirmNormalization={controller.confirmNormalizationReview}
            onCursorOffset={controller.selectSourceOffset}
            onDiscardInvalid={controller.discardInvalidDraft}
            onNavigateDiagnostic={(diagnostic) => {
              if (diagnostic.path) controller.selectSourcePath(diagnostic.document, diagnostic.path);
            }}
            onResize={setDrawerHeight}
            snapshot={snapshot}
            sourcePath={sourceRequest?.path}
            sourceRange={sourceRequest
              ? controller.sourceRange(sourceRequest.document, sourceRequest.path)
              : undefined}
          />
        </Suspense>
      )}

      <footer className="studio-footer">
        <div className="studio-footer-tools">
          <StudioButton className="studio-drawer-button" aria-label="Open workspace drawer" onClick={() => {
            setSourceRequest(controller.sourcePathForSelection());
            toggleDrawer('source');
          }}><CodeIcon fontSize="small" /><span>topology.yaml</span></StudioButton>
        </div>
        {controller.commandError ? <span className="studio-command-error" role="alert">{controller.commandError}</span> : null}
        {autosave.error ? (
          <span className="studio-command-error studio-recovery-error" role="alert">
            Recovery save failed: {autosave.error.message}
            {autosave.error.retryable ? <StudioButton onClick={autosave.retry}>Retry</StudioButton> : null}
          </span>
        ) : null}
        <span className="studio-visually-hidden" aria-atomic="true" aria-live="polite">{controller.announcement}</span>
        <span>{host.kind === 'vscode' ? 'VS Code workspace' : 'Browser project'}</span>
      </footer>
    </main>
  );
}
