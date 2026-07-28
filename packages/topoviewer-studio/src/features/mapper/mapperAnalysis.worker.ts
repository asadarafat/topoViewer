import type { TopoDocument } from 'topoviewer';
import { discoverMapperMetrics, evaluateMapperCoverage, ingestMapperSamples } from 'topoviewer/authoring';
import { maximumMapperSampleBytes, mapperCoveragePreviewLimit, projectMapperCoverageForStudio, summarizeMapperIngestion } from './mapperAnalysisProjection';
import type { MapperWorkerRequest, MapperWorkerResponse } from './mapperWorkerProtocol';

interface MapperWorkerConfiguration {
  configVersion: number;
  document: TopoDocument;
  mapper: Record<string, unknown>;
}

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<MapperWorkerRequest>) => void) | null;
  postMessage(value: MapperWorkerResponse): void;
};

let configuration: MapperWorkerConfiguration | undefined;

scope.onmessage = (event) => {
  if (event.data.type === 'configure') {
    configuration = {
      configVersion: event.data.configVersion,
      document: event.data.document,
      mapper: event.data.mapper
    };
    return;
  }
  const { configVersion, input, requestId } = event.data;
  if (!configuration || configuration.configVersion !== configVersion) {
    scope.postMessage({
      error: 'Mapper analysis configuration is stale.',
      requestId
    });
    return;
  }
  const ingestion = ingestMapperSamples(input, { maximumBytes: maximumMapperSampleBytes });
  const samples = ingestion.samples;
  const projected = projectMapperCoverageForStudio(
    evaluateMapperCoverage(configuration.document, configuration.mapper, samples, {
      maximumItems: mapperCoveragePreviewLimit
    })
  );
  scope.postMessage({
    coverage: projected.coverage,
    coverageTotalItems: projected.totalItems,
    ingestion: summarizeMapperIngestion(ingestion),
    metrics: discoverMapperMetrics(samples),
    requestId
  });
};
