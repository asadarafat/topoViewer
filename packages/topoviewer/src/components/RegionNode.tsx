import type { CSSProperties } from 'react';
import { displayName } from '../core/style';
import type { CompiledNodeData } from '../core/types';

export function RegionNode({ data }: { data: CompiledNodeData }) {
  const rendersOverlayLabel = data.labelZIndex !== undefined;

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
      {rendersOverlayLabel ? null : <div className="topoviewer-region-label" style={data.labelStyle}>{displayName(data)}</div>}
    </div>
  );
}
