export const NODE_SHAPES = [
  'rectangle',
  'square',
  'circle',
  'ellipse',
  'triangle',
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
export type NodeShapeGeometryElement = 'circle' | 'ellipse' | 'path' | 'polygon' | 'rect';

export interface NodeShapeGeometry {
  element: NodeShapeGeometryElement;
  attributes: Record<string, string | number>;
}

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

function svgPointList(values: readonly [number, number][]): string {
  return values.map(([x, y]) => `${x},${y}`).join(' ');
}

export function nodeShapeGeometry(type: NodeShapeName, polygonPoints?: string): NodeShapeGeometry {
  switch (type) {
    case 'triangle':
      return { element: 'polygon', attributes: { points: svgPointList([[50, 0], [100, 100], [0, 100]]) } };
    case 'circle':
      return { element: 'circle', attributes: { cx: 50, cy: 50, r: 50 } };
    case 'square':
      return { element: 'rect', attributes: { x: 0, y: 0, width: 100, height: 100, rx: 2 } };
    case 'rectangle':
      return { element: 'rect', attributes: { x: 0, y: 0, width: 100, height: 100, rx: 2 } };
    case 'roundRectangle':
      return { element: 'rect', attributes: { x: 0, y: 0, width: 100, height: 100, rx: 13 } };
    case 'bottomRoundRectangle':
      return { element: 'path', attributes: { d: 'M0 0 H100 V72 Q100 100 72 100 H28 Q0 100 0 72 Z' } };
    case 'cutRectangle':
      return { element: 'polygon', attributes: { points: svgPointList([[18, 0], [100, 0], [100, 82], [82, 100], [0, 100], [0, 18]]) } };
    case 'barrel':
      return { element: 'path', attributes: { d: 'M18 0 C0 18 0 82 18 100 H82 C100 82 100 18 82 0 Z' } };
    case 'rhomboid':
      return { element: 'polygon', attributes: { points: svgPointList([[28, 0], [100, 0], [72, 100], [0, 100]]) } };
    case 'diamond':
      return { element: 'polygon', attributes: { points: svgPointList([[50, 0], [100, 50], [50, 100], [0, 50]]) } };
    case 'pentagon':
      return { element: 'polygon', attributes: { points: svgPointList([[50, 0], [100, 36], [82, 100], [18, 100], [0, 36]]) } };
    case 'hexagon':
      return { element: 'polygon', attributes: { points: svgPointList([[25, 0], [75, 0], [100, 50], [75, 100], [25, 100], [0, 50]]) } };
    case 'concaveHexagon':
      return { element: 'polygon', attributes: { points: svgPointList([[0, 0], [100, 0], [66, 50], [100, 100], [0, 100], [34, 50]]) } };
    case 'heptagon':
      return { element: 'polygon', attributes: { points: svgPointList([[50, 0], [86, 14], [100, 50], [78, 100], [22, 100], [0, 50], [14, 14]]) } };
    case 'octagon':
      return { element: 'polygon', attributes: { points: svgPointList([[30, 0], [70, 0], [100, 30], [100, 70], [70, 100], [30, 100], [0, 70], [0, 30]]) } };
    case 'star':
      return { element: 'polygon', attributes: { points: svgPointList([[50, 0], [63, 33], [100, 33], [70, 55], [82, 100], [50, 73], [18, 100], [30, 55], [0, 33], [37, 33]]) } };
    case 'tag':
      return { element: 'polygon', attributes: { points: svgPointList([[0, 0], [70, 0], [100, 50], [70, 100], [0, 100]]) } };
    case 'vee':
      return { element: 'polygon', attributes: { points: svgPointList([[0, 0], [50, 40], [100, 0], [78, 100], [50, 74], [22, 100]]) } };
    case 'polygon':
      return { element: 'polygon', attributes: { points: polygonPoints || svgPointList([[50, 0], [100, 50], [50, 100], [0, 50]]) } };
    case 'ellipse':
    default:
      return { element: 'ellipse', attributes: { cx: 50, cy: 50, rx: 50, ry: 50 } };
  }
}

export function nodeShapeGeometryToSvgElement(geometry: NodeShapeGeometry, attributes: Record<string, string | number> = {}): string {
  const merged = { ...geometry.attributes, ...attributes };
  const serializedAttributes = Object.entries(merged)
    .map(([key, value]) => `${key}="${String(value).replace(/"/g, '&quot;')}"`)
    .join(' ');
  return `<${geometry.element} ${serializedAttributes}/>`;
}
