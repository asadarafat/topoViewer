import { positiveNumber } from './edgeStyle';

export const regionLabelPositions = [
  'topLeft',
  'topCenter',
  'topRight',
  'rightTop',
  'rightCenter',
  'rightBottom',
  'bottomRight',
  'bottomCenter',
  'bottomLeft',
  'leftTop',
  'leftCenter',
  'leftBottom',
] as const;

export type RegionLabelPosition = (typeof regionLabelPositions)[number];

function normalizeToken(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed[0].toLowerCase() + trimmed.slice(1);
}

export function normalizeRegionLabelPosition(value: unknown): RegionLabelPosition | undefined {
  const normalized = normalizeToken(value);
  return regionLabelPositions.includes(normalized as RegionLabelPosition)
    ? normalized as RegionLabelPosition
    : undefined;
}

export function regionLabelMargin(value: unknown): number | undefined {
  return positiveNumber(value);
}
