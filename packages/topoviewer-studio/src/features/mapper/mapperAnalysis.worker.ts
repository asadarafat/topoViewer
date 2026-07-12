import type { TopoDocument } from 'topoviewer';
import {
  discoverMapperMetrics,
  evaluateMapperCoverage,
  ingestMapperSamples,
  type MapperAuthoringSample
} from 'topoviewer/authoring';
import {
  maximumMapperSampleBytes,
  mapperCoveragePreviewLimit,
  projectMapperCoverageForStudio,
  summarizeMapperIngestion
} from './mapperAnalysisProjection';

interface MapperAnalysisRequest {
  document: TopoDocument;
  input?: string;
  mapper: Record<string, unknown>;
  requestId: number;
  samples?: MapperAuthoringSample[];
}

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<MapperAnalysisRequest>) => void) | null;
  postMessage(value: unknown): void;
};

scope.onmessage = (event) => {
  const { document, input, mapper, requestId } = event.data;
  const ingestion = typeof input === 'string'
    ? ingestMapperSamples(input, { maximumBytes: maximumMapperSampleBytes })
    : {
        diagnostics: [],
        format: 'generic-records' as const,
        samples: event.data.samples || [],
        truncated: false
      };
  const samples = ingestion.samples;
  const projected = projectMapperCoverageForStudio(evaluateMapperCoverage(
    document,
    mapper,
    samples,
    { maximumItems: mapperCoveragePreviewLimit }
  ));
  scope.postMessage({
    coverage: projected.coverage,
    coverageTotalItems: projected.totalItems,
    ingestion: summarizeMapperIngestion(ingestion),
    metrics: discoverMapperMetrics(samples),
    requestId
  });
};
