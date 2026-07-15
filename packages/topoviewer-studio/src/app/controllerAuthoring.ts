import type { TopoDocument } from 'topoviewer';
import {
  authoringObjectDisplayName,
  authoringObjectSourcePath,
  authoringRegionBounds,
  findAuthoringObject,
  planAuthoringNodeMove,
  planAuthoringPositionDelta,
  planAuthoringRegionMove,
  planAuthoringResize,
  resolveAuthoringSelection,
  type AuthoringEditPlan,
  type AuthoringObjectSelection
} from 'topoviewer/authoring';
import type { StudioSelection } from '../contracts/project';
import { positionOf } from './controllerUtils';

interface PlannedStudioEdit {
  label: string;
  plan: AuthoringEditPlan;
  selection: StudioSelection;
}

function sizeTuple(value: unknown) {
  if (Array.isArray(value)) return { height: Number(value[1]), width: Number(value[0]) };
  if (!value || typeof value !== 'object') return undefined;
  const size = value as Record<string, unknown>;
  return { height: Number(size.height), width: Number(size.width) };
}

export function describeStudioSelection(document: TopoDocument, selection: StudioSelection[]) {
  if (!selection.length) return 'Selection cleared';
  if (selection.length === 1) {
    const selected = selection[0];
    return `${selected.kind} ${authoringObjectDisplayName(document, selected as AuthoringObjectSelection)} selected`;
  }
  const names = selection.slice(0, 3).map((selected) => (
    authoringObjectDisplayName(document, selected as AuthoringObjectSelection)
  ));
  return `${selection.length} objects selected: ${names.join(', ')}${selection.length > names.length ? ', and more' : ''}`;
}

export interface StudioQuickEditTarget {
  field: string;
  label: string;
  multiline: boolean;
  scopePath: Array<string | number>;
  selection: StudioSelection;
  value: string;
}

export function resolveStudioQuickEditTarget(
  document: TopoDocument,
  selection: StudioSelection
): StudioQuickEditTarget | undefined {
  const authoringSelection = selection as AuthoringObjectSelection;
  const object = findAuthoringObject(document, authoringSelection);
  const scopePath = authoringObjectSourcePath(document, authoringSelection);
  if (!object || !scopePath) return undefined;
  const source = object as Record<string, unknown>;
  const field = selection.kind === 'text'
    ? 'text'
    : selection.kind === 'callout'
      ? 'title'
      : selection.kind === 'shape' || selection.kind === 'linkDirection'
        ? 'label'
        : 'name';
  const fallback = selection.kind === 'text'
    ? source.label ?? source.name
    : selection.kind === 'callout'
      ? source.name
      : selection.kind === 'shape'
        ? source.name
        : selection.kind === 'linkDirection'
          ? source.name
          : source.label;
  return {
    field,
    label: selection.kind === 'linkDirection' ? 'direction label' : selection.kind,
    multiline: selection.kind === 'text',
    scopePath,
    selection,
    value: String(source[field] ?? fallback ?? '')
  };
}

export function planStudioObjectMove(
  document: TopoDocument,
  id: string,
  nextPosition: { x: number; y: number },
  dragDelta?: { x: number; y: number }
): PlannedStudioEdit | undefined {
  const selection = resolveAuthoringSelection(document, id);
  const object = findAuthoringObject(document, selection);
  const current = positionOf(object?.position);
  if (!selection || !current) return undefined;
  const plan = selection.kind === 'node'
    ? planAuthoringNodeMove(document, selection.id, nextPosition)
    : selection.kind === 'region'
      ? planAuthoringRegionMove(document, selection.id, dragDelta
          ? { x: current.x + dragDelta.x, y: current.y + dragDelta.y }
          : nextPosition)
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

export function planStudioSelectionResize(
  document: TopoDocument,
  selection: StudioSelection,
  delta: { width: number; height: number }
): PlannedStudioEdit | undefined {
  if (!['node', 'region', 'shape', 'callout', 'text'].includes(selection.kind)) return undefined;
  const authoringSelection = selection as AuthoringObjectSelection;
  const object = findAuthoringObject(document, authoringSelection);
  const origin = positionOf(object?.position);
  if (!object || !origin) return undefined;
  const source = object as Record<string, unknown>;
  const style = source.style && typeof source.style === 'object' && !Array.isArray(source.style)
    ? source.style as Record<string, unknown>
    : {};
  const tuple = sizeTuple(source.size);
  const regionBounds = selection.kind === 'region' ? authoringRegionBounds(document, selection.id) : undefined;
  const fallback = selection.kind === 'node'
    ? { height: 60, width: 82 }
    : selection.kind === 'region'
      ? { height: 180, width: 280 }
      : selection.kind === 'callout'
        ? { height: 88, width: 160 }
        : selection.kind === 'text'
          ? { height: 64, width: 220 }
        : { height: 96, width: 180 };
  const width = selection.kind === 'node' ? Number(style.width) : tuple?.width;
  const height = selection.kind === 'node' ? Number(style.height) : tuple?.height;
  const currentSize = {
    height: Number.isFinite(height) && Number(height) > 0 ? Number(height) : regionBounds?.height || fallback.height,
    width: Number.isFinite(width) && Number(width) > 0 ? Number(width) : regionBounds?.width || fallback.width
  };
  const minimum = selection.kind === 'node'
    ? { height: 36, width: 48 }
    : selection.kind === 'region'
      ? { height: 80, width: 120 }
      : { height: 24, width: 24 };
  const aspectLocked = selection.kind === 'node' && ['circle', 'square'].includes(String(style.shape || ''));
  const singleAxisDelta = delta.width === 0 ? delta.height : delta.height === 0 ? delta.width : undefined;
  const size = aspectLocked && singleAxisDelta !== undefined
    ? (() => {
        const side = Math.max(minimum.height, minimum.width, currentSize.height, currentSize.width) + singleAxisDelta;
        const boundedSide = Math.max(minimum.height, minimum.width, side);
        return { height: boundedSide, width: boundedSide };
      })()
    : {
        height: Math.max(minimum.height, currentSize.height + delta.height),
        width: Math.max(minimum.width, currentSize.width + delta.width)
      };
  return {
    label: `Resize ${authoringObjectDisplayName(document, authoringSelection)}`,
    plan: planAuthoringResize(document, authoringSelection, origin, size),
    selection
  };
}
