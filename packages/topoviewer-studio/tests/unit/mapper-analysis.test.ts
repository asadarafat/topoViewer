import { describe, expect, it } from 'vitest';
import { mapperAnalysisMode, mapperWorkerSampleThreshold } from '../../src/features/mapper/useMapperAnalysis';
import { createMapperAnalysisRequest } from '../../src/features/mapper/mapperWorkerProtocol';

describe('mapper analysis scheduling', () => {
  it('keeps small inputs synchronous and moves measured blocking sizes to a worker', () => {
    expect(mapperWorkerSampleThreshold).toBe(250);
    expect(mapperAnalysisMode(250)).toBe('sync');
    expect(mapperAnalysisMode(251)).toBe('worker');
    expect(mapperAnalysisMode(5_000)).toBe('worker');
  });

  it('keeps dense topology configuration out of repeated analysis requests', () => {
    expect(createMapperAnalysisRequest(7, '[{"metric":"health","value":1}]', 12)).toEqual({
      configVersion: 7,
      input: '[{"metric":"health","value":1}]',
      requestId: 12,
      type: 'analyze'
    });
  });
});
