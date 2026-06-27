import { Handle, Position, useViewport } from '@xyflow/react';
import type { CSSProperties, SVGAttributes } from 'react';
import { displayName, formatLabels } from '../core/style';
import { sanitizeSvg } from '../core/security';
import { nodeShapeGeometry, type NodeShapeName } from '../core/nodeShapes';
import { DEFAULT_NODE_SHAPE } from '../core/styleDefaults';
import type { CompiledNodeData } from '../core/types';

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
  const geometry = nodeShapeGeometry(type, polygonPoints);
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
  const attributes = geometry.attributes as SVGAttributes<SVGElement>;

  switch (geometry.element) {
    case 'circle':
      return <circle {...attributes} {...common} />;
    case 'ellipse':
      return <ellipse {...attributes} {...common} />;
    case 'path':
      return <path {...attributes} {...common} />;
    case 'rect':
      return <rect {...attributes} {...common} />;
    case 'polygon':
    default:
      return <polygon {...attributes} {...common} />;
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
  const nodeStrokeOverlayStyle: CSSProperties = {
    strokeDasharray: nodeShapeStyle.strokeDasharray,
    strokeOpacity: nodeShapeStyle.strokeOpacity
  };
  const labelStyle = (data.labelStyle || {}) as CSSProperties;
  const nodeShapeType = data.nodeShapeType || DEFAULT_NODE_SHAPE;
  const preservesShapeAspectRatio = nodeShapeType === 'circle' || nodeShapeType === 'square';
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
  const metaText = formatLabels(data.labels);
  const rendersMeta = data.metaVisible !== false && metaText !== '';
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
          preserveAspectRatio={preservesShapeAspectRatio ? 'xMidYMid meet' : 'none'}
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
            stroke="none"
            strokeWidth={0}
          />
        </svg>
        <span className="topoviewer-node-icon-content" style={iconContentStyle}>
          {imageSource ? (
            <img className="topoviewer-node-icon-image" src={imageSource} alt={imageAlt} draggable={false} style={iconImageStyle} />
          ) : (
            icon.glyph
          )}
        </span>
        <svg
          className="topoviewer-node-geometry topoviewer-node-geometry-stroke-overlay"
          viewBox="0 0 100 100"
          preserveAspectRatio={preservesShapeAspectRatio ? 'xMidYMid meet' : 'none'}
          role="presentation"
          focusable="false"
          data-node-shape={nodeShapeType}
        >
          <NodeShapeSvg
            type={nodeShapeType}
            polygonPoints={data.nodeShapePoints}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            style={nodeStrokeOverlayStyle}
          />
        </svg>
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
      {rendersMeta ? <div className="topoviewer-node-meta" style={data.metaStyle}>{metaText}</div> : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
