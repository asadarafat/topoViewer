import type { TopoDocument } from 'topoviewer';
import type { MapperCoverageResult, MapperMetricDiscovery } from 'topoviewer/authoring';
import type { StudioMapperIngestionSummary } from './mapperAnalysisProjection';

export interface MapperWorkerConfigurationRequest {
  configVersion: number;
  document: TopoDocument;
  mapper: Record<string, unknown>;
  type: 'configure';
}

export interface MapperWorkerAnalysisRequest {
  configVersion: number;
  input: string;
  requestId: number;
  type: 'analyze';
}

export type MapperWorkerRequest = MapperWorkerAnalysisRequest | MapperWorkerConfigurationRequest;

export type MapperWorkerResponse =
  | {
      coverage: MapperCoverageResult;
      coverageTotalItems: number;
      ingestion: StudioMapperIngestionSummary;
      metrics: MapperMetricDiscovery[];
      requestId: number;
    }
  | {
      error: string;
      requestId: number;
    };

export function createMapperConfigurationRequest(
  configVersion: number,
  document: TopoDocument,
  mapper: Record<string, unknown>
): MapperWorkerConfigurationRequest {
  return {
    configVersion,
    document,
    mapper,
    type: 'configure'
  };
}

export function createMapperAnalysisRequest(
  configVersion: number,
  input: string,
  requestId: number
): MapperWorkerAnalysisRequest {
  return {
    configVersion,
    input,
    requestId,
    type: 'analyze'
  };
}
