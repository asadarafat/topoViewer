import type { Bounds } from './types';

export type LabelCollisionPolicy = 'none' | 'avoid' | 'fade' | 'hide';

export interface LabelPlacementCandidate {
  x: number;
  y: number;
  transform: string;
  weight?: number;
}

export interface LabelPlacementItem {
  id: string;
  width: number;
  height: number;
  priority?: number;
  collisionPolicy?: LabelCollisionPolicy;
  ignoredObstacleIds?: string[];
  candidates: LabelPlacementCandidate[];
}

export interface LabelPlacementResult extends LabelPlacementCandidate {
  opacity?: number;
  hidden?: boolean;
  bounds: Bounds;
}

export interface LabelPlacementObstacle {
  id: string;
  bounds: Bounds;
}

type TransformOffset = {
  x: number;
  y: number;
};

const transformOffsets = new Map<string, TransformOffset>([
  ['translate(0, 0)', { x: 0, y: 0 }],
  ['translate(-50%, 0)', { x: -0.5, y: 0 }],
  ['translate(-100%, 0)', { x: -1, y: 0 }],
  ['translate(0, -50%)', { x: 0, y: -0.5 }],
  ['translate(-50%, -50%)', { x: -0.5, y: -0.5 }],
  ['translate(-100%, -50%)', { x: -1, y: -0.5 }],
  ['translate(0, -100%)', { x: 0, y: -1 }],
  ['translate(-50%, -100%)', { x: -0.5, y: -1 }],
  ['translate(-100%, -100%)', { x: -1, y: -1 }]
]);

function transformOffset(transform: string): TransformOffset {
  return transformOffsets.get(transform) || { x: -0.5, y: -0.5 };
}

export function labelBounds(candidate: LabelPlacementCandidate, width: number, height: number): Bounds {
  const offset = transformOffset(candidate.transform);
  return {
    x: candidate.x + width * offset.x,
    y: candidate.y + height * offset.y,
    width,
    height
  };
}

function expandedBounds(bounds: Bounds, margin: number): Bounds {
  return {
    x: bounds.x - margin,
    y: bounds.y - margin,
    width: bounds.width + margin * 2,
    height: bounds.height + margin * 2
  };
}

function overlapArea(a: Bounds, b: Bounds): number {
  const x = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const y = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return x * y;
}

function activeObstaclesForItem(item: LabelPlacementItem, obstacles: LabelPlacementObstacle[]) {
  if (!item.ignoredObstacleIds?.length) return obstacles;
  const ignored = new Set(item.ignoredObstacleIds);
  return obstacles.filter((obstacle) => !ignored.has(obstacle.id));
}

function candidateScore(item: LabelPlacementItem, candidate: LabelPlacementCandidate, obstacles: LabelPlacementObstacle[]) {
  const bounds = labelBounds(candidate, item.width, item.height);
  const activeObstacles = activeObstaclesForItem(item, obstacles);
  const overlap = activeObstacles.reduce((sum, obstacle) => sum + overlapArea(bounds, obstacle.bounds), 0);
  return {
    bounds,
    score: overlap * 1000 + (candidate.weight || 0)
  };
}

function preferredCandidate(item: LabelPlacementItem, obstacles: LabelPlacementObstacle[]): LabelPlacementResult {
  const candidates = item.candidates.length ? item.candidates : [{ x: 0, y: 0, transform: 'translate(-50%, -50%)' }];
  const scored = candidates
    .map((candidate, index) => ({
      candidate,
      index,
      ...candidateScore(item, candidate, obstacles)
    }))
    .sort((a, b) => a.score - b.score || a.index - b.index);

  const best = scored[0];
  const collisionPolicy = item.collisionPolicy || 'avoid';
  const hasOverlap = activeObstaclesForItem(item, obstacles).some((obstacle) => overlapArea(best.bounds, obstacle.bounds) > 0);
  const result: LabelPlacementResult = {
    ...best.candidate,
    bounds: best.bounds
  };

  if (hasOverlap && collisionPolicy === 'fade') {
    result.opacity = 0.58;
  }
  if (hasOverlap && collisionPolicy === 'hide') {
    result.hidden = true;
  }
  return result;
}

export function placeLabels(
  items: LabelPlacementItem[],
  obstacles: LabelPlacementObstacle[] = [],
  margin = 4
): Record<string, LabelPlacementResult> {
  const placed: Record<string, LabelPlacementResult> = {};
  const activeObstacles = obstacles.map((obstacle) => ({
    ...obstacle,
    bounds: expandedBounds(obstacle.bounds, margin)
  }));
  const sorted = [...items].sort((a, b) => {
    const priorityDelta = (b.priority || 0) - (a.priority || 0);
    if (priorityDelta !== 0) return priorityDelta;
    return a.id.localeCompare(b.id);
  });

  for (const item of sorted) {
    if ((item.collisionPolicy || 'avoid') === 'none') {
      const candidate = item.candidates[0] || { x: 0, y: 0, transform: 'translate(-50%, -50%)' };
      const bounds = labelBounds(candidate, item.width, item.height);
      placed[item.id] = { ...candidate, bounds };
      activeObstacles.push({ id: item.id, bounds: expandedBounds(bounds, margin) });
      continue;
    }

    const result = preferredCandidate(item, activeObstacles);
    placed[item.id] = result;
    if (!result.hidden) {
      activeObstacles.push({ id: item.id, bounds: expandedBounds(result.bounds, margin) });
    }
  }

  return placed;
}
