import { useEffect, useState } from 'react';
import type { TopoDocument } from 'topoviewer';
import {
  discoverMapperMetrics,
  evaluateMapperCoverage,
  type MapperAuthoringSample,
  type MapperCoverageResult,
  type MapperMetricDiscovery
} from 'topoviewer/authoring';

export const mapperWorkerSampleThreshold = 250;

export interface MapperAnalysisState {
  coverage?: MapperCoverageResult;
  error?: string;
  metrics: MapperMetricDiscovery[];
  mode: 'idle' | 'sync' | 'worker';
  pending: boolean;
}

export function mapperAnalysisMode(sampleCount: number): 'sync' | 'worker' {
  return sampleCount > mapperWorkerSampleThreshold ? 'worker' : 'sync';
}

export function useMapperAnalysis(
  document: TopoDocument,
  mapper: Record<string, unknown> | undefined,
  samples: MapperAuthoringSample[] | undefined
): MapperAnalysisState {
  const [state, setState] = useState<MapperAnalysisState>({ metrics: [], mode: 'idle', pending: false });

  useEffect(() => {
    if (!mapper || !samples?.length) {
      setState({ metrics: [], mode: 'idle', pending: false });
      return;
    }
    const mode = mapperAnalysisMode(samples.length);
    if (mode === 'sync') {
      setState({
        coverage: evaluateMapperCoverage(document, mapper, samples),
        metrics: discoverMapperMetrics(samples),
        mode,
        pending: false
      });
      return;
    }
    if (typeof Worker === 'undefined') {
      const timer = setTimeout(() => setState({
        coverage: evaluateMapperCoverage(document, mapper, samples),
        metrics: discoverMapperMetrics(samples),
        mode: 'sync',
        pending: false
      }), 0);
      setState({ metrics: [], mode: 'sync', pending: true });
      return () => clearTimeout(timer);
    }
    const requestId = Date.now();
    const worker = new Worker(new URL('./mapperAnalysis.worker.ts', import.meta.url), { type: 'module' });
    setState({ metrics: [], mode: 'worker', pending: true });
    worker.onmessage = (event: MessageEvent<{
      coverage: MapperCoverageResult;
      metrics: MapperMetricDiscovery[];
      requestId: number;
    }>) => {
      if (event.data.requestId !== requestId) return;
      setState({ coverage: event.data.coverage, metrics: event.data.metrics, mode: 'worker', pending: false });
      worker.terminate();
    };
    worker.onerror = (event) => {
      setState({ error: event.message || 'Mapper analysis worker failed.', metrics: [], mode: 'worker', pending: false });
      worker.terminate();
    };
    worker.postMessage({ document, mapper, requestId, samples });
    return () => worker.terminate();
  }, [document, mapper, samples]);

  return state;
}
