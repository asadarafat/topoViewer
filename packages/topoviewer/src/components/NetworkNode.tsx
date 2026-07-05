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

function handlePosition(value: unknown): Position {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'top') return Position.Top;
  if (normalized === 'right') return Position.Right;
  if (normalized === 'bottom') return Position.Bottom;
  return Position.Left;
}

function handleTypes(value: unknown): Array<'source' | 'target'> {
  if (value === 'source') return ['source'];
  if (value === 'target') return ['target'];
  return ['source', 'target'];
}

function handleOffsetStyle(position: Position, offsetValue: unknown): CSSProperties {
  const parsed = Number(offsetValue);
  const offset = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 50;
  const percent = `${offset}%`;
  if (position === Position.Top || position === Position.Bottom) {
    return { left: percent };
  }
  return { top: percent };
}

function explicitHandles(data: CompiledNodeData) {
  return Array.isArray(data.handles)
    ? data.handles.filter((handle): handle is NonNullable<CompiledNodeData['handles']>[number] => !!handle?.id)
    : [];
}

function RenderExplicitHandles({ handles }: { handles: ReturnType<typeof explicitHandles> }) {
  return (
    <>
      {handles.flatMap((handle) => {
        const position = handlePosition(handle.position || handle.side);
        return handleTypes(handle.type).map((type) => (
          <Handle
            key={`${handle.id}:${type}`}
            className="topoviewer-node-handle"
            id={handle.id}
            type={type}
            position={position}
            style={handleOffsetStyle(position, handle.offset)}
          />
        ));
      })}
    </>
  );
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
  const rendersOverlayMeta = data.metaZIndex !== undefined;
  const cardLayout = data.nodeLayout?.type === 'card' ? data.nodeLayout : undefined;
  const isNavigableAttentionNode = data.attentionState === 'focused' || data.attentionState === 'related';
  const accessibleLabel = [
    displayName(data),
    data.attentionState ? `attention ${data.attentionState}` : ''
  ].filter(Boolean).join(', ');
  const handles = explicitHandles(data);
  const cardTitleStyle: CSSProperties = {
    color: labelStyle.color,
    fontSize: labelStyle.fontSize,
    fontWeight: labelStyle.fontWeight,
    opacity: labelStyle.opacity,
    textAlign: (data.cardContentStyle as CSSProperties | undefined)?.textAlign
  };
  const cardSubtitleStyle: CSSProperties = {
    color: (data.metaStyle as CSSProperties | undefined)?.color,
    fontSize: (data.metaStyle as CSSProperties | undefined)?.fontSize,
    fontWeight: (data.metaStyle as CSSProperties | undefined)?.fontWeight,
    textAlign: (data.cardContentStyle as CSSProperties | undefined)?.textAlign
  };

  return (
    <div
      className={[className, cardLayout ? 'topoviewer-node-layout-card' : ''].filter(Boolean).join(' ')}
      style={data.nodeStyle}
      role="group"
      aria-current={data.attentionState === 'focused' ? 'true' : undefined}
      aria-label={accessibleLabel}
      tabIndex={isNavigableAttentionNode ? 0 : -1}
    >
      {cardLayout ? (
        <>
          <Handle className="topoviewer-node-handle topoviewer-node-handle-default" type="target" position={Position.Left} />
          <RenderExplicitHandles handles={handles} />
          <div className="topoviewer-node-card">
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
            <div className="topoviewer-node-card-inner">
              <div className="topoviewer-node-card-icon" style={data.cardIconStyle as CSSProperties}>
                <span className="topoviewer-node-card-icon-content" style={data.cardIconContentStyle as CSSProperties}>
                  {imageSource ? (
                    <img className="topoviewer-node-icon-image" src={imageSource} alt={imageAlt} draggable={false} style={data.cardIconImageStyle as CSSProperties} />
                  ) : (
                    icon.glyph
                  )}
                </span>
                {data.badgeLabel ? (
                  <span
                    className="topoviewer-node-badge"
                    data-badge-position={data.cardBadgePosition || data.badgePosition || 'topRight'}
                    style={data.badgeStyle as CSSProperties}
                  >
                    {data.badgeLabel}
                  </span>
                ) : null}
              </div>
              <div className="topoviewer-node-card-content" style={data.cardContentStyle as CSSProperties}>
                <div className="topoviewer-node-card-title" style={cardTitleStyle}>
                  {data.cardTitle || displayName(data)}
                </div>
                {data.cardSubtitle ? (
                  <div className="topoviewer-node-card-subtitle" style={cardSubtitleStyle}>
                    {data.cardSubtitle}
                  </div>
                ) : null}
              </div>
            </div>
            {data.statusStyle ? (
              <span
                className="topoviewer-node-status"
                data-status-placement={data.statusPlacement || 'bottomRight'}
                style={data.statusStyle as CSSProperties}
              />
            ) : null}
          </div>
          <Handle className="topoviewer-node-handle topoviewer-node-handle-default" type="source" position={Position.Right} />
        </>
      ) : (
        <>
      <div
        className="topoviewer-node-icon"
        style={iconFrameStyle}
      >
        <Handle className="topoviewer-node-handle topoviewer-node-handle-default" type="target" position={Position.Left} />
        <RenderExplicitHandles handles={handles} />
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
        <Handle className="topoviewer-node-handle topoviewer-node-handle-default" type="source" position={Position.Right} />
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
      {rendersMeta && !rendersOverlayMeta ? <div className="topoviewer-node-meta" style={data.metaStyle}>{metaText}</div> : null}
        </>
      )}
    </div>
  );
}
