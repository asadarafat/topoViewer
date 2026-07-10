import { Handle, NodeResizer, Position, type ResizeParams } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type { CompiledNodeData } from '../core/types';

export function CalloutNode({ data }: { data: CompiledNodeData }) {
  const onResizeEnd = typeof data.__topoviewerOnResizeEnd === 'function'
    ? data.__topoviewerOnResizeEnd as (params: ResizeParams) => void
    : undefined;

  return (
    <div className="topoviewer-callout topoviewer-callout-drag" data-topoviewer-object-id={data.id} style={data.shapeStyle as CSSProperties} role="note" aria-label={data.title || data.name || data.id}>
      <NodeResizer
        isVisible={data.__topoviewerResizable === true}
        minWidth={120}
        minHeight={56}
        handleClassName="topoviewer-resize-handle"
        lineClassName="topoviewer-resize-line"
        onResizeEnd={onResizeEnd ? (_event, params) => onResizeEnd(params) : undefined}
      />
      <Handle type="target" position={Position.Left} />
      {data.title ? (
        <div className="topoviewer-callout-title" style={data.headerStyle}>{data.title}</div>
      ) : null}
      {data.bodyHtml ? (
        <div
          className="topoviewer-callout-body"
          style={data.bodyStyle}
          dangerouslySetInnerHTML={{ __html: data.bodyHtml }}
        />
      ) : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
