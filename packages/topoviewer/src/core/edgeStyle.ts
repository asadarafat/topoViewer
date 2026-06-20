export const edgeArrowShapes = ['none', 'triangle', 'vee', 'tee', 'circle', 'diamond'] as const;
export type EdgeArrowShape = (typeof edgeArrowShapes)[number];

export const taxiDirections = [
  'auto',
  'vertical',
  'downward',
  'upward',
  'horizontal',
  'rightward',
  'leftward',
] as const;
export type TaxiDirection = (typeof taxiDirections)[number];

export function finiteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function positiveNumber(value: unknown): number | undefined {
  const parsed = finiteNumber(value);
  return parsed !== undefined && parsed >= 0 ? parsed : undefined;
}

export function numberList(value: unknown): number[] | undefined {
  if (Array.isArray(value)) {
    const parsed = value.map(finiteNumber);
    return parsed.every((entry): entry is number => entry !== undefined) ? parsed : undefined;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? [value] : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const parsed = trimmed
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(finiteNumber);
    return parsed.every((entry): entry is number => entry !== undefined) ? parsed : undefined;
  }
  return undefined;
}

export function stringList(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const parsed = value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry).trim()))
      .filter(Boolean);
    return parsed.length ? parsed : undefined;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    return trimmed.split(/[\s,]+/).filter(Boolean);
  }
  return undefined;
}

export function normalizeEdgeArrowShape(value: unknown): EdgeArrowShape | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return edgeArrowShapes.includes(normalized as EdgeArrowShape)
    ? (normalized as EdgeArrowShape)
    : undefined;
}

export function normalizeTaxiDirection(value: unknown): TaxiDirection | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  return taxiDirections.includes(normalized as TaxiDirection) ? (normalized as TaxiDirection) : undefined;
}

export function normalizeCurveStyleToken(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/[-_\s]/g, '')
    .toLowerCase();
}

export function normalizeGradientStops(
  colorsValue: unknown,
  positionsValue: unknown,
): { colors: string[]; positions?: string[] } | undefined {
  const colors = stringList(colorsValue);
  if (!colors || colors.length < 2) {
    return undefined;
  }

  const positions = stringList(positionsValue);
  if (!positions) {
    return { colors };
  }

  return positions.length === colors.length ? { colors, positions } : undefined;
}
