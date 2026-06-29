import type { LinkDirectionKey } from './types';

export interface LinkDirectionPoint {
  x: number;
  y: number;
}

export interface LinkDirectionSegmentGeometry {
  path: string;
  start: LinkDirectionPoint;
  end: LinkDirectionPoint;
  center: LinkDirectionPoint;
  normal: LinkDirectionPoint;
}

export interface LinkDirectionGeometry {
  sourceToTarget: LinkDirectionSegmentGeometry;
  targetToSource: LinkDirectionSegmentGeometry;
}

interface PathCommand {
  command: string;
  values: number[];
}

function isCommand(token: string): boolean {
  return /^[A-Za-z]$/.test(token);
}

function numeric(token: string | undefined): number | undefined {
  if (token === undefined) return undefined;
  const value = Number(token);
  return Number.isFinite(value) ? value : undefined;
}

function tokenizePath(path: string): string[] {
  return path.match(/[AaCcHhLlMmQqSsTtVvZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) || [];
}

function commandArity(command: string): number {
  const normalized = command.toUpperCase();
  if (normalized === 'H' || normalized === 'V') return 1;
  if (normalized === 'M' || normalized === 'L' || normalized === 'T') return 2;
  if (normalized === 'Q' || normalized === 'S') return 4;
  if (normalized === 'C') return 6;
  return 0;
}

function parsePathCommands(path: string): PathCommand[] {
  const tokens = tokenizePath(path);
  const commands: PathCommand[] = [];
  let index = 0;
  let activeCommand = '';

  while (index < tokens.length) {
    const token = tokens[index];
    if (isCommand(token)) {
      activeCommand = token;
      index += 1;
      if (activeCommand.toUpperCase() === 'Z') {
        commands.push({ command: activeCommand, values: [] });
        activeCommand = '';
      }
      continue;
    }
    if (!activeCommand) {
      index += 1;
      continue;
    }

    const arity = commandArity(activeCommand);
    if (arity === 0) {
      index += 1;
      continue;
    }

    const values = tokens.slice(index, index + arity).map(numeric);
    if (values.length < arity || values.some((value) => value === undefined)) break;
    commands.push({ command: activeCommand, values: values as number[] });
    index += arity;

    if (activeCommand === 'M') activeCommand = 'L';
    if (activeCommand === 'm') activeCommand = 'l';
  }

  return commands;
}

function pointToPath(points: LinkDirectionPoint[]): string {
  const [first, ...rest] = points;
  return [`M ${first.x},${first.y}`, ...rest.map((point) => `L ${point.x},${point.y}`)].join(' ');
}

function pointAtQuadratic(start: LinkDirectionPoint, control: LinkDirectionPoint, end: LinkDirectionPoint, t: number): LinkDirectionPoint {
  const inverse = 1 - t;
  return {
    x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
    y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y
  };
}

function pointAtCubic(
  start: LinkDirectionPoint,
  controlA: LinkDirectionPoint,
  controlB: LinkDirectionPoint,
  end: LinkDirectionPoint,
  t: number
): LinkDirectionPoint {
  const inverse = 1 - t;
  return {
    x: inverse ** 3 * start.x + 3 * inverse * inverse * t * controlA.x + 3 * inverse * t * t * controlB.x + t ** 3 * end.x,
    y: inverse ** 3 * start.y + 3 * inverse * inverse * t * controlA.y + 3 * inverse * t * t * controlB.y + t ** 3 * end.y
  };
}

function offsetPoint(point: LinkDirectionPoint, offset: LinkDirectionPoint): LinkDirectionPoint {
  return { x: point.x + offset.x, y: point.y + offset.y };
}

function distance(left: LinkDirectionPoint, right: LinkDirectionPoint): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function routeLength(points: LinkDirectionPoint[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distance(points[index - 1], points[index]);
  }
  return total;
}

function pointAtDistance(points: LinkDirectionPoint[], requested: number): LinkDirectionPoint {
  if (points.length <= 1) return points[0] || { x: 0, y: 0 };
  const total = routeLength(points);
  const target = Math.min(total, Math.max(0, requested));
  let walked = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const segmentLength = distance(previous, current);
    if (segmentLength === 0) continue;
    if (walked + segmentLength >= target) {
      const ratio = (target - walked) / segmentLength;
      return {
        x: previous.x + (current.x - previous.x) * ratio,
        y: previous.y + (current.y - previous.y) * ratio
      };
    }
    walked += segmentLength;
  }
  return points[points.length - 1];
}

function normalAtDistance(points: LinkDirectionPoint[], requested: number): LinkDirectionPoint {
  if (points.length <= 1) return { x: 0, y: 1 };
  const total = routeLength(points);
  const target = Math.min(total, Math.max(0, requested));
  let walked = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const segmentLength = distance(previous, current);
    if (segmentLength === 0) continue;
    if (walked + segmentLength >= target || index === points.length - 1) {
      const unitX = (current.x - previous.x) / segmentLength;
      const unitY = (current.y - previous.y) / segmentLength;
      return { x: -unitY, y: unitX };
    }
    walked += segmentLength;
  }
  return { x: 0, y: 1 };
}

function sliceIncreasing(points: LinkDirectionPoint[], startDistance: number, endDistance: number): LinkDirectionPoint[] {
  const total = routeLength(points);
  const start = Math.min(total, Math.max(0, startDistance));
  const end = Math.min(total, Math.max(start, endDistance));
  const output: LinkDirectionPoint[] = [pointAtDistance(points, start)];
  let walked = 0;

  for (let index = 1; index < points.length; index += 1) {
    const current = points[index];
    const segmentLength = distance(points[index - 1], current);
    const nextWalked = walked + segmentLength;
    if (nextWalked > start && nextWalked < end && segmentLength > 0) {
      output.push(current);
    }
    walked = nextWalked;
  }

  output.push(pointAtDistance(points, end));
  return output.filter((point, index, list) => index === 0 || distance(point, list[index - 1]) > 0.01);
}

function sliceRoute(points: LinkDirectionPoint[], startDistance: number, endDistance: number): LinkDirectionPoint[] {
  if (endDistance >= startDistance) return sliceIncreasing(points, startDistance, endDistance);
  return sliceIncreasing(points, endDistance, startDistance).reverse();
}

function segmentGeometry(points: LinkDirectionPoint[], startDistance: number, endDistance: number): LinkDirectionSegmentGeometry {
  const segmentPoints = sliceRoute(points, startDistance, endDistance);
  const centerDistance = (startDistance + endDistance) / 2;
  const start = segmentPoints[0];
  const end = segmentPoints[segmentPoints.length - 1];
  return {
    path: pointToPath(segmentPoints.length >= 2 ? segmentPoints : [start, end]),
    start,
    end,
    center: pointAtDistance(points, centerDistance),
    normal: normalAtDistance(points, centerDistance)
  };
}

export function pathToPolylinePoints(path: string, curveSamples = 24): LinkDirectionPoint[] {
  const commands = parsePathCommands(path);
  const points: LinkDirectionPoint[] = [];
  let current: LinkDirectionPoint = { x: 0, y: 0 };
  let start: LinkDirectionPoint = current;

  const push = (point: LinkDirectionPoint) => {
    current = point;
    if (!points.length || distance(points[points.length - 1], point) > 0.01) points.push(point);
  };

  commands.forEach(({ command, values }) => {
    const relative = command === command.toLowerCase();
    const normalized = command.toUpperCase();
    const absolute = (x: number, y: number): LinkDirectionPoint => relative ? { x: current.x + x, y: current.y + y } : { x, y };

    if (normalized === 'M') {
      const point = absolute(values[0], values[1]);
      push(point);
      start = point;
      return;
    }
    if (normalized === 'L') {
      push(absolute(values[0], values[1]));
      return;
    }
    if (normalized === 'H') {
      push(relative ? { x: current.x + values[0], y: current.y } : { x: values[0], y: current.y });
      return;
    }
    if (normalized === 'V') {
      push(relative ? { x: current.x, y: current.y + values[0] } : { x: current.x, y: values[0] });
      return;
    }
    if (normalized === 'Q') {
      const source = current;
      const control = absolute(values[0], values[1]);
      const end = absolute(values[2], values[3]);
      for (let sample = 1; sample <= curveSamples; sample += 1) {
        push(pointAtQuadratic(source, control, end, sample / curveSamples));
      }
      return;
    }
    if (normalized === 'C') {
      const source = current;
      const controlA = absolute(values[0], values[1]);
      const controlB = absolute(values[2], values[3]);
      const end = absolute(values[4], values[5]);
      for (let sample = 1; sample <= curveSamples; sample += 1) {
        push(pointAtCubic(source, controlA, controlB, end, sample / curveSamples));
      }
      return;
    }
    if (normalized === 'Z') {
      push(start);
    }
  });

  return points;
}

export function linkDirectionGeometryForPath(
  path: string,
  offset: LinkDirectionPoint,
  startGap: number,
  centerGap: number
): LinkDirectionGeometry | undefined {
  const points = pathToPolylinePoints(path).map((point) => offsetPoint(point, offset));
  const total = routeLength(points);
  if (points.length < 2 || total < 8) return undefined;

  const minStrokeLength = Math.min(18, Math.max(4, total / 8));
  const requestedStartGap = Math.max(0, startGap);
  const requestedCenterGap = Math.max(0, centerGap);
  const availableForGaps = Math.max(0, total - minStrokeLength * 2);
  const requestedGaps = requestedStartGap * 2 + requestedCenterGap;
  const scale = requestedGaps > availableForGaps && requestedGaps > 0 ? availableForGaps / requestedGaps : 1;
  const effectiveStartGap = requestedStartGap * scale;
  const effectiveCenterGap = requestedCenterGap * scale;
  const sourceEnd = Math.max(effectiveStartGap, total / 2 - effectiveCenterGap / 2);
  const targetEnd = Math.min(total - effectiveStartGap, total / 2 + effectiveCenterGap / 2);

  return {
    sourceToTarget: segmentGeometry(points, effectiveStartGap, sourceEnd),
    targetToSource: segmentGeometry(points, total - effectiveStartGap, targetEnd)
  };
}

export function linkDirectionSegment(
  geometry: LinkDirectionGeometry,
  direction: LinkDirectionKey
): LinkDirectionSegmentGeometry {
  return geometry[direction];
}

export function trimPolylinePathEnd(path: string, trimEnd: number): string {
  if (trimEnd <= 0) return path;
  const points = pathToPolylinePoints(path);
  const total = routeLength(points);
  if (points.length < 2 || total <= 1) return path;

  const visibleEnd = Math.max(1, total - trimEnd);
  return pointToPath(sliceIncreasing(points, 0, visibleEnd));
}
