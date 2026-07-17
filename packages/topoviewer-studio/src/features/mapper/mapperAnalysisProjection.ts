import type { MapperCoverageResult, MapperSampleIngestionResult } from 'topoviewer/authoring';

export const mapperCoveragePreviewLimit = 25;
export const maximumMapperSampleBytes = 2 * 1024 * 1024;

export interface StudioMapperIngestionSummary {
  diagnostics: MapperSampleIngestionResult['diagnostics'];
  format: MapperSampleIngestionResult['format'];
  sampleCount: number;
  truncated: boolean;
}

export interface StudioMapperCoverageProjection {
  coverage: MapperCoverageResult;
  totalItems: number;
}

export function projectMapperCoverageForStudio(coverage: MapperCoverageResult): StudioMapperCoverageProjection {
  return {
    coverage: {
      items: coverage.items.slice(0, mapperCoveragePreviewLimit),
      summary: coverage.summary
    },
    totalItems: Object.values(coverage.summary).reduce((total, count) => total + count, 0)
  };
}

export function summarizeMapperIngestion(result: MapperSampleIngestionResult): StudioMapperIngestionSummary {
  return {
    diagnostics: result.diagnostics,
    format: result.format,
    sampleCount: result.samples.length,
    truncated: result.truncated
  };
}
