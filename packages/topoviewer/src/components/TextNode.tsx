import { Handle, Position } from '@xyflow/react';
import { memo, type CSSProperties } from 'react';
import type { CompiledNodeData } from '../core/types';
import { useAuthoringNodeResizer } from './AuthoringNodeResizer';

function TextNodeComponent({ data }: { data: CompiledNodeData }) {
  const { resizer, resizeState } = useAuthoringNodeResizer({ data, minHeight: 28, minWidth: 48 });
  const text = String(data.text || '');

  return (
    <div
      className="topoviewer-text topoviewer-text-drag topoviewer-resize-surface"
      data-resize-state={resizeState}
      data-topoviewer-object-id={data.id}
      style={data.textBoxStyle as CSSProperties}
      role="note"
      aria-label={text || String(data.name || data.id)}
    >
      {resizer}
      <Handle className="topoviewer-authoring-object-handle" type="target" position={Position.Left} />
      <span className="topoviewer-text-content">{text}</span>
      <Handle className="topoviewer-authoring-object-handle" type="source" position={Position.Right} />
    </div>
  );
}

export const TextNode = memo(TextNodeComponent);
