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
      return <polygon points={points([[50, 0], [100, 100], [0, 100]])} {...common} />;
    case 'circle':
      return <circle cx="50" cy="50" r="50" {...common} />;
    case 'square':
      return <rect x="0" y="0" width="100" height="100" rx="2" {...common} />;
    case 'rectangle':
      return <rect x="0" y="0" width="100" height="100" rx="2" {...common} />;
    case 'roundRectangle':
      return <rect x="0" y="0" width="100" height="100" rx="13" {...common} />;
    case 'bottomRoundRectangle':
      return <path d="M0 0 H100 V72 Q100 100 72 100 H28 Q0 100 0 72 Z" {...common} />;
    case 'cutRectangle':
      return <polygon points={points([[18, 0], [100, 0], [100, 82], [82, 100], [0, 100], [0, 18]])} {...common} />;
    case 'barrel':
      return <path d="M18 0 C0 18 0 82 18 100 H82 C100 82 100 18 82 0 Z" {...common} />;
    case 'rhomboid':
      return <polygon points={points([[28, 0], [100, 0], [72, 100], [0, 100]])} {...common} />;
    case 'diamond':
      return <polygon points={points([[50, 0], [100, 50], [50, 100], [0, 50]])} {...common} />;
    case 'pentagon':
      return <polygon points={points([[50, 0], [100, 36], [82, 100], [18, 100], [0, 36]])} {...common} />;
    case 'hexagon':
      return <polygon points={points([[25, 0], [75, 0], [100, 50], [75, 100], [25, 100], [0, 50]])} {...common} />;
    case 'concaveHexagon':
      return <polygon points={points([[0, 0], [100, 0], [66, 50], [100, 100], [0, 100], [34, 50]])} {...common} />;
    case 'heptagon':
      return <polygon points={points([[50, 0], [86, 14], [100, 50], [78, 100], [22, 100], [0, 50], [14, 14]])} {...common} />;
    case 'octagon':
      return <polygon points={points([[30, 0], [70, 0], [100, 30], [100, 70], [70, 100], [30, 100], [0, 70], [0, 30]])} {...common} />;
    case 'star':
      return <polygon points={points([[50, 0], [63, 33], [100, 33], [70, 55], [82, 100], [50, 73], [18, 100], [30, 55], [0, 33], [37, 33]])} {...common} />;
    case 'tag':
      return <polygon points={points([[0, 0], [70, 0], [100, 50], [70, 100], [0, 100]])} {...common} />;
    case 'vee':
      return <polygon points={points([[0, 0], [50, 40], [100, 0], [78, 100], [50, 74], [22, 100]])} {...common} />;
    case 'polygon':
      return <polygon points={polygonPoints || points([[50, 0], [100, 50], [50, 100], [0, 50]])} {...common} />;
    case 'ellipse':
    default:
      return <ellipse cx="50" cy="50" rx="50" ry="50" {...common} />;
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
          preserveAspectRatio="none"
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
