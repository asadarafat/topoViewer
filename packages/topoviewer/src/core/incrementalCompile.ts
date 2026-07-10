import type { CompiledGraph, LayoutConfig, PositionTuple, TopoDocument } from './types';

function positionValue(value: PositionTuple | { x: number; y: number } | undefined) {
  if (Array.isArray(value)) return { x: Number(value[0] || 0), y: Number(value[1] || 0) };
  return {
    x: Number(value?.x || 0),
    y: Number(value?.y || 0)
  };
}

function validPosition(value: unknown): boolean {
  if (value === undefined) return true;
  if (Array.isArray(value)) {
    return value.length === 2 && value.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate));
  }
  if (!value || typeof value !== 'object') return false;
  const position = value as Record<string, unknown>;
  return typeof position.x === 'number'
    && Number.isFinite(position.x)
    && typeof position.y === 'number'
    && Number.isFinite(position.y);
}

export function assertValidPositionOnlyFields(document: TopoDocument): void {
  const objects = [
    ...(document.graph?.nodes || []).map((node) => ({ id: node.id, kind: 'node', position: node.position })),
    ...(document.diagram?.shapes || []).map((shape) => ({ id: shape.id, kind: 'shape', position: shape.position })),
    ...(document.diagram?.callouts || []).map((callout) => ({ id: callout.id, kind: 'callout', position: callout.position }))
  ];
  const invalid = objects.find((object) => !validPosition(object.position));
  if (invalid) {
    throw new Error(`TopoViewer ${invalid.kind} "${invalid.id}" has an invalid position; expected two finite coordinates.`);
  }
}

function withoutPosition<T extends { position?: unknown }>(value: T): Omit<T, 'position'> {
  const { position: _position, ...remaining } = value;
  return remaining;
}

export function positionInsensitiveDocumentSignature(document: TopoDocument): string {
  const graph = document.graph;
  const diagram = document.diagram;
  return JSON.stringify({
    ...document,
    ...(graph ? {
      graph: {
        ...graph,
        nodes: (graph.nodes || []).map(withoutPosition)
      }
    } : {}),
    ...(diagram ? {
      diagram: {
        ...diagram,
        shapes: (diagram.shapes || []).map(withoutPosition),
        callouts: (diagram.callouts || []).map(withoutPosition)
      }
    } : {})
  });
}

export function supportsPositionOnlyCompile({
  document,
  hasExtensions,
  layoutOverride
}: {
  document: TopoDocument;
  hasExtensions: boolean;
  layoutOverride?: LayoutConfig;
}): boolean {
  const layout = { ...(document.layout || {}), ...(layoutOverride || {}) };
  return !hasExtensions
    && layout.mode === 'manual'
    && !(document.graph?.regions || []).length
    && !(document.graph?.nodes || []).some((node) => !!node.parent)
    && !(document.attention?.aggregate?.groups || []).length
    && !document.attention?.links?.grouping;
}

export function patchCompiledPositions(graph: CompiledGraph, document: TopoDocument): CompiledGraph {
  const positions = new Map<string, { x: number; y: number }>();
  (document.graph?.nodes || []).forEach((node) => positions.set(node.id, positionValue(node.position)));
  (document.diagram?.shapes || []).forEach((shape) => positions.set(shape.id, positionValue(shape.position)));
  (document.diagram?.callouts || []).forEach((callout) => positions.set(callout.id, positionValue(callout.position)));

  let changed = false;
  const nodes = graph.nodes.map((node) => {
    const nextPosition = positions.get(String(node.id || ''));
    if (!nextPosition || (
      Math.abs(node.position.x - nextPosition.x) < 0.5
      && Math.abs(node.position.y - nextPosition.y) < 0.5
    )) return node;
    changed = true;
    return { ...node, position: nextPosition };
  });
  return changed ? { ...graph, nodes } : graph;
}
