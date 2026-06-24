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
import { rendererLimitViolations } from './limits';
import { normalizeNodeShape, parseNodeShapePoints } from './nodeShapes';
import {
  nodeBadgePositions,
  nodeBorderStyles,
  nodeIconFitValues,
  nodeLabelPositions,
  nodeLabelTextOverflowValues,
  nodeLabelTextWrapValues,
  nodeStatusPlacements,
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
import type { DiagramCallout, DiagramConnector, GraphEntity, GraphLink, GraphPath, StyleRule, TopoDocument } from './types';
import { validateTopoDocument } from './validation';

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

const canonicalStyleKeyByLowercase = new Map([
  ['labelzindex', 'labelZIndex'],
  ['sourcelabelzindex', 'sourceLabelZIndex'],
  ['targetlabelzindex', 'targetLabelZIndex']
]);

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
    if ((key === 'labelZIndex' || key === 'sourceLabelZIndex' || key === 'targetLabelZIndex') && finiteNumber(style[key]) === undefined) {
      issues.push(issue('error', 'invalid-label-z-index', `${key} must be a finite number.`, `${path}.${key}`));
    }
    return issues;
  });
}

function selectorKind(selector: string): string {
  return selector.trim().match(/^[a-zA-Z][\w-]*/)?.[0] || '';
}

function nodeShapeStyleIssues(style: Record<string, unknown> | undefined, path: string): LintIssue[] {
  if (!style || typeof style !== 'object') return [];
  const issues: LintIssue[] = [];
  if (style.shape !== undefined && !normalizeNodeShape(style.shape)) {
    issues.push(issue(
      'error',
      'unsupported-node-shape',
      `Node shape "${String(style.shape)}" is not supported; use a canonical TopoViewer node shape value.`,
      `${path}.shape`
    ));
  }
  const polygonPoints = parseNodeShapePoints(style.shapePolygonPoints);
  if (polygonPoints.error) {
    issues.push(issue('error', 'invalid-node-shape-polygon', polygonPoints.error, `${path}.shapePolygonPoints`));
  }
  return issues;
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
    ...enumStyleIssue(style, 'statusPlacement', path, 'unsupported-node-status-placement', nodeStatusPlacements, normalizeNodeStatusPlacement)
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

  ['sourceDistanceFromNode', 'targetDistanceFromNode'].forEach((key) => {
    issues.push(...nonNegativeNumberIssue(style, key, path, 'invalid-edge-endpoint-distance', 'Edge endpoint distance'));
  });

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

function hasCalloutBox(callout: DiagramCallout): boolean {
  return !!(callout.position || callout.title || callout.body || callout.markdown);
}

function addPinOwners(pinIdsByOwner: Map<string, Set<string>>, owner: { id: string; pins?: Array<{ id: string }> }) {
  if (!owner.pins?.length) return;
  pinIdsByOwner.set(owner.id, new Set(owner.pins.map((pin) => pin.id)));
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
    ...(graph.paths || []).map((entity) => ({ kind: 'path', entity })),
    ...(graph.regions || []).map((entity) => ({ kind: 'region', entity })),
    ...(document.diagram?.shapes || []).map((entity) => ({ kind: 'shape', entity })),
    ...(document.diagram?.connectors || []).map((entity) => ({ kind: 'connector', entity })),
    ...(document.diagram?.callouts || []).map((entity) => ({ kind: 'callout', entity }))
  ];
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
  const visualAnchorIds = new Set([...nodeIds, ...shapeIds, ...calloutBoxIds]);
  const pinIdsByOwner = new Map<string, Set<string>>();
  (graph.nodes || []).forEach((node) => addPinOwners(pinIdsByOwner, node));
  (diagram.shapes || []).forEach((shape) => addPinOwners(pinIdsByOwner, shape));
  (diagram.callouts || []).forEach((callout) => addPinOwners(pinIdsByOwner, callout));
  const regionIds = new Set((graph.regions || []).map((region) => region.id));
  const linkIds = new Set((graph.links || []).map((link) => link.id));
  const sequencedPathIds = new Set((graph.paths || []).filter(hasSequence).map((path) => path.id));
  const nodeParents = new Map((graph.nodes || []).filter((node) => node.parent).map((node) => [node.id, node.parent!]));
  const seenIds = new Map<string, string>();

  (graph.nodes || []).forEach((node, index) => {
    addEntity(seenIds, issues, 'node', node, `graph.nodes[${index}]`, requireNames);
    issues.push(...objectLayerIssues(node, knownLayers, `graph.nodes[${index}]`));
    issues.push(...layerMembershipIssues('node', node, `graph.nodes[${index}]`));
    issues.push(...styleKeyIssues(node.style, `graph.nodes[${index}].style`));
    issues.push(...nodeStyleIssues(node.style, `graph.nodes[${index}].style`));
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
    if (link.parent && !linkIds.has(link.parent)) {
      issues.push(issue('error', 'broken-parent-link', `Link "${link.id}" parent "${link.parent}" does not exist as a link.`, `graph.links[${index}].parent`));
    }
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

  (document.stylesheet || []).forEach((rule, index) => {
    issues.push(...styleKeyIssues(rule.style, `stylesheet[${index}].style`));
    if (selectorKind(rule.selector) === 'node') {
      issues.push(...nodeStyleIssues(rule.style, `stylesheet[${index}].style`));
    }
    if (selectorKind(rule.selector) === 'region') {
      issues.push(...regionStyleIssues(rule.style, `stylesheet[${index}].style`));
    }
    if (['link', 'path', 'connector'].includes(selectorKind(rule.selector))) {
      issues.push(...edgeStyleIssues(rule.style, `stylesheet[${index}].style`));
    }
    if (!selectorTargetsGeneratedObject(rule.selector) && !selectorHasMatch(rule, document)) {
      issues.push(issue('warning', 'unused-selector', `Stylesheet selector "${rule.selector}" does not match any current object.`, `stylesheet[${index}].selector`));
    }
  });

  Object.entries(document.icons || {}).forEach(([key, icon]) => {
    if (icon.src && unsafeImageReference(icon.src)) {
      issues.push(issue('error', 'unsafe-image-reference', `Icon "${key}" uses an unsafe image reference.`, `icons.${key}.src`));
    }
  });

  rendererLimitViolations(document).forEach((message) => {
    issues.push(issue('error', 'renderer-limit', message, 'limits'));
  });

  return issues;
}
