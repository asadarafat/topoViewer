import { Handle, Position } from '@xyflow/react';
import type { CSSProperties } from 'react';
import { displayName, formatLabels } from '../core/style';
import { sanitizeSvg } from '../core/security';
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

export function NetworkNode({ data }: { data: CompiledNodeData }) {
  const icon = data.iconSpec || { glyph: 'R', fill: '#6ea8fe', stroke: '#d8e8ff' };
  const imageSource = iconImageSource(icon);
  const imageAlt = icon.alt || icon.glyph || displayName(data);
  const className = [
    'topoviewer-node',
    'topoviewer-node-drag',
    data.containedChildCount ? 'topoviewer-node-parent' : '',
    data.isContainedChild ? 'topoviewer-node-child' : '',
    data.attentionState ? `topoviewer-node-attention-${data.attentionState}` : '',
    data.attentionLabelPriority ? `topoviewer-node-label-priority-${data.attentionLabelPriority}` : ''
  ].filter(Boolean).join(' ');
  const labelHtml = data.labelHtml;
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
        style={{
          '--topoviewer-node-fill': icon.fill,
          '--topoviewer-node-stroke': icon.stroke,
          ...data.iconStyle
        } as CSSProperties}
      >
        {imageSource ? (
          <img className="topoviewer-node-icon-image" src={imageSource} alt={imageAlt} draggable={false} />
        ) : (
          icon.glyph
        )}
      </div>
      <div
        className="topoviewer-node-label"
        style={data.labelStyle}
        {...(labelHtml ? { dangerouslySetInnerHTML: { __html: labelHtml } } : {})}
      >
        {labelHtml ? null : displayName(data)}
      </div>
      <div className="topoviewer-node-meta" style={data.metaStyle}>{formatLabels(data.labels)}</div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
