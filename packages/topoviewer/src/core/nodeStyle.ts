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

export const nodeLayoutTypes = ['card'] as const;
export type NodeLayoutType = (typeof nodeLayoutTypes)[number];

export const nodeLayoutDirections = ['horizontal'] as const;
export type NodeLayoutDirection = (typeof nodeLayoutDirections)[number];

export const nodeLayoutIconPlacements = ['left'] as const;
export type NodeLayoutIconPlacement = (typeof nodeLayoutIconPlacements)[number];

export const nodeLayoutContentAlignments = ['left', 'center', 'right'] as const;
export type NodeLayoutContentAlign = (typeof nodeLayoutContentAlignments)[number];

export interface NodeLayoutCardStyle {
  type: 'card';
  direction: NodeLayoutDirection;
  icon: {
    placement: NodeLayoutIconPlacement;
    width: number;
    height: number;
    badgePlacement?: NodeBadgePosition;
  };
  content: {
    align: NodeLayoutContentAlign;
    titleField: string;
    subtitleField?: string;
  };
}

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

export function normalizeNodeLayoutType(value: unknown): NodeLayoutType | undefined {
  const normalized = normalizeLowerToken(value);
  return nodeLayoutTypes.includes(normalized as NodeLayoutType)
    ? normalized as NodeLayoutType
    : undefined;
}

export function normalizeNodeLayoutDirection(value: unknown): NodeLayoutDirection | undefined {
  const normalized = normalizeLowerToken(value);
  return nodeLayoutDirections.includes(normalized as NodeLayoutDirection)
    ? normalized as NodeLayoutDirection
    : undefined;
}

export function normalizeNodeLayoutIconPlacement(value: unknown): NodeLayoutIconPlacement | undefined {
  const normalized = normalizeLowerToken(value);
  return nodeLayoutIconPlacements.includes(normalized as NodeLayoutIconPlacement)
    ? normalized as NodeLayoutIconPlacement
    : undefined;
}

export function normalizeNodeLayoutContentAlign(value: unknown): NodeLayoutContentAlign | undefined {
  const normalized = normalizeLowerToken(value);
  return nodeLayoutContentAlignments.includes(normalized as NodeLayoutContentAlign)
    ? normalized as NodeLayoutContentAlign
    : undefined;
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function positiveOrDefault(value: unknown, fallback: number): number {
  const parsed = positiveNumber(value);
  return parsed === undefined || parsed <= 0 ? fallback : parsed;
}

export function normalizeNodeLayout(value: unknown): NodeLayoutCardStyle | undefined {
  const layout = recordValue(value);
  if (!layout || normalizeNodeLayoutType(layout.type) !== 'card') return undefined;

  const icon = recordValue(layout.icon) || {};
  const content = recordValue(layout.content) || {};
  const badgePlacement = normalizeNodeBadgePosition(icon.badgePlacement);
  const titleField = typeof content.titleField === 'string' && content.titleField.trim()
    ? content.titleField.trim()
    : 'name';
  const subtitleField = typeof content.subtitleField === 'string' && content.subtitleField.trim()
    ? content.subtitleField.trim()
    : undefined;

  return {
    type: 'card',
    direction: normalizeNodeLayoutDirection(layout.direction) || 'horizontal',
    icon: {
      placement: normalizeNodeLayoutIconPlacement(icon.placement) || 'left',
      width: positiveOrDefault(icon.width, 44),
      height: positiveOrDefault(icon.height, 44),
      badgePlacement
    },
    content: {
      align: normalizeNodeLayoutContentAlign(content.align) || 'left',
      titleField,
      subtitleField
    }
  };
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
