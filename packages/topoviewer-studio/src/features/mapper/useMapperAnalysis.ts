import { startTransition, useEffect, useRef, useState } from 'react';
import type { TopoDocument } from 'topoviewer';
import {
  discoverMapperMetrics,
  evaluateMapperCoverage,
  ingestMapperSamples,
  type MapperCoverageResult,
  type MapperMetricDiscovery
} from 'topoviewer/authoring';
import {
  maximumMapperSampleBytes,
  projectMapperCoverageForStudio,
  summarizeMapperIngestion,
  type StudioMapperIngestionSummary
} from './mapperAnalysisProjection';

export const mapperWorkerSampleThreshold = 250;

export interface MapperAnalysisState {
  coverage?: MapperCoverageResult;
  coverageTotalItems?: number;
  error?: string;
  ingestion?: StudioMapperIngestionSummary;
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
  input: string | undefined
): MapperAnalysisState {
  const [state, setState] = useState<MapperAnalysisState>({ metrics: [], mode: 'idle', pending: false });
  const workerRef = useRef<Worker>();
  const activeRequestIdRef = useRef(0);

  useEffect(() => {
    if (typeof Worker === 'undefined') return undefined;
    const worker = new Worker(new URL('./mapperAnalysis.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{
      coverage: MapperCoverageResult;
      coverageTotalItems: number;
      ingestion: StudioMapperIngestionSummary;
      metrics: MapperMetricDiscovery[];
      requestId: number;
    }>) => {
      if (event.data.requestId !== activeRequestIdRef.current) return;
      startTransition(() => setState({
        coverage: event.data.coverage,
        coverageTotalItems: event.data.coverageTotalItems,
        ingestion: event.data.ingestion,
        metrics: event.data.metrics,
        mode: 'worker',
        pending: false
      }));
    };
    worker.onerror = (event) => {
      setState({ error: event.message || 'Mapper analysis worker failed.', metrics: [], mode: 'worker', pending: false });
    };
    return () => {
      if (workerRef.current === worker) workerRef.current = undefined;
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    if (!mapper || !input?.trim()) {
      setState({ metrics: [], mode: 'idle', pending: false });
      return;
    }
    if (typeof Worker === 'undefined') {
      const timer = setTimeout(() => {
        const ingestion = ingestMapperSamples(input, { maximumBytes: maximumMapperSampleBytes });
        const samples = ingestion.samples;
        const projected = projectMapperCoverageForStudio(evaluateMapperCoverage(document, mapper, samples));
        setState({
          coverage: projected.coverage,
          coverageTotalItems: projected.totalItems,
          ingestion: summarizeMapperIngestion(ingestion),
          metrics: discoverMapperMetrics(samples),
          mode: 'sync',
          pending: false
        });
      }, 0);
      setState({ metrics: [], mode: 'sync', pending: true });
      return () => clearTimeout(timer);
    }
    const worker = workerRef.current;
    if (!worker) return;
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    startTransition(() => setState({ metrics: [], mode: 'worker', pending: true }));
    worker.postMessage({ document, input, mapper, requestId });
    return () => {
      if (activeRequestIdRef.current === requestId) activeRequestIdRef.current += 1;
    };
  }, [document, input, mapper]);

  return state;
}
