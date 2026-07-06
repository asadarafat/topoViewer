import { applyNodeChanges, type NodeChange } from '@xyflow/react';
import { rebuildRegionNodes } from '../core/compiler';
import type { GraphRegion, TopoDocument } from '../core/types';

function normalizePosition(position: unknown): { x: number; y: number } {
  if (Array.isArray(position)) return { x: Number(position[0] || 0), y: Number(position[1] || 0) };
  if (position && typeof position === 'object') {
    const objectPosition = position as { x?: number; y?: number };
    return { x: Number(objectPosition.x || 0), y: Number(objectPosition.y || 0) };
  }
  return { x: 0, y: 0 };
}

function regionIdFromNodeId(nodeId = ''): string {
  return nodeId.replace(/^region:/, '');
}

function regionDragDeltas(changes: NodeChange[], currentNodes: Array<Record<string, unknown>>) {
  const nodeById = new Map(currentNodes.map((node) => [String(node.id), node]));
  return changes.reduce((deltas, change) => {
    if (change.type !== 'position' || !change.id?.startsWith('region:') || !change.position) return deltas;
    const current = nodeById.get(change.id);
    if (!current) return deltas;
    const currentPosition = normalizePosition(current.position);
    const dx = change.position.x - currentPosition.x;
    const dy = change.position.y - currentPosition.y;
    if (dx === 0 && dy === 0) return deltas;
    deltas.set(regionIdFromNodeId(change.id), { dx, dy });
    return deltas;
  }, new Map<string, { dx: number; dy: number }>());
}

function translateRegionMembers(nodes: Array<Record<string, unknown>>, deltas: Map<string, { dx: number; dy: number }>, regions: GraphRegion[] = []) {
  if (!deltas.size) return nodes;
  const regionById = new Map(regions.map((region) => [region.id, region]));
  const movementByNodeId = new Map<string, { dx: number; dy: number }>();

  deltas.forEach(({ dx, dy }, regionId) => {
    const region = regionById.get(regionId);
    (region?.members || []).forEach((memberId) => {
      const current = movementByNodeId.get(memberId) || { dx: 0, dy: 0 };
      movementByNodeId.set(memberId, { dx: current.dx + dx, dy: current.dy + dy });
    });
  });

  return nodes.map((node) => {
    if (node.type === 'region') return node;
    const movement = movementByNodeId.get(String(node.id));
    if (!movement) return node;
    const position = normalizePosition(node.position);
    return {
      ...node,
      position: {
        x: position.x + movement.dx,
        y: position.y + movement.dy
      }
    };
  });
}

export function applyTopoNodeChanges({
  changes,
  currentNodes,
  document,
  selectedLayerIds,
  showRegions,
  deferRegionRebuild = false
}: {
  changes: NodeChange[];
  currentNodes: never[];
  document: TopoDocument;
  selectedLayerIds: string[];
  showRegions: boolean;
  deferRegionRebuild?: boolean;
}): never[] {
  const current = currentNodes as unknown as Array<Record<string, unknown>>;
  const regionDeltas = regionDragDeltas(changes, current);
  const changedNodes = applyNodeChanges(changes, currentNodes) as unknown as Array<Record<string, unknown>>;
  const translatedNodes = translateRegionMembers(changedNodes, regionDeltas, document.graph?.regions || []);
  if (deferRegionRebuild) {
    return translatedNodes as never[];
  }
  const nonRegionNodes = translatedNodes.filter((node) => node.type !== 'region');
  const regionNodes = showRegions
    ? rebuildRegionNodes(document.graph?.regions || [], new Set(selectedLayerIds), nonRegionNodes, document)
    : [];
  return [...regionNodes, ...nonRegionNodes] as never[];
}
