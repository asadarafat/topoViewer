import { Handle, Position } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type { CompiledNodeData } from '../core/types';

export function CalloutNode({ data }: { data: CompiledNodeData }) {
  return (
    <div className="topoviewer-callout topoviewer-callout-drag" style={data.shapeStyle as CSSProperties} role="note" aria-label={data.title || data.name || data.id}>
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
