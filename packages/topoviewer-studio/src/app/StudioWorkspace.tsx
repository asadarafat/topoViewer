import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import type { StudioExternalChange, StudioHost } from '../contracts/host';
import type { StudioAsset, StudioDiagnostic, StudioDocumentKind, StudioProject, StudioRecoverySnapshot, StudioSelection } from '../contracts/project';
import { useStableActions } from '../contracts/useStableActions';
import type { StudioCanvasActions, StudioCanvasModel } from '../features/canvas/contracts';
import type { StudioEdgeAuthoringTemplateId } from '../features/palette/types';
import { studioDiagnosticSourceRange, studioStylesheetCandidateRangeAtPath, studioStylesheetCandidateRangeForSelection } from '../features/workspace/sourceDocumentModel';
import {
  defaultStudioWorkbenchPreferences,
  normalizeStudioWorkbenchPreferences,
  studioSourceFractionFromPointer,
  studioSourceMaximumFraction,
  studioSourceMinimumFraction,
  type StudioDockView,
  type StudioContextDrawer,
  type StudioPreviewMode,
  type StudioWorkbenchLayout,
  type StudioWorkspaceTarget
} from '../features/workspace/workbenchLayout';
import { defaultStudioViewportPreferences, normalizeStudioViewportPreferences, type StudioViewportPreferences } from '../features/viewport/types';
import type { StudioProjectLifecycleActions } from '../features/projects/ProjectMenu';
import { serializeStudioSourceDraftRecovery, serializeStylesheetCandidateRecovery } from '../session';
import { useStudioController } from './useStudioController';
import { useStudioAutosave } from './useStudioAutosave';
import { studioGeometry } from '../ui/studioTokens';
import { useStudioColorScheme } from '../ui/StudioThemeProvider';
import type { StudioOptionalSurface } from './StudioOptionalSurfaceBoundary';
import { StudioWorkspaceShell, type StudioWorkspaceShellActions, type StudioWorkspaceShellState } from './StudioWorkspaceShell';

const studioWorkspaceLayoutPreferenceKey = 'workspace-layout';
const studioSourceKeyboardStep = 0.02;

interface StudioWorkspaceProps {
  forceEditorFailure?: boolean;
  forceOptionalSurfaceFailure?: StudioOptionalSurface;
  host: StudioHost;
  onReload(): Promise<void>;
  project: StudioProject;
  projectLifecycle: StudioProjectLifecycleActions;
  recovery?: StudioRecoverySnapshot;
}

export function StudioWorkspace({ forceEditorFailure, forceOptionalSurfaceFailure, host, onReload, project, projectLifecycle, recovery }: StudioWorkspaceProps) {
  const controller = useStudioController({ host, onReload, project, recovery });
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const compactHeader = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeDocument, setActiveDocument] = useState<StudioDocumentKind>(defaultStudioWorkbenchPreferences.activeDocument);
  const [activeDock, setActiveDock] = useState<StudioDockView>(defaultStudioWorkbenchPreferences.activeDock);
  const [authoringOpen, setAuthoringOpen] = useState(defaultStudioWorkbenchPreferences.authoringOpen);
  const [contextDrawer, setContextDrawer] = useState<StudioContextDrawer>();
  const [dockCollapsed, setDockCollapsed] = useState(defaultStudioWorkbenchPreferences.dockCollapsed);
  const [navigatorOpen, setNavigatorOpen] = useState(defaultStudioWorkbenchPreferences.navigatorOpen);
  const [mobileNavigatorOpen, setMobileNavigatorOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<StudioPreviewMode>(defaultStudioWorkbenchPreferences.previewMode);
  const [previewAvailableWidth, setPreviewAvailableWidth] = useState(0);
  const [sourceFraction, setSourceFraction] = useState(defaultStudioWorkbenchPreferences.sourceFraction);
  const [workbenchLayout, setWorkbenchLayout] = useState<StudioWorkbenchLayout>(defaultStudioWorkbenchPreferences.layout);
  const [workspaceLayoutReady, setWorkspaceLayoutReady] = useState(false);
  const [visitedContextDrawers, setVisitedContextDrawers] = useState<Set<StudioContextDrawer>>(() => new Set());
  const [sourceNavigation, setSourceNavigation] = useState<{
    document: StudioDocumentKind;
    id: number;
    range: ReturnType<typeof controller.sourceRange>;
  }>();
  const [presentationMode, setPresentationMode] = useState(false);
  const [canvasFitViewRequestId, setCanvasFitViewRequestId] = useState(0);
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
  const [selectedAsset, setSelectedAsset] = useState<StudioAsset>();
  const [optionalSurfaceRecovered, setOptionalSurfaceRecovered] = useState(false);
  const [pendingProjectAction, setPendingProjectAction] = useState<{
    action(): Promise<void>;
    context: string;
  }>();
  const canvasRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const splitRef = useRef<HTMLElement>(null);
  const sourceFractionRef = useRef(sourceFraction);
  const sourceNavigationSequence = useRef(0);
  const pendingMobileContextDrawerRef = useRef<StudioContextDrawer>();
  const viewportPreferencesEditedRef = useRef(false);
  const presentationTriggerRef = useRef<HTMLButtonElement>(null);
  const { snapshot } = controller;
  const topologyDraftBlocked = Boolean(snapshot.invalidDrafts.topology);
  const candidateSnapshot = useSyncExternalStore(controller.stylesheetCandidate.subscribe, controller.stylesheetCandidate.getSnapshot, controller.stylesheetCandidate.getSnapshot);
  const snapshotRef = useRef(snapshot);
  const autosave = useStudioAutosave(host, snapshot, controller.sourceDrafts, controller.stylesheetCandidate);
  const appearance = useStudioColorScheme();
  const independentDrawers = desktop && previewAvailableWidth >= studioGeometry.independentDrawerMinimumPreviewWidth;
  const rightContextVisible = contextDrawer === 'properties' || contextDrawer === 'mapper';
  const desktopAuthoringVisible = desktop && authoringOpen && (independentDrawers || !rightContextVisible);
  const desktopContextVisible = desktop && rightContextVisible;
  const mobileContextVisible = !desktop && Boolean(contextDrawer);
  const shouldForceOptionalSurfaceFailure = (surface: StudioOptionalSurface) => forceOptionalSurfaceFailure === surface && !optionalSurfaceRecovered;
  const recoverOptionalSurface = () => setOptionalSurfaceRecovered(true);
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
    sourceFractionRef.current = sourceFraction;
  }, [sourceFraction]);

  useEffect(() => {
    const preview = canvasRef.current;
    if (!preview || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setPreviewAvailableWidth(preview.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(preview);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!topologyDraftBlocked) return;
    setEdgeAuthoringTemplate(undefined);
    setFormatPainterSource(undefined);
  }, [topologyDraftBlocked]);

  useEffect(() => {
    let active = true;
    void host.readPreference<unknown>(studioWorkspaceLayoutPreferenceKey).then((result) => {
      if (!active) return;
      if (result.ok && result.value !== undefined) {
        const preferences = normalizeStudioWorkbenchPreferences(result.value);
        setActiveDocument(preferences.activeDocument);
        setActiveDock(preferences.activeDock);
        setAuthoringOpen(preferences.authoringOpen);
        setContextDrawer(preferences.contextDrawer);
        setDockCollapsed(preferences.dockCollapsed);
        setNavigatorOpen(preferences.navigatorOpen);
        setPreviewMode(preferences.previewMode);
        setSourceFraction(preferences.sourceFraction);
        setWorkbenchLayout(preferences.layout);
        setVisitedContextDrawers(new Set([...(preferences.authoringOpen ? (['add'] as const) : []), ...(preferences.contextDrawer ? [preferences.contextDrawer] : [])]));
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
          activeDocument,
          activeDock,
          authoringOpen,
          contextDrawer,
          dockCollapsed,
          layout: workbenchLayout,
          navigatorOpen,
          previewMode,
          sourceFraction
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
  }, [activeDocument, activeDock, authoringOpen, contextDrawer, dockCollapsed, host, navigatorOpen, previewMode, sourceFraction, workbenchLayout, workspaceLayoutReady]);

  useEffect(() => {
    if (!desktop || contextDrawer !== 'add') return;
    setAuthoringOpen(true);
    setContextDrawer(undefined);
  }, [contextDrawer, desktop]);

  useEffect(() => {
    if (desktop || !authoringOpen || contextDrawer) return;
    setContextDrawer('add');
  }, [authoringOpen, contextDrawer, desktop]);

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
        if (current.status === 'saved' && !controller.sourceDrafts.getSnapshot().dirty && !controller.stylesheetCandidate.getSnapshot().dirty && event.kind === 'changed') {
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
      sourceDrafts: serializeStudioSourceDraftRecovery(controller.sourceDrafts.getSnapshot()),
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

  function createFromPalette(...request: Parameters<typeof controller.createPaletteObject>) {
    const created = controller.createPaletteObject(...request);
    if (created) {
      const completeCreation = () => {
        revealProperties();
        canvasRef.current?.focus();
      };
      if (request[1]) {
        requestAnimationFrame(() => requestAnimationFrame(completeCreation));
      } else {
        completeCreation();
      }
    }
    return created;
  }

  function changeEdgeAuthoringTemplate(templateId?: StudioEdgeAuthoringTemplateId) {
    if (templateId) setFormatPainterSource(undefined);
    setEdgeAuthoringTemplate(templateId);
    if (!desktop) {
      if (templateId) setContextDrawer(undefined);
      else visitContextDrawer('add');
    }
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
    controller.setSelection(snapshot.selection);
    setPresentationMode(false);
    requestAnimationFrame(() => {
      setCanvasFitViewRequestId((requestId) => requestId + 1);
      presentationTriggerRef.current?.focus();
    });
  }

  function enterPresentation() {
    setEdgeAuthoringTemplate(undefined);
    setMobileNavigatorOpen(false);
    controller.setSelection(snapshot.selection);
    setPresentationMode(true);
  }

  function visitContextDrawer(drawer: StudioContextDrawer) {
    setVisitedContextDrawers((current) => {
      if (current.has(drawer)) return current;
      const next = new Set(current);
      next.add(drawer);
      return next;
    });
    if (drawer === 'add') {
      setAuthoringOpen(true);
      if (!desktop) setContextDrawer('add');
      else if (!independentDrawers) setContextDrawer(undefined);
      return;
    }
    setContextDrawer(drawer);
  }

  function closeAuthoring() {
    setAuthoringOpen(false);
    setContextDrawer((drawer) => (drawer === 'add' ? undefined : drawer));
  }

  function closeContextDrawer() {
    setContextDrawer(undefined);
  }

  function openWorkspace(view: StudioWorkspaceTarget) {
    if (view === 'project') {
      pendingMobileContextDrawerRef.current = undefined;
      if (desktop) setNavigatorOpen(true);
      else {
        setContextDrawer(undefined);
        setMobileNavigatorOpen(true);
      }
      return;
    }
    if (!desktop && mobileNavigatorOpen) {
      pendingMobileContextDrawerRef.current = view;
      setMobileNavigatorOpen(false);
      return;
    }
    visitContextDrawer(view);
  }

  function finishMobileNavigatorExit() {
    const pending = pendingMobileContextDrawerRef.current;
    if (!pending) return;
    pendingMobileContextDrawerRef.current = undefined;
    visitContextDrawer(pending);
  }

  function revealProperties() {
    if (contextDrawer === 'mapper') return;
    visitContextDrawer('properties');
  }

  function revealSourceWorkspace() {
    if (!desktop) {
      pendingMobileContextDrawerRef.current = undefined;
      setContextDrawer(undefined);
      setMobileNavigatorOpen(false);
      setWorkbenchLayout('source');
      return;
    }
    if (workbenchLayout === 'preview') setWorkbenchLayout('split');
  }

  function openCodeDocument(kind: StudioDocumentKind, path?: Array<string | number>) {
    setActiveDocument(kind);
    revealSourceWorkspace();
    if (path) {
      const range =
        kind === 'stylesheet'
          ? studioStylesheetCandidateRangeForSelection(candidateSnapshot, snapshot.selection) || studioStylesheetCandidateRangeAtPath(candidateSnapshot, path)
          : controller.sourceRange(kind, path);
      if (range) {
        setSourceNavigation({
          document: kind,
          id: ++sourceNavigationSequence.current,
          range
        });
      }
    }
  }

  function openDiagnostic(diagnostic: StudioDiagnostic) {
    setActiveDocument(diagnostic.document);
    revealSourceWorkspace();
    const documentText =
      diagnostic.document === 'stylesheet' ? candidateSnapshot.candidateText : snapshot.invalidDrafts[diagnostic.document]?.text || snapshot.project.documents[diagnostic.document]?.text || '';
    const range = (diagnostic.path ? controller.sourceRange(diagnostic.document, diagnostic.path) : undefined) || studioDiagnosticSourceRange(diagnostic, documentText);
    if (!range) return;
    setSourceNavigation({
      document: diagnostic.document,
      id: ++sourceNavigationSequence.current,
      range
    });
  }

  function applySourceFraction(value: number, separator?: HTMLElement) {
    const fraction = Math.min(studioSourceMaximumFraction, Math.max(studioSourceMinimumFraction, value));
    sourceFractionRef.current = fraction;
    splitRef.current?.style.setProperty('grid-template-columns', `${fraction}fr var(--studio-resizer-width) ${1 - fraction}fr`);
    separator?.setAttribute('aria-valuenow', String(Math.round(fraction * 100)));
    separator?.setAttribute('aria-valuetext', `${Math.round(fraction * 100)} percent source`);
    return fraction;
  }

  function resizeSourcePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || workbenchLayout !== 'split') return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function resizeSourcePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = splitRef.current?.getBoundingClientRect();
    if (!bounds) return;
    applySourceFraction(studioSourceFractionFromPointer(event.clientX, bounds.left, bounds.width), event.currentTarget);
  }

  function finishSourcePointerResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setSourceFraction(sourceFractionRef.current);
  }

  function resizeSourceWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    let next: number | undefined;
    if (event.key === 'ArrowLeft') next = sourceFractionRef.current - studioSourceKeyboardStep;
    if (event.key === 'ArrowRight') next = sourceFractionRef.current + studioSourceKeyboardStep;
    if (event.key === 'Home') next = studioSourceMinimumFraction;
    if (event.key === 'End') next = studioSourceMaximumFraction;
    if (next === undefined) return;
    event.preventDefault();
    setSourceFraction(applySourceFraction(next, event.currentTarget));
  }

  function resetSourceFraction(event: ReactPointerEvent<HTMLDivElement>) {
    setSourceFraction(applySourceFraction(defaultStudioWorkbenchPreferences.sourceFraction, event.currentTarget));
  }

  async function saveProject() {
    const sourceDraftDocument = (['topology', 'mapper'] as const).find((document) => controller.sourceDrafts.getSnapshot().drafts[document] !== undefined);
    const saved = await controller.save();
    if (saved === false && sourceDraftDocument) {
      openCodeDocument(sourceDraftDocument);
    } else if (saved === false && controller.stylesheetCandidate.getSnapshot().status === 'invalid-dirty') {
      openCodeDocument('stylesheet');
    }
  }

  async function reloadProject() {
    if (await controller.flushRecovery()) {
      await controller.reload();
    }
  }

  function openExportPanel() {
    const sourceDraftDocument = (['topology', 'mapper'] as const).find((document) => controller.sourceDrafts.getSnapshot().drafts[document] !== undefined);
    if (sourceDraftDocument) {
      openCodeDocument(sourceDraftDocument);
      controller.announce('Apply or revert the source draft before exporting');
      return;
    }
    if (controller.applyStylesheetCandidate()) {
      setExportOpen(true);
      return;
    }
    openCodeDocument('stylesheet');
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

  function searchPreview(query: string) {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return;
    const document = snapshot.projection.document;
    const visibleName = (item: { labels?: Record<string, string | number | boolean> }) => (typeof item.labels?.name === 'string' ? item.labels.name : undefined);
    const entries: Array<{
      id: string;
      kind: StudioSelection['kind'];
      name?: string;
    }> = [
      ...(document.graph?.layers || []).map((item) => ({
        id: item.id,
        kind: 'layer' as const,
        name: visibleName(item)
      })),
      ...(document.graph?.nodes || []).map((item) => ({
        id: item.id,
        kind: 'node' as const,
        name: visibleName(item)
      })),
      ...(document.graph?.links || []).map((item) => ({
        id: item.id,
        kind: 'link' as const,
        name: visibleName(item)
      })),
      ...(document.graph?.paths || []).map((item) => ({
        id: item.id,
        kind: 'path' as const,
        name: visibleName(item)
      })),
      ...(document.graph?.regions || []).map((item) => ({
        id: item.id,
        kind: 'region' as const,
        name: visibleName(item)
      })),
      ...(document.diagram?.shapes || []).map((item) => ({
        id: item.id,
        kind: 'shape' as const,
        name: visibleName(item)
      })),
      ...(document.diagram?.callouts || []).map((item) => ({
        id: item.id,
        kind: 'callout' as const,
        name: item.title || visibleName(item)
      })),
      ...(document.diagram?.texts || []).map((item) => ({
        id: item.id,
        kind: 'text' as const,
        name: item.text
      }))
    ];
    const match = entries.find((entry) => entry.id.toLocaleLowerCase().includes(normalized) || entry.name?.toLocaleLowerCase().includes(normalized));
    if (!match) {
      controller.announce(`No topology object matches ${query.trim()}`);
      return;
    }
    controller.setSelection([{ id: match.id, kind: match.kind }]);
    revealProperties();
    controller.announce(`Selected ${match.id}`);
  }

  const diagnostics = useMemo(
    () => [
      ...snapshot.projection.diagnostics,
      ...Object.values(snapshot.invalidDrafts).flatMap((draft) => draft?.diagnostics || []),
      ...candidateSnapshot.diagnostics.filter(
        (diagnostic) => !snapshot.projection.diagnostics.some((existing) => existing.code === diagnostic.code && existing.document === diagnostic.document && existing.line === diagnostic.line)
      )
    ],
    [candidateSnapshot.diagnostics, snapshot.invalidDrafts, snapshot.projection.diagnostics]
  );
  const nodeCount = snapshot.projection.document.graph?.nodes?.length || 0;
  const linkCount = snapshot.projection.document.graph?.links?.length || 0;
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length;
  const activeDocumentPath = snapshot.project.documents[activeDocument]?.path || `${activeDocument}.yaml`;
  const breadcrumb = snapshot.selection.length === 1 ? `${activeDocumentPath} / ${snapshot.selection[0].kind} / ${snapshot.selection[0].id}` : activeDocumentPath;
  const renderedWorkbenchLayout: StudioWorkbenchLayout = desktop || workbenchLayout !== 'split' ? workbenchLayout : 'preview';
  const renderedPreviewMode: StudioPreviewMode = topologyDraftBlocked ? 'inspect' : previewMode;
  const viewportInsets = useMemo(
    () => ({
      left: desktopAuthoringVisible ? studioGeometry.objectDrawerWidth : 0,
      right: desktopContextVisible ? studioGeometry.panelMinimumWidth : 0
    }),
    [desktopAuthoringVisible, desktopContextVisible]
  );

  const canvasModel = useMemo<StudioCanvasModel>(
    () => ({
      canvasRef,
      canCopy: controller.canCopy,
      canCopyFormat: controller.canCopyFormat,
      canPaste: controller.canPaste,
      canSaveSelectionAsPreset: controller.canSaveSelectionAsPreset,
      edgeAuthoringTemplate,
      fitViewRequestId: canvasFitViewRequestId,
      formatPainterActive: Boolean(formatPainterSource),
      hiddenLayerIds,
      interactionMode: renderedPreviewMode,
      presentationMode,
      snapshot,
      stylesheetCandidate: controller.stylesheetCandidate,
      viewportInsets,
      viewportPreferences
    }),
    [
      controller.canCopy,
      controller.canCopyFormat,
      controller.canPaste,
      controller.canSaveSelectionAsPreset,
      controller.stylesheetCandidate,
      canvasFitViewRequestId,
      edgeAuthoringTemplate,
      formatPainterSource,
      hiddenLayerIds,
      renderedPreviewMode,
      presentationMode,
      snapshot,
      viewportInsets,
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
    createObject: createFromPalette,
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
      revealProperties();
    },
    onExitPresentation: exitPresentation,
    onObjectActivate: revealProperties,
    onPaneSelect: () => {
      controller.setSelection([]);
      revealProperties();
    },
    onViewportZoomChange: setCanvasZoom,
    pasteClipboard: controller.pasteClipboard,
    previewRegionForNode: controller.previewRegionForNode,
    proposeMapperMetric: controller.proposeMapperMetric,
    releaseNodeFromRegion: controller.releaseNodeFromRegion,
    resizeObject: controller.resizeObject,
    resizeSelection: controller.resizeSelection,
    saveSelectionAsPreset: controller.saveSelectionAsPreset,
    selectFromCanvas: (change) => {
      controller.selectFromCanvas(change);
    },
    selectObject: (object) => {
      controller.selectObject(object);
    },
    setRegionExpanded: controller.setRegionExpanded,
    startFormatPainter
  });
  const sourceWorkspaceActions = useStableActions({
    onApplySource: controller.applySourceDraft,
    onApplyStyle: controller.applyStylesheetCandidate,
    onCreateMapper: () => openWorkspace('mapper'),
    onDiscardInvalid: controller.discardInvalidDraft,
    onRevertStyle: controller.revertStylesheetCandidate,
    onSelectSourceOffset: controller.selectSourceOffset
  });

  const shellState: StudioWorkspaceShellState = {
    activeDocument,
    activeDock,
    authoringOpen,
    breadcrumb,
    candidateSnapshot,
    canvasZoom,
    commandPaletteOpen,
    compactHeader,
    contextDrawer,
    desktop,
    desktopAuthoringVisible,
    desktopContextVisible,
    diagnostics,
    dockCollapsed,
    edgeAuthoringTemplate,
    errorCount,
    exportOpen,
    externalChange,
    externalChangeError,
    externalChangeLoading,
    externalDiskProject,
    headerActionsAnchor,
    hiddenLayerIds,
    linkCount,
    mobileContextVisible,
    mobileNavigatorOpen,
    navigatorOpen,
    nodeCount,
    pendingProjectAction,
    presentationMode,
    renderedPreviewMode,
    renderedWorkbenchLayout,
    selectedAsset,
    sourceFraction,
    sourceNavigation,
    topologyDraftBlocked,
    viewportPreferences,
    visitedContextDrawers
  };
  const shellActions: StudioWorkspaceShellActions = {
    changeEdgeAuthoringTemplate,
    changeViewportPreferences,
    closeAuthoring,
    closeContextDrawer,
    continuePendingProjectAction,
    createFromPalette,
    enterPresentation,
    finishMobileNavigatorExit,
    finishSourcePointerResize,
    keepExternalDraft,
    loadExternalProject,
    openCodeDocument,
    openDiagnostic,
    openExportPanel,
    openWorkspace,
    recoverOptionalSurface,
    reloadExternalProject,
    reloadProject,
    resetSourceFraction,
    resizeSourcePointerDown,
    resizeSourcePointerMove,
    resizeSourceWithKeyboard,
    saveProject,
    searchPreview,
    setActiveDock,
    setCommandPaletteOpen,
    setContextDrawer,
    setDockCollapsed,
    setExportOpen,
    setHeaderActionsAnchor,
    setHiddenLayerIds,
    setMobileNavigatorOpen,
    setNavigatorOpen,
    setPendingProjectAction,
    setPreviewMode,
    setSelectedAsset,
    setWorkbenchLayout,
    shellKeyDown,
    shouldForceOptionalSurfaceFailure
  };

  return (
    <StudioWorkspaceShell
      actions={shellActions}
      appearance={appearance}
      autosave={autosave}
      canvasActions={canvasActions}
      canvasModel={canvasModel}
      controller={controller}
      forceEditorFailure={forceEditorFailure}
      guardedProjectLifecycle={guardedProjectLifecycle}
      host={host}
      refs={{
        canvas: canvasRef,
        presentationTrigger: presentationTriggerRef,
        shell: shellRef,
        split: splitRef
      }}
      sourceWorkspaceActions={sourceWorkspaceActions}
      state={shellState}
    />
  );
}
