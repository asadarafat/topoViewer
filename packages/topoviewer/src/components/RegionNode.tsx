import { NodeResizer, type ResizeParams } from '@xyflow/react';
import type { CSSProperties } from 'react';
import { displayName } from '../core/style';
import type { CompiledNodeData } from '../core/types';

export function RegionNode({ data }: { data: CompiledNodeData }) {
  const rendersOverlayLabel = data.labelZIndex !== undefined;
  const onResizeEnd = typeof data.__topoviewerOnResizeEnd === 'function'
    ? data.__topoviewerOnResizeEnd as (params: ResizeParams) => void
    : undefined;

  return (
    <div
      className="topoviewer-region topoviewer-region-drag"
      style={{
        '--topoviewer-region-fill': data.fill,
        '--topoviewer-region-stroke': data.stroke,
        borderWidth: data.borderWidth,
        borderRadius: data.borderRadius
      } as CSSProperties}
    >
      <NodeResizer
        isVisible={data.__topoviewerResizable === true}
        minWidth={120}
        minHeight={80}
        handleClassName="topoviewer-resize-handle"
        lineClassName="topoviewer-resize-line"
        onResizeEnd={onResizeEnd ? (_event, params) => onResizeEnd(params) : undefined}
      />
      {rendersOverlayLabel ? null : <div className="topoviewer-region-label" style={data.labelStyle}>{displayName(data)}</div>}
    </div>
  );
}
