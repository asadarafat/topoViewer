import { memo, type CSSProperties } from 'react';
import { markdownToHtml } from '../core/style';
import type { CompiledNodeData } from '../core/types';
import { useAuthoringNodeResizer } from './AuthoringNodeResizer';

function TextNodeComponent({ data }: { data: CompiledNodeData }) {
  const { resizer, resizeState } = useAuthoringNodeResizer({ data, minHeight: 28, minWidth: 48 });
  const text = String(data.text || '');

  return (
    <div
      className={`topoviewer-text topoviewer-text-drag topoviewer-resize-surface${data.topoviewerPreview === true ? ' topoviewer-object-preview' : ''}`}
      data-auto-size={data.autoSize === true}
      data-resize-state={resizeState}
      data-topoviewer-object-id={data.id}
      data-topoviewer-preview={data.topoviewerPreview === true ? 'true' : undefined}
      style={data.textBoxStyle as CSSProperties}
      role="note"
      aria-label={text || String(data.name || data.id)}
    >
      {resizer}
      <div
        className="topoviewer-text-content"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(text) }}
      />
    </div>
  );
}

export const TextNode = memo(TextNodeComponent);
