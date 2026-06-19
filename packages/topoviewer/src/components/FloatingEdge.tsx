import {
  BaseEdge,
  EdgeLabelRenderer,
  Position,
  ViewportPortal,
  getBezierPath,
  getSimpleBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useInternalNode,
  type EdgeProps
} from '@xyflow/react';
import type { CSSProperties } from 'react';
import type { Bounds } from '../core/types';

function internalNodeBox(node: ReturnType<typeof useInternalNode> | undefined): Bounds & { centerX: number; centerY: number } | null {
  if (!node) return null;
  const runtimeNode = node as typeof node & {
    positionAbsolute?: { x: number; y: number };
    data?: { nodeStyle?: { width?: number; minHeight?: number }; edgeAnchor?: Bounds };
  };
  const position = runtimeNode.internals?.positionAbsolute || runtimeNode.positionAbsolute || runtimeNode.position || { x: 0, y: 0 };
  const width = runtimeNode.measured?.width || runtimeNode.width || Number(runtimeNode.data?.nodeStyle?.width || 82);
  const height = runtimeNode.measured?.height || runtimeNode.height || Number(runtimeNode.data?.nodeStyle?.minHeight || 60);
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
  if (curveType === 'bezier') {
    const distance = bezierControlPointDistance(data);
    if (distance !== undefined) return quadraticBezierPathForEndpoints(props, endpoints, distance, numeric(data.controlPointWeight, 0.5));
    return getBezierPath(props);
  }
  if (curveType === 'straight') return getStraightPath(props);
  if (curveType === 'step') return getSmoothStepPath({ ...props, borderRadius: 0 });
  if (curveType === 'smoothstep') return getSmoothStepPath(props);
  if (curveType === 'simplebezier') return getSimpleBezierPath(props);
  return getBezierPath(props);
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

function labelStyle(props: EdgeProps, x: number, y: number): CSSProperties {
  return {
    color: props.labelStyle?.fill,
    fontSize: props.labelStyle?.fontSize,
    fontWeight: props.labelStyle?.fontWeight,
    background: props.labelBgStyle?.fill,
    position: 'absolute',
    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
    pointerEvents: 'all'
  };
}

function pipeStyle(props: EdgeProps, data: Record<string, unknown>, role: 'border' | 'fill'): CSSProperties {
  const baseStroke = String(props.style?.stroke || '#6ea8fe');
  const pipeWidth = numeric(data.pipeWidth, numeric(props.style?.strokeWidth, 1) + 14);
  if (role === 'border') {
    return {
      stroke: String(data.pipeBorderColor || baseStroke),
      strokeWidth: pipeWidth + numeric(data.pipeBorderWidth, 2),
      opacity: 0.58
    };
  }
  return {
    stroke: String(data.pipeFill || baseStroke),
    strokeWidth: pipeWidth,
    opacity: numeric(data.pipeOpacity, 0.18)
  };
}

function laneStyle(props: EdgeProps, data: Record<string, unknown>): CSSProperties {
  return {
    ...props.style,
    strokeWidth: numeric(data.laneWidth, numeric(props.style?.strokeWidth, 3))
  };
}

function lineOutlineStyle(props: EdgeProps, data: Record<string, unknown>): CSSProperties | undefined {
  const outlineWidth = numeric(data.lineOutlineWidth, 0);
  if (outlineWidth <= 0) return undefined;
  return {
    ...props.style,
    stroke: String(data.lineOutlineColor || '#0f172a'),
    strokeWidth: numeric(props.style?.strokeWidth, 1) + outlineWidth * 2,
    strokeDasharray: props.style?.strokeDasharray,
    strokeDashoffset: props.style?.strokeDashoffset,
    strokeLinecap: props.style?.strokeLinecap,
    opacity: numeric(data.lineOpacity, numeric(props.style?.opacity, 1))
  };
}

export function FloatingEdge(props: EdgeProps) {
  const data = edgeData(props);
  const sourceNode = useInternalNode(props.source);
  const targetNode = useInternalNode(props.target);
  const originalSourceNode = useInternalNode(String(data.originalSource || props.source));
  const originalTargetNode = useInternalNode(String(data.originalTarget || props.target));
  const endpoints = floatingEndpoints(sourceNode, targetNode, props);
  const curveType = String(props.data?.curveType || 'default');
  const attentionState = data.attentionState ? `topoviewer-edge-attention-${data.attentionState}` : '';
  const attentionLabelPriority = data.attentionLabelPriority ? `topoviewer-edge-label-priority-${data.attentionLabelPriority}` : '';
  const [edgePath, labelX, labelY] = edgePathForCurve(curveType, { ...props, ...endpoints }, data, endpoints);
  const usesBundledBezierLane = curveType === 'bezier' && !!data.parallelLinkGroup;
  const offset = usesBundledBezierLane ? { x: 0, y: 0 } : laneOffset(data, endpoints);
  const transform = pathTransform(offset);
  const isPipe = !!data.isPipe || data.pipe === true;
  const isLane = !!data.isLane;
  const isLinkAggregate = data.isLinkAggregate === true || data.isLinkAggregate === 'true';
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
  const sourceLabelX = endpoints.sourceX + offset.x + numeric(data.sourceLabelXOffset, 0);
  const sourceLabelY = endpoints.sourceY + offset.y + numeric(data.sourceLabelYOffset, 0);
  const targetLabelX = endpoints.targetX + offset.x + numeric(data.targetLabelXOffset, 0);
  const targetLabelY = endpoints.targetY + offset.y + numeric(data.targetLabelYOffset, 0);

  return (
    <>
      <ViewportPortal>
        <svg className="topoviewer-edge-paint-layer" aria-hidden="true">
          {isPipe ? (
            <path
              className="topoviewer-edge-pipe-border"
              d={edgePath}
              style={pipeStyle(props, data, 'border')}
            />
          ) : null}
          {hasSourceLaneStub && sourceStubPath ? (
            <path
              className="topoviewer-edge-lane topoviewer-edge-lane-stub"
              d={sourceStubPath}
              style={paintedLaneStyle}
            />
          ) : null}
          {outlineStyle ? (
            <path
              className="topoviewer-edge-line-outline"
              d={edgePath}
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
            markerStart={props.markerStart as string | undefined}
            markerEnd={(hasTargetLaneStub || data.suppressLaneMarker) ? undefined : props.markerEnd as string | undefined}
            transform={transform}
            style={isPipe ? pipeStyle(props, data, 'fill') : paintedLaneStyle}
          />
          {hasTargetLaneStub && targetStubPath ? (
            <path
              className="topoviewer-edge-lane topoviewer-edge-lane-stub"
              d={targetStubPath}
              markerEnd={props.markerEnd as string | undefined}
              style={paintedLaneStyle}
            />
          ) : null}
        </svg>
      </ViewportPortal>
      <BaseEdge
        id={props.id}
        path={edgePath}
        markerStart={props.markerStart}
        markerEnd={props.markerEnd}
        style={{ ...props.style, opacity: 0 }}
        interactionWidth={props.interactionWidth}
      />
      {props.label ? (
        <EdgeLabelRenderer>
          <div
            className="topoviewer-edge-label topoviewer-edge-label-center"
            data-attention-state={data.attentionState || undefined}
            data-label-priority={data.attentionLabelPriority || undefined}
            style={labelStyle(props, labelX + offset.x, labelY + offset.y)}
          >
            {props.label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
      {sourceLabel ? (
        <EdgeLabelRenderer>
          <div
            className="topoviewer-edge-label topoviewer-edge-label-source"
            data-attention-state={data.attentionState || undefined}
            data-label-priority={data.attentionLabelPriority || undefined}
            style={labelStyle(props, sourceLabelX, sourceLabelY)}
          >
            {sourceLabel}
          </div>
        </EdgeLabelRenderer>
      ) : null}
      {targetLabel ? (
        <EdgeLabelRenderer>
          <div
            className="topoviewer-edge-label topoviewer-edge-label-target"
            data-attention-state={data.attentionState || undefined}
            data-label-priority={data.attentionLabelPriority || undefined}
            style={labelStyle(props, targetLabelX, targetLabelY)}
          >
            {targetLabel}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
