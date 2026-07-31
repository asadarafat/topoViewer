import type { StudioDocumentKind } from '../../contracts/project';

export type StudioWorkbenchLayout = 'preview' | 'source' | 'split';
export type StudioContextDrawer = 'add' | 'mapper' | 'properties';
export type StudioWorkspaceTarget = StudioContextDrawer | 'project';
export type StudioDockView = 'changes' | 'history' | 'host' | 'problems' | 'selection';
export type StudioPreviewMode = 'edit' | 'inspect';

export interface StudioWorkbenchPreferences {
  activeDocument: StudioDocumentKind;
  activeDock: StudioDockView;
  authoringOpen: boolean;
  contextDrawer?: StudioContextDrawer;
  dockCollapsed: boolean;
  layout: StudioWorkbenchLayout;
  navigatorOpen: boolean;
  previewMode: StudioPreviewMode;
  sourceFraction: number;
}

export const studioSourceMinimumFraction = 0.2;
export const studioSourceMaximumFraction = 0.5;
export const studioSourceDefaultFraction = 0.25;

export const defaultStudioWorkbenchPreferences: StudioWorkbenchPreferences = {
  activeDocument: 'topology',
  activeDock: 'problems',
  authoringOpen: false,
  contextDrawer: undefined,
  dockCollapsed: false,
  layout: 'split',
  navigatorOpen: true,
  previewMode: 'edit',
  sourceFraction: studioSourceDefaultFraction
};

const documents = new Set<StudioDocumentKind>(['mapper', 'stylesheet', 'topology']);
const dockViews = new Set<StudioDockView>(['changes', 'history', 'host', 'problems', 'selection']);
const drawers = new Set<StudioContextDrawer>(['add', 'mapper', 'properties']);
const layouts = new Set<StudioWorkbenchLayout>(['preview', 'source', 'split']);
const previewModes = new Set<StudioPreviewMode>(['edit', 'inspect']);

export function normalizeStudioSourceFraction(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return studioSourceDefaultFraction;
  return Math.min(studioSourceMaximumFraction, Math.max(studioSourceMinimumFraction, value));
}

export function studioSourceFractionFromPointer(clientX: number, workbenchLeft: number, workbenchWidth: number): number {
  if (!Number.isFinite(workbenchWidth) || workbenchWidth <= 0) return studioSourceDefaultFraction;
  return normalizeStudioSourceFraction((clientX - workbenchLeft) / workbenchWidth);
}

export function normalizeStudioWorkbenchPreferences(value: unknown): StudioWorkbenchPreferences {
  const candidate = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const legacyDrawer =
    candidate.panelOpen === true && drawers.has(candidate.workspaceView as StudioContextDrawer)
      ? (candidate.workspaceView as StudioContextDrawer)
      : undefined;

  return {
    activeDocument: documents.has(candidate.activeDocument as StudioDocumentKind)
      ? (candidate.activeDocument as StudioDocumentKind)
      : defaultStudioWorkbenchPreferences.activeDocument,
    activeDock: dockViews.has(candidate.activeDock as StudioDockView)
      ? (candidate.activeDock as StudioDockView)
      : defaultStudioWorkbenchPreferences.activeDock,
    authoringOpen:
      typeof candidate.authoringOpen === 'boolean'
        ? candidate.authoringOpen
        : candidate.contextDrawer === 'add' || candidate.authoringPinned === true,
    contextDrawer: drawers.has(candidate.contextDrawer as StudioContextDrawer)
      ? (candidate.contextDrawer as StudioContextDrawer)
      : legacyDrawer,
    dockCollapsed:
      typeof candidate.dockCollapsed === 'boolean'
        ? candidate.dockCollapsed
        : defaultStudioWorkbenchPreferences.dockCollapsed,
    layout: layouts.has(candidate.layout as StudioWorkbenchLayout)
      ? (candidate.layout as StudioWorkbenchLayout)
      : defaultStudioWorkbenchPreferences.layout,
    navigatorOpen:
      typeof candidate.navigatorOpen === 'boolean'
        ? candidate.navigatorOpen
        : defaultStudioWorkbenchPreferences.navigatorOpen,
    previewMode: previewModes.has(candidate.previewMode as StudioPreviewMode)
      ? (candidate.previewMode as StudioPreviewMode)
      : defaultStudioWorkbenchPreferences.previewMode,
    sourceFraction: normalizeStudioSourceFraction(candidate.sourceFraction)
  };
}
