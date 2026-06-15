import type { Bounds, GraphNode, GraphRegion } from './types';

export function normalizePosition(position: GraphNode['position']): { x: number; y: number } {
  if (Array.isArray(position)) return { x: Number(position[0] || 0), y: Number(position[1] || 0) };
  if (position && typeof position === 'object') return { x: Number(position.x || 0), y: Number(position.y || 0) };
  return { x: 0, y: 0 };
}

export function unionBounds(boundsList: Array<Bounds | null | undefined>): Bounds | null {
  const validBounds = boundsList.filter(Boolean) as Bounds[];
  if (!validBounds.length) return null;
  const minX = Math.min(...validBounds.map((bounds) => bounds.x));
  const minY = Math.min(...validBounds.map((bounds) => bounds.y));
  const maxX = Math.max(...validBounds.map((bounds) => bounds.x + bounds.width));
  const maxY = Math.max(...validBounds.map((bounds) => bounds.y + bounds.height));
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}

function numberOrDefault(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function expandBounds(bounds: Bounds, paddingX: number, paddingY = paddingX): Bounds {
  return {
    x: bounds.x - paddingX,
    y: bounds.y - paddingY,
    width: bounds.width + paddingX * 2,
    height: bounds.height + paddingY * 2
  };
}

function regionDepth(region: GraphRegion, regionById: Map<string, GraphRegion>): number {
  let depth = 0;
  let current: GraphRegion | undefined = region;
  const seen = new Set<string>();

  while (current?.parent && !seen.has(current.parent)) {
    seen.add(current.parent);
    const parent = regionById.get(current.parent);
    if (!parent) break;
    depth += 1;
    current = parent;
  }

  return depth;
}

function regionBounds(region: GraphRegion, nodeById: Map<string, GraphNode>, regions: GraphRegion[]): Bounds | null {
  const points = (region.members || [])
    .map((id) => nodeById.get(id))
    .filter(Boolean)
    .map((node) => normalizePosition(node!.position));

  if (!points.length) return null;

  const padding = numberOrDefault(region.padding, 88);
  const paddingX = numberOrDefault(region.paddingX, padding);
  const paddingY = numberOrDefault(region.paddingY, padding);
  const nodeWidth = numberOrDefault(region.nodeWidth, 88);
  const nodeHeight = numberOrDefault(region.nodeHeight, 74);
  const minWidth = numberOrDefault(region.minWidth, 180);
  const minHeight = numberOrDefault(region.minHeight, 120);
  const defaultHeaderPadding = regions.some((candidate) => candidate.parent === region.id) ? 88 : 0;
  const headerPadding = numberOrDefault(region.headerPadding, defaultHeaderPadding);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs) - paddingX;
  const minY = Math.min(...ys) - paddingY - headerPadding;
  const maxX = Math.max(...xs) + paddingX + nodeWidth;
  const maxY = Math.max(...ys) + paddingY + nodeHeight;

  return {
    x: minX,
    y: minY,
    width: Math.max(minWidth, maxX - minX),
    height: Math.max(minHeight, maxY - minY)
  };
}

export function buildRegionBoundsMap(regions: GraphRegion[], selectedLayerIds: Set<string>, nodeById: Map<string, GraphNode>): Map<string, Bounds> {
  const visibleRegions = regions.filter((region) => (region.layers || []).some((layerId) => selectedLayerIds.has(layerId)));
  const regionById = new Map(visibleRegions.map((region) => [region.id, region]));
  const childrenByParentId = visibleRegions.reduce((children, region) => {
    if (!region.parent) return children;
    const current = children.get(region.parent) || [];
    current.push(region.id);
    children.set(region.parent, current);
    return children;
  }, new Map<string, string[]>());
  const boundsById = new Map<string, Bounds>();
  const deepestFirst = [...visibleRegions].sort((a, b) => regionDepth(b, regionById) - regionDepth(a, regionById));

  deepestFirst.forEach((region) => {
    const ownBounds = regionBounds(region, nodeById, regions);
    const childBounds = (childrenByParentId.get(region.id) || []).map((childId) => boundsById.get(childId));
    const mergedBounds = unionBounds([ownBounds, ...childBounds]);
    if (!mergedBounds) return;
    const parentPadding = childBounds.some(Boolean) ? numberOrDefault(region.parentPadding, 42) : 0;
    const parentPaddingX = childBounds.some(Boolean) ? numberOrDefault(region.parentPaddingX, parentPadding) : 0;
    const parentPaddingY = childBounds.some(Boolean) ? numberOrDefault(region.parentPaddingY, parentPadding) : 0;
    boundsById.set(region.id, expandBounds(mergedBounds, parentPaddingX, parentPaddingY));
  });

  return boundsById;
}
