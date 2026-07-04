import type { EdgeProps } from '@xyflow/react';
import type { CSSProperties } from 'react';
import { placeLabels, type LabelPlacementItem, type LabelPlacementObstacle, type LabelPlacementResult } from '../core/labelPlacement';
import { linkDirectionSegment, type LinkDirectionGeometry } from '../core/linkDirectionGeometry';
import type { Bounds } from '../core/types';

export type EdgeLabelRole = 'center' | 'source' | 'target';

export type LinkDirectionKey = 'sourceToTarget' | 'targetToSource';

export interface DirectionStroke {
  id: string;
  direction: LinkDirectionKey;
  label?: string;
  data: Record<string, unknown>;
  style?: CSSProperties;
  labelStyle?: CSSProperties;
  labelBgStyle?: CSSProperties;
}

export interface EndpointLabelLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
}

interface FloatingEndpoints {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

type EdgeNodeBox = Bounds | null;

function numeric(value: unknown, fallback: number): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function endpointLabelAutoEnabled(data: Record<string, unknown>, role: 'source' | 'target'): boolean {
  const roleValue = data[`${role}LabelAutoPosition`];
  const sharedValue = data.endpointLabelAutoPosition;
  if (roleValue !== undefined) return roleValue !== false && String(roleValue).toLowerCase() !== 'false';
  if (sharedValue !== undefined) return sharedValue !== false && String(sharedValue).toLowerCase() !== 'false';
  return true;
}

function estimateEdgeLabelSize(data: Record<string, unknown>, role: EdgeLabelRole, value: string): { width: number; height: number } {
  const fontSize = numeric(role === 'center' ? data.labelFontSize : data[`${role}LabelFontSize`] ?? data.labelFontSize, 10);
  const horizontalPadding = numeric(data.labelBorderWidth, 0) > 0 ? 10 : 8;
  return {
    width: Math.max(20, value.length * fontSize * 0.58 + horizontalPadding),
    height: Math.max(16, fontSize + 9)
  };
}

function expandedBox(box: EdgeNodeBox, margin: number): Bounds | null {
  if (!box) return null;
  return {
    x: box.x - margin,
    y: box.y - margin,
    width: box.width + margin * 2,
    height: box.height + margin * 2
  };
}

function pointInsideBox(point: { x: number; y: number }, box: Bounds | null): boolean {
  if (!box) return false;
  return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
}

function pushLabelOutsideNode(
  point: { x: number; y: number },
  box: EdgeNodeBox,
  unit: { x: number; y: number },
  role: 'source' | 'target',
  margin: number
): { x: number; y: number } {
  const padded = expandedBox(box, margin);
  if (!padded || !pointInsideBox(point, padded)) return point;
  const direction = role === 'source' ? unit : { x: -unit.x, y: -unit.y };
  const candidates = [
    { x: padded.x - margin, y: point.y },
    { x: padded.x + padded.width + margin, y: point.y },
    { x: point.x, y: padded.y - margin },
    { x: point.x, y: padded.y + padded.height + margin }
  ];
  return candidates
    .map((candidate) => ({
      candidate,
      score: candidate.x * direction.x + candidate.y * direction.y
    }))
    .sort((a, b) => b.score - a.score)[0]?.candidate || point;
}

function clampToEndpointDistance(
  point: { x: number; y: number },
  anchor: { x: number; y: number },
  maxDistance: number
): { x: number; y: number } {
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (!Number.isFinite(distance) || distance <= maxDistance || distance === 0) return point;
  const scale = maxDistance / distance;
  return {
    x: anchor.x + dx * scale,
    y: anchor.y + dy * scale
  };
}

export function endpointLabelPoint(
  data: Record<string, unknown>,
  endpoints: FloatingEndpoints,
  offset: { x: number; y: number },
  role: 'source' | 'target',
  lineWidth: number,
  value: string,
  nodeBox: EdgeNodeBox
): EndpointLabelLayout {
  const anchor = role === 'source'
    ? { x: endpoints.sourceX + offset.x, y: endpoints.sourceY + offset.y }
    : { x: endpoints.targetX + offset.x, y: endpoints.targetY + offset.y };
  const size = estimateEdgeLabelSize(data, role, value);
  if (!endpointLabelAutoEnabled(data, role)) {
    return {
      ...anchor,
      ...size,
      x: anchor.x + numeric(data[`${role}LabelXOffset`], 0),
      y: anchor.y + numeric(data[`${role}LabelYOffset`], 0)
    };
  }

  const dx = endpoints.targetX - endpoints.sourceX;
  const dy = endpoints.targetY - endpoints.sourceY;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const unit = { x: dx / length, y: dy / length };
  const normal = { x: -unit.y, y: unit.x };
  const distance = numeric(
    data[`${role}LabelDistance`] ?? data.endpointLabelDistance,
    Math.max(18, lineWidth + 14)
  );
  const maxDistance = numeric(
    data[`${role}LabelMaxDistance`] ?? data.endpointLabelMaxDistance,
    Math.max(distance + 28, distance * 2.2)
  );
  const sideOffset = numeric(data[`${role}LabelSideOffset`] ?? data.endpointLabelSideOffset, 0);
  const direction = role === 'source' ? 1 : -1;
  const base = {
    x: anchor.x + unit.x * distance * direction + normal.x * sideOffset,
    y: anchor.y + unit.y * distance * direction + normal.y * sideOffset
  };
  const nudged = pushLabelOutsideNode(base, nodeBox, unit, role, Math.max(10, lineWidth + 8));
  const clamped = clampToEndpointDistance(nudged, anchor, maxDistance);

  return {
    ...size,
    x: clamped.x + numeric(data[`${role}LabelXOffset`], 0),
    y: clamped.y + numeric(data[`${role}LabelYOffset`], 0)
  };
}

function nodeObstacle(id: string, box: EdgeNodeBox, margin: number): LabelPlacementObstacle | undefined {
  if (!box) return undefined;
  return {
    id,
    bounds: {
      x: box.x - margin,
      y: box.y - margin,
      width: box.width + margin * 2,
      height: box.height + margin * 2
    }
  };
}

function centeredLabelItem(id: string, data: Record<string, unknown>, role: EdgeLabelRole, value: string, point: { x: number; y: number }, priority: number): LabelPlacementItem {
  const size = estimateEdgeLabelSize(data, role, value);
  return {
    id,
    width: size.width,
    height: size.height,
    priority,
    collisionPolicy: 'avoid',
    candidates: [{
      x: point.x,
      y: point.y,
      transform: 'translate(-50%, -50%)'
    }]
  };
}

function endpointLabelItem(
  id: string,
  data: Record<string, unknown>,
  base: EndpointLabelLayout,
  endpoints: FloatingEndpoints
): LabelPlacementItem {
  const dx = endpoints.targetX - endpoints.sourceX;
  const dy = endpoints.targetY - endpoints.sourceY;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const normal = { x: -dy / length, y: dx / length };
  const step = numeric(data.endpointLabelCollisionStep, 7);
  return {
    id,
    width: base.width,
    height: base.height,
    priority: 72,
    collisionPolicy: 'fade',
    candidates: [
      { x: base.x, y: base.y, transform: 'translate(-50%, -50%)' },
      { x: base.x + normal.x * step, y: base.y + normal.y * step, transform: 'translate(-50%, -50%)', weight: 8 },
      { x: base.x - normal.x * step, y: base.y - normal.y * step, transform: 'translate(-50%, -50%)', weight: 10 },
      { x: base.x + normal.x * step * 2, y: base.y + normal.y * step * 2, transform: 'translate(-50%, -50%)', weight: 14 },
      { x: base.x - normal.x * step * 2, y: base.y - normal.y * step * 2, transform: 'translate(-50%, -50%)', weight: 16 }
    ]
  };
}

function directionalLabelItem(
  direction: DirectionStroke,
  data: Record<string, unknown>,
  geometry: LinkDirectionGeometry,
  placement: string,
  offset: number
): LabelPlacementItem | undefined {
  if (!direction.label) return undefined;
  const point = directionLabelPoint(direction.direction, geometry, placement, offset);
  const size = estimateEdgeLabelSize({ ...data, ...direction.data }, 'center', direction.label);
  const segment = linkDirectionSegment(geometry, direction.direction);
  const step = Math.max(8, numeric(direction.data.directionLabelCollisionStep ?? data.directionLabelCollisionStep, 10));
  const directionMultiplier = direction.direction === 'sourceToTarget' ? -1 : 1;
  return {
    id: `direction:${direction.id}`,
    width: size.width,
    height: size.height,
    priority: 58,
    collisionPolicy: 'fade',
    candidates: [
      { x: point.x, y: point.y, transform: 'translate(-50%, -50%)' },
      { x: point.x + segment.normal.x * step * directionMultiplier, y: point.y + segment.normal.y * step * directionMultiplier, transform: 'translate(-50%, -50%)', weight: 8 },
      { x: point.x - segment.normal.x * step * directionMultiplier, y: point.y - segment.normal.y * step * directionMultiplier, transform: 'translate(-50%, -50%)', weight: 10 },
      { x: point.x + segment.normal.x * step * 2 * directionMultiplier, y: point.y + segment.normal.y * step * 2 * directionMultiplier, transform: 'translate(-50%, -50%)', weight: 14 },
      { x: point.x - segment.normal.x * step * 2 * directionMultiplier, y: point.y - segment.normal.y * step * 2 * directionMultiplier, transform: 'translate(-50%, -50%)', weight: 16 }
    ]
  };
}

export function edgeLabelLayouts({
  label,
  data,
  centerPoint,
  sourceLabel,
  targetLabel,
  sourceLabelLayout,
  targetLabelLayout,
  sourceBox,
  targetBox,
  endpoints,
  directions,
  directionGeometry
}: {
  label: EdgeProps['label'];
  data: Record<string, unknown>;
  centerPoint: { x: number; y: number };
  sourceLabel: string;
  targetLabel: string;
  sourceLabelLayout?: EndpointLabelLayout;
  targetLabelLayout?: EndpointLabelLayout;
  sourceBox: EdgeNodeBox;
  targetBox: EdgeNodeBox;
  endpoints: FloatingEndpoints;
  directions: DirectionStroke[];
  directionGeometry?: LinkDirectionGeometry;
}): Record<string, LabelPlacementResult> {
  const items: LabelPlacementItem[] = [];
  if (label) {
    items.push(centeredLabelItem('center', data, 'center', String(label), centerPoint, 54));
  }
  if (sourceLabel && sourceLabelLayout) {
    items.push(endpointLabelItem('source', data, sourceLabelLayout, endpoints));
  }
  if (targetLabel && targetLabelLayout) {
    items.push(endpointLabelItem('target', data, targetLabelLayout, endpoints));
  }
  if (directionGeometry) {
    for (const direction of directions) {
      const item = directionalLabelItem(
        direction,
        data,
        directionGeometry,
        String(data.directionLabelPlacement || 'center'),
        numeric(data.directionLabelOffset, 0)
      );
      if (item) items.push(item);
    }
  }

  const obstacles = [
    nodeObstacle('source-node', sourceBox, 6),
    nodeObstacle('target-node', targetBox, 6)
  ].filter(Boolean) as LabelPlacementObstacle[];

  return placeLabels(items, obstacles, 3);
}

export function directionLabelPoint(
  direction: LinkDirectionKey,
  geometry: LinkDirectionGeometry,
  placement: string,
  offset: number
) {
  const segment = linkDirectionSegment(geometry, direction);
  const base = placement === 'source'
    ? segment.start
    : placement === 'target'
      ? segment.end
      : segment.center;
  const directionMultiplier = direction === 'sourceToTarget' ? -1 : 1;
  return {
    x: base.x + segment.normal.x * offset * directionMultiplier,
    y: base.y + segment.normal.y * offset * directionMultiplier,
    angle: readableAngle(Math.atan2(segment.end.y - segment.start.y, segment.end.x - segment.start.x) * 180 / Math.PI)
  };
}

function readableAngle(angle: number): number {
  if (angle > 90) return angle - 180;
  if (angle < -90) return angle + 180;
  return angle;
}
