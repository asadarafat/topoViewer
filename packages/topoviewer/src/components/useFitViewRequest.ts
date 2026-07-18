import type { FitViewOptions, ReactFlowInstance } from '@xyflow/react';
import { useEffect, useRef } from 'react';
import { resolveFitViewOptions } from './fitView';

export function useFitViewRequest(
  requestId: string | number | undefined,
  ready: boolean,
  reactFlow: ReactFlowInstance,
  options?: FitViewOptions
) {
  const optionsRef = useRef<FitViewOptions>(resolveFitViewOptions(options));
  optionsRef.current = resolveFitViewOptions(options);
  const appliedRequestIdRef = useRef(requestId);

  useEffect(() => {
    if (requestId === undefined || !ready || Object.is(appliedRequestIdRef.current, requestId)) return undefined;
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        appliedRequestIdRef.current = requestId;
        void reactFlow.fitView(optionsRef.current);
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, [reactFlow, ready, requestId]);
}
