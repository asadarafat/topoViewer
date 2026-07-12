import { describe, expect, it } from 'vitest';
import type { TopoDocument } from 'topoviewer';
import { evaluateMapperCoverage, ingestMapperSamples } from 'topoviewer/authoring';
import { mapperWorkerSampleThreshold } from '../../src/features/mapper/useMapperAnalysis';
import { benchmark, budgets, expectSeriesWithinBudget, writeBenchmarkReport } from './benchmark';

describe('mapper analysis performance evidence', () => {
  it('profiles small, typical, and maximum ingestion and coverage cardinalities', () => {
    const topology: TopoDocument = {
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
    const fixture = (sampleCount: number) => Array.from({ length: sampleCount }, (_, index) => ({
      fields: {}, labels: { node_id: `node-${index % 1_000}` }, metric: 'health', value: 1
    }));
    const smallSamples = fixture(50);
    const typicalSamples = fixture(500);
    const maximumSamples = fixture(5_000);
    const maximumJson = JSON.stringify(maximumSamples);
    const coverage = evaluateMapperCoverage(topology, mapper, maximumSamples);
    const smallCardinality = benchmark(() => {
      for (let operation = 0; operation < 10; operation += 1) {
        evaluateMapperCoverage(topology, mapper, smallSamples);
      }
    }, 10);
    const typicalCardinality = benchmark(() => {
      for (let operation = 0; operation < 10; operation += 1) {
        evaluateMapperCoverage(topology, mapper, typicalSamples);
      }
    }, 10);
    const maximumCardinality = benchmark(() => evaluateMapperCoverage(topology, mapper, maximumSamples));
    const maximumIngestion = benchmark(() => ingestMapperSamples(maximumJson));

    expect(coverage.summary.resolved).toBe(5_000);
    expect(mapperWorkerSampleThreshold).toBeLessThan(maximumSamples.length);
    writeBenchmarkReport('mapper.json', {
      maximumCardinality,
      maximumIngestion,
      smallCardinality,
      typicalCardinality
    });
    expectSeriesWithinBudget(smallCardinality, budgets.budgets.unit.mapperMs.smallCardinality, 'smallCardinality');
    expectSeriesWithinBudget(typicalCardinality, budgets.budgets.unit.mapperMs.typicalCardinality, 'typicalCardinality');
    expectSeriesWithinBudget(maximumCardinality, budgets.budgets.unit.mapperMs.maximumCardinality, 'maximumCardinality');
    expectSeriesWithinBudget(maximumIngestion, budgets.budgets.unit.mapperMs.maximumIngestion, 'maximumIngestion');
  });
});
