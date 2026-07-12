import { NodeResizer, type ResizeParams } from '@xyflow/react';
import { useEffect, useRef, useState } from 'react';
import type { CompiledNodeData } from '../core/types';

export type TopoViewerResizeState = 'idle' | 'resizing' | 'settling';

function reducedMotionRequested() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function useAuthoringNodeResizer({
  data,
  minHeight,
  minWidth
}: {
  data: CompiledNodeData;
  minHeight: number;
  minWidth: number;
}) {
  const [state, setState] = useState<TopoViewerResizeState>('idle');
  const settleTimer = useRef<ReturnType<typeof setTimeout>>();
  const onResizeEnd = typeof data.__topoviewerOnResizeEnd === 'function'
    ? data.__topoviewerOnResizeEnd as (params: ResizeParams) => void
    : undefined;
  const visible = data.__topoviewerResizable === true && Boolean(onResizeEnd);

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  const resizer = visible ? (
    <NodeResizer
      isVisible
      minHeight={minHeight}
      minWidth={minWidth}
      handleClassName="topoviewer-resize-handle"
      lineClassName="topoviewer-resize-line"
      onResizeStart={() => {
        if (settleTimer.current) clearTimeout(settleTimer.current);
        setState('resizing');
      }}
      onResizeEnd={(_event, params) => {
        onResizeEnd?.(params);
        if (reducedMotionRequested()) {
          setState('idle');
          return;
        }
        setState('settling');
        settleTimer.current = setTimeout(() => setState('idle'), 220);
      }}
    />
  ) : null;

  return { resizer, resizeState: visible ? state : 'idle' as TopoViewerResizeState };
}
