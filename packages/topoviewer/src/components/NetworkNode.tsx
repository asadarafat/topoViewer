import { Handle, Position, useViewport } from '@xyflow/react';
import type { CSSProperties, SVGAttributes } from 'react';
import { displayName, formatLabels } from '../core/style';
import { sanitizeSvg } from '../core/security';
import { type NodeShapeName } from '../core/nodeShapes';
import { DEFAULT_NODE_SHAPE } from '../core/styleDefaults';
import type { CompiledNodeData } from '../core/types';

type Point = [number, number];

function points(values: Point[]): string {
  return values.map(([x, y]) => `${x},${y}`).join(' ');
}

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(sanitizeSvg(svg))}`;
}

function iconImageSource(icon: CompiledNodeData['iconSpec']): string | undefined {
  if (!icon) return undefined;
  if (icon.src) return icon.src;
  if (icon.svg) return svgToDataUri(icon.svg);
  return undefined;
}

function NodeShapeSvg({
  type,
  polygonPoints,
  className = 'topoviewer-node-geometry-shape',
  style,
  fill,
  stroke,
  strokeWidth,
  transform
}: {
  type: NodeShapeName;
  polygonPoints?: string;
  className?: string;
  style?: CSSProperties;
  fill: string;
  stroke: string;
  strokeWidth: number;
  transform?: string;
}) {
  const common: SVGAttributes<SVGElement> = {
    className,
    fill,
    stroke,
    strokeWidth,
    style,
    transform,
    strokeLinejoin: 'round',
    strokeLinecap: 'round'
  };

  switch (type) {
    case 'triangle':
      return <polygon points={points([[50, 8], [92, 88], [8, 88]])} {...common} />;
    case 'circle':
      return <circle cx="50" cy="50" r="40" {...common} />;
    case 'square':
      return <rect x="16" y="16" width="68" height="68" rx="2" {...common} />;
    case 'rectangle':
      return <rect x="10" y="18" width="80" height="64" rx="2" {...common} />;
    case 'roundRectangle':
      return <rect x="10" y="18" width="80" height="64" rx="13" {...common} />;
    case 'bottomRoundRectangle':
      return <path d="M10 16 H90 V62 Q90 84 68 84 H32 Q10 84 10 62 Z" {...common} />;
    case 'cutRectangle':
      return <polygon points={points([[24, 12], [90, 12], [90, 76], [76, 90], [10, 90], [10, 24]])} {...common} />;
    case 'barrel':
      return <path d="M22 12 C12 28 12 72 22 88 H78 C88 72 88 28 78 12 Z" {...common} />;
    case 'rhomboid':
      return <polygon points={points([[30, 14], [92, 14], [70, 86], [8, 86]])} {...common} />;
    case 'diamond':
      return <polygon points={points([[50, 8], [92, 50], [50, 92], [8, 50]])} {...common} />;
    case 'pentagon':
      return <polygon points={points([[50, 7], [92, 38], [76, 90], [24, 90], [8, 38]])} {...common} />;
    case 'hexagon':
      return <polygon points={points([[28, 10], [72, 10], [92, 50], [72, 90], [28, 90], [8, 50]])} {...common} />;
    case 'concaveHexagon':
      return <polygon points={points([[22, 10], [78, 10], [62, 50], [78, 90], [22, 90], [38, 50]])} {...common} />;
    case 'heptagon':
      return <polygon points={points([[50, 7], [82, 20], [94, 52], [74, 88], [26, 88], [6, 52], [18, 20]])} {...common} />;
    case 'octagon':
      return <polygon points={points([[32, 10], [68, 10], [90, 32], [90, 68], [68, 90], [32, 90], [10, 68], [10, 32]])} {...common} />;
    case 'star':
      return <polygon points={points([[50, 7], [61, 34], [91, 34], [67, 54], [76, 86], [50, 67], [24, 86], [33, 54], [9, 34], [39, 34]])} {...common} />;
    case 'tag':
      return <polygon points={points([[10, 20], [68, 20], [92, 50], [68, 80], [10, 80]])} {...common} />;
    case 'vee':
      return <polygon points={points([[9, 14], [50, 48], [91, 14], [74, 90], [50, 68], [26, 90]])} {...common} />;
    case 'polygon':
      return <polygon points={polygonPoints || points([[50, 8], [92, 50], [50, 92], [8, 50]])} {...common} />;
    case 'ellipse':
    default:
      return <ellipse cx="50" cy="50" rx="40" ry="28" {...common} />;
  }
}

export function NetworkNode({ data }: { data: CompiledNodeData }) {
  const viewport = useViewport();
  const icon = data.iconSpec || { glyph: 'R', fill: '#6ea8fe', stroke: '#d8e8ff' };
  const imageSource = iconImageSource(icon);
  const imageAlt = icon.alt || icon.glyph || displayName(data);
  const iconStyle = (data.iconStyle || {}) as CSSProperties;
  const iconContentStyle = (data.iconContentStyle || {}) as CSSProperties;
  const iconImageStyle = (data.iconImageStyle || {}) as CSSProperties;
  const nodeShapeStyle = (data.nodeShapeStyle || {}) as CSSProperties;
  const nodeOutlineStyle = (data.nodeOutlineStyle || {}) as CSSProperties;
  const nodeUnderlayStyle = (data.nodeUnderlayStyle || {}) as CSSProperties;
  const labelStyle = (data.labelStyle || {}) as CSSProperties;
  const nodeShapeType = data.nodeShapeType || DEFAULT_NODE_SHAPE;
  const fill = String(nodeShapeStyle.fill || iconStyle.backgroundColor || icon.fill || '#929aa8');
  const stroke = String(nodeShapeStyle.stroke || iconStyle.borderColor || icon.stroke || '#d9e0ea');
  const strokeWidth = Number(nodeShapeStyle.strokeWidth || iconStyle.borderWidth || 4);
  const outlineStroke = String(nodeOutlineStyle.stroke || stroke);
  const outlineStrokeWidth = Number(nodeOutlineStyle.strokeWidth || 0);
  const underlayFill = String(nodeUnderlayStyle.fill || 'transparent');
  const underlayScaleX = String(nodeUnderlayStyle['--topoviewer-node-underlay-scale-x' as keyof CSSProperties] || '1');
  const underlayScaleY = String(nodeUnderlayStyle['--topoviewer-node-underlay-scale-y' as keyof CSSProperties] || '1');
  const underlayTransform = `translate(50 50) scale(${underlayScaleX} ${underlayScaleY}) translate(-50 -50)`;
  const configuredFontSize = Number.parseFloat(String(labelStyle.fontSize || 10));
  const labelMinZoom = typeof data.labelMinZoom === 'number' ? data.labelMinZoom : undefined;
  const labelSuppressed = labelMinZoom !== undefined && configuredFontSize * viewport.zoom < labelMinZoom;
  const iconFrameStyle = {
    width: iconStyle.width,
    height: iconStyle.height,
    color: iconStyle.color,
    '--topoviewer-node-fill': fill,
    '--topoviewer-node-stroke': stroke,
    '--topoviewer-node-stroke-width': strokeWidth
  } as CSSProperties;
  const className = [
    'topoviewer-node',
    'topoviewer-node-drag',
    `topoviewer-node-shape-${nodeShapeType}`,
    `topoviewer-node-label-position-${data.labelPosition || 'bottom'}`,
    labelSuppressed ? 'topoviewer-node-label-zoom-suppressed' : '',
    data.containedChildCount ? 'topoviewer-node-parent' : '',
    data.isContainedChild ? 'topoviewer-node-child' : '',
    data.attentionState ? `topoviewer-node-attention-${data.attentionState}` : '',
    data.attentionLabelPriority ? `topoviewer-node-label-priority-${data.attentionLabelPriority}` : ''
  ].filter(Boolean).join(' ');
  const labelHtml = data.labelHtml;
  const rendersOverlayLabel = data.labelZIndex !== undefined;
  const isNavigableAttentionNode = data.attentionState === 'focused' || data.attentionState === 'related';
  const accessibleLabel = [
    displayName(data),
    data.attentionState ? `attention ${data.attentionState}` : ''
  ].filter(Boolean).join(', ');

  return (
    <div
      className={className}
      style={data.nodeStyle}
      role="group"
      aria-current={data.attentionState === 'focused' ? 'true' : undefined}
      aria-label={accessibleLabel}
      tabIndex={isNavigableAttentionNode ? 0 : -1}
    >
      <Handle type="target" position={Position.Left} />
      <div
        className="topoviewer-node-icon"
        style={iconFrameStyle}
      >
        <svg
          className="topoviewer-node-geometry"
          viewBox="0 0 100 100"
          role="presentation"
          focusable="false"
          data-node-shape={nodeShapeType}
        >
          <NodeShapeSvg
            type={nodeShapeType}
            polygonPoints={data.nodeShapePoints}
            className="topoviewer-node-geometry-underlay"
            fill={underlayFill}
            stroke="none"
            strokeWidth={0}
            style={nodeUnderlayStyle}
            transform={underlayTransform}
          />
          <NodeShapeSvg
            type={nodeShapeType}
            polygonPoints={data.nodeShapePoints}
            className="topoviewer-node-geometry-outline"
            fill="none"
            stroke={outlineStroke}
            strokeWidth={outlineStrokeWidth}
            style={nodeOutlineStyle}
          />
          <NodeShapeSvg
            type={nodeShapeType}
            polygonPoints={data.nodeShapePoints}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            style={nodeShapeStyle}
          />
        </svg>
        <span className="topoviewer-node-icon-content" style={iconContentStyle}>
          {imageSource ? (
            <img className="topoviewer-node-icon-image" src={imageSource} alt={imageAlt} draggable={false} style={iconImageStyle} />
          ) : (
            icon.glyph
          )}
        </span>
        {data.badgeLabel ? (
          <span
            className="topoviewer-node-badge"
            data-badge-position={data.badgePosition || 'topRight'}
            style={data.badgeStyle as CSSProperties}
          >
            {data.badgeLabel}
          </span>
        ) : null}
        {data.statusStyle ? (
          <span
            className="topoviewer-node-status"
            data-status-placement={data.statusPlacement || 'bottomRight'}
            style={data.statusStyle as CSSProperties}
          />
        ) : null}
      </div>
      {rendersOverlayLabel ? null : (
        <div
          className="topoviewer-node-label"
          style={labelStyle}
          data-label-position={data.labelPosition || 'bottom'}
          {...(labelHtml ? { dangerouslySetInnerHTML: { __html: labelHtml } } : {})}
        >
          {labelHtml ? null : displayName(data)}
        </div>
      )}
      <div className="topoviewer-node-meta" style={data.metaStyle}>{formatLabels(data.labels)}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
