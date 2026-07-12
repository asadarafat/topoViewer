import { memo, type CSSProperties } from 'react';
import { displayName } from '../core/style';
import type { CompiledNodeData } from '../core/types';
import { useAuthoringNodeResizer } from './AuthoringNodeResizer';

function RegionNodeComponent({ data }: { data: CompiledNodeData }) {
  const rendersOverlayLabel = data.labelZIndex !== undefined;
  const { resizer, resizeState } = useAuthoringNodeResizer({ data, minHeight: 80, minWidth: 120 });
  const onCollapse = typeof data.__topoviewerOnRegionCollapse === 'function'
    ? data.__topoviewerOnRegionCollapse as () => void
    : undefined;

  return (
    <div
      className={`topoviewer-region topoviewer-region-drag topoviewer-resize-surface${data.topoviewerPreview === true ? ' topoviewer-region-preview' : ''}`}
      data-resize-state={resizeState}
      data-topoviewer-object-id={data.id}
      style={{
        '--topoviewer-region-fill': data.fill,
        '--topoviewer-region-stroke': data.stroke,
        borderWidth: data.borderWidth,
        borderRadius: data.borderRadius
      } as CSSProperties}
    >
      {resizer}
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

export const RegionNode = memo(RegionNodeComponent);
