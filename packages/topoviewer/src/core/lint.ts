import {
  edgeArrowShapes,
  finiteNumber,
  normalizeEdgeArrowShape,
  normalizeGradientStops,
  normalizeTaxiDirection,
  numberList,
  positiveNumber,
  stringList,
  taxiDirections,
} from './edgeStyle';
import { analyzeClosLayoutDiagnostics } from './closLayout';
import { rendererLimitViolations } from './limits';
import { normalizeNodeShape, parseNodeShapePoints } from './nodeShapes';
import {
  nodeBadgePositions,
  nodeBorderStyles,
  nodeIconFitValues,
  nodeLayoutContentAlignments,
  nodeLayoutDirections,
  nodeLayoutIconPlacements,
  nodeLayoutTypes,
  nodeLabelPositions,
  nodeLabelTextOverflowValues,
  nodeLabelTextWrapValues,
  nodeStatusPlacements,
  normalizeNodeLayout,
  normalizeNodeLayoutContentAlign,
  normalizeNodeLayoutDirection,
  normalizeNodeLayoutIconPlacement,
  normalizeNodeLayoutType,
  normalizeNodeBadgePosition,
  normalizeNodeBorderStyle,
  normalizeNodeIconFit,
  normalizeNodeLabelPosition,
  normalizeNodeLabelTextOverflow,
  normalizeNodeLabelTextWrap,
  normalizeNodeStatusPlacement,
  opacityNumber,
  nonNegativeNumber,
  nodeDashPattern,
} from './nodeStyle';
import { regionLabelMargin, regionLabelPositions, normalizeRegionLabelPosition } from './regionStyle';
import { selectorMatches } from './selector';
import { applyStyle } from './style';
import { canonicalStyleKeyByLowercase, isColorStyleKey } from './styleDefaults';
import { LINK_DIRECTION_KEYS, type LinkDirectionKey } from './types';
import type { DiagramCallout, DiagramConnector, GraphEntity, GraphLink, GraphLinkDirection, GraphNode, GraphPath, StyleRule, TopoDocument } from './types';
import { validateTopoDocument } from './validation';

const directionLabelPlacements = ['center', 'source', 'target', 'outside'];
const directionLabelRotations = ['none', 'auto', 'true', 'false'];

export type LintSeverity = 'error' | 'warning';

export interface LintIssue {
  severity: LintSeverity;
  code: string;
  message: string;
  path?: string;
}

export interface LintOptions {
  requireNames?: boolean;
}

function issue(severity: LintSeverity, code: string, message: string, path?: string): LintIssue {
  return { severity, code, message, path };
}

const unsafeTextControlPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069\uFFFD]/;

function unsafeTextIssues(value: unknown, path: string): LintIssue[] {
  if (typeof value === 'string') {
    return unsafeTextControlPattern.test(value)
      ? [issue('error', 'unsafe-text-control', 'Text contains a null byte, control character, bidi control, or invalid UTF-8 replacement character.', path)]
      : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => unsafeTextIssues(item, `${path}[${index}]`));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => unsafeTextIssues(item, `${path}.${key}`));
  }
  return [];
}

function addEntity(
  seen: Map<string, string>,
  issues: LintIssue[],
  kind: string,
  entity: GraphEntity,
  path: string,
  requireNames: boolean
) {
  const existing = seen.get(entity.id);
  if (existing) {
    issues.push(issue('error', 'duplicate-id', `Duplicate id "${entity.id}" used by ${existing} and ${kind}.`, path));
  } else {
    seen.set(entity.id, kind);
  }

  if (requireNames && !entity.name) {
    issues.push(issue('warning', 'missing-name', `${kind} "${entity.id}" should define name for readable labels, tooltips, and exports.`, path));
  }

  const record = entity as unknown as Record<string, unknown>;
  ['id', 'name', 'label', 'labels', 'data'].forEach((key) => {
    issues.push(...unsafeTextIssues(record[key], `${path}.${key}`));
  });
}

function objectLayerIssues(entity: GraphEntity, knownLayers: Set<string>, path: string): LintIssue[] {
  return (entity.layers || []).flatMap((layer) => (
    knownLayers.has(layer)
      ? []
      : [issue('error', 'unknown-layer', `Entity "${entity.id}" references unknown layer "${layer}".`, `${path}.layers`)]
  ));
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function layerMembershipIssues(kind: string, entity: GraphEntity, path: string): LintIssue[] {
  if (entity.layers?.length) return [];
  return [issue('warning', `missing-${kind}-layers`, `${titleCase(kind)} "${entity.id}" will not render until it declares at least one layer.`, `${path}.layers`)];
}

function styleKeyIssues(style: Record<string, unknown> | undefined, path: string): LintIssue[] {
  if (!style || typeof style !== 'object') return [];
  return Object.keys(style).flatMap((key) => {
    const issues: LintIssue[] = [];
    if (key.includes('-')) {
      issues.push(issue('error', 'non-canonical-style-key', `Style key "${key}" is not supported; use camelCase style keys.`, `${path}.${key}`));
      return issues;
    }
    const canonicalKey = canonicalStyleKeyByLowercase.get(key.toLowerCase());
    if (canonicalKey && canonicalKey !== key) {
      issues.push(issue('error', 'non-canonical-style-key', `Style key "${key}" is not supported; use "${canonicalKey}".`, `${path}.${key}`));
    }
    if (
      (
        key === 'labelZIndex'
        || key === 'sourceLabelZIndex'
        || key === 'targetLabelZIndex'
      )
      && finiteNumber(style[key]) === undefined
    ) {
      issues.push(issue('error', 'invalid-label-z-index', `${key} must be a finite number.`, `${path}.${key}`));
    }
    if (style[key] === null && isColorStyleKey(key)) {
      issues.push(issue(
        'error',
        'invalid-style-color',
        `${key} is empty. Quote hex colors in YAML, for example '${key}: "#d19d02ff"'.`,
        `${path}.${key}`
      ));
    }
    return issues;
  });
}

function selectorKind(selector: string): string {
  return selector.trim().match(/^[a-zA-Z][\w-]*/)?.[0] || '';
}

function selectorIsBareKind(selector: string): boolean {
  return /^[a-zA-Z][\w-]*$/.test(selector.trim());
}

function nodeAspectDimensionIssues(style: Record<string, unknown> | undefined, path: string): LintIssue[] {
  if (!style || typeof style !== 'object') return [];
  const shape = normalizeNodeShape(style.shape);
  const width = finiteNumber(style.width);
  const height = finiteNumber(style.height);
  if ((shape === 'circle' || shape === 'square') && width !== undefined && height !== undefined && width !== height) {
    return [issue(
      'error',
      'invalid-node-aspect-dimensions',
      `shape: ${shape} requires equal width and height. Use equal dimensions, omit one dimension, or use shape: ${shape === 'circle' ? 'ellipse' : 'rectangle'} for a stretched body.`,
      `${path}.height`
    )];
  }
  return [];
}

function nodeShapeStyleIssues(style: Record<string, unknown> | undefined, path: string): LintIssue[] {
  if (!style || typeof style !== 'object') return [];
  const issues: LintIssue[] = [];
  const shape = normalizeNodeShape(style.shape);
  if (style.shape !== undefined && !shape) {
    issues.push(issue(
      'error',
      'unsupported-node-shape',
      `Node shape "${String(style.shape)}" is not supported; use a canonical TopoViewer node shape value.`,
      `${path}.shape`
    ));
  }
  issues.push(...nodeAspectDimensionIssues(style, path));
  const polygonPoints = parseNodeShapePoints(style.shapePolygonPoints);
  if (polygonPoints.error) {
    issues.push(issue('error', 'invalid-node-shape-polygon', polygonPoints.error, `${path}.shapePolygonPoints`));
  }
  return issues;
}

function plainRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function nodeLayoutValueIssues(style: Record<string, unknown>, path: string): LintIssue[] {
  if (style.nodeLayout === undefined) return [];
  const layout = plainRecord(style.nodeLayout);
  if (!layout) {
    return [issue('error', 'invalid-node-layout', 'nodeLayout must be an object.', `${path}.nodeLayout`)];
  }

  const issues: LintIssue[] = [];
  if (!normalizeNodeLayoutType(layout.type)) {
    issues.push(issue(
      'error',
      'unsupported-node-layout-type',
      `nodeLayout.type "${String(layout.type)}" is not supported; use one of ${nodeLayoutTypes.join(', ')}.`,
      `${path}.nodeLayout.type`
    ));
  }
  if (layout.direction !== undefined && !normalizeNodeLayoutDirection(layout.direction)) {
    issues.push(issue(
      'error',
      'unsupported-node-layout-direction',
      `nodeLayout.direction "${String(layout.direction)}" is not supported; use one of ${nodeLayoutDirections.join(', ')}.`,
      `${path}.nodeLayout.direction`
    ));
  }

  const icon = plainRecord(layout.icon);
  if (layout.icon !== undefined && !icon) {
    issues.push(issue('error', 'invalid-node-layout-icon', 'nodeLayout.icon must be an object.', `${path}.nodeLayout.icon`));
  }
  if (icon) {
    if (icon.placement !== undefined && !normalizeNodeLayoutIconPlacement(icon.placement)) {
      issues.push(issue(
        'error',
        'unsupported-node-layout-icon-placement',
        `nodeLayout.icon.placement "${String(icon.placement)}" is not supported; use one of ${nodeLayoutIconPlacements.join(', ')}.`,
        `${path}.nodeLayout.icon.placement`
      ));
    }
    ['width', 'height'].forEach((key) => {
      if (icon[key] !== undefined && positiveNumber(icon[key]) === undefined) {
        issues.push(issue('error', 'invalid-node-layout-icon-size', `nodeLayout.icon.${key} must be a positive number.`, `${path}.nodeLayout.icon.${key}`));
      }
    });
    if (icon.badgePlacement !== undefined) {
      issues.push(issue(
        'error',
        'unsupported-node-layout-icon-badge-placement',
        'nodeLayout.icon.badgePlacement is not supported; use node-level badgePosition for card shell badges.',
        `${path}.nodeLayout.icon.badgePlacement`
      ));
    }
  }

  const content = plainRecord(layout.content);
  if (layout.content !== undefined && !content) {
    issues.push(issue('error', 'invalid-node-layout-content', 'nodeLayout.content must be an object.', `${path}.nodeLayout.content`));
  }
  if (content) {
    if (content.align !== undefined && !normalizeNodeLayoutContentAlign(content.align)) {
      issues.push(issue(
        'error',
        'unsupported-node-layout-content-align',
        `nodeLayout.content.align "${String(content.align)}" is not supported; use one of ${nodeLayoutContentAlignments.join(', ')}.`,
        `${path}.nodeLayout.content.align`
      ));
    }
    ['titleField', 'subtitleField'].forEach((key) => {
      if (content[key] !== undefined && (typeof content[key] !== 'string' || !String(content[key]).trim())) {
        issues.push(issue('error', 'invalid-node-layout-field', `nodeLayout.content.${key} must be a non-empty field path string.`, `${path}.nodeLayout.content.${key}`));
      }
    });
  }

  return issues;
}

function nodeLayoutShapeIssues(style: Record<string, unknown> | undefined, path: string): LintIssue[] {
  if (!style || typeof style !== 'object' || !normalizeNodeLayout(style.nodeLayout)) return [];
  const shape = normalizeNodeShape(style.shape);
  if (shape === 'roundRectangle') return [];
  return [issue(
    'error',
    'invalid-node-card-layout-shape',
    'nodeLayout.type: card requires the effective node style to set shape: roundRectangle.',
    `${path}.nodeLayout`
  )];
}

function enumStyleIssue(
  style: Record<string, unknown>,
  key: string,
  path: string,
  code: string,
  values: readonly string[],
  normalize: (value: unknown) => unknown
): LintIssue[] {
  if (style[key] === undefined || normalize(style[key])) return [];
  return [issue(
    'error',
    code,
    `${key} "${String(style[key])}" is not supported; use one of ${values.join(', ')}.`,
    `${path}.${key}`
  )];
}

function opacityStyleIssue(style: Record<string, unknown>, key: string, path: string): LintIssue[] {
  if (style[key] === undefined || opacityNumber(style[key]) !== undefined) return [];
  return [issue('error', 'invalid-node-opacity', `${key} must be a number between 0 and 1.`, `${path}.${key}`)];
}

function nodeNonNegativeNumberIssue(style: Record<string, unknown>, key: string, path: string): LintIssue[] {
  if (style[key] === undefined || nonNegativeNumber(style[key]) !== undefined) return [];
  return [issue('error', 'invalid-node-style-number', `${key} must be a non-negative number.`, `${path}.${key}`)];
}

function nodeStyleIssues(style: Record<string, unknown> | undefined, path: string): LintIssue[] {
  if (!style || typeof style !== 'object') return [];
  const issues: LintIssue[] = [
    ...nodeShapeStyleIssues(style, path),
    ...enumStyleIssue(style, 'labelPosition', path, 'unsupported-node-label-position', nodeLabelPositions, normalizeNodeLabelPosition),
    ...enumStyleIssue(style, 'labelTextWrap', path, 'unsupported-node-label-wrap', nodeLabelTextWrapValues, normalizeNodeLabelTextWrap),
    ...enumStyleIssue(style, 'labelTextOverflow', path, 'unsupported-node-label-overflow', nodeLabelTextOverflowValues, normalizeNodeLabelTextOverflow),
    ...enumStyleIssue(style, 'borderStyle', path, 'unsupported-node-border-style', nodeBorderStyles, normalizeNodeBorderStyle),
    ...enumStyleIssue(style, 'iconFit', path, 'unsupported-node-icon-fit', nodeIconFitValues, normalizeNodeIconFit),
    ...enumStyleIssue(style, 'badgePosition', path, 'unsupported-node-badge-position', nodeBadgePositions, normalizeNodeBadgePosition),
    ...enumStyleIssue(style, 'statusPlacement', path, 'unsupported-node-status-placement', nodeStatusPlacements, normalizeNodeStatusPlacement),
    ...nodeLayoutValueIssues(style, path)
  ];

  [
    'labelBackgroundOpacity',
    'labelOpacity',
    'borderOpacity',
    'outlineOpacity',
    'underlayOpacity',
    'iconOpacity'
  ].forEach((key) => {
    issues.push(...opacityStyleIssue(style, key, path));
  });

  [
    'labelTextMaxWidth',
    'labelBorderWidth',
    'labelPadding',
    'minZoomedLabelFontSize',
    'outlineWidth',
    'underlayPadding',
    'iconPadding',
    'badgeBorderWidth',
    'badgeFontSize',
    'badgeMinWidth',
    'badgeMinHeight',
    'badgePadding',
    'badgeOffset',
    'statusSize'
  ].forEach((key) => {
    issues.push(...nodeNonNegativeNumberIssue(style, key, path));
  });

  ['labelXOffset', 'labelYOffset'].forEach((key) => {
    if (style[key] !== undefined && finiteNumber(style[key]) === undefined) {
      issues.push(issue('error', 'invalid-node-style-number', `${key} must be a finite number.`, `${path}.${key}`));
    }
  });

  if (style.borderDashPattern !== undefined && nodeDashPattern(style.borderDashPattern) === undefined) {
    issues.push(issue('error', 'invalid-node-border-dash-pattern', 'borderDashPattern must be a number or list of numbers.', `${path}.borderDashPattern`));
  }

  if (style.badgeLabel !== undefined && String(style.badgeLabel).length > 12) {
    issues.push(issue('warning', 'long-node-badge-label', 'badgeLabel should be short enough to fit inside a compact node badge.', `${path}.badgeLabel`));
  }

  return issues;
}

function regionStyleIssues(style: Record<string, unknown> | undefined, path: string): LintIssue[] {
  if (!style || typeof style !== 'object') return [];
  const issues: LintIssue[] = [
    ...enumStyleIssue(style, 'labelPosition', path, 'unsupported-region-label-position', regionLabelPositions, normalizeRegionLabelPosition)
  ];

  if (style.labelMargin !== undefined && regionLabelMargin(style.labelMargin) === undefined) {
    issues.push(issue('error', 'invalid-region-label-margin', 'labelMargin must be a non-negative number.', `${path}.labelMargin`));
  }

  return issues;
}

function isValidTaxiTurn(value: unknown): boolean {
  if (value === undefined) return true;
  if (finiteNumber(value) !== undefined) return true;
  if (typeof value === 'string' && /^\s*-?\d+(\.\d+)?%\s*$/.test(value)) return true;
  return false;
}

function nonNegativeNumberIssue(
  style: Record<string, unknown>,
  key: string,
  path: string,
  code: string,
  label: string,
): LintIssue[] {
  return style[key] !== undefined && positiveNumber(style[key]) === undefined
    ? [issue('error', code, `${label} "${String(style[key])}" must be a non-negative number.`, `${path}.${key}`)]
    : [];
}

function edgeStyleIssues(style: Record<string, unknown> | undefined, path: string): LintIssue[] {
  if (!style || typeof style !== 'object') return [];
  const issues: LintIssue[] = [];

  (['sourceArrowShape', 'targetArrowShape'] as const).forEach((key) => {
    if (style[key] !== undefined && !normalizeEdgeArrowShape(style[key])) {
      issues.push(issue(
        'error',
        'unsupported-edge-arrow-shape',
        `Edge arrow shape "${String(style[key])}" is not supported; use one of ${edgeArrowShapes.join(', ')}.`,
        `${path}.${key}`
      ));
    }
  });

  ['sourceArrowSize', 'targetArrowSize'].forEach((key) => {
    issues.push(...nonNegativeNumberIssue(style, key, path, 'invalid-edge-arrow-size', 'Edge arrow size'));
  });

  ['sourceArrowBorderWidth', 'targetArrowBorderWidth'].forEach((key) => {
    issues.push(...nonNegativeNumberIssue(style, key, path, 'invalid-edge-arrow-border-width', 'Edge arrow border width'));
  });

  ['sourceArrowOffset', 'targetArrowOffset'].forEach((key) => {
    if (style[key] !== undefined && finiteNumber(style[key]) === undefined) {
      issues.push(issue('error', 'invalid-edge-arrow-offset', `Edge arrow offset "${String(style[key])}" must be a finite number.`, `${path}.${key}`));
    }
  });

  [
    'labelXOffset',
    'labelYOffset',
    'sourceLabelXOffset',
    'sourceLabelYOffset',
    'targetLabelXOffset',
    'targetLabelYOffset',
    'endpointLabelSideOffset',
    'sourceLabelSideOffset',
    'targetLabelSideOffset'
  ].forEach((key) => {
    if (style[key] !== undefined && finiteNumber(style[key]) === undefined) {
      issues.push(issue('error', 'invalid-edge-label-offset', `${key} must be a finite number.`, `${path}.${key}`));
    }
  });

  ['endpointLabelDistance', 'endpointLabelMaxDistance', 'sourceLabelDistance', 'sourceLabelMaxDistance', 'targetLabelDistance', 'targetLabelMaxDistance'].forEach((key) => {
    issues.push(...nonNegativeNumberIssue(style, key, path, 'invalid-edge-label-distance', 'Edge endpoint label distance'));
  });

  ['endpointLabelAutoPosition', 'sourceLabelAutoPosition', 'targetLabelAutoPosition'].forEach((key) => {
    if (style[key] !== undefined && typeof style[key] !== 'boolean') {
      issues.push(issue('error', 'invalid-edge-label-auto-position', `${key} must be a boolean.`, `${path}.${key}`));
    }
  });

  ['endpointLabelOverlayLayer', 'sourceLabelOverlayLayer', 'targetLabelOverlayLayer', 'directionOverlayLayer'].forEach((key) => {
    if (style[key] !== undefined && (typeof style[key] !== 'string' || !style[key])) {
      issues.push(issue('error', 'invalid-edge-overlay-layer', `${key} must be a non-empty toggle ID.`, `${path}.${key}`));
    }
  });

  ['sourceLabelOpacity', 'targetLabelOpacity'].forEach((key) => {
    if (style[key] !== undefined) {
      const opacity = finiteNumber(style[key]);
      if (opacity === undefined || opacity < 0 || opacity > 1) {
        issues.push(issue('error', 'invalid-edge-label-opacity', `${key} must be a number between 0 and 1.`, `${path}.${key}`));
      }
    }
  });

  ['sourceDistanceFromNode', 'targetDistanceFromNode'].forEach((key) => {
    issues.push(...nonNegativeNumberIssue(style, key, path, 'invalid-edge-endpoint-distance', 'Edge endpoint distance'));
  });

  ['directionCenterGap', 'directionStartGap'].forEach((key) => {
    issues.push(...nonNegativeNumberIssue(style, key, path, 'invalid-link-direction-gap', 'Link direction gap'));
  });

  if (style.directionalStrokes !== undefined && typeof style.directionalStrokes !== 'boolean') {
    issues.push(issue('error', 'invalid-link-direction-strokes', 'directionalStrokes must be a boolean.', `${path}.directionalStrokes`));
  }

  if (
    style.directionLabelPlacement !== undefined
    && !directionLabelPlacements.includes(String(style.directionLabelPlacement))
  ) {
    issues.push(issue('error', 'invalid-link-direction-label-placement', `directionLabelPlacement must be one of ${directionLabelPlacements.join(', ')}.`, `${path}.directionLabelPlacement`));
  }

  if (style.directionLabelOffset !== undefined && finiteNumber(style.directionLabelOffset) === undefined) {
    issues.push(issue('error', 'invalid-link-direction-label-offset', 'directionLabelOffset must be a finite number.', `${path}.directionLabelOffset`));
  }
  if (
    style.directionLabelRotation !== undefined
    && !directionLabelRotations.includes(String(style.directionLabelRotation))
  ) {
    issues.push(issue('error', 'invalid-link-direction-label-rotation', `directionLabelRotation must be one of ${directionLabelRotations.join(', ')}.`, `${path}.directionLabelRotation`));
  }

  const segmentDistances = numberList(style.segmentDistances);
  const segmentWeights = numberList(style.segmentWeights);
  if (style.segmentDistances !== undefined && !segmentDistances) {
    issues.push(issue('error', 'invalid-edge-segment-controls', 'segmentDistances must be a number or list of numbers.', `${path}.segmentDistances`));
  }
  if (style.segmentWeights !== undefined && !segmentWeights) {
    issues.push(issue('error', 'invalid-edge-segment-controls', 'segmentWeights must be a number or list of numbers.', `${path}.segmentWeights`));
  }
  if (segmentDistances && segmentWeights && segmentDistances.length !== segmentWeights.length) {
    issues.push(issue('error', 'invalid-edge-segment-controls', 'segmentDistances and segmentWeights must contain the same number of entries.', `${path}.segmentWeights`));
  }

  if (style.taxiDirection !== undefined && !normalizeTaxiDirection(style.taxiDirection)) {
    issues.push(issue(
      'error',
      'invalid-edge-taxi-direction',
      `taxiDirection "${String(style.taxiDirection)}" is not supported; use one of ${taxiDirections.join(', ')}.`,
      `${path}.taxiDirection`
    ));
  }
  if (!isValidTaxiTurn(style.taxiTurn)) {
    issues.push(issue('error', 'invalid-edge-taxi-turn', 'taxiTurn must be a number or percentage string.', `${path}.taxiTurn`));
  }
  issues.push(...nonNegativeNumberIssue(style, 'taxiTurnMinDistance', path, 'invalid-edge-taxi-distance', 'taxiTurnMinDistance'));

  if (style.lineFill !== undefined && style.lineFill !== 'solid' && style.lineFill !== 'linearGradient') {
    issues.push(issue('error', 'invalid-edge-gradient', 'lineFill must be solid or linearGradient.', `${path}.lineFill`));
  }
  if (style.lineFill === 'linearGradient') {
    const colors = stringList(style.lineGradientStopColors);
    const positions = stringList(style.lineGradientStopPositions);
    if (!colors || colors.length < 2) {
      issues.push(issue('error', 'invalid-edge-gradient', 'lineGradientStopColors must provide at least two colors when lineFill is linearGradient.', `${path}.lineGradientStopColors`));
    } else if (positions && positions.length !== colors.length) {
      issues.push(issue('error', 'invalid-edge-gradient', 'lineGradientStopPositions must contain the same number of entries as lineGradientStopColors.', `${path}.lineGradientStopPositions`));
    } else if (!normalizeGradientStops(style.lineGradientStopColors, style.lineGradientStopPositions)) {
      issues.push(issue('error', 'invalid-edge-gradient', 'lineGradientStopColors and lineGradientStopPositions are not a valid linear gradient definition.', `${path}.lineGradientStopColors`));
    }
  }

  (['interactive', 'labelInteractive'] as const).forEach((key) => {
    if (style[key] !== undefined && typeof style[key] !== 'boolean') {
      issues.push(issue('error', 'invalid-edge-interaction-flag', `${key} must be a boolean.`, `${path}.${key}`));
    }
  });

  return issues;
}

function hasSequence(path: GraphPath): path is GraphPath & { sequence: string[] } {
  return Array.isArray(path.sequence) && path.sequence.length >= 2;
}

function layoutDiagnosticLinks(links: GraphLink[], paths: GraphPath[]): GraphLink[] {
  return [
    ...links,
    ...paths.flatMap((path) => {
      if (hasSequence(path)) {
        return path.sequence.slice(0, -1).map((source, index) => ({
          ...path,
          id: `${path.id}:${index}`,
          source,
          target: path.sequence[index + 1]
        }));
      }
      return path.source && path.target ? [{ ...path, source: path.source, target: path.target }] : [];
    })
  ];
}

function hasCalloutBox(callout: DiagramCallout): boolean {
  return !!(callout.position || callout.title || callout.body || callout.markdown);
}

function addPinOwners(pinIdsByOwner: Map<string, Set<string>>, owner: { id: string; pins?: Array<{ id: string }> }) {
  if (!owner.pins?.length) return;
  pinIdsByOwner.set(owner.id, new Set(owner.pins.map((pin) => pin.id)));
}

function handleCapability(value: unknown): Array<'source' | 'target'> {
  if (value === 'source') return ['source'];
  if (value === 'target') return ['target'];
  return ['source', 'target'];
}

function addNodeHandleOwners(handleIdsByNode: Map<string, Map<string, Set<'source' | 'target'>>>, node: GraphNode) {
  if (!node.handles?.length) return;
  const handles = new Map<string, Set<'source' | 'target'>>();
  node.handles.forEach((handle) => {
    if (!handle?.id) return;
    const capabilities = handles.get(handle.id) || new Set<'source' | 'target'>();
    handleCapability(handle.type).forEach((type) => capabilities.add(type));
    handles.set(handle.id, capabilities);
  });
  handleIdsByNode.set(node.id, handles);
}

function nodeHandleIssues(node: GraphNode, nodeIndex: number): LintIssue[] {
  if (!node.handles?.length) return [];
  const issues: LintIssue[] = [];
  const seen = new Set<string>();
  node.handles.forEach((handle, handleIndex) => {
    const path = `graph.nodes[${nodeIndex}].handles[${handleIndex}]`;
    if (seen.has(handle.id)) {
      issues.push(issue('error', 'duplicate-node-handle', `Node "${node.id}" defines duplicate handle "${handle.id}".`, `${path}.id`));
    }
    seen.add(handle.id);
    if (handle.offset !== undefined && (handle.offset < 0 || handle.offset > 100)) {
      issues.push(issue('warning', 'node-handle-offset-clamped', `Node "${node.id}" handle "${handle.id}" offset will be clamped to the 0-100 range.`, `${path}.offset`));
    }
  });
  return issues;
}

function linkHandleReferenceIssue(
  link: GraphLink,
  linkIndex: number,
  endpoint: 'source' | 'target',
  handleId: string | undefined,
  nodeId: string,
  handleIdsByNode: Map<string, Map<string, Set<'source' | 'target'>>>
): LintIssue[] {
  if (!handleId) return [];
  const handles = handleIdsByNode.get(nodeId);
  const capabilities = handles?.get(handleId);
  if (capabilities?.has(endpoint)) return [];
  return [issue(
    'error',
    `broken-${endpoint}-handle`,
    `Link "${link.id}" ${endpoint}Handle "${handleId}" does not exist as a ${endpoint}-capable handle on node "${nodeId}".`,
    `graph.links[${linkIndex}].${endpoint}Handle`
  )];
}

function visualAnchorIssues(kind: string, id: string, endpoint: 'source' | 'target', ownerId: string | undefined, visualAnchorIds: Set<string>, path: string): LintIssue[] {
  if (!ownerId || visualAnchorIds.has(ownerId)) return [];
  return [issue('error', `broken-${kind}-${endpoint}`, `${titleCase(kind)} "${id}" ${endpoint} "${ownerId}" does not exist as a visual anchor.`, `${path}.${endpoint}`)];
}

function pinReferenceIssues(
  kind: string,
  id: string,
  endpoint: 'source' | 'target',
  ownerId: string | undefined,
  pinId: string | undefined,
  visualAnchorIds: Set<string>,
  pinIdsByOwner: Map<string, Set<string>>,
  path: string
): LintIssue[] {
  if (!ownerId || !pinId || !visualAnchorIds.has(ownerId)) return [];
  if (pinIdsByOwner.get(ownerId)?.has(pinId)) return [];
  return [issue('error', `broken-${kind}-${endpoint}-pin`, `${titleCase(kind)} "${id}" ${endpoint} pin "${pinId}" does not exist on "${ownerId}".`, `${path}.${endpoint}Pin`)];
}

function ownerNodeId(nodeId: string, nodeParents: Map<string, string>): string {
  return nodeParents.get(nodeId) || nodeId;
}

function endpointMatchesParentPathEndpoint(endpoint: string | undefined, parentEndpoint: string, nodeParents: Map<string, string>): boolean {
  if (!endpoint) return false;
  return ownerNodeId(endpoint, nodeParents) === parentEndpoint;
}

function subjectEntities(document: TopoDocument): Array<{ kind: string; entity: GraphEntity }> {
  const graph = document.graph || {};
  return [
    ...(graph.nodes || []).map((entity) => ({ kind: 'node', entity })),
    ...(graph.links || []).map((entity) => ({ kind: 'link', entity })),
    ...(graph.links || []).flatMap((link) => linkDirectionEntities(link).map((entity) => ({ kind: 'linkDirection', entity }))),
    ...(graph.paths || []).map((entity) => ({ kind: 'path', entity })),
    ...(graph.regions || []).map((entity) => ({ kind: 'region', entity })),
    ...(document.diagram?.shapes || []).map((entity) => ({ kind: 'shape', entity })),
    ...(document.diagram?.connectors || []).map((entity) => ({ kind: 'connector', entity })),
    ...(document.diagram?.callouts || []).map((entity) => ({ kind: 'callout', entity })),
    ...(document.diagram?.texts || []).map((entity) => ({ kind: 'text', entity }))
  ];
}

function linkDirectionId(link: GraphLink, direction: LinkDirectionKey, value: GraphLinkDirection = {}): string {
  return value.id || `${link.id}:${direction}`;
}

function linkDirectionEntities(link: GraphLink): Array<GraphEntity & Record<string, unknown>> {
  if (!link.directions || typeof link.directions !== 'object') return [];
  return LINK_DIRECTION_KEYS.flatMap((direction) => {
    const value = link.directions?.[direction];
    if (!value || typeof value !== 'object') return [];
    return [{
      id: linkDirectionId(link, direction, value),
      name: value.name,
      label: value.label,
      labels: { ...(link.labels || {}), ...(value.labels || {}) },
      data: { ...(link.data || {}), ...(value.data || {}) },
      layers: link.layers,
      style: value.style,
      source: link.source,
      target: link.target,
      linkId: link.id,
      parentLinkId: link.id,
      direction
    }];
  });
}

function linkDirectionIssues(link: GraphLink, linkIndex: number, seen: Map<string, string>): LintIssue[] {
  if (!link.directions || typeof link.directions !== 'object') return [];
  const issues: LintIssue[] = [];
  const known = new Set<string>(LINK_DIRECTION_KEYS);
  Object.keys(link.directions).forEach((key) => {
    if (!known.has(key)) {
      issues.push(issue(
        'error',
        'invalid-link-direction-key',
        `Link direction "${key}" is not supported; use sourceToTarget or targetToSource.`,
        `graph.links[${linkIndex}].directions.${key}`
      ));
    }
  });

  LINK_DIRECTION_KEYS.forEach((direction) => {
    const value = link.directions?.[direction];
    if (!value || typeof value !== 'object') return;
    const id = linkDirectionId(link, direction, value);
    const path = `graph.links[${linkIndex}].directions.${direction}`;
    const existing = seen.get(id);
    if (existing) {
      issues.push(issue('error', 'duplicate-id', `Duplicate id "${id}" used by ${existing} and linkDirection.`, value.id ? `${path}.id` : path));
    } else {
      seen.set(id, 'linkDirection');
    }
    issues.push(...styleKeyIssues(value.style, `${path}.style`));
    issues.push(...edgeStyleIssues(value.style, `${path}.style`));
  });

  return issues;
}

function selectorHasMatch(rule: StyleRule, document: TopoDocument): boolean {
  return subjectEntities(document).some(({ kind, entity }) => selectorMatches(kind, entity, rule.selector));
}

function selectorTargetsGeneratedObject(selector: string): boolean {
  return /\[\s*labels\.leader\s*=/.test(selector)
    || /\[\s*isAggregate\s*=/.test(selector)
    || /\[\s*aggregate\s*=/.test(selector)
    || /\[\s*isLinkAggregate\s*=/.test(selector);
}

function unsafeImageReference(value: string): boolean {
  const trimmed = value.trim();
  return /^javascript:/i.test(trimmed) || /^data:image\/svg\+xml/i.test(trimmed);
}

export function lintTopoDocument(input: TopoDocument, options: LintOptions = {}): LintIssue[] {
  const document = validateTopoDocument(input);
  const requireNames = options.requireNames !== false;
  const issues: LintIssue[] = [];
  const graph = document.graph || {};
  const diagram = document.diagram || {};
  const knownLayers = new Set((graph.layers || []).map((layer) => layer.id));
  const nodeIds = new Set((graph.nodes || []).map((node) => node.id));
  const shapeIds = new Set((diagram.shapes || []).map((shape) => shape.id));
  const calloutBoxIds = new Set((diagram.callouts || []).filter(hasCalloutBox).map((callout) => callout.id));
  const textIds = new Set((diagram.texts || []).map((text) => text.id));
  const visualAnchorIds = new Set([...nodeIds, ...shapeIds, ...calloutBoxIds, ...textIds]);
  const pinIdsByOwner = new Map<string, Set<string>>();
  const handleIdsByNode = new Map<string, Map<string, Set<'source' | 'target'>>>();
  (graph.nodes || []).forEach((node) => addPinOwners(pinIdsByOwner, node));
  (graph.nodes || []).forEach((node) => addNodeHandleOwners(handleIdsByNode, node));
  (diagram.shapes || []).forEach((shape) => addPinOwners(pinIdsByOwner, shape));
  (diagram.callouts || []).forEach((callout) => addPinOwners(pinIdsByOwner, callout));
  const regionIds = new Set((graph.regions || []).map((region) => region.id));
  const linkIds = new Set((graph.links || []).map((link) => link.id));
  const sequencedPathIds = new Set((graph.paths || []).filter(hasSequence).map((path) => path.id));
  const nodeParents = new Map((graph.nodes || []).filter((node) => node.parent).map((node) => [node.id, node.parent!]));
  const seenIds = new Map<string, string>();
  const styleSubjects = subjectEntities(document);

  (graph.nodes || []).forEach((node, index) => {
    addEntity(seenIds, issues, 'node', node, `graph.nodes[${index}]`, requireNames);
    issues.push(...objectLayerIssues(node, knownLayers, `graph.nodes[${index}]`));
    issues.push(...layerMembershipIssues('node', node, `graph.nodes[${index}]`));
    issues.push(...styleKeyIssues(node.style, `graph.nodes[${index}].style`));
    issues.push(...nodeStyleIssues(node.style, `graph.nodes[${index}].style`));
    issues.push(...nodeHandleIssues(node, index));
    if (node.parent && !nodeIds.has(node.parent)) {
      issues.push(issue('error', 'broken-parent', `Node "${node.id}" parent "${node.parent}" does not exist as a node.`, `graph.nodes[${index}].parent`));
    }
  });

  (graph.links || []).forEach((link: GraphLink, index) => {
    addEntity(seenIds, issues, 'link', link, `graph.links[${index}]`, requireNames);
    issues.push(...objectLayerIssues(link, knownLayers, `graph.links[${index}]`));
    issues.push(...layerMembershipIssues('link', link, `graph.links[${index}]`));
    issues.push(...styleKeyIssues(link.style, `graph.links[${index}].style`));
    issues.push(...edgeStyleIssues(link.style, `graph.links[${index}].style`));
    if (!nodeIds.has(link.source)) issues.push(issue('error', 'broken-source', `Link "${link.id}" source "${link.source}" does not exist.`, `graph.links[${index}].source`));
    if (!nodeIds.has(link.target)) issues.push(issue('error', 'broken-target', `Link "${link.id}" target "${link.target}" does not exist.`, `graph.links[${index}].target`));
    if (nodeIds.has(link.source)) issues.push(...linkHandleReferenceIssue(link, index, 'source', link.sourceHandle, link.source, handleIdsByNode));
    if (nodeIds.has(link.target)) issues.push(...linkHandleReferenceIssue(link, index, 'target', link.targetHandle, link.target, handleIdsByNode));
    if (link.parent && !linkIds.has(link.parent)) {
      issues.push(issue('error', 'broken-parent-link', `Link "${link.id}" parent "${link.parent}" does not exist as a link.`, `graph.links[${index}].parent`));
    }
    issues.push(...linkDirectionIssues(link, index, seenIds));
  });

  (graph.paths || []).forEach((path, index) => {
    addEntity(seenIds, issues, 'path', path, `graph.paths[${index}]`, requireNames);
    issues.push(...objectLayerIssues(path, knownLayers, `graph.paths[${index}]`));
    issues.push(...layerMembershipIssues('path', path, `graph.paths[${index}]`));
    issues.push(...styleKeyIssues(path.style, `graph.paths[${index}].style`));
    issues.push(...edgeStyleIssues(path.style, `graph.paths[${index}].style`));
    if (hasSequence(path)) {
      path.sequence.forEach((nodeId, sequenceIndex) => {
        if (!nodeIds.has(nodeId)) {
          issues.push(issue('error', 'broken-path-node', `Path "${path.id}" sequence node "${nodeId}" does not exist.`, `graph.paths[${index}].sequence[${sequenceIndex}]`));
        }
      });
      return;
    }

    if (!path.source || !path.target || !path.parent) return;
    if (!nodeIds.has(path.source)) issues.push(issue('error', 'broken-source', `Path "${path.id}" source "${path.source}" does not exist.`, `graph.paths[${index}].source`));
    if (!nodeIds.has(path.target)) issues.push(issue('error', 'broken-target', `Path "${path.id}" target "${path.target}" does not exist.`, `graph.paths[${index}].target`));
    if (!sequencedPathIds.has(path.parent)) {
      issues.push(issue('error', 'broken-parent-path', `Path "${path.id}" parent "${path.parent}" does not exist as a sequenced path.`, `graph.paths[${index}].parent`));
      return;
    }
    const parentPath = (graph.paths || []).find((candidate) => candidate.id === path.parent && hasSequence(candidate));
    const parentStart = parentPath?.sequence?.[0];
    const parentEnd = parentPath?.sequence?.[(parentPath.sequence?.length || 1) - 1];
    if (parentStart && !endpointMatchesParentPathEndpoint(path.source, parentStart, nodeParents)) {
      issues.push(issue('warning', 'stitched-source-owner', `Path "${path.id}" source owner does not match parent path first node "${parentStart}".`, `graph.paths[${index}].source`));
    }
    if (parentEnd && !endpointMatchesParentPathEndpoint(path.target, parentEnd, nodeParents)) {
      issues.push(issue('warning', 'stitched-target-owner', `Path "${path.id}" target owner does not match parent path last node "${parentEnd}".`, `graph.paths[${index}].target`));
    }
  });

  (graph.regions || []).forEach((region, index) => {
    addEntity(seenIds, issues, 'region', region, `graph.regions[${index}]`, requireNames);
    issues.push(...objectLayerIssues(region, knownLayers, `graph.regions[${index}]`));
    issues.push(...layerMembershipIssues('region', region, `graph.regions[${index}]`));
    issues.push(...styleKeyIssues(region.style, `graph.regions[${index}].style`));
    issues.push(...regionStyleIssues(region.style, `graph.regions[${index}].style`));
    (region.members || []).forEach((member, memberIndex) => {
      if (!nodeIds.has(member) && !regionIds.has(member)) {
        issues.push(issue('error', 'broken-region-member', `Region "${region.id}" member "${member}" does not exist as a node or region.`, `graph.regions[${index}].members[${memberIndex}]`));
      }
    });
    if (region.parent && !regionIds.has(region.parent)) {
      issues.push(issue('error', 'broken-parent-region', `Region "${region.id}" parent "${region.parent}" does not exist as a region.`, `graph.regions[${index}].parent`));
    }
  });

  (diagram.shapes || []).forEach((shape, index) => {
    addEntity(seenIds, issues, 'shape', shape, `diagram.shapes[${index}]`, false);
    issues.push(...objectLayerIssues(shape, knownLayers, `diagram.shapes[${index}]`));
    issues.push(...layerMembershipIssues('shape', shape, `diagram.shapes[${index}]`));
    issues.push(...styleKeyIssues(shape.style, `diagram.shapes[${index}].style`));
  });

  (diagram.connectors || []).forEach((connector: DiagramConnector, index) => {
    addEntity(seenIds, issues, 'connector', connector, `diagram.connectors[${index}]`, false);
    issues.push(...objectLayerIssues(connector, knownLayers, `diagram.connectors[${index}]`));
    issues.push(...layerMembershipIssues('connector', connector, `diagram.connectors[${index}]`));
    issues.push(...styleKeyIssues(connector.style, `diagram.connectors[${index}].style`));
    issues.push(...edgeStyleIssues(connector.style, `diagram.connectors[${index}].style`));
    if (!connector.sourcePosition) {
      issues.push(...visualAnchorIssues('connector', connector.id, 'source', connector.source, visualAnchorIds, `diagram.connectors[${index}]`));
      issues.push(...pinReferenceIssues('connector', connector.id, 'source', connector.source, connector.sourcePin, visualAnchorIds, pinIdsByOwner, `diagram.connectors[${index}]`));
    }
    if (!connector.targetPosition) {
      issues.push(...visualAnchorIssues('connector', connector.id, 'target', connector.target, visualAnchorIds, `diagram.connectors[${index}]`));
      issues.push(...pinReferenceIssues('connector', connector.id, 'target', connector.target, connector.targetPin, visualAnchorIds, pinIdsByOwner, `diagram.connectors[${index}]`));
    }
  });

  (diagram.callouts || []).forEach((callout, index) => {
    addEntity(seenIds, issues, 'callout', callout, `diagram.callouts[${index}]`, false);
    issues.push(...objectLayerIssues(callout, knownLayers, `diagram.callouts[${index}]`));
    issues.push(...layerMembershipIssues('callout', callout, `diagram.callouts[${index}]`));
    issues.push(...styleKeyIssues(callout.style, `diagram.callouts[${index}].style`));
    issues.push(...styleKeyIssues(callout.leader, `diagram.callouts[${index}].leader`));
    issues.push(...edgeStyleIssues(callout.leader, `diagram.callouts[${index}].leader`));
    const source = callout.source || (hasCalloutBox(callout) ? callout.id : undefined);
    if (!callout.sourcePosition) {
      issues.push(...visualAnchorIssues('callout', callout.id, 'source', source, visualAnchorIds, `diagram.callouts[${index}]`));
      issues.push(...pinReferenceIssues('callout', callout.id, 'source', source, callout.sourcePin, visualAnchorIds, pinIdsByOwner, `diagram.callouts[${index}]`));
    }
    if (!callout.targetPosition) {
      issues.push(...visualAnchorIssues('callout', callout.id, 'target', callout.target, visualAnchorIds, `diagram.callouts[${index}]`));
      issues.push(...pinReferenceIssues('callout', callout.id, 'target', callout.target, callout.targetPin, visualAnchorIds, pinIdsByOwner, `diagram.callouts[${index}]`));
    }
  });

  (diagram.texts || []).forEach((text, index) => {
    addEntity(seenIds, issues, 'text', text, `diagram.texts[${index}]`, false);
    issues.push(...unsafeTextIssues(text.text, `diagram.texts[${index}].text`));
    issues.push(...objectLayerIssues(text, knownLayers, `diagram.texts[${index}]`));
    issues.push(...layerMembershipIssues('text', text, `diagram.texts[${index}]`));
    issues.push(...styleKeyIssues(text.style, `diagram.texts[${index}].style`));
  });

  (document.stylesheet || []).forEach((rule, index) => {
    issues.push(...styleKeyIssues(rule.style, `stylesheet[${index}].style`));
    if (selectorKind(rule.selector) === 'node') {
      issues.push(...nodeStyleIssues(rule.style, `stylesheet[${index}].style`));
    }
    if (selectorKind(rule.selector) === 'region') {
      issues.push(...regionStyleIssues(rule.style, `stylesheet[${index}].style`));
    }
    if (['link', 'linkDirection', 'path', 'connector'].includes(selectorKind(rule.selector))) {
      issues.push(...edgeStyleIssues(rule.style, `stylesheet[${index}].style`));
    }
    if (
      styleSubjects.length > 0
      && !selectorIsBareKind(rule.selector)
      && !selectorTargetsGeneratedObject(rule.selector)
      && !selectorHasMatch(rule, document)
    ) {
      issues.push(issue('warning', 'unused-selector', `Stylesheet selector "${rule.selector}" does not match any current object.`, `stylesheet[${index}].selector`));
    }
  });

  if (!issues.some((item) => item.code === 'invalid-node-aspect-dimensions')) {
    (graph.nodes || []).forEach((node, index) => {
      issues.push(...nodeAspectDimensionIssues(applyStyle('node', node, document), `graph.nodes[${index}].effectiveStyle`));
    });
  }

  (graph.nodes || []).forEach((node, index) => {
    issues.push(...nodeLayoutShapeIssues(applyStyle('node', node, document), `graph.nodes[${index}].effectiveStyle`));
  });

  Object.entries(document.icons || {}).forEach(([key, icon]) => {
    if (icon.src && unsafeImageReference(icon.src)) {
      issues.push(issue('error', 'unsafe-image-reference', `Icon "${key}" uses an unsafe image reference.`, `icons.${key}.src`));
    }
  });

  rendererLimitViolations(document).forEach((message) => {
    issues.push(issue('error', 'renderer-limit', message, 'limits'));
  });

  analyzeClosLayoutDiagnostics(graph.nodes || [], layoutDiagnosticLinks(graph.links || [], graph.paths || []), document.layout || {})
    .forEach((diagnostic) => {
      issues.push(issue('warning', diagnostic.code, diagnostic.message, diagnostic.path));
    });

  return issues;
}
