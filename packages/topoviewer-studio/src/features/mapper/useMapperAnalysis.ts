import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import type { TopoDocument } from 'topoviewer';
import { discoverMapperMetrics, evaluateMapperCoverage, ingestMapperSamples, type MapperCoverageResult, type MapperMetricDiscovery } from 'topoviewer/authoring';
import { maximumMapperSampleBytes, projectMapperCoverageForStudio, summarizeMapperIngestion, type StudioMapperIngestionSummary } from './mapperAnalysisProjection';
import { createMapperAnalysisRequest, createMapperConfigurationRequest, type MapperWorkerResponse } from './mapperWorkerProtocol';

export const mapperWorkerSampleThreshold = 250;

export interface MapperAnalysisState {
  analyze(input?: string): void;
  coverage?: MapperCoverageResult;
  coverageTotalItems?: number;
  error?: string;
  ingestion?: StudioMapperIngestionSummary;
  metrics: MapperMetricDiscovery[];
  mode: 'idle' | 'sync' | 'worker';
  pending: boolean;
}

type MapperAnalysisSnapshot = Omit<MapperAnalysisState, 'analyze'>;

export function mapperAnalysisMode(sampleCount: number): 'sync' | 'worker' {
  return sampleCount > mapperWorkerSampleThreshold ? 'worker' : 'sync';
}

export function useMapperAnalysis(document: TopoDocument, mapper: Record<string, unknown> | undefined): MapperAnalysisState {
  const [state, setState] = useState<MapperAnalysisSnapshot>({
    metrics: [],
    mode: 'idle',
    pending: false
  });
  const workerRef = useRef<Worker>();
  const activeRequestIdRef = useRef(0);
  const configurationVersionRef = useRef(0);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (typeof Worker === 'undefined') return undefined;
    const worker = new Worker(new URL('./mapperAnalysis.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<MapperWorkerResponse>) => {
      if (event.data.requestId !== activeRequestIdRef.current) return;
      performance.mark('topoviewer-studio-mapper-worker-response');
      if ('error' in event.data) {
        setState({
          error: event.data.error,
          metrics: [],
          mode: 'worker',
          pending: false
        });
        return;
      }
      const response = event.data;
      startTransition(() =>
        setState({
          coverage: response.coverage,
          coverageTotalItems: response.coverageTotalItems,
          ingestion: response.ingestion,
          metrics: response.metrics,
          mode: 'worker',
          pending: false
        })
      );
    };
    worker.onerror = (event) => {
      setState({
        error: event.message || 'Mapper analysis worker failed.',
        metrics: [],
        mode: 'worker',
        pending: false
      });
    };
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      if (workerRef.current === worker) workerRef.current = undefined;
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker || !mapper) return;
    activeRequestIdRef.current += 1;
    const configVersion = configurationVersionRef.current + 1;
    configurationVersionRef.current = configVersion;
    worker.postMessage(createMapperConfigurationRequest(configVersion, document, mapper));
  }, [document, mapper]);

  const analyze = useCallback((input?: string) => {
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = undefined;
    }
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
    if (!mapper || !input?.trim()) {
      setState({ metrics: [], mode: 'idle', pending: false });
      return;
    }
    if (typeof Worker === 'undefined') {
      syncTimerRef.current = setTimeout(() => {
        const ingestion = ingestMapperSamples(input, {
          maximumBytes: maximumMapperSampleBytes
        });
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
      return;
    }
    const worker = workerRef.current;
    if (!worker) {
      setState((current) => ({
        ...current,
        error: 'Mapper analysis worker is not ready.',
        metrics: [],
        mode: 'worker',
        pending: false
      }));
      return;
    }
    performance.mark('topoviewer-studio-mapper-analysis-scheduled');
    worker.postMessage(createMapperAnalysisRequest(configurationVersionRef.current, input, requestId));
    performance.mark('topoviewer-studio-mapper-analysis-posted');
    startTransition(() => setState({ metrics: [], mode: 'worker', pending: true }));
  }, [document, mapper]);

  return { ...state, analyze };
}
