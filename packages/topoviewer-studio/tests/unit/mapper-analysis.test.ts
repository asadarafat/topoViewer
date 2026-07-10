import { describe, expect, it } from 'vitest';
import {
  mapperAnalysisMode,
  mapperWorkerSampleThreshold
} from '../../src/features/mapper/useMapperAnalysis';

describe('mapper analysis scheduling', () => {
  it('keeps small inputs synchronous and moves measured blocking sizes to a worker', () => {
    expect(mapperWorkerSampleThreshold).toBe(250);
    expect(mapperAnalysisMode(250)).toBe('sync');
    expect(mapperAnalysisMode(251)).toBe('worker');
    expect(mapperAnalysisMode(5_000)).toBe('worker');
  });
});
