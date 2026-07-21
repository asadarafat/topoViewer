import type { EdgeChange, NodeChange } from '@xyflow/react';
import type { TopoDocument, TopoViewerObjectDoubleClick } from '../core/types';

const runtimeOwnedNodeKeys = new Set([
  'dragging',
  'height',
  'internals',
  'measured',
  'positionAbsolute',
  'resizing',
  'width'
]);

function sourceNodeDefinitionUnchanged(next: Record<string, unknown>, current: Record<string, unknown>) {
  return Object.keys(next).every((key) => (
    runtimeOwnedNodeKeys.has(key)
    || next[key] === current[key]
    || (
      key === 'position'
      && sameRuntimePosition(
        next[key] as { x: number; y: number } | undefined,
        current[key] as { x: number; y: number } | undefined
      )
    )
  ))
    && Object.keys(current).every((key) => runtimeOwnedNodeKeys.has(key) || key in next);
}

export function sourceObjectId(compiledObject: Record<string, unknown>): string {
  const data = (compiledObject.data || {}) as Record<string, unknown>;
  return String(data.id || compiledObject.id || '');
}

export function runtimeObjectInteraction(
  compiledObject: Record<string, unknown>,
  element: TopoViewerObjectDoubleClick['element'],
  event: Pick<MouseEvent, 'clientX' | 'clientY' | 'ctrlKey' | 'metaKey' | 'shiftKey'>
): TopoViewerObjectDoubleClick {
  return {
    clientX: event.clientX,
    clientY: event.clientY,
    id: sourceObjectId(compiledObject),
    runtimeId: String(compiledObject.id || ''),
    element,
    data: (compiledObject.data || {}) as Record<string, unknown>,
    modifiers: {
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey
    }
  };
}

export function sameRuntimePosition(
  first: { x: number; y: number } | undefined,
  second: { x: number; y: number } | undefined
) {
  if (!first || !second) return false;
  return Math.abs(first.x - second.x) < 0.5 && Math.abs(first.y - second.y) < 0.5;
}

export function runtimeNodePosition(node: Record<string, unknown>): { x: number; y: number } {
  const position = (node.position || {}) as { x?: unknown; y?: unknown };
  const x = Number(position.x);
  const y = Number(position.y);
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0
  };
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
      if (nextStyle[key] === currentStyle[key]) return false;
      const nextValue = Number(nextStyle[key]);
      const currentValue = Number(currentStyle[key]);
      if (Number.isFinite(nextValue) && Number.isFinite(currentValue)) {
        return Math.abs(nextValue - currentValue) > 0.5;
      }
      return true;
    });
    if (declaredDimensionChanged) return node;
    if (sourceNodeDefinitionUnchanged(nextRecord, current)) return current;
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

export function runtimeNodesHaveCollisionManagedLabels(nodes: ReadonlyArray<{ data?: unknown }>) {
  return nodes.some((node) => {
    const data = node.data as Record<string, unknown> | undefined;
    return data?.labelZIndex !== undefined || data?.metaZIndex !== undefined;
  });
}

export function preserveSourceOwnedEdges<Change extends EdgeChange>(
  changes: Change[],
  sourceEdgeIds: ReadonlySet<string>
): Change[] {
  return changes.filter((change) => change.type !== 'remove' || !sourceEdgeIds.has(change.id));
}
