import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  getBezierPath,
  getSimpleBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useInternalNode,
  type EdgeProps
} from '@xyflow/react';
import { memo, useId, useState, type CSSProperties, type MouseEvent } from 'react';
import { applyEndpointSpacing, segmentRoute, taxiRoute } from '../core/edgeGeometry';
import { normalizeTaxiDirection, numberList, stringList } from '../core/edgeStyle';
import { linkDirectionGeometryForPath, linkDirectionSegment, trimPolylinePathEnd, type LinkDirectionGeometry } from '../core/linkDirectionGeometry';
import { styleDefaultNumber } from '../core/styleDefaults';
import type { Bounds } from '../core/types';
import { directionLabelPoint, edgeLabelLayouts, endpointLabelPoint, type DirectionStroke, type EdgeLabelRole, type LinkDirectionKey } from './floatingEdgeLabels';

function internalNodeBox(node: ReturnType<typeof useInternalNode> | undefined): Bounds & { centerX: number; centerY: number } | null {
  if (!node) return null;
  const runtimeNode = node as typeof node & {
    positionAbsolute?: { x: number; y: number };
    data?: { nodeStyle?: { width?: number; minHeight?: number }; edgeAnchor?: Bounds };
  };
  const position = runtimeNode.internals?.positionAbsolute || runtimeNode.positionAbsolute || runtimeNode.position || { x: 0, y: 0 };
  const width = runtimeNode.measured?.width || runtimeNode.width || Number(runtimeNode.data?.nodeStyle?.width || styleDefaultNumber('node', 'width', 82));
  const height = runtimeNode.measured?.height || runtimeNode.height || Number(runtimeNode.data?.nodeStyle?.minHeight || styleDefaultNumber('node', 'height', 60));
  const anchor = runtimeNode.data?.edgeAnchor;

  if (anchor) {
    const anchorWidth = Number(anchor.width || width);
    const anchorHeight = Number(anchor.height || height);
    const anchorX = Number(anchor.x ?? (width - anchorWidth) / 2);
    const anchorY = Number(anchor.y ?? 0);
    return {
      x: position.x + anchorX,
      y: position.y + anchorY,
      width: anchorWidth,
      height: anchorHeight,
      centerX: position.x + anchorX + anchorWidth / 2,
      centerY: position.y + anchorY + anchorHeight / 2
    };
  }

  return {
    x: position.x,
    y: position.y,
    width,
    height,
    centerX: position.x + width / 2,
    centerY: position.y + height / 2
  };
}

function floatingSide(sourceBox: NonNullable<ReturnType<typeof internalNodeBox>>, targetBox: NonNullable<ReturnType<typeof internalNodeBox>>): Position {
  const dx = targetBox.centerX - sourceBox.centerX;
  const dy = targetBox.centerY - sourceBox.centerY;
  if (Math.abs(dx) > Math.abs(dy)) return dx >= 0 ? Position.Right : Position.Left;
  return dy >= 0 ? Position.Bottom : Position.Top;
}

function floatingPoint(box: NonNullable<ReturnType<typeof internalNodeBox>>, side: Position): { x: number; y: number } {
  if (side === Position.Left) return { x: box.x, y: box.centerY };
  if (side === Position.Right) return { x: box.x + box.width, y: box.centerY };
  if (side === Position.Top) return { x: box.centerX, y: box.y };
  return { x: box.centerX, y: box.y + box.height };
}

function floatingEndpoints(sourceNode: ReturnType<typeof useInternalNode> | undefined, targetNode: ReturnType<typeof useInternalNode> | undefined, fallback: EdgeProps) {
  if (fallback.sourceHandleId || fallback.targetHandleId) {
    return {
      sourceX: fallback.sourceX,
      sourceY: fallback.sourceY,
      targetX: fallback.targetX,
      targetY: fallback.targetY,
      sourcePosition: fallback.sourcePosition,
      targetPosition: fallback.targetPosition
    };
  }

  const sourceBox = internalNodeBox(sourceNode);
  const targetBox = internalNodeBox(targetNode);
  if (!sourceBox || !targetBox) return fallback;
  const sourcePosition = floatingSide(sourceBox, targetBox);
  const targetPosition = floatingSide(targetBox, sourceBox);
  const sourcePoint = floatingPoint(sourceBox, sourcePosition);
  const targetPoint = floatingPoint(targetBox, targetPosition);

  return {
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
    sourcePosition,
    targetPosition
  };
}

function edgePathForCurve(curveType: string, props: EdgeProps, data: Record<string, unknown>, endpoints: ReturnType<typeof floatingEndpoints>) {
  if (data.routeKind === 'segments') {
    const route = segmentRoute(endpoints, numberList(data.segmentDistances), numberList(data.segmentWeights));
    if (route) return [route.path, route.labelX, route.labelY] as [string, number, number];
  }

  if (data.routeKind === 'taxi' && data.taxiRoutingExplicit) {
    const taxiDirection = normalizeTaxiDirection(data.taxiDirection) || 'auto';
    const route = taxiRoute(endpoints, taxiDirection, data.taxiTurn as number | string | undefined, numericOrUndefined(data.taxiTurnMinDistance));
    if (route) return [route.path, route.labelX, route.labelY] as [string, number, number];
  }

  if (curveType === 'bezier') {
    const distance = bezierControlPointDistance(data);
    if (distance !== undefined) return quadraticBezierPathForEndpoints(props, endpoints, distance, numeric(data.controlPointWeight, 0.5));
    return getBezierPath({ ...props, ...endpoints });
  }
  if (curveType === 'straight') return getStraightPath({ ...props, ...endpoints });
  if (curveType === 'step') return getSmoothStepPath({ ...props, ...endpoints, borderRadius: 0 });
  if (curveType === 'smoothstep') return getSmoothStepPath({ ...props, ...endpoints });
  if (curveType === 'simplebezier') return getSimpleBezierPath({ ...props, ...endpoints });
  return getBezierPath({ ...props, ...endpoints });
}

function straightPathForEndpoints(props: EdgeProps, endpoints: ReturnType<typeof floatingEndpoints>) {
  return getStraightPath({ ...props, ...endpoints });
}

function edgeData(props: EdgeProps): Record<string, unknown> {
  return (props.data || {}) as Record<string, unknown>;
}

function numeric(value: unknown, fallback: number): number {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function numericOrUndefined(value: unknown): number | undefined {
  const next = Number(value);
  return Number.isFinite(next) ? next : undefined;
}

function laneOffsetDistance(data: Record<string, unknown>): number {
  if (!data.isLane) return 0;
  const laneCount = Math.max(1, numeric(data.laneCount, 1));
  const laneIndex = Math.min(laneCount - 1, Math.max(0, numeric(data.laneIndex, 0)));
  const laneGap = numeric(data.laneGap, 5);
  return (laneIndex - (laneCount - 1) / 2) * laneGap;
}

function laneOffset(data: Record<string, unknown>, endpoints: ReturnType<typeof floatingEndpoints>): { x: number; y: number } {
  const offset = laneOffsetDistance(data);
  if (offset === 0) return { x: 0, y: 0 };

  const dx = endpoints.targetX - endpoints.sourceX;
  const dy = endpoints.targetY - endpoints.sourceY;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    x: (-dy / length) * offset,
    y: (dx / length) * offset
  };
}

function bezierControlPointDistance(data: Record<string, unknown>): number | undefined {
  if (data.controlPointDistance !== undefined) return numeric(data.controlPointDistance, 0);
  if (!data.parallelLinkGroup) return undefined;
  const stepSize = numeric(data.controlPointStepSize, numeric(data.laneGap, 40));
  return laneOffsetDistance({ ...data, laneGap: stepSize });
}

function quadraticBezierPathForEndpoints(
  props: EdgeProps,
  endpoints: ReturnType<typeof floatingEndpoints>,
  distance: number,
  weight: number
): [string, number, number] {
  if (distance === 0) {
    const [path, labelX, labelY] = getStraightPath({ ...props, ...endpoints });
    return [path, labelX, labelY];
  }
  const sourceX = Number(endpoints.sourceX);
  const sourceY = Number(endpoints.sourceY);
  const targetX = Number(endpoints.targetX);
  const targetY = Number(endpoints.targetY);
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const controlX = sourceX + dx * weight + (-dy / length) * distance;
  const controlY = sourceY + dy * weight + (dx / length) * distance;
  const labelX = sourceX * 0.25 + controlX * 0.5 + targetX * 0.25;
  const labelY = sourceY * 0.25 + controlY * 0.5 + targetY * 0.25;
  return [`M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`, labelX, labelY];
}

function pathTransform(offset: { x: number; y: number }): string | undefined {
  if (!offset.x && !offset.y) return undefined;
  return `translate(${offset.x} ${offset.y})`;
}

function textValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

type LinkDirectionClickHandler = (event: MouseEvent<SVGPathElement>, direction: DirectionStroke) => void;

function labelZIndex(data: Record<string, unknown>, role: EdgeLabelRole): number | undefined {
  const roleValue = role === 'source'
    ? data.sourceLabelZIndex
    : role === 'target'
      ? data.targetLabelZIndex
      : undefined;
  return numericOrUndefined(roleValue ?? data.labelZIndex);
}

function labelRoleValue(data: Record<string, unknown>, role: EdgeLabelRole, suffix: string): unknown {
  if (role === 'center' && suffix === 'Color') return data.edgeLabelColor ?? data.labelColor;
  if (role === 'center') return data[`label${suffix}`];
  return data[`${role}Label${suffix}`] ?? data[`label${suffix}`];
}

function labelStyle(
  props: EdgeProps,
  data: Record<string, unknown>,
  x: number,
  y: number,
  role: EdgeLabelRole,
  angle?: number,
  overrideStyle?: CSSProperties
): CSSProperties {
  const labelColor = labelRoleValue(data, role, 'Color') || data.labelColor || props.labelStyle?.fill;
  const background = labelRoleValue(data, role, 'BackgroundColor') || data.textBackgroundColor || props.labelBgStyle?.fill;
  const borderWidth = numeric(labelRoleValue(data, role, 'BorderWidth'), numeric(data.labelBorderWidth, 0));
  const borderColor = labelRoleValue(data, role, 'BorderColor') || data.labelBorderColor;
  const fontSize = labelRoleValue(data, role, 'FontSize') || props.labelStyle?.fontSize;
  const fontWeight = labelRoleValue(data, role, 'FontWeight') || props.labelStyle?.fontWeight;
  const fontStyle = labelRoleValue(data, role, 'FontStyle') || data.labelFontStyle || props.labelStyle?.fontStyle;
  const opacity = numericOrUndefined(labelRoleValue(data, role, 'Opacity') ?? data.labelOpacity);
  const zIndex = labelZIndex(data, role);

  return {
    color: labelColor as CSSProperties['color'],
    fontSize: fontSize as CSSProperties['fontSize'],
    fontWeight: fontWeight as CSSProperties['fontWeight'],
    fontStyle: fontStyle as CSSProperties['fontStyle'],
    opacity,
    background: background as CSSProperties['background'],
    border: borderWidth > 0 ? `${borderWidth}px solid ${String(borderColor || 'transparent')}` : undefined,
    position: 'absolute',
    zIndex,
    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)${angle === undefined ? '' : ` rotate(${angle}deg)`}`,
    transformOrigin: 'center',
    pointerEvents: data.labelInteractive === false ? 'none' : 'all',
    ...overrideStyle
  };
}

function renderEdgeLabel(
  props: EdgeProps,
  data: Record<string, unknown>,
  value: string,
  x: number,
  y: number,
  role: EdgeLabelRole,
  key?: string,
  angle?: number,
  overrideStyle?: CSSProperties
) {
  const zIndex = labelZIndex(data, role);
  const label = (
    <div
      className={`topoviewer-edge-label topoviewer-edge-label-${role}`}
      data-attention-state={data.attentionState || undefined}
      data-label-priority={data.attentionLabelPriority || undefined}
      data-label-z-index={zIndex}
      style={labelStyle(props, data, x, y, role, angle, overrideStyle)}
    >
      {value}
    </div>
  );

  return <EdgeLabelRenderer key={key}>{label}</EdgeLabelRenderer>;
}

function linkGroupCollapsePoint(
  endpoints: ReturnType<typeof floatingEndpoints>,
  x: number,
  y: number
) {
  const dx = endpoints.targetX - endpoints.sourceX;
  const dy = endpoints.targetY - endpoints.sourceY;
  const length = Math.hypot(dx, dy) || 1;
  return { x: x + (dy / length) * 44, y: y - (dx / length) * 44 };
}

function pipeStyle(props: EdgeProps, data: Record<string, unknown>, role: 'border' | 'fill'): CSSProperties {
  const baseStroke = String(props.style?.stroke || '#6ea8fe');
  const pipeWidth = numeric(data.pipeWidth, numeric(props.style?.strokeWidth, 1) + 14);
  if (role === 'border') {
    return {
      fill: 'none',
      stroke: String(data.pipeBorderColor || baseStroke),
      strokeWidth: pipeWidth + numeric(data.pipeBorderWidth, 2),
      opacity: 0.58
    };
  }
  return {
    fill: 'none',
    stroke: String(data.pipeFill || baseStroke),
    strokeWidth: pipeWidth,
    opacity: numeric(data.pipeOpacity, 0.18)
  };
}

function laneStyle(props: EdgeProps, data: Record<string, unknown>): CSSProperties {
  return {
    ...props.style,
    fill: 'none',
    strokeWidth: numeric(data.laneWidth, numeric(props.style?.strokeWidth, 3))
  };
}

function lineOutlineStyle(props: EdgeProps, data: Record<string, unknown>): CSSProperties | undefined {
  const outlineWidth = numeric(data.lineOutlineWidth, 0);
  if (outlineWidth <= 0) return undefined;
  return {
    ...props.style,
    fill: 'none',
    stroke: String(data.lineOutlineColor || '#0f172a'),
    strokeWidth: numeric(props.style?.strokeWidth, 1) + outlineWidth * 2,
    strokeDasharray: props.style?.strokeDasharray,
    strokeDashoffset: props.style?.strokeDashoffset,
    strokeLinecap: props.style?.strokeLinecap,
    opacity: numeric(data.lineOpacity, numeric(props.style?.opacity, 1))
  };
}

function directionLineOutlineStyle(direction: DirectionStroke): CSSProperties | undefined {
  const outlineWidth = numeric(direction.data.lineOutlineWidth, 0);
  if (outlineWidth <= 0) return undefined;
  return {
    ...direction.style,
    fill: 'none',
    stroke: String(direction.data.lineOutlineColor || '#0f172a'),
    strokeWidth: numeric(direction.style?.strokeWidth, numeric(direction.data.lineWidth, 1)) + outlineWidth * 2,
    strokeDasharray: direction.style?.strokeDasharray,
    strokeDashoffset: direction.style?.strokeDashoffset,
    strokeLinecap: direction.style?.strokeLinecap,
    opacity: numeric(direction.data.lineOpacity, numeric(direction.style?.opacity, 1)),
    pointerEvents: 'none'
  };
}

function safeSvgId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, '-');
}

function edgePathStyle(style: CSSProperties | undefined): CSSProperties {
  return {
    ...(style || {}),
    fill: 'none'
  };
}

function gradientPaint(
  data: Record<string, unknown>,
  endpoints: Pick<ReturnType<typeof floatingEndpoints>, 'sourceX' | 'sourceY' | 'targetX' | 'targetY'>,
  id: string
) {
  if (data.lineFill !== 'linearGradient') return undefined;
  const colors = stringList(data.lineGradientStopColors);
  if (!colors || colors.length < 2) return undefined;
  const positions = stringList(data.lineGradientStopPositions);
  return {
    id,
    url: `url(#${id})`,
    x1: endpoints.sourceX,
    y1: endpoints.sourceY,
    x2: endpoints.targetX,
    y2: endpoints.targetY,
    stops: colors.map((color, index) => ({
      color,
      offset: positions?.[index] || `${Math.round((index / (colors.length - 1)) * 100)}%`
    }))
  };
}

const markerViewBoxSize = 12;
const markerPathWidth = 10;

function markerInfo(data: Record<string, unknown>, role: 'source' | 'target', id: string, fallbackLineWidth: number) {
  const shape = String(data[`${role}ArrowShape`] || 'none');
  if (shape === 'none') return undefined;
  const size = numeric(data[`${role}ArrowSize`], fallbackLineWidth);
  const borderColor = data[`${role}ArrowBorderColor`] ?? data.arrowBorderColor;
  return {
    id,
    url: `url(#${id})`,
    shape,
    color: String(data[`${role}ArrowColor`] || data.arrowColor || data.lineColor || '#6ea8fe'),
    borderColor: borderColor === undefined ? undefined : String(borderColor),
    borderWidth: numeric(data[`${role}ArrowBorderWidth`] ?? data.arrowBorderWidth, 0),
    offset: numeric(data[`${role}ArrowOffset`], 0),
    size
  };
}

function markerRefX(shape: string, size: number, offset: number): number {
  const base = shape === 'circle' || shape === 'square' || shape === 'tee' ? 5 : 10;
  const scale = size > 0 ? size / markerViewBoxSize : 1;
  return base + offset / scale;
}

function markerBorderProps(marker: NonNullable<ReturnType<typeof markerInfo>>) {
  if (!marker.borderColor || marker.borderWidth <= 0) return {};
  return {
    stroke: marker.borderColor,
    strokeWidth: Math.max(0.25, (marker.borderWidth * markerViewBoxSize) / Math.max(1, marker.size))
  };
}

function markerShape(marker: NonNullable<ReturnType<typeof markerInfo>>) {
  const { shape, color } = marker;
  const borderProps = markerBorderProps(marker);
  if (shape === 'vee') {
    return <path d="M1,1 L10,5 L1,9" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (shape === 'tee') {
    return <path d="M5,0 L5,10" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />;
  }
  if (shape === 'circle') {
    return <circle cx="5" cy="5" r="4" fill={color} {...borderProps} />;
  }
  if (shape === 'square') {
    return <rect x="0.75" y="0.75" width="8.5" height="8.5" rx="1.2" fill={color} {...borderProps} />;
  }
  if (shape === 'diamond') {
    return <path d="M1,5 L5,1 L10,5 L5,9 Z" fill={color} {...borderProps} />;
  }
  return <path d="M0,0 L10,5 L0,10 Z" fill={color} {...borderProps} />;
}

function markerBodyLength(marker: NonNullable<ReturnType<typeof markerInfo>>): number {
  if (marker.shape === 'tee') return 0;
  if (marker.shape === 'circle' || marker.shape === 'square') return marker.size * (8 / markerViewBoxSize);
  return marker.size * (markerPathWidth / markerViewBoxSize);
}

function directionStrokeEndTrim(marker: NonNullable<ReturnType<typeof markerInfo>> | undefined, strokeWidth: number, lineCap: unknown): number {
  if (!marker) return 0;
  const cap = String(lineCap || '').toLowerCase();
  const capExtension = cap === 'round' || cap === 'square' ? strokeWidth / 2 : 0;
  return Math.max(0, markerBodyLength(marker) + marker.offset + capExtension);
}

function linkDirections(data: Record<string, unknown>): DirectionStroke[] {
  if (!Array.isArray(data.linkDirections)) return [];
  return data.linkDirections.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const record = entry as Record<string, unknown>;
    const direction = record.direction === 'sourceToTarget' || record.direction === 'targetToSource'
      ? record.direction
      : undefined;
    if (!direction) return [];
    return [{
      id: String(record.id || `${data.id || 'link'}:${direction}`),
      direction,
      label: record.label === undefined ? undefined : String(record.label),
      data: {
        id: String(record.id || `${data.id || 'link'}:${direction}`),
        linkId: String(record.linkId || data.id || ''),
        parentLinkId: String(record.linkId || data.id || ''),
        source: String(record.source || data.source || ''),
        target: String(record.target || data.target || ''),
        direction,
        ...((record.data && typeof record.data === 'object' ? record.data : {}) as Record<string, unknown>)
      },
      style: (record.style && typeof record.style === 'object' ? record.style : undefined) as CSSProperties | undefined,
      labelStyle: (record.labelStyle && typeof record.labelStyle === 'object' ? record.labelStyle : undefined) as CSSProperties | undefined,
      labelBgStyle: (record.labelBgStyle && typeof record.labelBgStyle === 'object' ? record.labelBgStyle : undefined) as CSSProperties | undefined
    }];
  });
}

function shouldRotateDirectionLabel(data: Record<string, unknown>, direction: DirectionStroke): boolean {
  const value = direction.data.directionLabelRotation ?? data.directionLabelRotation;
  const normalized = String(value || '').toLowerCase();
  return normalized === 'auto' || normalized === 'true';
}

function directionMarkerRole(direction: LinkDirectionKey): 'source' | 'target' {
  return direction === 'sourceToTarget' ? 'target' : 'source';
}

function maximumDirectionStrokeWidth(directions: DirectionStroke[], fallback: number): number {
  return directions.reduce((width, direction) => {
    return Math.max(width, numeric(direction.style?.strokeWidth, numeric(direction.data.lineWidth, fallback)));
  }, fallback);
}

function centerLabelOffset(
  data: Record<string, unknown>,
  directions: DirectionStroke[],
  geometry: LinkDirectionGeometry | undefined,
  fallbackLineWidth: number
): { x: number; y: number } {
  const explicitX = numericOrUndefined(data.labelXOffset);
  const explicitY = numericOrUndefined(data.labelYOffset);
  if (explicitX !== undefined || explicitY !== undefined) {
    return { x: explicitX || 0, y: explicitY || 0 };
  }
  if (!geometry || !directions.length) return { x: 0, y: 0 };

  const segment = linkDirectionSegment(geometry, 'sourceToTarget');
  const directionLabelOffset = Math.abs(numeric(data.directionLabelOffset, 0));
  const strokeWidth = maximumDirectionStrokeWidth(directions, fallbackLineWidth);
  const distance = Math.max(directionLabelOffset + strokeWidth + 14, strokeWidth * 1.5 + 12);
  return {
    x: -segment.normal.x * distance,
    y: -segment.normal.y * distance
  };
}

function FloatingEdgeComponent(props: EdgeProps) {
  const [parentHovered, setParentHovered] = useState(false);
  const data = edgeData(props);
  const svgId = safeSvgId(`${useId()}-${props.id}`);
  const sourceNode = useInternalNode(props.source);
  const targetNode = useInternalNode(props.target);
  const originalSourceNode = useInternalNode(String(data.originalSource || props.source));
  const originalTargetNode = useInternalNode(String(data.originalTarget || props.target));
  const rawEndpoints = floatingEndpoints(sourceNode, targetNode, props);
  const endpoints = applyEndpointSpacing(
    rawEndpoints,
    numeric(data.sourceDistanceFromNode, 0),
    numeric(data.targetDistanceFromNode, 0)
  );
  const curveType = String(props.data?.curveType || 'default');
  const attentionState = data.attentionState ? `topoviewer-edge-attention-${data.attentionState}` : '';
  const [edgePath, labelX, labelY] = edgePathForCurve(curveType, { ...props, ...endpoints }, data, endpoints);
  const usesBundledBezierLane = curveType === 'bezier' && !!data.parallelLinkGroup;
  const offset = usesBundledBezierLane ? { x: 0, y: 0 } : laneOffset(data, endpoints);
  const transform = pathTransform(offset);
  const isPipe = !!data.isPipe || data.pipe === true;
  const isLane = !!data.isLane;
  const isLinkAggregate = data.isLinkAggregate === true || data.isLinkAggregate === 'true';
  const linkGroupExpandHandler = data.__topoviewerOnLinkGroupExpand as (() => void) | undefined;
  const linkGroupCollapseHandler = data.__topoviewerOnLinkGroupCollapse as (() => void) | undefined;
  const outlineStyle = !isPipe ? lineOutlineStyle(props, data) : undefined;
  const hasSourceLaneStub = isLane && !!data.originalSource;
  const hasTargetLaneStub = isLane && !!data.originalTarget;
  const sourceStubEndpoints = hasSourceLaneStub
    ? floatingEndpoints(originalSourceNode, sourceNode, props)
    : undefined;
  const targetStubEndpoints = hasTargetLaneStub
    ? floatingEndpoints(targetNode, originalTargetNode, props)
    : undefined;
  const stitchedSourceStubEndpoints = sourceStubEndpoints ? {
    ...sourceStubEndpoints,
    targetX: sourceStubEndpoints.targetX + offset.x,
    targetY: sourceStubEndpoints.targetY + offset.y
  } : undefined;
  const stitchedTargetStubEndpoints = targetStubEndpoints ? {
    ...targetStubEndpoints,
    sourceX: targetStubEndpoints.sourceX + offset.x,
    sourceY: targetStubEndpoints.sourceY + offset.y
  } : undefined;
  const [sourceStubPath] = stitchedSourceStubEndpoints ? straightPathForEndpoints(props, stitchedSourceStubEndpoints) : [''];
  const [targetStubPath] = stitchedTargetStubEndpoints ? straightPathForEndpoints(props, stitchedTargetStubEndpoints) : [''];
  const paintedLaneStyle = isLane ? laneStyle(props, data) : props.style;
  const sourceLabel = textValue(data.sourceLabel);
  const targetLabel = textValue(data.targetLabel);
  const gradient = gradientPaint(data, endpoints, `${svgId}-gradient`);
  const lineWidth = numeric(props.style?.strokeWidth, numeric(data.lineWidth, styleDefaultNumber('link', 'lineWidth', 1)));
  const sourceMarker = markerInfo(data, 'source', `${svgId}-source-marker`, lineWidth);
  const targetMarker = markerInfo(data, 'target', `${svgId}-target-marker`, lineWidth);
  const sourceBox = internalNodeBox(sourceNode);
  const targetBox = internalNodeBox(targetNode);
  const sourceLabelLayout = sourceLabel
    ? endpointLabelPoint(data, endpoints, offset, 'source', lineWidth, sourceLabel, sourceBox)
    : undefined;
  const targetLabelLayout = targetLabel
    ? endpointLabelPoint(data, endpoints, offset, 'target', lineWidth, targetLabel, targetBox)
    : undefined;
  const directions = data.directionalStrokes === false ? [] : linkDirections(data);
  const directionGeometry = directions.length
    ? linkDirectionGeometryForPath(
      edgePath,
      offset,
      numeric(data.directionStartGap, styleDefaultNumber('link', 'directionStartGap', 14)),
      numeric(data.directionCenterGap, styleDefaultNumber('link', 'directionCenterGap', 48))
    )
    : undefined;
  const directionClickHandler = data.__topoviewerOnLinkDirectionClick as LinkDirectionClickHandler | undefined;
  const directionDoubleClickHandler = data.__topoviewerOnLinkDirectionDoubleClick as LinkDirectionClickHandler | undefined;
  const directionMarkers = directions.map((direction) => ({
    direction,
    marker: markerInfo(
      direction.data,
      directionMarkerRole(direction.direction),
      `${svgId}-${safeSvgId(direction.id)}-marker`,
      numeric(direction.style?.strokeWidth, numeric(direction.data.lineWidth, lineWidth))
    )
  }));
  const directionGradients = directionGeometry ? directions.map((direction) => {
    const segment = linkDirectionSegment(directionGeometry, direction.direction);
    return {
      direction,
      gradient: gradientPaint(direction.data, {
        sourceX: segment.start.x,
        sourceY: segment.start.y,
        targetX: segment.end.x,
        targetY: segment.end.y
      }, `${svgId}-${safeSvgId(direction.id)}-gradient`)
    };
  }) : [];
  const edgeRenderProps = props as EdgeProps & { zIndex?: unknown };
  const paintLayerZIndex = numericOrUndefined(edgeRenderProps.zIndex) ?? numericOrUndefined(data.zIndex);
  const paintLayerStyle: CSSProperties | undefined = paintLayerZIndex === undefined ? undefined : { zIndex: paintLayerZIndex };
  const visibleStyle = isPipe
    ? pipeStyle(props, data, 'fill')
    : edgePathStyle({
      ...paintedLaneStyle,
      stroke: gradient?.url || paintedLaneStyle?.stroke
    });
  const centerLabelOffsetPoint = centerLabelOffset(data, directions, directionGeometry, lineWidth);
  const edgeLabels = edgeLabelLayouts({
    label: props.label,
    data,
    centerPoint: {
      x: labelX + offset.x + centerLabelOffsetPoint.x,
      y: labelY + offset.y + centerLabelOffsetPoint.y
    },
    sourceLabel,
    targetLabel,
    sourceLabelLayout,
    targetLabelLayout,
    sourceBox,
    targetBox,
    endpoints,
    directions,
    directionGeometry
  });
  const linkGroupCollapsePosition = linkGroupCollapseHandler
    ? linkGroupCollapsePoint(endpoints, labelX, labelY)
    : undefined;

  return (
    <>
      <g className={`topoviewer-edge-paint-layer${data.topoviewerPreview === true ? ' topoviewer-edge-preview' : ''}`} data-topoviewer-preview={data.topoviewerPreview === true ? 'true' : undefined} style={paintLayerStyle} aria-hidden="true">
        {gradient || sourceMarker || targetMarker || directionMarkers.some(({ marker }) => marker) || directionGradients.some(({ gradient: directionGradient }) => directionGradient) ? (
          <defs>
            {gradient ? (
              <linearGradient id={gradient.id} gradientUnits="userSpaceOnUse" x1={gradient.x1} y1={gradient.y1} x2={gradient.x2} y2={gradient.y2}>
                {gradient.stops.map((stop, index) => (
                  <stop key={`${index}-${stop.offset}-${stop.color}`} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
            ) : null}
            {sourceMarker ? (
              <marker
                id={sourceMarker.id}
                viewBox="-1 -1 12 12"
                refX={markerRefX(sourceMarker.shape, sourceMarker.size, sourceMarker.offset)}
                refY="5"
                markerWidth={sourceMarker.size}
                markerHeight={sourceMarker.size}
                markerUnits="userSpaceOnUse"
                orient="auto-start-reverse"
              >
                {markerShape(sourceMarker)}
              </marker>
            ) : null}
            {targetMarker ? (
              <marker
                id={targetMarker.id}
                viewBox="-1 -1 12 12"
                refX={markerRefX(targetMarker.shape, targetMarker.size, targetMarker.offset)}
                refY="5"
                markerWidth={targetMarker.size}
                markerHeight={targetMarker.size}
                markerUnits="userSpaceOnUse"
                orient="auto-start-reverse"
              >
                {markerShape(targetMarker)}
              </marker>
            ) : null}
            {directionMarkers.map(({ marker }) => marker ? (
              <marker
                key={marker.id}
                id={marker.id}
                viewBox="-1 -1 12 12"
                refX={markerRefX(marker.shape, marker.size, marker.offset)}
                refY="5"
                markerWidth={marker.size}
                markerHeight={marker.size}
                markerUnits="userSpaceOnUse"
                orient="auto-start-reverse"
              >
                {markerShape(marker)}
              </marker>
            ) : null)}
            {directionGradients.map(({ gradient: directionGradient }) => directionGradient ? (
              <linearGradient
                key={directionGradient.id}
                id={directionGradient.id}
                gradientUnits="userSpaceOnUse"
                x1={directionGradient.x1}
                y1={directionGradient.y1}
                x2={directionGradient.x2}
                y2={directionGradient.y2}
              >
                {directionGradient.stops.map((stop, index) => (
                  <stop key={`${index}-${stop.offset}-${stop.color}`} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
            ) : null)}
          </defs>
        ) : null}
        {isPipe ? (
          <path
            className="topoviewer-edge-pipe-border"
            d={edgePath}
            fill="none"
            style={pipeStyle(props, data, 'border')}
          />
        ) : null}
        {hasSourceLaneStub && sourceStubPath ? (
          <path
            className="topoviewer-edge-lane topoviewer-edge-lane-stub"
            d={sourceStubPath}
            fill="none"
            style={edgePathStyle(paintedLaneStyle)}
          />
        ) : null}
        {outlineStyle ? (
          <path
            className="topoviewer-edge-line-outline"
            d={edgePath}
            fill="none"
            transform={transform}
            style={outlineStyle}
          />
        ) : null}
        <path
          className={[
            'topoviewer-edge-visible-path',
            isPipe ? 'topoviewer-edge-pipe-fill' : '',
            isLane ? 'topoviewer-edge-lane' : '',
            isLinkAggregate ? 'topoviewer-edge-aggregate' : '',
            attentionState
          ].filter(Boolean).join(' ')}
          data-link-aggregate={isLinkAggregate ? 'true' : undefined}
          data-link-count={isLinkAggregate ? String(data.count || '') : undefined}
          d={edgePath}
          markerStart={sourceMarker?.url}
          markerEnd={(hasTargetLaneStub || data.suppressLaneMarker) ? undefined : targetMarker?.url}
          transform={transform}
          fill="none"
          style={visibleStyle}
        />
        {directionGeometry ? directions.map((direction) => {
          const segment = linkDirectionSegment(directionGeometry, direction.direction);
          const marker = directionMarkers.find((entry) => entry.direction.id === direction.id)?.marker;
          const directionGradient = directionGradients.find((entry) => entry.direction.id === direction.id)?.gradient;
          const directionOutlineStyle = directionLineOutlineStyle(direction);
          const directionAttentionState = direction.data.attentionState ? `topoviewer-edge-attention-${direction.data.attentionState}` : '';
          const directionSelected = direction.data.topoviewerSelected === true || direction.data.topoviewerSelected === 'true';
          const strokeWidth = numeric(direction.style?.strokeWidth, numeric(direction.data.lineWidth, numeric(data.lineWidth, 3)));
          const directionPath = trimPolylinePathEnd(segment.path, directionStrokeEndTrim(marker, strokeWidth, direction.style?.strokeLinecap || direction.data.lineCap));
          return (
            <g
              key={direction.id}
              className={[
                directionSelected ? 'topoviewer-edge-direction-selected' : '',
                parentHovered ? 'topoviewer-edge-direction-parent-hover' : ''
              ].filter(Boolean).join(' ') || undefined}
            >
              {directionOutlineStyle ? (
                <path
                  className="topoviewer-edge-direction-outline"
                  data-link-id={direction.data.linkId ? String(direction.data.linkId) : undefined}
                  data-direction-id={direction.id}
                  data-direction={direction.direction}
                  d={directionPath}
                  fill="none"
                  style={directionOutlineStyle}
                />
              ) : null}
              <path
                className={[
                  'topoviewer-edge-direction-stroke',
                  `topoviewer-edge-direction-${direction.direction}`,
                  directionAttentionState || attentionState
                ].filter(Boolean).join(' ')}
                data-link-id={direction.data.linkId ? String(direction.data.linkId) : undefined}
                data-direction-id={direction.id}
                data-direction={direction.direction}
                d={directionPath}
                fill="none"
                style={edgePathStyle({
                  ...direction.style,
                  stroke: directionGradient?.url || direction.style?.stroke,
                  pointerEvents: 'none'
                })}
              />
              {marker ? (
                <path
                  className="topoviewer-edge-direction-marker-carrier"
                  data-link-id={direction.data.linkId ? String(direction.data.linkId) : undefined}
                  data-direction-id={direction.id}
                  data-direction={direction.direction}
                  d={segment.path}
                  markerEnd={marker.url}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={0.01}
                  style={{ pointerEvents: 'none' }}
                />
              ) : null}
              {directionClickHandler || directionDoubleClickHandler ? (
                <path
                  className="topoviewer-edge-direction-hit-target"
                  data-link-id={direction.data.linkId ? String(direction.data.linkId) : undefined}
                  data-direction-id={direction.id}
                  data-direction={direction.direction}
                  d={segment.path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={Math.max(12, strokeWidth + 10)}
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onClick={directionClickHandler ? (event) => directionClickHandler(event, direction) : undefined}
                  onDoubleClick={directionDoubleClickHandler ? (event) => directionDoubleClickHandler(event, direction) : undefined}
                />
              ) : null}
            </g>
          );
        }) : null}
        {hasTargetLaneStub && targetStubPath ? (
          <path
            className="topoviewer-edge-lane topoviewer-edge-lane-stub"
            d={targetStubPath}
            markerEnd={targetMarker?.url}
            fill="none"
            style={edgePathStyle(paintedLaneStyle)}
          />
        ) : null}
      </g>
      <BaseEdge
        id={props.id}
        path={edgePath}
        style={edgePathStyle({ ...props.style, opacity: 0, pointerEvents: data.interactive === false ? 'none' : undefined })}
        interactionWidth={props.interactionWidth}
        onMouseEnter={() => setParentHovered(true)}
        onMouseLeave={() => setParentHovered(false)}
      />
      {props.label ? linkGroupExpandHandler ? (
        <EdgeLabelRenderer>
          <button
            aria-label={`Expand ${String(data.count || '')} parallel links`}
            className="topoviewer-edge-label topoviewer-edge-label-center topoviewer-link-group-expand-button nodrag nopan"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.preventDefault();
              event.stopPropagation();
              linkGroupExpandHandler();
            }}
            style={labelStyle(
              props,
              data,
              edgeLabels.center?.x ?? labelX + offset.x + centerLabelOffsetPoint.x,
              edgeLabels.center?.y ?? labelY + offset.y + centerLabelOffsetPoint.y,
              'center',
              undefined,
              edgeLabels.center?.opacity === undefined ? undefined : { opacity: edgeLabels.center.opacity }
            )}
            type="button"
          >
            {String(props.label)}
          </button>
        </EdgeLabelRenderer>
      ) : renderEdgeLabel(
          props,
          data,
          String(props.label),
          edgeLabels.center?.x ?? labelX + offset.x + centerLabelOffsetPoint.x,
          edgeLabels.center?.y ?? labelY + offset.y + centerLabelOffsetPoint.y,
          'center',
          undefined,
          undefined,
          edgeLabels.center?.opacity === undefined ? undefined : { opacity: edgeLabels.center.opacity }
        ) : null}
      {linkGroupCollapseHandler && linkGroupCollapsePosition ? (
        <EdgeLabelRenderer>
          <button
            aria-label={`Collapse ${String(data.linkAggregateCount || '')} parallel links`}
            className="topoviewer-link-group-collapse-button nodrag nopan"
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              event.preventDefault();
              event.stopPropagation();
              linkGroupCollapseHandler();
            }}
            style={{
              transform: `translate(-50%, -50%) translate(${linkGroupCollapsePosition.x}px, ${linkGroupCollapsePosition.y}px)`
            }}
            type="button"
          >
            Collapse {String(data.linkAggregateCount || '')} links
          </button>
        </EdgeLabelRenderer>
      ) : null}
      {sourceLabel && edgeLabels.source
        ? renderEdgeLabel(
          props,
          data,
          sourceLabel,
          edgeLabels.source.x,
          edgeLabels.source.y,
          'source',
          undefined,
          undefined,
          edgeLabels.source.opacity === undefined ? undefined : { opacity: edgeLabels.source.opacity }
        )
        : null}
      {targetLabel && edgeLabels.target
        ? renderEdgeLabel(
          props,
          data,
          targetLabel,
          edgeLabels.target.x,
          edgeLabels.target.y,
          'target',
          undefined,
          undefined,
          edgeLabels.target.opacity === undefined ? undefined : { opacity: edgeLabels.target.opacity }
        )
        : null}
      {directionGeometry ? directions.map((direction) => {
        if (!direction.label) return null;
        const fallbackPoint = directionLabelPoint(
          direction.direction,
          directionGeometry,
          String(data.directionLabelPlacement || 'center'),
          numeric(data.directionLabelOffset, 0)
        );
        const point = edgeLabels[`direction:${direction.id}`] || fallbackPoint;
        return renderEdgeLabel(
          {
            ...props,
            labelStyle: direction.labelStyle,
            labelBgStyle: direction.labelBgStyle
          },
          direction.data,
          direction.label,
          point.x,
          point.y,
          'center',
          direction.id,
          shouldRotateDirectionLabel(data, direction) ? fallbackPoint.angle : undefined,
          point.opacity === undefined ? undefined : { opacity: point.opacity }
        );
      }) : null}
    </>
  );
}

export const FloatingEdge = memo(FloatingEdgeComponent);
