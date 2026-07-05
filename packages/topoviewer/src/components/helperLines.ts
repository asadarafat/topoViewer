import type { TopoViewerProps } from '../core/types';

export interface HelperLinesOptions {
  enabled: boolean;
  snap: boolean;
  threshold: number;
  showMidpoints: boolean;
  candidateLimit: number;
  midpointCandidateLimit: number;
}

export interface HelperLineBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hidden?: boolean;
  draggable?: boolean;
  type?: string;
}

export interface HelperLinePosition {
  value: number;
  kind: 'edge' | 'center' | 'midpoint';
}

export interface HelperLineState {
  vertical?: HelperLinePosition;
  horizontal?: HelperLinePosition;
}

export interface HelperLinePositionChange {
  id?: string;
  type: string;
  position?: { x: number; y: number };
  dragging?: boolean;
}

export interface HelperLineNodeLike {
  id?: string;
  type?: string;
  hidden?: boolean;
  draggable?: boolean;
  width?: number | null;
  height?: number | null;
  measured?: {
    width?: number | null;
    height?: number | null;
  };
  position?: {
    x?: number | null;
    y?: number | null;
  };
  positionAbsolute?: {
    x?: number | null;
    y?: number | null;
  };
  internals?: {
    positionAbsolute?: {
      x?: number | null;
      y?: number | null;
    };
  };
  style?: {
    width?: number | string | null;
    height?: number | string | null;
  };
  data?: {
    nodeStyle?: {
      width?: number | string | null;
      height?: number | string | null;
    };
    regionBoundsWidth?: number | null;
    regionBoundsHeight?: number | null;
    [key: string]: unknown;
  };
}

export interface HelperLineChangeResult<TChange extends HelperLinePositionChange = HelperLinePositionChange> {
  changes: TChange[];
  lines: HelperLineState;
  snappedPositions: Map<string, { x: number; y: number }>;
}

const DEFAULT_THRESHOLD = 5;
const DEFAULT_CANDIDATE_LIMIT = 300;
const DEFAULT_MIDPOINT_CANDIDATE_LIMIT = 80;
const DEFAULT_NODE_WIDTH = 80;
const DEFAULT_NODE_HEIGHT = 50;

export const emptyHelperLineState: HelperLineState = {};

function finiteNumber(value: unknown): number | undefined {
  const numberValue = typeof value === 'number'
    ? value
    : typeof value === 'string' && value.trim() !== ''
      ? Number(value)
      : NaN;
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function positiveNumber(value: unknown): number | undefined {
  const numberValue = finiteNumber(value);
  return numberValue !== undefined && numberValue > 0 ? numberValue : undefined;
}

function booleanOption(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function optionNumber(value: unknown, fallback: number, minimum = 0): number {
  const numberValue = finiteNumber(value);
  if (numberValue === undefined || numberValue < minimum) return fallback;
  return numberValue;
}

export function normalizeHelperLinesOptions(value: TopoViewerProps['helperLines']): HelperLinesOptions {
  if (!value) {
    return {
      enabled: false,
      snap: false,
      threshold: DEFAULT_THRESHOLD,
      showMidpoints: false,
      candidateLimit: DEFAULT_CANDIDATE_LIMIT,
      midpointCandidateLimit: DEFAULT_MIDPOINT_CANDIDATE_LIMIT
    };
  }
  if (value === true) {
    return {
      enabled: true,
      snap: true,
      threshold: DEFAULT_THRESHOLD,
      showMidpoints: false,
      candidateLimit: DEFAULT_CANDIDATE_LIMIT,
      midpointCandidateLimit: DEFAULT_MIDPOINT_CANDIDATE_LIMIT
    };
  }
  return {
    enabled: value.enabled ?? true,
    snap: booleanOption(value.snap, true),
    threshold: optionNumber(value.threshold, DEFAULT_THRESHOLD),
    showMidpoints: booleanOption(value.showMidpoints, false),
    candidateLimit: Math.floor(optionNumber(value.candidateLimit, DEFAULT_CANDIDATE_LIMIT, 1)),
    midpointCandidateLimit: Math.floor(optionNumber(value.midpointCandidateLimit, DEFAULT_MIDPOINT_CANDIDATE_LIMIT, 1))
  };
}

function positionFromNode(node: HelperLineNodeLike) {
  const absolute = node.internals?.positionAbsolute || node.positionAbsolute || node.position;
  return {
    x: finiteNumber(absolute?.x) ?? 0,
    y: finiteNumber(absolute?.y) ?? 0
  };
}

function localPositionFromNode(node: HelperLineNodeLike) {
  return {
    x: finiteNumber(node.position?.x) ?? 0,
    y: finiteNumber(node.position?.y) ?? 0
  };
}

function absolutePositionForChange(node: HelperLineNodeLike, nextLocalPosition: { x: number; y: number }) {
  const currentLocal = localPositionFromNode(node);
  const currentAbsolute = positionFromNode(node);
  return {
    x: currentAbsolute.x + (nextLocalPosition.x - currentLocal.x),
    y: currentAbsolute.y + (nextLocalPosition.y - currentLocal.y)
  };
}

function localPositionForAbsoluteSnap(node: HelperLineNodeLike, snappedAbsolutePosition: { x: number; y: number }) {
  const currentLocal = localPositionFromNode(node);
  const currentAbsolute = positionFromNode(node);
  return {
    x: currentLocal.x + (snappedAbsolutePosition.x - currentAbsolute.x),
    y: currentLocal.y + (snappedAbsolutePosition.y - currentAbsolute.y)
  };
}

function sizeFromNode(node: HelperLineNodeLike) {
  const data = node.data || {};
  return {
    width: positiveNumber(node.measured?.width)
      ?? positiveNumber(node.width)
      ?? positiveNumber(node.style?.width)
      ?? positiveNumber(data.nodeStyle?.width)
      ?? positiveNumber(data.regionBoundsWidth)
      ?? DEFAULT_NODE_WIDTH,
    height: positiveNumber(node.measured?.height)
      ?? positiveNumber(node.height)
      ?? positiveNumber(node.style?.height)
      ?? positiveNumber(data.nodeStyle?.height)
      ?? positiveNumber(data.regionBoundsHeight)
      ?? DEFAULT_NODE_HEIGHT
  };
}

export function helperLineBoxFromNode(node: HelperLineNodeLike, overridePosition?: { x: number; y: number }): HelperLineBox | undefined {
  const id = String(node.id || '');
  if (!id || id.startsWith('pin:')) return undefined;
  const position = overridePosition || positionFromNode(node);
  const size = sizeFromNode(node);
  return {
    id,
    type: node.type,
    hidden: !!node.hidden,
    draggable: node.draggable !== false,
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height
  };
}

function boxCoordinates(box: HelperLineBox) {
  return {
    vertical: [
      { value: box.x, offset: 0, kind: 'edge' as const },
      { value: box.x + box.width / 2, offset: box.width / 2, kind: 'center' as const },
      { value: box.x + box.width, offset: box.width, kind: 'edge' as const }
    ],
    horizontal: [
      { value: box.y, offset: 0, kind: 'edge' as const },
      { value: box.y + box.height / 2, offset: box.height / 2, kind: 'center' as const },
      { value: box.y + box.height, offset: box.height, kind: 'edge' as const }
    ]
  };
}

function sortedCandidates(candidates: HelperLineBox[], draggedId: string, limit: number): HelperLineBox[] {
  return candidates
    .filter((candidate) => candidate.id !== draggedId && !candidate.hidden)
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, limit);
}

function candidateCoordinates(candidates: HelperLineBox[], axis: 'vertical' | 'horizontal') {
  return candidates.flatMap((candidate) => boxCoordinates(candidate)[axis].map((coordinate) => ({
    ...coordinate,
    candidateId: candidate.id
  })));
}

function midpointCoordinates(candidates: HelperLineBox[], axis: 'vertical' | 'horizontal') {
  const coordinates = candidates.map((candidate) => {
    const coordinatesForCandidate = boxCoordinates(candidate)[axis];
    return {
      ...coordinatesForCandidate[1],
      candidateId: candidate.id
    };
  });
  const midpoints: Array<{ value: number; offset: number; kind: 'midpoint'; candidateId: string }> = [];
  for (let first = 0; first < coordinates.length; first += 1) {
    for (let second = first + 1; second < coordinates.length; second += 1) {
      midpoints.push({
        value: (coordinates[first].value + coordinates[second].value) / 2,
        offset: 0,
        kind: 'midpoint',
        candidateId: `${coordinates[first].candidateId}:${coordinates[second].candidateId}`
      });
    }
  }
  return midpoints;
}

function bestAxisAlignment(
  dragged: HelperLineBox,
  candidates: HelperLineBox[],
  axis: 'vertical' | 'horizontal',
  options: HelperLinesOptions
) {
  const draggedCoordinates = boxCoordinates(dragged)[axis];
  const candidatesForAxis = options.showMidpoints && candidates.length <= options.midpointCandidateLimit
    ? [...candidateCoordinates(candidates, axis), ...midpointCoordinates(candidates, axis)]
    : candidateCoordinates(candidates, axis);
  let best: {
    line: HelperLinePosition;
    snappedAxisValue: number;
    distance: number;
  } | undefined;

  for (const draggedCoordinate of draggedCoordinates) {
    for (const candidateCoordinate of candidatesForAxis) {
      if (candidateCoordinate.kind === 'midpoint' && draggedCoordinate.kind !== 'center') continue;
      const distance = Math.abs(draggedCoordinate.value - candidateCoordinate.value);
      if (distance > options.threshold) continue;
      if (best && distance >= best.distance) continue;
      best = {
        line: {
          value: candidateCoordinate.value,
          kind: candidateCoordinate.kind === 'midpoint' ? 'midpoint' : draggedCoordinate.kind
        },
        snappedAxisValue: candidateCoordinate.value - draggedCoordinate.offset,
        distance
      };
    }
  }

  return best;
}

export function calculateHelperLines(
  dragged: HelperLineBox,
  candidates: HelperLineBox[],
  options: HelperLinesOptions
): { lines: HelperLineState; snappedPosition?: { x: number; y: number } } {
  if (!options.enabled || dragged.hidden || dragged.draggable === false) {
    return { lines: emptyHelperLineState };
  }
  const eligibleCandidates = sortedCandidates(candidates, dragged.id, options.candidateLimit);
  if (!eligibleCandidates.length) return { lines: emptyHelperLineState };

  const vertical = bestAxisAlignment(dragged, eligibleCandidates, 'vertical', options);
  const horizontal = bestAxisAlignment(dragged, eligibleCandidates, 'horizontal', options);
  const lines: HelperLineState = {
    ...(vertical ? { vertical: vertical.line } : {}),
    ...(horizontal ? { horizontal: horizontal.line } : {})
  };
  const snappedPosition = options.snap && (vertical || horizontal)
    ? {
      x: vertical?.snappedAxisValue ?? dragged.x,
      y: horizontal?.snappedAxisValue ?? dragged.y
    }
    : undefined;
  return { lines, snappedPosition };
}

export function applyHelperLineSnapToChanges<TChange extends HelperLinePositionChange>({
  changes,
  nodes,
  options,
  activeNodeId
}: {
  changes: TChange[];
  nodes: HelperLineNodeLike[];
  options: HelperLinesOptions;
  activeNodeId?: string;
}): HelperLineChangeResult<TChange> {
  if (!options.enabled) {
    return { changes, lines: emptyHelperLineState, snappedPositions: new Map() };
  }
  const activeChange = changes.find((change) => (
    change.type === 'position'
      && !!change.id
      && !!change.position
      && (change.dragging !== false || String(change.id) === activeNodeId)
  ));
  if (!activeChange?.position) {
    return { changes, lines: emptyHelperLineState, snappedPositions: new Map() };
  }
  const nodeById = new Map(nodes.map((node) => [String(node.id || ''), node]));
  const activeNode = nodeById.get(String(activeChange.id));
  if (!activeNode) {
    return { changes, lines: emptyHelperLineState, snappedPositions: new Map() };
  }
  const dragged = helperLineBoxFromNode(activeNode, absolutePositionForChange(activeNode, activeChange.position));
  if (!dragged) {
    return { changes, lines: emptyHelperLineState, snappedPositions: new Map() };
  }
  const candidates = nodes.flatMap((node) => {
    const box = helperLineBoxFromNode(node);
    return box ? [box] : [];
  });
  const result = calculateHelperLines(dragged, candidates, options);
  const snappedPositions = new Map<string, { x: number; y: number }>();

  if (!result.snappedPosition) {
    return { changes, lines: result.lines, snappedPositions };
  }

  const snappedLocalPosition = localPositionForAbsoluteSnap(activeNode, result.snappedPosition);
  snappedPositions.set(String(activeChange.id), snappedLocalPosition);
  return {
    lines: result.lines,
    snappedPositions,
    changes: changes.map((change) => (
      change === activeChange
        ? { ...change, position: snappedLocalPosition }
        : change
    ))
  };
}

export function resolveDragStopPosition({
  runtimeId,
  eventPosition,
  nodes,
  snappedPositions
}: {
  runtimeId: string;
  eventPosition: { x?: number; y?: number } | undefined;
  nodes: HelperLineNodeLike[];
  snappedPositions: Map<string, { x: number; y: number }>;
}) {
  const snapped = snappedPositions.get(runtimeId);
  if (snapped) return snapped;
  const currentNode = nodes.find((node) => String(node.id || '') === runtimeId);
  const currentPosition = currentNode?.position;
  return {
    x: finiteNumber(currentPosition?.x) ?? finiteNumber(eventPosition?.x) ?? 0,
    y: finiteNumber(currentPosition?.y) ?? finiteNumber(eventPosition?.y) ?? 0
  };
}
