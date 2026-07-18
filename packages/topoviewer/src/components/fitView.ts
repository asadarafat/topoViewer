import type { FitViewOptions } from '@xyflow/react';

const defaultFitViewOptions: FitViewOptions = {
  duration: 220,
  maxZoom: 1,
  padding: 0.06
};

export function resolveFitViewOptions(options?: FitViewOptions): FitViewOptions {
  return { ...defaultFitViewOptions, ...options };
}
