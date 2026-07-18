import { lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import CoPresentIcon from '@mui/icons-material/CoPresent';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import IosShareIcon from '@mui/icons-material/IosShare';
import MenuIcon from '@mui/icons-material/Menu';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RedoIcon from '@mui/icons-material/Redo';
import RefreshIcon from '@mui/icons-material/Refresh';
import UndoIcon from '@mui/icons-material/Undo';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { StudioExternalChange, StudioHost } from '../contracts/host';
import type { StudioProject, StudioRecoverySnapshot, StudioSelection } from '../contracts/project';
import { CanvasSurface } from '../features/canvas/CanvasSurface';
import { EditWorkspace, type EditCodeDocument } from '../features/inspector/EditWorkspace';
import { Inspector } from '../features/inspector/Inspector';
import { StyleAwareSaveControls } from '../features/inspector/StyleCandidateFooter';
import { ObjectPalette } from '../features/palette/ObjectPalette';
import type { StudioEdgeAuthoringTemplateId } from '../features/palette/types';
import { WorkspaceRail, type StudioWorkspaceView } from '../features/workspace/WorkspaceRail';
import { normalizeStudioWorkspaceRatio, studioWorkspaceDefaultRatio, studioWorkspaceMaximumRatio, studioWorkspaceMinimumRatio, studioWorkspaceRatioFromPointer } from '../features/workspace/workspaceLayout';
import { defaultStudioViewportPreferences, normalizeStudioViewportPreferences, type StudioViewportPreferences } from '../features/viewport/types';
import { ProjectMenu, type StudioProjectLifecycleActions } from '../features/projects/ProjectMenu';
import { ExternalChangeDialog } from '../features/projects/ExternalChangeDialog';
import { NormalizationReviewDialog } from '../features/projects/NormalizationReviewDialog';
import { StyleCandidateResolutionDialog } from '../features/projects/StyleCandidateResolutionDialog';
import { StudioButton, StudioIconButton, StudioMenu, StudioMenuItem, StudioMenuItemIcon, StudioMenuItemText } from '../ui/controls';
import { StudioPanelHeader } from '../ui/StudioPanel';
import { serializeStylesheetCandidateRecovery } from '../session';
import { useStudioController } from './useStudioController';
import { useStudioAutosave } from './useStudioAutosave';
import { studioSpace } from '../ui/muiSpacing';
import { studioCssVariables } from '../ui/studioCssVariables';

const MapperWorkspace = lazy(() => import('../features/mapper/MapperWorkspace'));
const ExportPanel = lazy(() => import('../features/export/ExportPanel'));
const studioFeedbackUrl = 'https://github.com/asadarafat/topoviewer/issues/new?template=studio_preview_feedback.yml';
const studioWorkspaceRatioPreferenceKey = 'workspace-panel-ratio';
const studioWorkspaceKeyboardStep = 0.02;

interface StudioWorkspaceProps {
  forceEditorFailure?: boolean;
  host: StudioHost;
  onReload(): Promise<void>;
  project: StudioProject;
  projectLifecycle: StudioProjectLifecycleActions;
  recovery?: StudioRecoverySnapshot;
}

type PanelState = 'default' | 'open' | 'closed';

const workspaceViewSx = {
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  height: '100%',
  minHeight: 0,
  minWidth: 0,
  overflow: 'hidden',
  width: '100%',
  '&[hidden]': { display: 'none' }
} as const;

export function StudioWorkspace({ forceEditorFailure, host, onReload, project, projectLifecycle, recovery }: StudioWorkspaceProps) {
  const controller = useStudioController({ host, onReload, project, recovery });
  const [workspaceState, setWorkspaceState] = useState<PanelState>('default');
  const [workspaceView, setWorkspaceView] = useState<StudioWorkspaceView>('topo');
  const [editCodeDocument, setEditCodeDocument] = useState<EditCodeDocument>('topology');
  const [workspaceRatio, setWorkspaceRatio] = useState(studioWorkspaceDefaultRatio);
  const [workspaceRatioReady, setWorkspaceRatioReady] = useState(false);
  const [visitedWorkspaceViews, setVisitedWorkspaceViews] = useState<Set<StudioWorkspaceView>>(() => new Set(['topo']));
  const [presentationMode, setPresentationMode] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [externalChange, setExternalChange] = useState<StudioExternalChange>();
  const [externalDiskProject, setExternalDiskProject] = useState<StudioProject>();
  const [externalChangeError, setExternalChangeError] = useState<string>();
  const [externalChangeLoading, setExternalChangeLoading] = useState(false);
  const [viewportPreferences, setViewportPreferences] = useState<StudioViewportPreferences>(defaultStudioViewportPreferences);
  const [viewportPreferencesReady, setViewportPreferencesReady] = useState(false);
  const [edgeAuthoringTemplate, setEdgeAuthoringTemplate] = useState<StudioEdgeAuthoringTemplateId>();
  const [formatPainterSource, setFormatPainterSource] = useState<StudioSelection>();
  const [headerActionsAnchor, setHeaderActionsAnchor] = useState<HTMLElement | null>(null);
  const [pendingProjectAction, setPendingProjectAction] = useState<{
    action(): Promise<void>;
    context: string;
  }>();
  const canvasRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const workspaceRatioRef = useRef(workspaceRatio);
  const presentationTriggerRef = useRef<HTMLButtonElement>(null);
  const { snapshot } = controller;
  const snapshotRef = useRef(snapshot);
  const autosave = useStudioAutosave(host, snapshot, controller.stylesheetCandidate);
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
          delete: () => beforeProjectSwitch(projectLifecycle.delete!, 'Deleting this project')
        }
      : {}),
    ...(projectLifecycle.duplicate
      ? {
          duplicate: () => beforeProjectSwitch(projectLifecycle.duplicate!, 'Duplicating this project')
        }
      : {}),
    ...(projectLifecycle.open
      ? {
          open: (id: string) => beforeProjectSwitch(() => projectLifecycle.open!(id), 'Opening another project')
        }
      : {}),
    ...(projectLifecycle.openArchive
      ? {
          openArchive: () => beforeProjectSwitch(projectLifecycle.openArchive!, 'Opening an archive')
        }
      : {}),
    ...(projectLifecycle.openFolder
      ? {
          openFolder: () => beforeProjectSwitch(projectLifecycle.openFolder!, 'Opening a folder')
        }
      : {})
  };

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  useEffect(() => {
    workspaceRatioRef.current = workspaceRatio;
  }, [workspaceRatio]);

  useEffect(() => {
    let active = true;
    void host.readPreference<number>(studioWorkspaceRatioPreferenceKey).then((result) => {
      if (!active) return;
      if (result.ok && result.value !== undefined) setWorkspaceRatio(normalizeStudioWorkspaceRatio(result.value));
      setWorkspaceRatioReady(true);
    });
    return () => {
      active = false;
    };
  }, [host]);

  useEffect(() => {
    if (!workspaceRatioReady) return;
    const timer = setTimeout(() => {
      void host.writePreference(studioWorkspaceRatioPreferenceKey, workspaceRatio).then((result) => {
        if (!result.ok)
          host.report({
            category: 'persistence',
            detail: { code: result.error.code },
            name: 'studio-workspace-ratio-write-failed'
          });
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [host, workspaceRatio, workspaceRatioReady]);

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

  function cancelEdgeAuthoringFromShell(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.defaultPrevented || event.key !== 'Escape' || (!edgeAuthoringTemplate && !formatPainterSource)) return;
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

  function selectWorkspace(view: StudioWorkspaceView) {
    setVisitedWorkspaceViews((current) => {
      if (current.has(view)) return current;
      const next = new Set(current);
      next.add(view);
      return next;
    });
    setWorkspaceView(view);
    setWorkspaceState((state) => (state === 'open' ? 'open' : 'default'));
  }

  function applyWorkspaceRatio(value: number, separator?: HTMLElement) {
    const ratio = normalizeStudioWorkspaceRatio(value);
    workspaceRatioRef.current = ratio;
    shellRef.current?.style.setProperty('--studio-workspace-width', `${ratio * 100}vw`);
    separator?.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    separator?.setAttribute('aria-valuetext', `${Math.round(ratio * 100)} percent of the Studio window`);
    return ratio;
  }

  function workspaceRatioForPointer(clientX: number) {
    const bounds = shellRef.current?.getBoundingClientRect();
    return bounds ? studioWorkspaceRatioFromPointer(clientX, bounds.left, bounds.width) : studioWorkspaceDefaultRatio;
  }

  function resizeWorkspacePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || workspaceState === 'closed') return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function resizeWorkspacePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    applyWorkspaceRatio(workspaceRatioForPointer(event.clientX), event.currentTarget);
  }

  function finishWorkspacePointerResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setWorkspaceRatio(workspaceRatioRef.current);
  }

  function resizeWorkspaceWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    let next: number | undefined;
    if (event.key === 'ArrowLeft') next = workspaceRatioRef.current - studioWorkspaceKeyboardStep;
    if (event.key === 'ArrowRight') next = workspaceRatioRef.current + studioWorkspaceKeyboardStep;
    if (event.key === 'Home') next = studioWorkspaceMinimumRatio;
    if (event.key === 'End') next = studioWorkspaceMaximumRatio;
    if (next === undefined) return;
    event.preventDefault();
    setWorkspaceRatio(applyWorkspaceRatio(next, event.currentTarget));
  }

  function resetWorkspaceRatio(event: ReactPointerEvent<HTMLDivElement>) {
    setWorkspaceRatio(applyWorkspaceRatio(studioWorkspaceDefaultRatio, event.currentTarget));
  }

  async function saveProject() {
    const saved = await controller.save();
    if (saved === false && controller.stylesheetCandidate.getSnapshot().status === 'invalid-dirty') {
      setEditCodeDocument('stylesheet');
      controller.stylesheetCandidate.setMode('yaml');
      selectWorkspace('edit');
    }
  }

  function openExportPanel() {
    if (controller.applyStylesheetCandidate()) {
      setExportOpen(true);
      return;
    }
    setEditCodeDocument('stylesheet');
    controller.stylesheetCandidate.setMode('yaml');
    selectWorkspace('edit');
  }

  async function continuePendingProjectAction(discard: boolean) {
    const pending = pendingProjectAction;
    if (!pending) return;
    if (discard) controller.revertStylesheetCandidate();
    else if (!controller.applyStylesheetCandidate()) return;
    setPendingProjectAction(undefined);
    if (await controller.flushRecovery()) await pending.action();
  }

  const inspectorBindings = {
    onCommit: controller.commitInspector,
    onCommitViewport: controller.commitViewport,
    onCopyId: (id: string) => {
      void controller.copyObjectId(id);
    },
    onPreviewIdRename: controller.previewObjectIdRename,
    onRenameId: controller.renameObjectId,
    onUnset: controller.unsetInspector,
    onViewportPreferencesChange: (patch: Partial<StudioViewportPreferences>) => setViewportPreferences((current) => ({ ...current, ...patch })),
    snapshot,
    viewportPreferences
  };

  return (
    <Box
      component="main"
      className={`studio-shell${workspaceState === 'closed' ? ' studio-shell--workspace-closed' : ''}${presentationMode ? ' studio-shell--presentation' : ''}`}
      data-ui-system="material"
      onKeyDown={cancelEdgeAuthoringFromShell}
      ref={shellRef}
      style={
        {
          ...studioCssVariables,
          '--studio-workspace-width': `${workspaceRatio * 100}vw`
        } as CSSProperties
      }
      sx={{
        bgcolor: 'background.default',
        color: 'text.primary',
        display: 'grid',
        height: '100vh',
        width: '100vw',
        ...(presentationMode
          ? {
              gridTemplate: '"canvas" minmax(0, 1fr) / minmax(0, 1fr)'
            }
          : {
              gridTemplateAreas: {
                md: '"header header" "palette canvas" "footer footer"',
                xs: '"header" "canvas" "footer"'
              },
              gridTemplateColumns: {
                md:
                  workspaceState === 'closed'
                    ? 'var(--studio-rail-width) minmax(var(--studio-canvas-min-width), 1fr)'
                    : 'clamp(var(--studio-workspace-min-width), var(--studio-workspace-width, 25vw), 50vw) minmax(var(--studio-canvas-min-width), 1fr)',
                xs: 'minmax(0, 1fr)'
              },
              gridTemplateRows: {
                md: 'var(--studio-header-height) minmax(0, 1fr) var(--studio-footer-height)',
                xs: 'var(--studio-compact-header-height) minmax(0, 1fr) var(--studio-footer-height)'
              }
            })
      }}
    >
      <AppBar
        className="studio-header"
        color="default"
        component="header"
        elevation={0}
        position="static"
        sx={{
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          display: presentationMode ? 'none' : 'grid',
          gridArea: 'header',
          gridTemplateAreas: {
            md: '"product project actions"',
            xs: '"product project" "actions actions"'
          },
          gridTemplateColumns: {
            md: 'minmax(300px, 1fr) auto minmax(300px, 1fr)',
            xs: 'minmax(180px, 1fr) minmax(0, 1fr)'
          },
          gridTemplateRows: {
            md: 'var(--studio-header-height)',
            xs: '40px 40px'
          },
          minWidth: 0,
          px: { md: studioSpace.space16, xs: studioSpace.space8 }
        }}
      >
        <Box
          className="studio-product"
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: studioSpace.space8,
            gridArea: 'product',
            minWidth: 0
          }}
        >
          <StudioIconButton
            aria-expanded={workspaceState !== 'closed'}
            aria-label={`${workspaceState === 'closed' ? 'Open' : 'Close'} workspace panel`}
            onClick={() => setWorkspaceState((state) => (state === 'closed' ? 'default' : 'closed'))}
            sx={{ display: { md: 'inline-flex', xs: 'none' } }}
            title="Workspaces"
          >
            <MenuIcon fontSize="small" />
          </StudioIconButton>
          <StudioIconButton
            aria-expanded={workspaceState === 'open'}
            aria-label={`${workspaceState === 'open' ? 'Close' : 'Open'} workspace panel`}
            onClick={() => setWorkspaceState((state) => (state === 'open' ? 'default' : 'open'))}
            sx={{ display: { md: 'none', xs: 'inline-flex' } }}
            title="Workspaces"
          >
            <MenuIcon fontSize="small" />
          </StudioIconButton>
          <Typography component="h1" noWrap variant="h6">
            TopoViewer Studio
          </Typography>
          <Chip label="Experimental" size="small" sx={{ display: { md: 'flex', xs: 'none' } }} variant="outlined" />
        </Box>
        <ProjectMenu actions={guardedProjectLifecycle} project={snapshot.project} />
        <Box
          className="studio-header-actions"
          sx={{
            alignItems: 'center',
            display: 'flex',
            gap: studioSpace.space4,
            gridArea: 'actions',
            justifySelf: 'end'
          }}
        >
          <StyleAwareSaveControls candidate={controller.stylesheetCandidate} onSave={() => void saveProject()} projectStatus={snapshot.status} />
          <Divider flexItem orientation="vertical" sx={{ mx: studioSpace.space4 }} />
          <StudioIconButton aria-label="Undo" disabled={!controller.canUndo} onClick={controller.undo} title="Undo">
            <UndoIcon fontSize="small" />
          </StudioIconButton>
          <StudioIconButton aria-label="Redo" disabled={!controller.canRedo} onClick={controller.redo} title="Redo">
            <RedoIcon fontSize="small" />
          </StudioIconButton>
          <Divider flexItem orientation="vertical" sx={{ mx: studioSpace.space4 }} />
          <StudioIconButton aria-label="Open export panel" onClick={openExportPanel} title="Export">
            <IosShareIcon fontSize="small" />
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
      </AppBar>

      <Paper
        className="studio-left-workspace"
        component="section"
        data-state={workspaceState}
        elevation={0}
        square
        sx={{
          borderRight: 1,
          borderColor: 'divider',
          display: presentationMode ? 'none' : { md: 'grid', xs: workspaceState === 'open' ? 'grid' : 'none' },
          gridArea: 'palette',
          gridTemplateColumns: workspaceState === 'closed' ? 'var(--studio-rail-width) 0 0' : 'var(--studio-rail-width) minmax(0, 1fr) 8px',
          overflow: 'hidden',
          '@media (max-width: 899px)':
            workspaceState === 'open'
              ? {
                  bottom: 'var(--studio-footer-height)',
                  gridTemplateColumns: 'var(--studio-rail-width) minmax(0, 1fr)',
                  left: 0,
                  position: 'fixed',
                  top: 'var(--studio-compact-header-height)',
                  width: 'min(344px, calc(100vw - 32px))',
                  zIndex: 80
                }
              : undefined
        }}
      >
        <WorkspaceRail onChange={selectWorkspace} value={workspaceView} />
        <Box
          className="studio-left-workspace-content"
          sx={{
            containerName: 'studio-workspace',
            containerType: 'inline-size',
            gridArea: '1 / 2',
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden',
            position: 'relative',
            visibility: workspaceState === 'closed' ? 'hidden' : 'visible',
            zIndex: 1
          }}
        >
          {visitedWorkspaceViews.has('topo') ? (
            <Box className="studio-workspace-view studio-workspace-view--topo" component="section" hidden={workspaceView !== 'topo'} id="studio-topo-workspace" sx={{ ...workspaceViewSx, gridTemplateRows: 'minmax(0, 1fr)' }}>
              <ObjectPalette
                activeEdgeTemplate={edgeAuthoringTemplate}
                onCollapse={() => setWorkspaceState('closed')}
                onCreate={createFromPalette}
                onDeletePreset={controller.deletePreset}
                onEdgeTemplateChange={changeEdgeAuthoringTemplate}
                onPathModeChange={controller.setPathMode}
                onRenamePreset={controller.renamePreset}
                pathMode={controller.pathMode}
                presets={controller.presets}
                selectedNodeCount={snapshot.selection.filter((item) => item.kind === 'node').length}
                state={workspaceState}
              />
            </Box>
          ) : null}
          {visitedWorkspaceViews.has('edit') ? (
            <Box
              aria-label="Edit panel"
              className="studio-workspace-view studio-workspace-view--edit"
              component="section"
              hidden={workspaceView !== 'edit'}
              id="studio-edit-workspace"
              sx={{ ...workspaceViewSx, gridTemplateRows: 'minmax(0, 1fr)' }}
            >
              <EditWorkspace
                candidate={controller.stylesheetCandidate}
                codeDocument={editCodeDocument}
                forceEditorFailure={forceEditorFailure}
                onApplySource={controller.applySourceDraft}
                onApplyStyle={controller.applyStylesheetCandidate}
                onCandidateTextChange={controller.replaceStylesheetCandidateRaw}
                onCandidateTextReplace={controller.replaceStylesheetCandidateStructured}
                onCommitObject={controller.commitInspector}
                onCommitStyle={controller.commitCandidateStyle}
                onCopyId={(id) => {
                  void controller.copyObjectId(id);
                }}
                onCollapse={() => setWorkspaceState('closed')}
                onDiscardInvalid={controller.discardInvalidDraft}
                onPreviewObjectIdRename={controller.previewObjectIdRename}
                onRenameObjectId={controller.renameObjectId}
                onRevertStyle={controller.revertStylesheetCandidate}
                onSelectSourceOffset={controller.selectSourceOffset}
                onUnsetStyle={controller.unsetCandidateStyle}
                onUnsetObject={controller.unsetInspector}
                onCodeDocumentChange={setEditCodeDocument}
                snapshot={snapshot}
                sourceRange={controller.sourceRange}
                viewportPreferences={viewportPreferences}
              />
            </Box>
          ) : null}
          {visitedWorkspaceViews.has('viewport') ? (
            <Box aria-label="Viewport panel" className="studio-workspace-view" component="section" hidden={workspaceView !== 'viewport'} id="studio-viewport-workspace" sx={workspaceViewSx}>
              <StudioPanelHeader onCollapse={() => setWorkspaceState('closed')} title="Viewport" />
              <Inspector {...inspectorBindings} ariaLabel="Viewport workspace" documentView="viewport" />
            </Box>
          ) : null}
          {visitedWorkspaceViews.has('mapper') ? (
            <Box
              aria-label="Mapper panel"
              className="studio-workspace-view studio-workspace-view--mapper"
              component="section"
              hidden={workspaceView !== 'mapper'}
              id="studio-mapper-workspace"
              sx={{ ...workspaceViewSx, gridTemplateRows: 'minmax(0, 1fr)' }}
            >
              <Suspense fallback={<Box className="studio-workspace-loading">Opening telemetry mapper...</Box>}>
                <MapperWorkspace
                  forceEditorFailure={forceEditorFailure}
                  onApplySource={(text) => controller.applySourceDraft('mapper', text)}
                  onClose={() => setWorkspaceState('closed')}
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
                  sampleInput={controller.mapperSampleInput}
                  snapshot={snapshot}
                  sourceRange={(path) => controller.sourceRange('mapper', path)}
                  variant="panel"
                />
              </Suspense>
            </Box>
          ) : null}
        </Box>
        <Box
          aria-label="Resize workspace panel"
          aria-orientation="vertical"
          aria-valuemax={Math.round(studioWorkspaceMaximumRatio * 100)}
          aria-valuemin={Math.round(studioWorkspaceMinimumRatio * 100)}
          aria-valuenow={Math.round(workspaceRatio * 100)}
          aria-valuetext={`${Math.round(workspaceRatio * 100)} percent of the Studio window`}
          className="studio-left-workspace-resizer"
          component="div"
          onDoubleClick={resetWorkspaceRatio}
          onKeyDown={resizeWorkspaceWithKeyboard}
          onPointerCancel={finishWorkspacePointerResize}
          onPointerDown={resizeWorkspacePointerDown}
          onPointerMove={resizeWorkspacePointerMove}
          onPointerUp={finishWorkspacePointerResize}
          role="separator"
          tabIndex={workspaceState === 'closed' ? -1 : 0}
          title="Resize workspace panel; double-click to reset"
          sx={{
            bgcolor: 'background.paper',
            cursor: 'col-resize',
            display: {
              md: workspaceState === 'closed' ? 'none' : 'block',
              xs: 'none'
            },
            gridArea: '1 / 3',
            minHeight: 0,
            minWidth: 8,
            overflow: 'hidden',
            position: 'relative',
            touchAction: 'none',
            zIndex: 24,
            '&::after': {
              bgcolor: 'divider',
              bottom: 0,
              content: '""',
              left: 3,
              position: 'absolute',
              top: 0,
              width: 1
            },
            '&:hover::after, &:focus-visible::after, &:active::after': {
              bgcolor: 'primary.main'
            }
          }}
        />
      </Paper>
      <CanvasSurface
        alignSelection={controller.alignSelection}
        applyFormat={(object) => {
          if (!formatPainterSource) return false;
          const applied = controller.applyFormat(formatPainterSource, object);
          if (applied) setFormatPainterSource(undefined);
          return applied;
        }}
        canvasRef={canvasRef}
        canCopy={controller.canCopy}
        canCopyFormat={controller.canCopyFormat}
        canPaste={controller.canPaste}
        canSaveSelectionAsPreset={controller.canSaveSelectionAsPreset}
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
        formatPainterActive={Boolean(formatPainterSource)}
        deleteSelection={controller.deleteSelection}
        deleteLayer={controller.deleteLayer}
        distributeSelection={controller.distributeSelection}
        duplicateSelection={controller.duplicateSelection}
        moveObjects={controller.moveObjects}
        nudgeSelection={controller.nudgeSelection}
        onAnnouncement={controller.announce}
        onCancelFormatPainter={cancelFormatPainter}
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
        startFormatPainter={startFormatPainter}
        selectFromCanvas={controller.selectFromCanvas}
        selectObject={(object) => {
          controller.selectObject(object);
          if (workspaceView === 'mapper') return;
          selectWorkspace('edit');
        }}
        setSelection={controller.setSelection}
        setLayerMembership={controller.setLayerMembership}
        setRegionExpanded={controller.setRegionExpanded}
        snapshot={snapshot}
        stylesheetCandidate={controller.stylesheetCandidate}
        viewportPreferences={viewportPreferences}
        onExitPresentation={exitPresentation}
        onPaneSelect={() => selectWorkspace('viewport')}
        onCancelEdgeAuthoring={() => changeEdgeAuthoringTemplate(undefined)}
        onCompleteEdgeAuthoring={() => setEdgeAuthoringTemplate(undefined)}
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
                zIndex: 100
              }}
            >
              Opening export tools...
            </Box>
          }
        >
          <ExportPanel canvasElement={canvasRef.current} host={host} onAnnouncement={controller.announce} onClose={() => setExportOpen(false)} snapshot={snapshot} />
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

      <StyleCandidateResolutionDialog
        candidate={controller.stylesheetCandidate}
        context={pendingProjectAction?.context || 'This action'}
        onApply={() => void continuePendingProjectAction(false)}
        onCancel={() => setPendingProjectAction(undefined)}
        onDiscard={() => void continuePendingProjectAction(true)}
        open={Boolean(pendingProjectAction)}
      />

      <NormalizationReviewDialog onCancel={controller.cancelNormalizationReview} onConfirm={controller.confirmNormalizationReview} review={controller.normalizationReview} />

      <Paper
        className="studio-footer"
        component="footer"
        elevation={0}
        square
        sx={{
          alignItems: 'center',
          borderTop: 1,
          borderColor: 'divider',
          display: presentationMode ? 'none' : 'flex',
          gridArea: 'footer',
          justifyContent: 'space-between',
          px: studioSpace.space12
        }}
      >
        {controller.commandError ? (
          <Typography color="error" component="span" noWrap role="alert" variant="body2">
            {controller.commandError}
          </Typography>
        ) : null}
        {autosave.error ? (
          <Typography color="error" component="span" role="alert" variant="body2">
            Recovery save failed: {autosave.error.message}
            {autosave.error.retryable ? <StudioButton onClick={autosave.retry}>Retry</StudioButton> : null}
          </Typography>
        ) : null}
        <Typography className="studio-visually-hidden" aria-atomic="true" aria-live="polite" component="span">
          {controller.announcement}
        </Typography>
        <Typography component="span" variant="caption">
          {host.kind === 'vscode' ? 'VS Code workspace' : 'Browser project'}
        </Typography>
      </Paper>
    </Box>
  );
}
