import { finiteNumber, numberList, positiveNumber } from './edgeStyle';

export const nodeLabelPositions = ['top', 'right', 'bottom', 'left', 'center'] as const;
export type NodeLabelPosition = (typeof nodeLabelPositions)[number];

export const nodeLabelTextWrapValues = ['none', 'wrap'] as const;
export type NodeLabelTextWrap = (typeof nodeLabelTextWrapValues)[number];

export const nodeLabelTextOverflowValues = ['clip', 'ellipsis'] as const;
export type NodeLabelTextOverflow = (typeof nodeLabelTextOverflowValues)[number];

export const nodeBorderStyles = ['solid', 'dashed', 'dotted'] as const;
export type NodeBorderStyle = (typeof nodeBorderStyles)[number];

export const nodeIconFitValues = ['contain', 'cover', 'fill'] as const;
export type NodeIconFit = (typeof nodeIconFitValues)[number];

export const nodeBadgePositions = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const;
export type NodeBadgePosition = (typeof nodeBadgePositions)[number];

export const nodeStatusPlacements = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'center'] as const;
export type NodeStatusPlacement = (typeof nodeStatusPlacements)[number];

function normalizeToken(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeLowerToken(value: unknown): string | undefined {
  return normalizeToken(value)?.toLowerCase();
}

function normalizeCamelToken(value: unknown): string | undefined {
  const token = normalizeToken(value);
  if (!token) return undefined;
  return token[0].toLowerCase() + token.slice(1);
}

export function normalizeNodeLabelPosition(value: unknown): NodeLabelPosition | undefined {
  const normalized = normalizeLowerToken(value);
  return nodeLabelPositions.includes(normalized as NodeLabelPosition)
    ? normalized as NodeLabelPosition
    : undefined;
}

export function normalizeNodeLabelTextWrap(value: unknown): NodeLabelTextWrap | undefined {
  const normalized = normalizeLowerToken(value);
  return nodeLabelTextWrapValues.includes(normalized as NodeLabelTextWrap)
    ? normalized as NodeLabelTextWrap
    : undefined;
}

export function normalizeNodeLabelTextOverflow(value: unknown): NodeLabelTextOverflow | undefined {
  const normalized = normalizeLowerToken(value);
  return nodeLabelTextOverflowValues.includes(normalized as NodeLabelTextOverflow)
    ? normalized as NodeLabelTextOverflow
    : undefined;
}

export function normalizeNodeBorderStyle(value: unknown): NodeBorderStyle | undefined {
  const normalized = normalizeLowerToken(value);
  return nodeBorderStyles.includes(normalized as NodeBorderStyle)
    ? normalized as NodeBorderStyle
    : undefined;
}

export function normalizeNodeIconFit(value: unknown): NodeIconFit | undefined {
  const normalized = normalizeLowerToken(value);
  return nodeIconFitValues.includes(normalized as NodeIconFit)
    ? normalized as NodeIconFit
    : undefined;
}

export function normalizeNodeBadgePosition(value: unknown): NodeBadgePosition | undefined {
  const normalized = normalizeCamelToken(value);
  return nodeBadgePositions.includes(normalized as NodeBadgePosition)
    ? normalized as NodeBadgePosition
    : undefined;
}

export function normalizeNodeStatusPlacement(value: unknown): NodeStatusPlacement | undefined {
  const normalized = normalizeCamelToken(value);
  return nodeStatusPlacements.includes(normalized as NodeStatusPlacement)
    ? normalized as NodeStatusPlacement
    : undefined;
}

export function opacityNumber(value: unknown): number | undefined {
  const parsed = finiteNumber(value);
  return parsed !== undefined && parsed >= 0 && parsed <= 1 ? parsed : undefined;
}

export function nonNegativeNumber(value: unknown): number | undefined {
  return positiveNumber(value);
}

export function nodeDashPattern(value: unknown): string | undefined {
  const numbers = numberList(value);
  if (numbers) return numbers.join(' ');
  return undefined;
}

export function dashPatternForBorderStyle(style: unknown): string | undefined {
  const normalized = normalizeNodeBorderStyle(style);
  if (normalized === 'dashed') return '8 5';
  if (normalized === 'dotted') return '1 5';
  return undefined;
}

export function worstSeverityColor(value: unknown): string | undefined {
  const severity = typeof value === 'string' ? value.toLowerCase() : undefined;
  if (severity === 'critical') return '#dc2626';
  if (severity === 'major') return '#f97316';
  if (severity === 'minor' || severity === 'warning') return '#f59e0b';
  if (severity === 'normal' || severity === 'up') return '#22c55e';
  return undefined;
}
