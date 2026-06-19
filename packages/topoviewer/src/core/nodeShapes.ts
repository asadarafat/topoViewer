export const NODE_SHAPES = [
  'ellipse',
  'triangle',
  'rectangle',
  'roundRectangle',
  'bottomRoundRectangle',
  'cutRectangle',
  'barrel',
  'rhomboid',
  'diamond',
  'pentagon',
  'hexagon',
  'concaveHexagon',
  'heptagon',
  'octagon',
  'star',
  'tag',
  'vee',
  'polygon'
] as const;

export type NodeShapeName = typeof NODE_SHAPES[number];
export type NodeShapePoint = [number, number];

const NODE_SHAPE_SET = new Set<string>(NODE_SHAPES);

export interface ParsedNodeShapePoints {
  points?: NodeShapePoint[];
  error?: string;
}

export function normalizeNodeShape(value: unknown): NodeShapeName | undefined {
  if (typeof value !== 'string') return undefined;
  const shape = value.trim();
  return NODE_SHAPE_SET.has(shape) ? shape as NodeShapeName : undefined;
}

export function parseNodeShapePoints(value: unknown): ParsedNodeShapePoints {
  if (value === undefined || value === null || value === '') return {};
  const values = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.trim().split(/[\s,]+/).filter(Boolean)
      : undefined;

  if (!values) {
    return { error: 'shapePolygonPoints must be an array of numbers or a space-separated string.' };
  }

  const numbers = values.map((entry) => typeof entry === 'number' ? entry : Number(entry));
  if (numbers.some((entry) => !Number.isFinite(entry))) {
    return { error: 'shapePolygonPoints must contain only finite numbers.' };
  }
  if (numbers.length < 6 || numbers.length % 2 !== 0) {
    return { error: 'shapePolygonPoints must contain at least three x/y pairs.' };
  }
  if (numbers.some((entry) => entry < -1 || entry > 1)) {
    return { error: 'shapePolygonPoints values must be in the [-1, 1] coordinate space.' };
  }

  const points: NodeShapePoint[] = [];
  for (let index = 0; index < numbers.length; index += 2) {
    points.push([numbers[index], numbers[index + 1]]);
  }
  return { points };
}

export function nodeShapePointsToSvg(points: readonly NodeShapePoint[] | undefined): string | undefined {
  if (!points?.length) return undefined;
  return points
    .map(([x, y]) => `${50 + x * 40},${50 + y * 40}`)
    .join(' ');
}
