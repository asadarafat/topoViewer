import type { EdgeChange, NodeChange } from '@xyflow/react';
import type { TopoDocument } from '../core/types';

export function sourceObjectId(compiledObject: Record<string, unknown>): string {
  const data = (compiledObject.data || {}) as Record<string, unknown>;
  return String(data.id || compiledObject.id || '');
}

export function regionDragGroupRuntimeIds(document: TopoDocument, runtimeId: string): Set<string> {
  if (!runtimeId.startsWith('region:')) return new Set([runtimeId]);
  const rootRegionId = runtimeId.replace(/^region:/, '');
  const regions = document.graph?.regions || [];
  const byId = new Map(regions.map((region) => [region.id, region]));
  const excluded = new Set([runtimeId]);
  const visit = (regionId: string) => {
    const region = byId.get(regionId);
    if (!region) return;
    (region.members || []).forEach((memberId) => {
      excluded.add(memberId);
      if (byId.has(memberId)) visit(memberId);
    });
    regions.filter((candidate) => candidate.parent === regionId).forEach((child) => {
      excluded.add(`region:${child.id}`);
      visit(child.id);
    });
  };
  visit(rootRegionId);
  return excluded;
}

export function preserveRuntimeNodeMeasurements(nextNodes: unknown[], currentNodes: unknown[]) {
  const currentById = new Map(currentNodes.map((node) => [
    String((node as { id?: unknown }).id || ''),
    node as Record<string, unknown>
  ]));
  return nextNodes.map((node) => {
    const current = currentById.get(String((node as { id?: unknown }).id || ''));
    if (!current) return node;
    const nextRecord = node as Record<string, unknown>;
    const nextStyle = (nextRecord.style || {}) as Record<string, unknown>;
    const currentStyle = (current.style || {}) as Record<string, unknown>;
    const declaredDimensionChanged = ['width', 'height'].some((key) => {
      const nextValue = Number(nextStyle[key]);
      const currentValue = Number(currentStyle[key]);
      return Number.isFinite(nextValue) && Number.isFinite(currentValue) && Math.abs(nextValue - currentValue) > 0.5;
    });
    if (declaredDimensionChanged) return node;
    const runtimeMeasurements: Record<string, unknown> = {};
    if (current.height !== undefined) runtimeMeasurements.height = current.height;
    if (current.measured !== undefined) runtimeMeasurements.measured = current.measured;
    if (current.width !== undefined) runtimeMeasurements.width = current.width;
    return { ...nextRecord, ...runtimeMeasurements };
  });
}

export function hasRegionPositionChange(changes: NodeChange[]) {
  return changes.some((change) => (
    change.type === 'position' && String(change.id || '').startsWith('region:')
  ));
}

export function preserveSourceOwnedEdges<Change extends EdgeChange>(
  changes: Change[],
  sourceEdgeIds: ReadonlySet<string>
): Change[] {
  return changes.filter((change) => change.type !== 'remove' || !sourceEdgeIds.has(change.id));
}
