import { applyStyle, type TopoDocument, type TopoViewerNodePositionChange } from 'topoviewer';
import {
  authoringObjectDisplayName,
  authoringRegionBounds,
  findAuthoringObject,
  planAuthoringNodeMove,
  planAuthoringPositionDelta,
  planAuthoringRegionMove,
  planAuthoringResize,
  resolveStyleProvenance,
  resolveAuthoringSelection,
  type AuthoringEditPlan,
  type AuthoringObjectSelection
} from 'topoviewer/authoring';
import { studioPosition } from '../../contracts/geometry';
import type { StudioSelection } from '../../contracts/project';

export type StudioResizeAppearance = { height: number; width: number } & Record<string, unknown>;

interface PlannedStudioEdit {
  appearance?: StudioResizeAppearance;
  label: string;
  plan: AuthoringEditPlan;
  selection: StudioSelection;
}

interface PlannedStudioSelectionEdit {
  label: string;
  plan: AuthoringEditPlan;
  selection: StudioSelection[];
}

export function resolveStudioResizeAppearance(
  document: TopoDocument,
  selection: StudioSelection,
  size: { height: number; width: number }
): StudioResizeAppearance | undefined {
  return ['node', 'region', 'shape', 'callout', 'text'].includes(selection.kind) ? size : undefined;
}

export function describeStudioSelection(document: TopoDocument, selection: StudioSelection[]) {
  if (!selection.length) return 'Selection cleared';
  if (selection.length === 1) {
    const selected = selection[0];
    return `${selected.kind} ${authoringObjectDisplayName(document, selected as AuthoringObjectSelection)} selected`;
  }
  const names = selection.slice(0, 3).map((selected) => authoringObjectDisplayName(document, selected as AuthoringObjectSelection));
  return `${selection.length} objects selected: ${names.join(', ')}${selection.length > names.length ? ', and more' : ''}`;
}

export function planStudioObjectMove(document: TopoDocument, id: string, nextPosition: { x: number; y: number }, dragDelta?: { x: number; y: number }): PlannedStudioEdit | undefined {
  const selection = resolveAuthoringSelection(document, id);
  const object = findAuthoringObject(document, selection);
  const regionBounds = selection?.kind === 'region' ? authoringRegionBounds(document, selection.id) : undefined;
  const current = studioPosition(object?.position) || (regionBounds ? { x: regionBounds.x, y: regionBounds.y } : undefined);
  if (!selection || !current) return undefined;
  const plan =
    selection.kind === 'node'
      ? planAuthoringNodeMove(document, selection.id, nextPosition)
      : selection.kind === 'region'
        ? planAuthoringRegionMove(document, selection.id, dragDelta ? { x: current.x + dragDelta.x, y: current.y + dragDelta.y } : nextPosition)
        : planAuthoringPositionDelta(document, [selection], {
            x: nextPosition.x - current.x,
            y: nextPosition.y - current.y
          });
  return {
    label: `Move ${authoringObjectDisplayName(document, selection)}`,
    plan,
    selection: selection as StudioSelection
  };
}

function mergeMovePlans(plans: AuthoringEditPlan[]): AuthoringEditPlan {
  const updates = new Map<string, AuthoringEditPlan['updates'][number]>();
  plans.forEach((plan) => {
    plan.updates.forEach((update) => {
      const key = JSON.stringify(update.path);
      const existing = updates.get(key);
      if (existing && JSON.stringify(existing.value) !== JSON.stringify(update.value)) {
        throw new Error(`Selected objects produce conflicting movement for ${update.path.join('.')}.`);
      }
      updates.set(key, update);
    });
  });
  return {
    insertions: plans.flatMap((plan) => plan.insertions),
    removals: plans.flatMap((plan) => plan.removals),
    updates: [...updates.values()]
  };
}

function selectedRegionCoverage(document: TopoDocument, regionIds: Set<string>) {
  const regions = document.graph?.regions || [];
  const regionById = new Map(regions.map((region) => [region.id, region]));
  const childrenByParent = new Map<string, typeof regions>();
  regions.forEach((region) => {
    if (!region.parent) return;
    const children = childrenByParent.get(region.parent) || [];
    children.push(region);
    childrenByParent.set(region.parent, children);
  });
  const selectedAncestor = (regionId: string) => {
    const visited = new Set<string>();
    let parent = regionById.get(regionId)?.parent;
    while (parent && !visited.has(parent)) {
      if (regionIds.has(parent)) return true;
      visited.add(parent);
      parent = regionById.get(parent)?.parent;
    }
    return false;
  };
  const topLevelRegionIds = [...regionIds].filter((regionId) => !selectedAncestor(regionId));
  const coveredIds = new Set<string>();
  const cover = (regionId: string) => {
    if (coveredIds.has(regionId)) return;
    coveredIds.add(regionId);
    const region = regionById.get(regionId);
    region?.members?.forEach((memberId) => coveredIds.add(memberId));
    childrenByParent.get(regionId)?.forEach((candidate) => cover(candidate.id));
  };
  topLevelRegionIds.forEach(cover);
  return { coveredIds, topLevelRegionIds };
}

export function planStudioSelectionMove(
  document: TopoDocument,
  selection: StudioSelection[],
  changes: TopoViewerNodePositionChange[]
): PlannedStudioSelectionEdit | undefined {
  if (!changes.length) return undefined;
  if (changes.length === 1) {
    const change = changes[0];
    const planned = planStudioObjectMove(document, change.id, change.position, change.delta);
    return planned ? { ...planned, selection: [planned.selection] } : undefined;
  }

  const changeById = new Map(changes.map((change) => [change.id, change]));
  const movedSelections = changes.flatMap((change) => {
    const candidate = resolveAuthoringSelection(document, change.id);
    return candidate ? [candidate as StudioSelection] : [];
  });
  const selectionKeys = new Set(selection.map((candidate) => `${candidate.kind}:${candidate.id}`));
  const nextSelection = movedSelections.every((candidate) => selectionKeys.has(`${candidate.kind}:${candidate.id}`))
    ? selection
    : movedSelections;
  const movedRegionIds = new Set(movedSelections.filter((candidate) => candidate.kind === 'region').map((candidate) => candidate.id));
  const { coveredIds, topLevelRegionIds } = selectedRegionCoverage(document, movedRegionIds);
  const plans: AuthoringEditPlan[] = [];

  topLevelRegionIds.forEach((regionId) => {
    const change = changeById.get(regionId);
    if (!change) return;
    const planned = planStudioObjectMove(document, regionId, change.position, change.delta);
    if (planned) plans.push(planned.plan);
  });

  movedSelections.forEach((candidate) => {
    if (candidate.kind === 'region' || coveredIds.has(candidate.id)) return;
    const change = changeById.get(candidate.id);
    const object = findAuthoringObject(document, candidate as AuthoringObjectSelection);
    const current = studioPosition(object?.position);
    if (!change || !current) return;
    const delta = change.delta || {
      x: change.position.x - current.x,
      y: change.position.y - current.y
    };
    plans.push(planAuthoringPositionDelta(document, [candidate as AuthoringObjectSelection], delta));
  });

  if (!plans.length) return undefined;
  return {
    label: `Move ${movedSelections.length} objects`,
    plan: mergeMovePlans(plans),
    selection: nextSelection
  };
}

export function planStudioSelectionResize(document: TopoDocument, selection: StudioSelection, delta: { width: number; height: number }): PlannedStudioEdit | undefined {
  if (!['node', 'region', 'shape', 'callout', 'text'].includes(selection.kind)) return undefined;
  const authoringSelection = selection as AuthoringObjectSelection;
  const object = findAuthoringObject(document, authoringSelection);
  const origin = studioPosition(object?.position);
  if (!object || !origin) return undefined;
  const effectiveStyle = selection.kind === 'node'
    ? Object.fromEntries(resolveStyleProvenance('node', object as Parameters<typeof resolveStyleProvenance>[1], document).map((field) => [field.key, field.effectiveValue]))
    : applyStyle(selection.kind as 'region' | 'shape' | 'callout' | 'text', object as Parameters<typeof applyStyle>[1], document);
  const regionBounds = selection.kind === 'region' ? authoringRegionBounds(document, selection.id) : undefined;
  const fallback =
    selection.kind === 'node'
      ? { height: 60, width: 82 }
      : selection.kind === 'region'
        ? { height: 180, width: 280 }
        : selection.kind === 'callout'
          ? { height: 88, width: 160 }
          : selection.kind === 'text'
            ? { height: 64, width: 220 }
            : { height: 96, width: 180 };
  const width = Number(effectiveStyle.width);
  const height = Number(effectiveStyle.height);
  const currentSize = {
    height: Number.isFinite(height) && Number(height) > 0 ? Number(height) : regionBounds?.height || fallback.height,
    width: Number.isFinite(width) && Number(width) > 0 ? Number(width) : regionBounds?.width || fallback.width
  };
  const minimum = selection.kind === 'node' ? { height: 36, width: 48 } : selection.kind === 'region' ? { height: 80, width: 120 } : { height: 24, width: 24 };
  const aspectLocked = selection.kind === 'node' && ['circle', 'square'].includes(String(effectiveStyle.shape || ''));
  const singleAxisDelta = delta.width === 0 ? delta.height : delta.height === 0 ? delta.width : undefined;
  const size =
    aspectLocked && singleAxisDelta !== undefined
      ? (() => {
          const side = Math.max(minimum.height, minimum.width, currentSize.height, currentSize.width) + singleAxisDelta;
          const boundedSide = Math.max(minimum.height, minimum.width, side);
          return { height: boundedSide, width: boundedSide };
        })()
      : {
          height: Math.max(minimum.height, currentSize.height + delta.height),
          width: Math.max(minimum.width, currentSize.width + delta.width)
        };
  const appearance = resolveStudioResizeAppearance(document, selection, size);
  return {
    ...(appearance ? { appearance } : {}),
    label: `Resize ${authoringObjectDisplayName(document, authoringSelection)}`,
    plan: planAuthoringResize(document, authoringSelection, origin, size),
    selection
  };
}
