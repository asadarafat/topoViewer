import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import CodeIcon from '@mui/icons-material/Code';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import IosShareIcon from '@mui/icons-material/IosShare';
import MenuIcon from '@mui/icons-material/Menu';
import PresentToAllIcon from '@mui/icons-material/PresentToAll';
import RedoIcon from '@mui/icons-material/Redo';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import SensorsIcon from '@mui/icons-material/Sensors';
import TuneIcon from '@mui/icons-material/Tune';
import UndoIcon from '@mui/icons-material/Undo';
import type { StudioExternalChange, StudioHost } from '../contracts/host';
import type { StudioDocumentKind, StudioProject, StudioRecoverySnapshot, StudioSelection } from '../contracts/project';
import { CanvasSurface } from '../features/canvas/CanvasSurface';
import { Inspector } from '../features/inspector/Inspector';
import { ObjectPalette } from '../features/palette/ObjectPalette';
import { ProjectMenu, type StudioProjectLifecycleActions } from '../features/projects/ProjectMenu';
import { ExternalChangeDialog } from '../features/projects/ExternalChangeDialog';
import { useStudioController } from './useStudioController';
import { useStudioAutosave } from './useStudioAutosave';

const WorkspaceDrawer = lazy(() => import('../features/workspace/WorkspaceDrawer'));
const MapperWorkspace = lazy(() => import('../features/mapper/MapperWorkspace'));
const ExportPanel = lazy(() => import('../features/export/ExportPanel'));
const studioFeedbackUrl = 'https://github.com/asadarafat/topoviewer/issues/new?template=studio_preview_feedback.yml';

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
  const [drawerView, setDrawerView] = useState<'source' | 'mapper'>('source');
  const [drawerHeight, setDrawerHeight] = useState(300);
  const [sourceRequest, setSourceRequest] = useState<{
    document: StudioDocumentKind;
    path: Array<string | number>;
  }>();
  const [paletteState, setPaletteState] = useState<PanelState>('default');
  const [inspectorState, setInspectorState] = useState<PanelState>('default');
  const [presentationMode, setPresentationMode] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [externalChange, setExternalChange] = useState<StudioExternalChange>();
  const [externalDiskProject, setExternalDiskProject] = useState<StudioProject>();
  const [externalChangeError, setExternalChangeError] = useState<string>();
  const [externalChangeLoading, setExternalChangeLoading] = useState(false);
  const canvasRef = useRef<HTMLElement>(null);
  const drawerReturnFocusRef = useRef<HTMLElement | null>(null);
  const presentationTriggerRef = useRef<HTMLButtonElement>(null);
  const { snapshot } = controller;
  const snapshotRef = useRef(snapshot);
  const autosave = useStudioAutosave(host, snapshot);

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

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

  function openDrawer(view: 'source' | 'mapper') {
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

  function toggleDrawer(view: 'source' | 'mapper') {
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

  function exitPresentation() {
    setPresentationMode(false);
    requestAnimationFrame(() => presentationTriggerRef.current?.focus());
  }

  return (
    <main
      className={`studio-shell${drawerOpen ? ' studio-shell--drawer' : ''}${paletteState === 'closed' ? ' studio-shell--palette-closed' : ''}${inspectorState === 'closed' ? ' studio-shell--inspector-closed' : ''}${presentationMode ? ' studio-shell--presentation' : ''}`}
      style={{ '--studio-drawer-height': `${drawerHeight}px` } as CSSProperties}
    >
      <header className="studio-header">
        <div className="studio-product">
          <button className="studio-icon-button studio-desktop-control" aria-expanded={paletteState !== 'closed'} aria-label={`${paletteState === 'closed' ? 'Open' : 'Close'} object palette`} onClick={() => setPaletteState((state) => state === 'closed' ? 'default' : 'closed')} title="Objects" type="button"><MenuIcon fontSize="small" /></button>
          <button className="studio-icon-button studio-mobile-control" aria-expanded={paletteState === 'open'} aria-label={`${paletteState === 'open' ? 'Close' : 'Open'} object palette`} onClick={() => setPaletteState((state) => state === 'open' ? 'default' : 'open')} title="Objects" type="button"><MenuIcon fontSize="small" /></button>
          <h1>TopoViewer Studio</h1>
          <span className="studio-status">Experimental</span>
        </div>
        <ProjectMenu actions={projectLifecycle} project={snapshot.project} />
        <div className="studio-header-actions">
          <span aria-live="polite" className={`studio-saved-state studio-saved-state--${snapshot.status}`}>{statusLabels[snapshot.status]}</span>
          <button className="studio-icon-button" aria-label="Undo" disabled={!controller.canUndo} onClick={controller.undo} title="Undo" type="button"><UndoIcon fontSize="small" /></button>
          <button className="studio-icon-button" aria-label="Redo" disabled={!controller.canRedo} onClick={controller.redo} title="Redo" type="button"><RedoIcon fontSize="small" /></button>
          <button className="studio-icon-button" aria-label="Save project" disabled={snapshot.status === 'saved' || snapshot.status === 'saving'} onClick={() => void controller.save()} title="Save" type="button"><SaveIcon fontSize="small" /></button>
          <button className="studio-icon-button" aria-label="Reload project" onClick={() => void controller.reload()} title="Reload" type="button"><RefreshIcon fontSize="small" /></button>
          <button className="studio-icon-button" aria-label="Open export panel" onClick={() => setExportOpen(true)} title="Export" type="button"><IosShareIcon fontSize="small" /></button>
          <a className="studio-icon-button" aria-label="Send Studio preview feedback" href={studioFeedbackUrl} rel="noreferrer" target="_blank" title="Preview feedback"><FeedbackOutlinedIcon fontSize="small" /></a>
          <button className="studio-icon-button" aria-label="Enter presentation mode" onClick={() => { setDrawerOpen(false); setPresentationMode(true); }} ref={presentationTriggerRef} title="Presentation mode" type="button"><PresentToAllIcon fontSize="small" /></button>
          <button className="studio-icon-button studio-desktop-control" aria-expanded={inspectorState !== 'closed'} aria-label={`${inspectorState === 'closed' ? 'Open' : 'Close'} Inspector`} onClick={() => setInspectorState((state) => state === 'closed' ? 'default' : 'closed')} title="Inspector" type="button"><TuneIcon fontSize="small" /></button>
          <button className="studio-icon-button studio-mobile-control" aria-expanded={inspectorState === 'open'} aria-label={`${inspectorState === 'open' ? 'Close' : 'Open'} Inspector`} onClick={() => setInspectorState((state) => state === 'open' ? 'default' : 'open')} title="Inspector" type="button"><TuneIcon fontSize="small" /></button>
        </div>
      </header>

      <ObjectPalette onCreate={createFromPalette} presets={controller.presets} state={paletteState} />
      <CanvasSurface
        alignSelection={controller.alignSelection}
        canvasRef={canvasRef}
        canCopy={controller.canCopy}
        canPaste={controller.canPaste}
        connectSelected={controller.connectSelected}
        copySelection={controller.copySelection}
        cutSelection={controller.cutSelection}
        createConnection={controller.createConnection}
        createLayer={controller.createLayer}
        createNestedRegion={controller.createNestedRegion}
        isConnectionValid={controller.isConnectionValid}
        createObject={controller.createPaletteObject}
        deleteSelection={controller.deleteSelection}
        deleteLayer={controller.deleteLayer}
        distributeSelection={controller.distributeSelection}
        duplicateSelection={controller.duplicateSelection}
        moveObject={controller.moveObject}
        nudgeSelection={controller.nudgeSelection}
        onAnnouncement={controller.announce}
        pasteClipboard={controller.pasteClipboard}
        pathMode={controller.pathMode}
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
        selectObject={controller.selectObject}
        setSelection={controller.setSelection}
        setLayerMembership={controller.setLayerMembership}
        setPathMode={controller.setPathMode}
        setRegionExpanded={controller.setRegionExpanded}
        snapshot={snapshot}
        onExitPresentation={exitPresentation}
      />
      <Inspector
        profile={controller.authoringProfile}
        onCommit={controller.commitInspector}
        onReorderFieldProfile={controller.reorderFieldProfile}
        onResetProfile={controller.resetAuthoringProfile}
        onCommitStyle={controller.commitStyleInspector}
        onOpenMapper={() => openDrawer('mapper')}
        onOpenSource={(document, path) => {
          setSourceRequest({ document, path });
          openDrawer('source');
        }}
        onUnsetStyle={controller.unsetStyleInspector}
        onUpdateFieldProfile={controller.updateFieldProfile}
        state={inspectorState}
        snapshot={snapshot}
        sourceRange={controller.sourceRange}
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

      {drawerOpen && drawerView === 'mapper' && (
        <Suspense fallback={<section className="studio-workspace-loading">Opening telemetry mapper...</section>}>
          <MapperWorkspace
            onClose={closeDrawer}
            onCommitField={controller.commitMapperField}
            onCommitProposal={controller.commitMapperProposal}
            onCommitStyle={controller.commitMapperStyle}
            onCreateRule={controller.createMapperRule}
            onEnable={controller.enableMapper}
            onExport={() => void controller.exportMapper()}
            onIngestSamples={controller.setMapperSampleResult}
            onOpenSource={(path) => {
              setSourceRequest({ document: 'mapper', path });
              setDrawerView('source');
            }}
            onRemove={controller.removeMapper}
            onProposeMetric={controller.proposeMapperMetric}
            onSelectCoverageObject={(kind, id) => controller.setSelection([{ id, kind: kind as StudioSelection['kind'] }])}
            onUnsetField={controller.unsetMapperField}
            onUnsetStyle={controller.unsetMapperStyle}
            profile={controller.authoringProfile}
            proposal={controller.mapperProposal}
            sampleResult={controller.mapperSamples}
            snapshot={snapshot}
          />
        </Suspense>
      )}

      <footer className="studio-footer">
        <div className="studio-footer-tools">
          <button className="studio-drawer-button" aria-label="Open workspace drawer" onClick={() => {
            setSourceRequest(controller.sourcePathForSelection());
            toggleDrawer('source');
          }} type="button"><CodeIcon fontSize="small" /><span>topology.yaml</span></button>
          <button className="studio-drawer-button" aria-label="Open telemetry mapper" onClick={() => {
            toggleDrawer('mapper');
          }} type="button"><SensorsIcon fontSize="small" /><span>Telemetry</span></button>
        </div>
        {controller.commandError ? <span className="studio-command-error" role="alert">{controller.commandError}</span> : null}
        {autosave.error ? (
          <span className="studio-command-error studio-recovery-error" role="alert">
            Recovery save failed: {autosave.error.message}
            {autosave.error.retryable ? <button onClick={autosave.retry} type="button">Retry</button> : null}
          </span>
        ) : null}
        <span className="studio-visually-hidden" aria-atomic="true" aria-live="polite">{controller.announcement}</span>
        <span>{host.kind === 'vscode' ? 'VS Code workspace' : 'Browser project'}</span>
      </footer>
    </main>
  );
}
