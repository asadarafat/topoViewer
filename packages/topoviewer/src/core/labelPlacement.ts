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

const SPATIAL_CELL_SIZE = 128;
const MAX_CELLS_PER_BOUNDS = 4096;

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

function cellRange(bounds: Bounds) {
  const minimumX = Math.floor(bounds.x / SPATIAL_CELL_SIZE);
  const maximumX = Math.floor((bounds.x + Math.max(0, bounds.width)) / SPATIAL_CELL_SIZE);
  const minimumY = Math.floor(bounds.y / SPATIAL_CELL_SIZE);
  const maximumY = Math.floor((bounds.y + Math.max(0, bounds.height)) / SPATIAL_CELL_SIZE);
  const count = (maximumX - minimumX + 1) * (maximumY - minimumY + 1);
  return count <= MAX_CELLS_PER_BOUNDS
    ? { maximumX, maximumY, minimumX, minimumY }
    : undefined;
}

class ObstacleSpatialIndex {
  private readonly all: LabelPlacementObstacle[] = [];
  private readonly cells = new Map<string, LabelPlacementObstacle[]>();
  private readonly global: LabelPlacementObstacle[] = [];

  add(obstacle: LabelPlacementObstacle) {
    this.all.push(obstacle);
    const range = cellRange(obstacle.bounds);
    if (!range) {
      this.global.push(obstacle);
      return;
    }
    for (let x = range.minimumX; x <= range.maximumX; x += 1) {
      for (let y = range.minimumY; y <= range.maximumY; y += 1) {
        const key = `${x}:${y}`;
        const entries = this.cells.get(key);
        if (entries) entries.push(obstacle);
        else this.cells.set(key, [obstacle]);
      }
    }
  }

  query(bounds: Bounds): LabelPlacementObstacle[] {
    const range = cellRange(bounds);
    if (!range) return this.all;
    const matches = new Set<LabelPlacementObstacle>(this.global);
    for (let x = range.minimumX; x <= range.maximumX; x += 1) {
      for (let y = range.minimumY; y <= range.maximumY; y += 1) {
        for (const obstacle of this.cells.get(`${x}:${y}`) || []) matches.add(obstacle);
      }
    }
    return [...matches];
  }
}

function activeObstaclesForItem(item: LabelPlacementItem, obstacles: LabelPlacementObstacle[]) {
  if (!item.ignoredObstacleIds?.length) return obstacles;
  const ignored = new Set(item.ignoredObstacleIds);
  return obstacles.filter((obstacle) => !ignored.has(obstacle.id));
}

function candidateScore(item: LabelPlacementItem, candidate: LabelPlacementCandidate, index: ObstacleSpatialIndex) {
  const bounds = labelBounds(candidate, item.width, item.height);
  const activeObstacles = activeObstaclesForItem(item, index.query(bounds));
  const overlap = activeObstacles.reduce((sum, obstacle) => sum + overlapArea(bounds, obstacle.bounds), 0);
  return {
    activeObstacles,
    bounds,
    score: overlap * 1000 + (candidate.weight || 0)
  };
}

function preferredCandidate(item: LabelPlacementItem, spatialIndex: ObstacleSpatialIndex): LabelPlacementResult {
  const candidates = item.candidates.length ? item.candidates : [{ x: 0, y: 0, transform: 'translate(-50%, -50%)' }];
  const scored = candidates
    .map((candidate, candidateIndex) => ({
      candidate,
      index: candidateIndex,
      ...candidateScore(item, candidate, spatialIndex)
    }))
    .sort((a, b) => a.score - b.score || a.index - b.index);

  const best = scored[0];
  const collisionPolicy = item.collisionPolicy || 'avoid';
  const hasOverlap = best.activeObstacles.some((obstacle) => overlapArea(best.bounds, obstacle.bounds) > 0);
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
  const activeObstacles = new ObstacleSpatialIndex();
  obstacles.forEach((obstacle) => activeObstacles.add({
    ...obstacle, bounds: expandedBounds(obstacle.bounds, margin)
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
      activeObstacles.add({ id: item.id, bounds: expandedBounds(bounds, margin) });
      continue;
    }

    const result = preferredCandidate(item, activeObstacles);
    placed[item.id] = result;
    if (!result.hidden) {
      activeObstacles.add({ id: item.id, bounds: expandedBounds(result.bounds, margin) });
    }
  }

  return placed;
}
