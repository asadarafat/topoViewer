import { ViewportPortal, useViewport, type Node } from '@xyflow/react';
import type { CSSProperties } from 'react';
import { displayName } from '../core/style';
import type { Bounds, CompiledNodeData } from '../core/types';

type RuntimeNode = Node<Record<string, unknown>> & {
  measured?: {
    width?: number;
    height?: number;
  };
  positionAbsolute?: {
    x: number;
    y: number;
  };
  internals?: {
    positionAbsolute?: {
      x: number;
      y: number;
    };
  };
};

type AnchorTransform = {
  x: number;
  y: number;
  transform: string;
};

function finiteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function cssNumber(value: unknown, fallback: number): number {
  return finiteNumber(value) ?? fallback;
}

function nodeSize(node: RuntimeNode, data: CompiledNodeData): { width: number; height: number } {
  const nodeStyle = (data.nodeStyle || {}) as Record<string, unknown>;
  const flowStyle = (node.style || {}) as Record<string, unknown>;
  return {
    width: cssNumber(node.width ?? node.measured?.width ?? flowStyle.width ?? nodeStyle.width, 82),
    height: cssNumber(node.height ?? node.measured?.height ?? flowStyle.height ?? nodeStyle.minHeight, 60)
  };
}

function edgeAnchor(data: CompiledNodeData, width: number, height: number): Bounds {
  const anchor = data.edgeAnchor;
  if (anchor) return anchor;
  return { x: 0, y: 0, width, height };
}

function nodePosition(node: RuntimeNode): { x: number; y: number } {
  return node.internals?.positionAbsolute || node.positionAbsolute || node.position || { x: 0, y: 0 };
}

function nodeLabelPoint(node: RuntimeNode, data: CompiledNodeData): AnchorTransform {
  const { width, height } = nodeSize(node, data);
  const anchor = edgeAnchor(data, width, height);
  const position = nodePosition(node);
  const nodeStyle = (data.nodeStyle || {}) as Record<string, unknown>;
  const labelPosition = data.labelPosition || 'bottom';
  const offsetX = cssNumber(nodeStyle['--topoviewer-node-label-x-offset'], 0);
  const offsetY = cssNumber(nodeStyle['--topoviewer-node-label-y-offset'], 0);
  const centerX = position.x + anchor.x + anchor.width / 2;
  const centerY = position.y + anchor.y + anchor.height / 2;

  switch (labelPosition) {
    case 'top':
      return {
        x: centerX + offsetX,
        y: position.y + anchor.y - 8 + offsetY,
        transform: 'translate(-50%, -100%)'
      };
    case 'left':
      return {
        x: position.x + anchor.x - 8 + offsetX,
        y: centerY + offsetY,
        transform: 'translate(-100%, -50%)'
      };
    case 'right':
      return {
        x: position.x + anchor.x + anchor.width + 8 + offsetX,
        y: centerY + offsetY,
        transform: 'translate(0, -50%)'
      };
    case 'center':
      return {
        x: centerX + offsetX,
        y: centerY + offsetY,
        transform: 'translate(-50%, -50%)'
      };
    case 'bottom':
    default:
      return {
        x: centerX + offsetX,
        y: position.y + anchor.y + anchor.height + 8 + offsetY,
        transform: 'translate(-50%, 0)'
      };
  }
}

function regionLabelPoint(node: RuntimeNode, data: CompiledNodeData): AnchorTransform {
  const { width, height } = nodeSize(node, data);
  const position = nodePosition(node);
  const labelPosition = data.labelPosition || 'topLeft';
  const margin = cssNumber(data.labelMargin, 12);
  const leftMargin = cssNumber(data.labelLeftMargin, margin);

  switch (labelPosition) {
    case 'topCenter':
      return { x: position.x + width / 2, y: position.y + margin, transform: 'translate(-50%, 0)' };
    case 'topRight':
    case 'rightTop':
      return { x: position.x + width - margin, y: position.y + margin, transform: 'translate(-100%, 0)' };
    case 'rightCenter':
      return { x: position.x + width - margin, y: position.y + height / 2, transform: 'translate(-100%, -50%)' };
    case 'rightBottom':
    case 'bottomRight':
      return { x: position.x + width - margin, y: position.y + height - margin, transform: 'translate(-100%, -100%)' };
    case 'bottomCenter':
      return { x: position.x + width / 2, y: position.y + height - margin, transform: 'translate(-50%, -100%)' };
    case 'bottomLeft':
    case 'leftBottom':
      return { x: position.x + leftMargin, y: position.y + height - margin, transform: 'translate(0, -100%)' };
    case 'leftCenter':
      return { x: position.x + leftMargin, y: position.y + height / 2, transform: 'translate(0, -50%)' };
    case 'leftTop':
    case 'topLeft':
    default:
      return { x: position.x + leftMargin, y: position.y + margin, transform: 'translate(0, 0)' };
  }
}

function overlayStyle(baseStyle: CSSProperties | undefined, point: AnchorTransform, zIndex: number): CSSProperties {
  return {
    ...(baseStyle || {}),
    position: 'absolute',
    left: point.x,
    top: point.y,
    zIndex,
    transform: point.transform,
    pointerEvents: 'none'
  };
}

function shouldRenderOverlayLabel(data: CompiledNodeData, viewportZoom: number): boolean {
  if (finiteNumber(data.labelZIndex) === undefined) return false;
  if (data.attentionLabelPriority === 'hidden') return false;
  if (typeof data.labelMinZoom === 'number') {
    const configuredFontSize = cssNumber(data.labelStyle?.fontSize, 10);
    return configuredFontSize * viewportZoom >= data.labelMinZoom;
  }
  return true;
}

function labelContent(data: CompiledNodeData) {
  if (data.labelHtml) return { dangerouslySetInnerHTML: { __html: data.labelHtml } };
  return {};
}

export function LabelOverlay({ nodes }: { nodes: RuntimeNode[] }) {
  const viewport = useViewport();
  const labels = nodes.flatMap((node) => {
    const data = node.data as unknown as CompiledNodeData | undefined;
    const labelZIndex = finiteNumber(data?.labelZIndex);
    if (!data || labelZIndex === undefined || node.hidden || !shouldRenderOverlayLabel(data, viewport.zoom)) return [];

    if (node.type === 'region') {
      const point = regionLabelPoint(node, data);
      return [(
        <div
          key={`${node.id}:label`}
          className="topoviewer-region-label topoviewer-label-overlay"
          data-label-z-index={labelZIndex}
          style={overlayStyle(data.labelStyle, point, labelZIndex)}
        >
          {displayName(data)}
        </div>
      )];
    }

    if (node.type !== 'network') return [];
    const point = nodeLabelPoint(node, data);
    return [(
      <div
        key={`${node.id}:label`}
        className="topoviewer-node-label topoviewer-label-overlay"
        data-label-position={data.labelPosition || 'bottom'}
        data-label-priority={data.attentionLabelPriority || undefined}
        data-label-z-index={labelZIndex}
        style={overlayStyle(data.labelStyle, point, labelZIndex)}
        {...labelContent(data)}
      >
        {data.labelHtml ? null : displayName(data)}
      </div>
    )];
  });

  if (!labels.length) return null;
  return (
    <ViewportPortal>
      {labels}
    </ViewportPortal>
  );
}
