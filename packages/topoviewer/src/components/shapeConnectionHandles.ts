import { Position } from '@xyflow/react';
import { SHAPE_CONNECTION_PORT_COUNT, shapeConnectionPortId } from '../core/connectionHandles';
import { nodeShapeGeometry, type NodeShapeName } from '../core/nodeShapes';

export interface ShapeConnectionPort {
  active: boolean;
  id: string;
  position: Position;
  x: number;
  y: number;
}

const cardinalPoints: Array<[number, number]> = [
  [50, 0],
  [100, 50],
  [50, 100],
  [0, 50]
];

function parseSvgPoints(value: unknown): Array<[number, number]> {
  if (typeof value !== 'string') return [];
  return value.trim().split(/\s+/).flatMap((entry) => {
    const [x, y] = entry.split(',').map(Number);
    return Number.isFinite(x) && Number.isFinite(y) ? [[x, y] as [number, number]] : [];
  });
}

function portPosition([x, y]: [number, number]): Position {
  const distances: Array<[Position, number]> = [
    [Position.Top, y],
    [Position.Right, 100 - x],
    [Position.Bottom, 100 - y],
    [Position.Left, x]
  ];
  return distances.reduce((nearest, candidate) => candidate[1] < nearest[1] ? candidate : nearest)[0];
}

function activeShapePoints(shape: NodeShapeName, polygonPoints?: string): Array<[number, number]> {
  const geometry = nodeShapeGeometry(shape, polygonPoints);
  if (geometry.element !== 'polygon') return cardinalPoints;
  const points = parseSvgPoints(geometry.attributes.points);
  if (shape === 'star') {
    return points
      .filter(([x, y]) => Math.hypot(x - 50, y - 50) >= 44)
      .slice(0, SHAPE_CONNECTION_PORT_COUNT);
  }
  return points.slice(0, SHAPE_CONNECTION_PORT_COUNT);
}

/**
 * Returns stable connection-port IDs while allowing the visible port count and
 * geometry to follow the rendered node shape.
 */
export function shapeConnectionPorts(shape: NodeShapeName, polygonPoints?: string): ShapeConnectionPort[] {
  const active = activeShapePoints(shape, polygonPoints);
  return Array.from({ length: SHAPE_CONNECTION_PORT_COUNT }, (_value, index) => {
    const point = active[index] || cardinalPoints[index % cardinalPoints.length];
    return {
      active: index < active.length,
      id: shapeConnectionPortId(index),
      position: portPosition(point),
      x: point[0],
      y: point[1]
    };
  });
}
