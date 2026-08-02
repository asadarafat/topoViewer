import {
  lazy,
  Suspense,
  type CSSProperties,
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction
} from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import type { StudioExternalChange, StudioHost } from '../contracts/host';
import type {
  StudioAsset,
  StudioDiagnostic,
  StudioDocumentKind,
  StudioProject
} from '../contracts/project';
import type { StudioCanvasActions, StudioCanvasModel } from '../features/canvas/contracts';
import type { StudioEdgeAuthoringTemplateId } from '../features/palette/types';
import type { StudioProjectLifecycleActions } from '../features/projects/ProjectMenu';
import { StudioPreviewHeader } from '../features/workspace/StudioPreviewHeader';
import { StudioWorkbenchContextBar } from '../features/workspace/StudioWorkbenchContextBar';
import {
  studioSourceMaximumFraction,
  studioSourceMinimumFraction,
  type StudioContextDrawer,
  type StudioDockView,
  type StudioPreviewMode,
  type StudioWorkbenchLayout,
  type StudioWorkspaceTarget
} from '../features/workspace/workbenchLayout';
import type { StudioViewportPreferences } from '../features/viewport/types';
import type { StudioSourceRange, StudioStylesheetCandidateState } from '../session';
import { studioSpace } from '../ui/muiSpacing';
import { studioCssVariables } from '../ui/studioCssVariables';
import { studioGeometry, studioLayer } from '../ui/studioTokens';
import type { StudioOptionalSurface } from './StudioOptionalSurfaceBoundary';
import { StudioStatusBar } from './StudioStatusBar';
import { StudioAuthoringWorkspace, StudioContextualWorkspace, StudioProjectSource } from './StudioWorkspaceDrawers';
import type { useStudioAutosave } from './useStudioAutosave';
import type { useStudioColorScheme } from '../ui/StudioThemeProvider';
import type { useStudioController } from './useStudioController';
import { StudioWorkspaceHeader } from './StudioWorkspaceHeader';

const StudioAssetPreviewDialog = lazy(() => import('../features/assets/StudioAssetPreviewDialog'));
const CanvasSurface = lazy(() =>
  import('../features/canvas/CanvasSurface').then((module) => ({
    default: module.CanvasSurface
  }))
);
const StudioSourceWorkspace = lazy(() =>
  import('../features/workspace/StudioSourceWorkspace').then((module) => ({
    default: module.StudioSourceWorkspace
  }))
);
const StudioCommandPalette = lazy(() =>
  import('./StudioCommandPalette').then((module) => ({
    default: module.StudioCommandPalette
  }))
);
const StudioSessionDock = lazy(() =>
  import('../features/workspace/StudioSessionDock').then((module) => ({
    default: module.StudioSessionDock
  }))
);
const StudioOptionalSurfaceBoundary = lazy(() =>
  import('./StudioOptionalSurfaceBoundary').then((module) => ({
    default: module.StudioOptionalSurfaceBoundary
  }))
);
const StudioOptionalSurfaceFailureProbe = lazy(() =>
  import('./StudioOptionalSurfaceBoundary').then((module) => ({
    default: module.StudioOptionalSurfaceFailureProbe
  }))
);
const ExportPanel = lazy(() => import('../features/export/ExportPanel'));
const ProjectDialogs = lazy(() => import('../features/projects/ProjectDialogs'));
type StudioController = ReturnType<typeof useStudioController>;
type StudioAppearance = ReturnType<typeof useStudioColorScheme>;
type StudioAutosave = ReturnType<typeof useStudioAutosave>;

export interface StudioWorkspaceShellState {
  activeDocument: StudioDocumentKind;
  activeDock: StudioDockView;
  attentionPolicyExpanded: boolean;
  authoringOpen: boolean;
  breadcrumb: string;
  candidateSnapshot: StudioStylesheetCandidateState;
  canvasZoom: number;
  commandPaletteOpen: boolean;
  compactHeader: boolean;
  contextDrawer?: StudioContextDrawer;
  desktop: boolean;
  desktopAuthoringVisible: boolean;
  desktopContextVisible: boolean;
  diagnostics: StudioDiagnostic[];
  dockCollapsed: boolean;
  edgeAuthoringTemplate?: StudioEdgeAuthoringTemplateId;
  errorCount: number;
  exportOpen: boolean;
  externalChange?: StudioExternalChange;
  externalChangeError?: string;
  externalChangeLoading: boolean;
  externalDiskProject?: StudioProject;
  headerActionsAnchor: HTMLElement | null;
  hiddenLayerIds: string[];
  linkCount: number;
  mobileContextVisible: boolean;
  mobileNavigatorOpen: boolean;
  navigatorOpen: boolean;
  nodeCount: number;
  pendingProjectAction?: { action(): Promise<void>; context: string };
  presentationMode: boolean;
  renderedPreviewMode: StudioPreviewMode;
  renderedWorkbenchLayout: StudioWorkbenchLayout;
  selectedAsset?: StudioAsset;
  sourceFraction: number;
  sourceNavigation?: {
    document: StudioDocumentKind;
    id: number;
    range: StudioSourceRange | undefined;
  };
  topologyDraftBlocked: boolean;
  viewportPreferences: StudioViewportPreferences;
  visitedContextDrawers: ReadonlySet<StudioContextDrawer>;
}

export interface StudioWorkspaceShellActions {
  changeEdgeAuthoringTemplate(templateId?: StudioEdgeAuthoringTemplateId): void;
  changeViewportPreferences(patch: Partial<StudioViewportPreferences>): void;
  closeAuthoring(): void;
  closeContextDrawer(): void;
  continuePendingProjectAction(discard: boolean): Promise<void>;
  createFromPalette(...request: Parameters<StudioController['createPaletteObject']>): boolean;
  enterPresentation(): void;
  finishMobileNavigatorExit(): void;
  finishSourcePointerResize(event: ReactPointerEvent<HTMLDivElement>): void;
  keepExternalDraft(): Promise<void>;
  loadExternalProject(): Promise<StudioProject | undefined>;
  openCodeDocument(kind: StudioDocumentKind, path?: Array<string | number>): void;
  openDiagnostic(diagnostic: StudioDiagnostic): void;
  openExportPanel(): void;
  openWorkspace(view: StudioWorkspaceTarget): void;
  recoverOptionalSurface(): void;
  reloadExternalProject(): Promise<void>;
  reloadProject(): Promise<void>;
  resetSourceFraction(event: ReactPointerEvent<HTMLDivElement>): void;
  resizeSourcePointerDown(event: ReactPointerEvent<HTMLDivElement>): void;
  resizeSourcePointerMove(event: ReactPointerEvent<HTMLDivElement>): void;
  resizeSourceWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>): void;
  saveProject(): Promise<void>;
  searchPreview(query: string): void;
  setActiveDock: Dispatch<SetStateAction<StudioDockView>>;
  setAttentionExpanded(expanded: boolean): void;
  setCommandPaletteOpen: Dispatch<SetStateAction<boolean>>;
  setContextDrawer: Dispatch<SetStateAction<StudioContextDrawer | undefined>>;
  setDockCollapsed: Dispatch<SetStateAction<boolean>>;
  setExportOpen: Dispatch<SetStateAction<boolean>>;
  setHeaderActionsAnchor: Dispatch<SetStateAction<HTMLElement | null>>;
  setHiddenLayerIds: Dispatch<SetStateAction<string[]>>;
  setMobileNavigatorOpen: Dispatch<SetStateAction<boolean>>;
  setNavigatorOpen: Dispatch<SetStateAction<boolean>>;
  setPendingProjectAction: Dispatch<SetStateAction<{ action(): Promise<void>; context: string } | undefined>>;
  setPreviewMode: Dispatch<SetStateAction<StudioPreviewMode>>;
  setSelectedAsset: Dispatch<SetStateAction<StudioAsset | undefined>>;
  setWorkbenchLayout: Dispatch<SetStateAction<StudioWorkbenchLayout>>;
  shellKeyDown(event: ReactKeyboardEvent<HTMLElement>): void;
  shouldForceOptionalSurfaceFailure(surface: StudioOptionalSurface): boolean;
}

interface StudioWorkspaceShellProps {
  actions: StudioWorkspaceShellActions;
  appearance: StudioAppearance;
  autosave: StudioAutosave;
  canvasActions: StudioCanvasActions;
  canvasModel: StudioCanvasModel;
  controller: StudioController;
  forceEditorFailure?: boolean;
  guardedProjectLifecycle: StudioProjectLifecycleActions;
  host: StudioHost;
  refs: {
    canvas: RefObject<HTMLElement | null>;
    preview: RefObject<HTMLElement | null>;
    presentationTrigger: RefObject<HTMLButtonElement>;
    shell: RefObject<HTMLElement | null>;
    split: RefObject<HTMLElement | null>;
  };
  sourceWorkspaceActions: {
    onApplySource: StudioController['applySourceDraft'];
    onApplyStyle: StudioController['applyStylesheetCandidate'];
    onCreateMapper(): void;
    onDiscardInvalid: StudioController['discardInvalidDraft'];
    onRevertStyle: StudioController['revertStylesheetCandidate'];
    onSelectSourceOffset: StudioController['selectSourceOffset'];
  };
  state: StudioWorkspaceShellState;
}

export function StudioWorkspaceShell({
  actions,
  appearance,
  autosave,
  canvasActions,
  canvasModel,
  controller,
  forceEditorFailure,
  guardedProjectLifecycle,
  host,
  refs,
  sourceWorkspaceActions,
  state
}: StudioWorkspaceShellProps) {
  const { snapshot } = controller;
  const authoringWorkspaceContent = state.visitedContextDrawers.has('add') ? (
    <StudioAuthoringWorkspace
      activeEdgeTemplate={state.edgeAuthoringTemplate}
      controller={controller}
      disabled={state.topologyDraftBlocked}
      onClose={actions.closeAuthoring}
      onCreate={actions.createFromPalette}
      onEdgeTemplateChange={actions.changeEdgeAuthoringTemplate}
      open={state.authoringOpen}
    />
  ) : null;
  const contextualWorkspaceContent = (
    <StudioContextualWorkspace
      activeDrawer={state.contextDrawer}
      controller={controller}
      onClose={actions.closeContextDrawer}
      onAttentionExpandedChange={actions.setAttentionExpanded}
      onOpenSource={actions.openCodeDocument}
      onRecoverOptionalSurface={actions.recoverOptionalSurface}
      onViewportPreferencesChange={actions.changeViewportPreferences}
      shouldForceOptionalSurfaceFailure={actions.shouldForceOptionalSurfaceFailure}
      viewportPreferences={state.viewportPreferences}
      visitedDrawers={state.visitedContextDrawers}
    />
  );
  const projectSourceNavigator = (
    <StudioProjectSource
      activeDocument={state.activeDocument}
      attentionExpanded={state.attentionPolicyExpanded}
      controller={controller}
      disabled={state.topologyDraftBlocked}
      hiddenLayerIds={state.hiddenLayerIds}
      hostName={host.displayName}
      onOpenAsset={(asset) => {
        actions.setSelectedAsset(asset);
        if (!state.desktop) actions.setMobileNavigatorOpen(false);
      }}
      onOpenContext={actions.openWorkspace}
      onOpenDocument={(document, path) => {
        actions.openCodeDocument(document, path);
        if (!state.desktop) actions.setMobileNavigatorOpen(false);
      }}
      onOpenProblem={(diagnostic) => {
        actions.openDiagnostic(diagnostic);
        if (!state.desktop) actions.setMobileNavigatorOpen(false);
      }}
      onAttentionExpandedChange={actions.setAttentionExpanded}
      setHiddenLayerIds={actions.setHiddenLayerIds}
    />
  );

  return (
    <Box
      component="div"
      className={`studio-shell${state.presentationMode ? ' studio-shell--presentation' : ''}`}
      data-ui-system="material"
      onKeyDown={actions.shellKeyDown}
      ref={refs.shell}
      style={{ ...studioCssVariables } as CSSProperties}
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        display: 'grid',
        height: '100vh',
        minWidth: 0,
        position: 'relative',
        width: '100vw',
        ...(state.presentationMode
          ? { gridTemplate: '"canvas" minmax(0, 1fr) / minmax(0, 1fr)' }
          : {
              gridTemplateAreas: '"header" "workbench" "readout"',
              gridTemplateColumns: 'minmax(0, 1fr)',
              gridTemplateRows: 'var(--studio-command-bar-height) minmax(0, 1fr) var(--studio-readout-height)'
            })
      }}
    >
      <StudioWorkspaceHeader
        actions={actions}
        appearance={appearance}
        controller={controller}
        guardedProjectLifecycle={guardedProjectLifecycle}
        presentationTriggerRef={refs.presentationTrigger}
        state={state}
      />

      <Box
        component="main"
        sx={{
          display: 'grid',
          gridArea: state.presentationMode ? 'canvas' : 'workbench',
          gridTemplateColumns: {
            md:
              state.presentationMode || !state.navigatorOpen
                ? 'minmax(0, 1fr)'
                : 'var(--studio-navigator-width) minmax(0, 1fr)',
            xs: 'minmax(0, 1fr)'
          },
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {state.desktop ? (
          <Box
            sx={{
              display: state.navigatorOpen && !state.presentationMode ? 'grid' : 'none',
              minHeight: 0,
              minWidth: 0,
              overflow: 'hidden'
            }}
          >
            {projectSourceNavigator}
          </Box>
        ) : (
          <Drawer
            ModalProps={{ keepMounted: true }}
            onClose={() => actions.setMobileNavigatorOpen(false)}
            open={state.mobileNavigatorOpen && !state.presentationMode}
            slotProps={{
              paper: {
                'aria-label': 'Project source drawer',
                sx: {
                  bottom: `${studioGeometry.readoutHeight}px`,
                  height: 'auto',
                  maxWidth: '88vw',
                  top: `${studioGeometry.commandBarHeight}px`,
                  width: studioGeometry.navigatorWidth
                }
              },
              transition: { onExited: actions.finishMobileNavigatorExit }
            }}
            variant="temporary"
          >
            {projectSourceNavigator}
          </Drawer>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateRows: state.presentationMode
              ? 'minmax(0, 1fr)'
              : `var(--studio-context-bar-height) minmax(0, 1fr) ${
                  state.dockCollapsed ? 'var(--studio-dock-collapsed-height)' : 'var(--studio-dock-height)'
                }`,
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {state.presentationMode ? null : (
            <StudioWorkbenchContextBar
              breadcrumb={state.breadcrumb}
              errorCount={state.errorCount}
              layout={state.renderedWorkbenchLayout}
              onLayoutChange={actions.setWorkbenchLayout}
            />
          )}
          <Box
            data-layout={state.presentationMode ? 'preview' : state.renderedWorkbenchLayout}
            ref={refs.split}
            sx={{
              display: 'grid',
              gridTemplateColumns:
                !state.presentationMode && state.renderedWorkbenchLayout === 'split'
                  ? `${state.sourceFraction}fr var(--studio-resizer-width) ${1 - state.sourceFraction}fr`
                  : 'minmax(0, 1fr)',
              minHeight: 0,
              minWidth: 0,
              overflow: 'hidden'
            }}
          >
            <Box
              data-testid="studio-source-pane"
              hidden={state.presentationMode || state.renderedWorkbenchLayout === 'preview'}
              sx={{
                minHeight: 0,
                minWidth: 0,
                overflow: 'hidden',
                '&[hidden]': { display: 'none' }
              }}
            >
              <Suspense
                fallback={
                  <Box
                    sx={{
                      alignItems: 'center',
                      display: 'flex',
                      height: '100%',
                      justifyContent: 'center',
                      p: studioSpace.space12
                    }}
                  >
                    <Typography role="status" variant="body2">
                      Opening YAML workspace...
                    </Typography>
                  </Box>
                }
              >
                <StudioSourceWorkspace
                  activeDocument={state.activeDocument}
                  candidate={controller.stylesheetCandidate}
                  forceEditorFailure={forceEditorFailure}
                  navigation={
                    state.sourceNavigation?.document === state.activeDocument && state.sourceNavigation.range
                      ? {
                          focus: true,
                          id: state.sourceNavigation.id,
                          range: state.sourceNavigation.range
                        }
                      : undefined
                  }
                  onApplySource={sourceWorkspaceActions.onApplySource}
                  onApplyStyle={sourceWorkspaceActions.onApplyStyle}
                  onCreateMapper={sourceWorkspaceActions.onCreateMapper}
                  onDiscardInvalid={sourceWorkspaceActions.onDiscardInvalid}
                  onRevertStyle={sourceWorkspaceActions.onRevertStyle}
                  onSelectSourceOffset={sourceWorkspaceActions.onSelectSourceOffset}
                  snapshot={snapshot}
                  sourceDrafts={controller.sourceDrafts}
                />
              </Suspense>
            </Box>
            <Box
              aria-label="Resize source and preview"
              aria-orientation="vertical"
              aria-valuemax={Math.round(studioSourceMaximumFraction * 100)}
              aria-valuemin={Math.round(studioSourceMinimumFraction * 100)}
              aria-valuenow={Math.round(state.sourceFraction * 100)}
              aria-valuetext={`${Math.round(state.sourceFraction * 100)} percent source`}
              component="div"
              onDoubleClick={actions.resetSourceFraction}
              onKeyDown={actions.resizeSourceWithKeyboard}
              onPointerCancel={actions.finishSourcePointerResize}
              onPointerDown={actions.resizeSourcePointerDown}
              onPointerMove={actions.resizeSourcePointerMove}
              onPointerUp={actions.finishSourcePointerResize}
              role="separator"
              tabIndex={!state.presentationMode && state.renderedWorkbenchLayout === 'split' ? 0 : -1}
              title="Resize source and preview; double-click to reset"
              sx={{
                bgcolor: 'divider',
                cursor: 'col-resize',
                display: !state.presentationMode && state.renderedWorkbenchLayout === 'split' ? 'block' : 'none',
                minHeight: 0,
                position: 'relative',
                touchAction: 'none',
                zIndex: studioLayer.panelResizer,
                '&:hover, &:focus-visible, &:active': {
                  bgcolor: 'primary.main'
                }
              }}
            />
            <Box
              data-testid="studio-preview-pane"
              hidden={!state.presentationMode && state.renderedWorkbenchLayout === 'source'}
              ref={refs.preview}
              sx={{
                display: 'grid',
                gridTemplateRows: state.presentationMode
                  ? 'minmax(0, 1fr)'
                  : 'var(--studio-preview-bar-height) minmax(0, 1fr)',
                minHeight: 0,
                minWidth: 0,
                overflow: 'hidden',
                '&[hidden]': { display: 'none' }
              }}
            >
              {state.presentationMode ? null : (
                <StudioPreviewHeader
                  editDisabled={state.topologyDraftBlocked}
                  linkCount={state.linkCount}
                  mode={state.renderedPreviewMode}
                  nodeCount={state.nodeCount}
                  onModeChange={actions.setPreviewMode}
                  onSearch={actions.searchPreview}
                />
              )}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplate: '"canvas" minmax(0, 1fr) / minmax(0, 1fr)',
                  minHeight: 0,
                  minWidth: 0,
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <Suspense
                  fallback={(
                    <Box
                      aria-label="Opening topology canvas"
                      role="status"
                      sx={{ gridArea: 'canvas', minHeight: 0, minWidth: 0 }}
                    />
                  )}
                >
                  <CanvasSurface actions={canvasActions} model={canvasModel} />
                </Suspense>
                {state.desktopAuthoringVisible && !state.presentationMode ? (
                  <Box
                    sx={{
                      bgcolor: 'background.paper',
                      borderRight: 1,
                      borderColor: 'divider',
                      bottom: 0,
                      boxShadow: 8,
                      containerName: 'studio-workspace',
                      containerType: 'inline-size',
                      display: 'grid',
                      left: 0,
                      minHeight: 0,
                      overflow: 'hidden',
                      position: 'absolute',
                      top: 0,
                      width: 'var(--studio-object-drawer-width)',
                      zIndex: studioLayer.drawer
                    }}
                  >
                    {authoringWorkspaceContent}
                  </Box>
                ) : null}
                {state.desktopContextVisible && !state.presentationMode ? (
                  <Box
                    sx={{
                      bgcolor: 'background.paper',
                      borderLeft: 1,
                      borderColor: 'divider',
                      bottom: 0,
                      boxShadow: 8,
                      containerName: 'studio-workspace',
                      containerType: 'inline-size',
                      display: 'grid',
                      minHeight: 0,
                      overflow: 'hidden',
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      width: 'var(--studio-panel-min-width)',
                      zIndex: studioLayer.drawer
                    }}
                  >
                    {contextualWorkspaceContent}
                  </Box>
                ) : null}
              </Box>
            </Box>
          </Box>
          {state.presentationMode ? null : (
            <Suspense
              fallback={
                <Box
                  aria-label="Opening project session details"
                  role="status"
                  sx={{
                    bgcolor: 'background.paper',
                    borderTop: 1,
                    borderColor: 'divider',
                    minHeight: 0
                  }}
                />
              }
            >
              <StudioSessionDock
                activeView={state.activeDock}
                candidateDirty={state.candidateSnapshot.dirty}
                collapsed={state.dockCollapsed}
                diagnostics={state.diagnostics}
                history={controller.historyEntries}
                hostName={host.displayName}
                onActiveViewChange={actions.setActiveDock}
                onOpenProblem={actions.openDiagnostic}
                onToggleCollapsed={() => actions.setDockCollapsed((collapsed) => !collapsed)}
                project={snapshot.project}
                projectStatus={snapshot.status}
                selection={snapshot.selection}
                sourceDrafts={controller.sourceDrafts}
              />
            </Suspense>
          )}
          {!state.desktop && !state.presentationMode ? (
            <Drawer
              anchor={state.contextDrawer === 'add' ? 'left' : 'right'}
              ModalProps={{ keepMounted: true }}
              onClose={() => (state.contextDrawer === 'add' ? actions.closeAuthoring() : actions.closeContextDrawer())}
              open={state.mobileContextVisible}
              slotProps={{
                paper: {
                  'aria-label':
                    state.contextDrawer === 'add'
                      ? 'Add workspace drawer'
                      : state.contextDrawer === 'mapper'
                        ? 'Telemetry mapper workspace drawer'
                        : 'Properties workspace drawer',
                  sx: {
                    bottom: `${studioGeometry.readoutHeight}px`,
                    height: 'auto',
                    maxWidth: '92vw',
                    top: `${studioGeometry.commandBarHeight}px`,
                    width:
                      state.contextDrawer === 'add'
                        ? studioGeometry.objectDrawerWidth
                        : studioGeometry.panelMaximumWidth
                  }
                }
              }}
              variant="temporary"
            >
              {state.contextDrawer === 'add' ? authoringWorkspaceContent : contextualWorkspaceContent}
            </Drawer>
          ) : null}
        </Box>
      </Box>

      {state.commandPaletteOpen ? (
        <Suspense fallback={null}>
          <StudioCommandPalette
            canRedo={controller.canRedo}
            canUndo={controller.canUndo}
            onClose={() => actions.setCommandPaletteOpen(false)}
            onExport={actions.openExportPanel}
            onOpenWorkspace={actions.openWorkspace}
            onPresentation={actions.enterPresentation}
            onRedo={controller.redo}
            onReload={() => void actions.reloadProject()}
            onSelectObject={(selection) => {
              controller.setSelection([selection]);
              actions.openWorkspace('properties');
            }}
            onUndo={controller.undo}
            open
            snapshot={snapshot}
          />
        </Suspense>
      ) : null}

      {state.exportOpen ? (
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
              <Typography role="status" variant="body2">
                Opening export tools...
              </Typography>
            </Box>
          }
        >
          <StudioOptionalSurfaceBoundary
            message="Export tools are unavailable."
            modalLabel="Export tools unavailable"
            onClose={() => actions.setExportOpen(false)}
            onRetry={actions.recoverOptionalSurface}
            surfaceLabel="Export tools"
          >
            {actions.shouldForceOptionalSurfaceFailure('export') ? (
              <StudioOptionalSurfaceFailureProbe surface="export" />
            ) : null}
            <ExportPanel
              canvasElement={refs.canvas.current}
              host={host}
              onAnnouncement={controller.announce}
              onClose={() => actions.setExportOpen(false)}
              onConfigureMapper={() => {
                actions.setExportOpen(false);
                actions.openWorkspace('mapper');
              }}
              snapshot={snapshot}
            />
          </StudioOptionalSurfaceBoundary>
        </Suspense>
      ) : null}

      {state.externalChange || state.pendingProjectAction || controller.normalizationReview ? (
        <Suspense fallback={null}>
          <ProjectDialogs
            externalChange={
              state.externalChange
                ? {
                    diskProject: state.externalDiskProject,
                    error: state.externalChangeError,
                    event: state.externalChange,
                    loading: state.externalChangeLoading,
                    onInspect: () => void actions.loadExternalProject(),
                    onKeepDraft: () => void actions.keepExternalDraft(),
                    onReloadDisk: () => void actions.reloadExternalProject(),
                    studioProject: snapshot.project
                  }
                : undefined
            }
            normalizationReview={
              controller.normalizationReview
                ? {
                    onCancel: controller.cancelNormalizationReview,
                    onConfirm: controller.confirmNormalizationReview,
                    review: controller.normalizationReview
                  }
                : undefined
            }
            styleResolution={
              state.pendingProjectAction
                ? {
                    candidate: controller.stylesheetCandidate,
                    context: state.pendingProjectAction.context,
                    onApply: () => void actions.continuePendingProjectAction(false),
                    onCancel: () => actions.setPendingProjectAction(undefined),
                    onDiscard: () => void actions.continuePendingProjectAction(true),
                    open: true
                  }
                : undefined
            }
          />
        </Suspense>
      ) : null}

      {state.selectedAsset ? (
        <Suspense fallback={null}>
          <StudioOptionalSurfaceBoundary
            message="Asset preview is unavailable."
            modalLabel="Asset preview unavailable"
            onClose={() => actions.setSelectedAsset(undefined)}
            onRetry={actions.recoverOptionalSurface}
            resetKey={state.selectedAsset.path}
            surfaceLabel="Asset preview"
          >
            {actions.shouldForceOptionalSurfaceFailure('asset') ? (
              <StudioOptionalSurfaceFailureProbe surface="asset" />
            ) : null}
            <StudioAssetPreviewDialog
              asset={state.selectedAsset}
              host={host}
              onClose={() => actions.setSelectedAsset(undefined)}
              projectId={snapshot.project.id}
            />
          </StudioOptionalSurfaceBoundary>
        </Suspense>
      ) : null}

      {state.presentationMode ? null : (
        <StudioStatusBar
          appearanceError={appearance.error}
          autosaveError={autosave.error}
          commandError={controller.commandError}
          diagnostics={state.diagnostics}
          hostName={host.displayName}
          onDismissAppearanceError={appearance.clearError}
          onOpenProblem={actions.openDiagnostic}
          onOpenProblems={() => {
            actions.setActiveDock('problems');
            actions.setDockCollapsed(false);
          }}
          onRetryAutosave={autosave.retry}
          projectRevision={snapshot.project.revision}
          selection={snapshot.selection}
          zoom={state.canvasZoom}
        />
      )}
      <Typography className="studio-visually-hidden" aria-atomic="true" aria-live="polite" component="span">
        {controller.announcement}
      </Typography>
    </Box>
  );
}
