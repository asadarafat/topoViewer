import type { TopoDocument } from 'topoviewer';
import {
  discoverMapperMetrics,
  evaluateMapperCoverage,
  type MapperAuthoringSample
} from 'topoviewer/authoring';

interface MapperAnalysisRequest {
  document: TopoDocument;
  mapper: Record<string, unknown>;
  requestId: number;
  samples: MapperAuthoringSample[];
}

const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<MapperAnalysisRequest>) => void) | null;
  postMessage(value: unknown): void;
};

scope.onmessage = (event) => {
  const { document, mapper, requestId, samples } = event.data;
  scope.postMessage({
    coverage: evaluateMapperCoverage(document, mapper, samples),
    metrics: discoverMapperMetrics(samples),
    requestId
  });
};
