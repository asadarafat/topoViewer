import type { TaxiDirection } from './edgeStyle';

export interface EdgeEndpoints {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export interface EdgeRoute {
  path: string;
  labelX: number;
  labelY: number;
}

export interface ParallelBezierControlPointOptions {
  baseDistance?: number;
  laneCount: number;
  laneIndex: number;
  stepSize: number;
}

interface Point {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function parallelBezierControlPointDistance({
  baseDistance,
  laneCount,
  laneIndex,
  stepSize,
}: ParallelBezierControlPointOptions): number {
  const count = Math.max(1, Number.isFinite(laneCount) ? laneCount : 1);
  const index = clamp(Number.isFinite(laneIndex) ? laneIndex : 0, 0, count - 1);
  const base = baseDistance !== undefined && Number.isFinite(baseDistance) ? baseDistance : 0;
  const step = Number.isFinite(stepSize) ? stepSize : 0;
  return base + (index - (count - 1) / 2) * step;
}

function pointsToPath(points: Point[]): EdgeRoute {
  const [first, ...rest] = points;
  const path = [`M${first.x},${first.y}`, ...rest.map((point) => `L${point.x},${point.y}`)].join(' ');
  const labelPoint = pointAtHalfLength(points);
  return { path, labelX: labelPoint.x, labelY: labelPoint.y };
}

function pointAtHalfLength(points: Point[]): Point {
  if (points.length === 1) {
    return points[0];
  }

  const lengths: number[] = [];
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const length = Math.hypot(current.x - previous.x, current.y - previous.y);
    lengths.push(length);
    total += length;
  }

  if (total === 0) {
    return points[0];
  }

  const half = total / 2;
  let walked = 0;
  for (let index = 1; index < points.length; index += 1) {
    const length = lengths[index - 1];
    if (walked + length >= half) {
      const previous = points[index - 1];
      const current = points[index];
      const ratio = length === 0 ? 0 : (half - walked) / length;
      return {
        x: previous.x + (current.x - previous.x) * ratio,
        y: previous.y + (current.y - previous.y) * ratio,
      };
    }
    walked += length;
  }

  return points[points.length - 1];
}

export function applyEndpointSpacing<T extends EdgeEndpoints>(
  endpoints: T,
  sourceDistance = 0,
  targetDistance = 0,
  minLength = 8,
): T {
  const dx = endpoints.targetX - endpoints.sourceX;
  const dy = endpoints.targetY - endpoints.sourceY;
  const length = Math.hypot(dx, dy);
  if (length <= minLength || (sourceDistance <= 0 && targetDistance <= 0)) {
    return endpoints;
  }

  const available = Math.max(0, length - minLength);
  const requested = Math.max(0, sourceDistance) + Math.max(0, targetDistance);
  const scale = requested > available && requested > 0 ? available / requested : 1;
  const sourceInset = Math.max(0, sourceDistance) * scale;
  const targetInset = Math.max(0, targetDistance) * scale;
  const unitX = dx / length;
  const unitY = dy / length;

  return {
    ...endpoints,
    sourceX: endpoints.sourceX + unitX * sourceInset,
    sourceY: endpoints.sourceY + unitY * sourceInset,
    targetX: endpoints.targetX - unitX * targetInset,
    targetY: endpoints.targetY - unitY * targetInset,
  };
}

export function segmentRoute(
  endpoints: EdgeEndpoints,
  segmentDistances?: number[],
  segmentWeights?: number[],
): EdgeRoute | undefined {
  if (!segmentDistances?.length) {
    return undefined;
  }

  const dx = endpoints.targetX - endpoints.sourceX;
  const dy = endpoints.targetY - endpoints.sourceY;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return undefined;
  }

  const normalX = -dy / length;
  const normalY = dx / length;
  const weights = segmentWeights?.length ? segmentWeights : segmentDistances.map((_, index) => (index + 1) / (segmentDistances.length + 1));

  const points: Point[] = [{ x: endpoints.sourceX, y: endpoints.sourceY }];
  segmentDistances.forEach((distance, index) => {
    const weight = clamp(weights[index] ?? weights[weights.length - 1] ?? 0.5, 0, 1);
    points.push({
      x: endpoints.sourceX + dx * weight + normalX * distance,
      y: endpoints.sourceY + dy * weight + normalY * distance,
    });
  });
  points.push({ x: endpoints.targetX, y: endpoints.targetY });

  return pointsToPath(points);
}

export function taxiRoute(
  endpoints: EdgeEndpoints,
  direction: TaxiDirection = 'auto',
  taxiTurn?: number | string,
  taxiTurnMinDistance?: number,
): EdgeRoute | undefined {
  const dx = endpoints.targetX - endpoints.sourceX;
  const dy = endpoints.targetY - endpoints.sourceY;
  const distance = Math.hypot(dx, dy);
  if (distance === 0 || (taxiTurnMinDistance !== undefined && distance < taxiTurnMinDistance)) {
    return undefined;
  }

  const primary = normalizeTaxiPrimary(direction, dx, dy);
  const points =
    primary === 'vertical'
      ? verticalTaxiPoints(endpoints, direction, taxiTurn)
      : horizontalTaxiPoints(endpoints, direction, taxiTurn);

  return pointsToPath(points);
}

function normalizeTaxiPrimary(direction: TaxiDirection, dx: number, dy: number): 'horizontal' | 'vertical' {
  if (direction === 'horizontal' || direction === 'leftward' || direction === 'rightward') {
    return 'horizontal';
  }
  if (direction === 'vertical' || direction === 'upward' || direction === 'downward') {
    return 'vertical';
  }
  return Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
}

function verticalTaxiPoints(endpoints: EdgeEndpoints, direction: TaxiDirection, taxiTurn: number | string | undefined): Point[] {
  const turnY = directedTurnCoordinate(endpoints.sourceY, endpoints.targetY, direction, taxiTurn, 'vertical');
  return [
    { x: endpoints.sourceX, y: endpoints.sourceY },
    { x: endpoints.sourceX, y: turnY },
    { x: endpoints.targetX, y: turnY },
    { x: endpoints.targetX, y: endpoints.targetY },
  ];
}

function horizontalTaxiPoints(endpoints: EdgeEndpoints, direction: TaxiDirection, taxiTurn: number | string | undefined): Point[] {
  const turnX = directedTurnCoordinate(endpoints.sourceX, endpoints.targetX, direction, taxiTurn, 'horizontal');
  return [
    { x: endpoints.sourceX, y: endpoints.sourceY },
    { x: turnX, y: endpoints.sourceY },
    { x: turnX, y: endpoints.targetY },
    { x: endpoints.targetX, y: endpoints.targetY },
  ];
}

function directedTurnCoordinate(
  source: number,
  target: number,
  direction: TaxiDirection,
  taxiTurn: number | string | undefined,
  primary: 'horizontal' | 'vertical',
): number {
  const delta = target - source;
  const explicit = parseTaxiTurn(taxiTurn, delta);
  if (explicit !== undefined) {
    return source + explicit;
  }

  if ((primary === 'vertical' && direction === 'upward') || (primary === 'horizontal' && direction === 'leftward')) {
    return source - Math.max(40, Math.abs(delta) / 2);
  }
  if ((primary === 'vertical' && direction === 'downward') || (primary === 'horizontal' && direction === 'rightward')) {
    return source + Math.max(40, Math.abs(delta) / 2);
  }

  return source + delta / 2;
}

function parseTaxiTurn(value: number | string | undefined, delta: number): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    if (trimmed.endsWith('%')) {
      const percent = Number(trimmed.slice(0, -1));
      return Number.isFinite(percent) ? delta * (percent / 100) : undefined;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}
