import { NodeResizer, type ResizeParams } from '@xyflow/react';
import type { CSSProperties } from 'react';
import { displayName } from '../core/style';
import type { CompiledNodeData } from '../core/types';

export function RegionNode({ data }: { data: CompiledNodeData }) {
  const rendersOverlayLabel = data.labelZIndex !== undefined;
  const onResizeEnd = typeof data.__topoviewerOnResizeEnd === 'function'
    ? data.__topoviewerOnResizeEnd as (params: ResizeParams) => void
    : undefined;
  const onCollapse = typeof data.__topoviewerOnRegionCollapse === 'function'
    ? data.__topoviewerOnRegionCollapse as () => void
    : undefined;

  return (
    <div
      className={`topoviewer-region topoviewer-region-drag${data.topoviewerPreview === true ? ' topoviewer-region-preview' : ''}`}
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
      {onCollapse ? (
        <button
          type="button"
          className="topoviewer-region-collapse-button nodrag nopan"
          aria-label={`Collapse ${displayName(data)}`}
          title="Collapse region"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onCollapse();
          }}
        >
          -
        </button>
      ) : null}
      {rendersOverlayLabel ? null : <div className="topoviewer-region-label" style={data.labelStyle}>{displayName(data)}</div>}
    </div>
  );
}
