import { describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import type { TopoDocument } from 'topoviewer';
import { evaluateMapperCoverage } from 'topoviewer/authoring';
import { mapperWorkerSampleThreshold } from '../../src/features/mapper/useMapperAnalysis';

describe('mapper analysis performance evidence', () => {
  it('documents why maximum-cardinality analysis is scheduled off the main thread', () => {
    const document: TopoDocument = {
      graph: {
        nodes: Array.from({ length: 1_000 }, (_, index) => ({
          id: `node-${index}`, position: [index, 0]
        }))
      }
    };
    const mapper = {
      mappings: [{
        id: 'health', metric: 'health',
        target: { kind: 'node', resolve: { by: 'id', metricLabel: 'node_id' } }
      }],
      version: 1
    };
    const samples = Array.from({ length: 5_000 }, (_, index) => ({
      fields: {}, labels: { node_id: `node-${index % 1_000}` }, metric: 'health', value: 1
    }));
    const started = performance.now();
    const coverage = evaluateMapperCoverage(document, mapper, samples);
    const elapsedMs = performance.now() - started;

    expect(coverage.summary.resolved).toBe(5_000);
    expect(mapperWorkerSampleThreshold).toBeLessThan(samples.length);
    expect(elapsedMs).toBeLessThan(2_000);
  });
});
