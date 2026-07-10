import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties } from 'react';
import CodeIcon from '@mui/icons-material/Code';
import IosShareIcon from '@mui/icons-material/IosShare';
import MenuIcon from '@mui/icons-material/Menu';
import PresentToAllIcon from '@mui/icons-material/PresentToAll';
import RedoIcon from '@mui/icons-material/Redo';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import SensorsIcon from '@mui/icons-material/Sensors';
import TuneIcon from '@mui/icons-material/Tune';
import UndoIcon from '@mui/icons-material/Undo';
import type { StudioHost } from '../contracts/host';
import type { StudioDocumentKind, StudioProject, StudioRecoverySnapshot, StudioSelection } from '../contracts/project';
import { CanvasSurface } from '../features/canvas/CanvasSurface';
import { Inspector } from '../features/inspector/Inspector';
import { ObjectPalette } from '../features/palette/ObjectPalette';
import { ProjectMenu, type StudioProjectLifecycleActions } from '../features/projects/ProjectMenu';
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
  const canvasRef = useRef<HTMLElement>(null);
  const { snapshot } = controller;
  const autosave = useStudioAutosave(host, snapshot);

  useEffect(() => {
    if (!controller.normalizationReview) return;
    setDrawerView('source');
    setDrawerOpen(true);
  }, [controller.normalizationReview]);

  return (
    <main
      className={`studio-shell${drawerOpen ? ' studio-shell--drawer' : ''}${paletteState === 'closed' ? ' studio-shell--palette-closed' : ''}${inspectorState === 'closed' ? ' studio-shell--inspector-closed' : ''}${presentationMode ? ' studio-shell--presentation' : ''}`}
      style={{ '--studio-drawer-height': `${drawerHeight}px` } as CSSProperties}
    >
      <header className="studio-header">
        <div className="studio-product">
          <button className="studio-icon-button studio-desktop-control" aria-expanded={paletteState !== 'closed'} aria-label={`${paletteState === 'closed' ? 'Open' : 'Close'} object palette`} onClick={() => setPaletteState((state) => state === 'closed' ? 'default' : 'closed')} title="Objects" type="button"><MenuIcon fontSize="small" /></button>
          <button className="studio-icon-button studio-mobile-control" aria-expanded={paletteState === 'open'} aria-label={`${paletteState === 'open' ? 'Close' : 'Open'} object palette`} onClick={() => setPaletteState((state) => state === 'open' ? 'default' : 'open')} title="Objects" type="button"><MenuIcon fontSize="small" /></button>
          <strong>TopoViewer Studio</strong>
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
          <button className="studio-icon-button" aria-label="Enter presentation mode" onClick={() => { setDrawerOpen(false); setPresentationMode(true); }} title="Presentation mode" type="button"><PresentToAllIcon fontSize="small" /></button>
          <button className="studio-icon-button studio-desktop-control" aria-expanded={inspectorState !== 'closed'} aria-label={`${inspectorState === 'closed' ? 'Open' : 'Close'} Inspector`} onClick={() => setInspectorState((state) => state === 'closed' ? 'default' : 'closed')} title="Inspector" type="button"><TuneIcon fontSize="small" /></button>
          <button className="studio-icon-button studio-mobile-control" aria-expanded={inspectorState === 'open'} aria-label={`${inspectorState === 'open' ? 'Close' : 'Open'} Inspector`} onClick={() => setInspectorState((state) => state === 'open' ? 'default' : 'open')} title="Inspector" type="button"><TuneIcon fontSize="small" /></button>
        </div>
      </header>

      <ObjectPalette onCreate={controller.createPaletteObject} presets={controller.presets} state={paletteState} />
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
        pasteClipboard={controller.pasteClipboard}
        pathMode={controller.pathMode}
        presentationMode={presentationMode}
        previewRegionForNode={controller.previewRegionForNode}
        proposeMapperMetric={controller.proposeMapperMetric}
        releaseNodeFromRegion={controller.releaseNodeFromRegion}
        renameLayer={controller.renameLayer}
        resizeObject={controller.resizeObject}
        reorderLayer={controller.reorderLayer}
        saveSelectionAsPreset={controller.saveSelectionAsPreset}
        selectFromCanvas={controller.selectFromCanvas}
        selectObject={controller.selectObject}
        setSelection={controller.setSelection}
        setLayerMembership={controller.setLayerMembership}
        setPathMode={controller.setPathMode}
        setRegionExpanded={controller.setRegionExpanded}
        snapshot={snapshot}
        onExitPresentation={() => setPresentationMode(false)}
      />
      <Inspector
        profile={controller.authoringProfile}
        onCommit={controller.commitInspector}
        onReorderFieldProfile={controller.reorderFieldProfile}
        onResetProfile={controller.resetAuthoringProfile}
        onCommitStyle={controller.commitStyleInspector}
        onOpenSource={(document, path) => {
          setSourceRequest({ document, path });
          setDrawerView('source');
          setDrawerOpen(true);
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

      {drawerOpen && drawerView === 'source' && (
        <Suspense fallback={<section className="studio-workspace-loading">Opening workspace...</section>}>
          <WorkspaceDrawer
            forceEditorFailure={forceEditorFailure}
            history={controller.historyEntries}
            initialDocument={sourceRequest?.document}
            normalizationReview={controller.normalizationReview}
            onApply={controller.applySourceDraft}
            onCancelNormalization={controller.cancelNormalizationReview}
            onClose={() => setDrawerOpen(false)}
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
            onClose={() => setDrawerOpen(false)}
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
            setDrawerView('source');
            setDrawerOpen((value) => drawerView === 'source' ? !value : true);
          }} type="button"><CodeIcon fontSize="small" /><span>topology.yaml</span></button>
          <button className="studio-drawer-button" aria-label="Open telemetry mapper" onClick={() => {
            setDrawerView('mapper');
            setDrawerOpen((value) => drawerView === 'mapper' ? !value : true);
          }} type="button"><SensorsIcon fontSize="small" /><span>Telemetry</span></button>
        </div>
        {controller.commandError ? <span className="studio-command-error" role="alert">{controller.commandError}</span> : null}
        {autosave.error ? (
          <span className="studio-command-error studio-recovery-error" role="alert">
            Recovery save failed: {autosave.error.message}
            {autosave.error.retryable ? <button onClick={autosave.retry} type="button">Retry</button> : null}
          </span>
        ) : null}
        <span className="studio-visually-hidden" aria-live="polite">{controller.announcement}</span>
        <span>{host.kind === 'vscode' ? 'VS Code workspace' : 'Browser project'}</span>
      </footer>
    </main>
  );
}
