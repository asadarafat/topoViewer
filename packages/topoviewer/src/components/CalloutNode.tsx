import { Handle, Position } from '@xyflow/react';
import { memo, type CSSProperties } from 'react';
import type { CompiledNodeData } from '../core/types';
import { useAuthoringNodeResizer } from './AuthoringNodeResizer';

function CalloutNodeComponent({ data }: { data: CompiledNodeData }) {
  const { resizer, resizeState } = useAuthoringNodeResizer({ data, minHeight: 56, minWidth: 120 });

  return (
    <div className={`topoviewer-callout topoviewer-callout-drag topoviewer-resize-surface${data.topoviewerPreview === true ? ' topoviewer-object-preview' : ''}`} data-resize-state={resizeState} data-topoviewer-object-id={data.id} data-topoviewer-preview={data.topoviewerPreview === true ? 'true' : undefined} style={data.shapeStyle as CSSProperties} role="note" aria-label={data.title || data.name || data.id}>
      {resizer}
      <Handle className="topoviewer-authoring-object-handle" type="target" position={Position.Left} />
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
      <Handle className="topoviewer-authoring-object-handle" type="source" position={Position.Right} />
    </div>
  );
}

export const CalloutNode = memo(CalloutNodeComponent);
