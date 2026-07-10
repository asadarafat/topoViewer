import { describe, expect, it } from 'vitest';
import type { TopoDocument } from '../../src';
import { evaluateMapperCoverage, type MapperAuthoringSample } from '../../src/authoring';

const document: TopoDocument = {
  graph: {
    nodes: [
      { id: 'leaf1', labels: { role: 'leaf' }, position: [0, 0] },
      { id: 'leaf2', labels: { role: 'leaf' }, position: [100, 0] }
    ]
  }
};

describe('mapper coverage diagnostics', () => {
  it('classifies and links every required coverage outcome', () => {
    const mapper = {
      version: 1,
      mappings: [
        { id: 'health-a', metric: 'health', target: { kind: 'node', resolve: { by: 'id', metricLabel: 'node_id' } } },
        { id: 'health-b', metric: 'health', target: { kind: 'node', resolve: { by: 'id', metricLabel: 'node_id' } } },
        { id: 'role', metric: 'role_health', target: { kind: 'node', resolve: { by: 'label', key: 'role', metricLabel: 'role' } } }
      ]
    };
    const samples = [
      { fields: {}, labels: { node_id: 'leaf1' }, metric: 'health', value: 1 },
      { fields: {}, labels: { node_id: 'missing' }, metric: 'health', value: 0 },
      { fields: {}, labels: { role: 'leaf' }, metric: 'role_health', value: 1 },
      { fields: {}, labels: {}, metric: 'unused', value: 1 },
      { fields: {}, labels: {}, metric: '', value: 1 }
    ] as MapperAuthoringSample[];
    const coverage = evaluateMapperCoverage(document, mapper, samples);

    expect(coverage.summary).toEqual({
      ambiguous: 1, duplicate: 1, ignored: 1, invalid: 1, resolved: 1, unresolved: 2
    });
    expect(coverage.items.find((item) => item.status === 'resolved')).toMatchObject({
      objectIds: ['leaf1'], ruleId: 'health-a', targetKind: 'node'
    });
    expect(coverage.items.find((item) => item.status === 'ambiguous')?.objectIds).toEqual(['leaf1', 'leaf2']);
  });

  it('ignores samples outside mapper source identity', () => {
    const coverage = evaluateMapperCoverage(document, {
      identity: { sourceId: 'branch-a', sourceIdLabel: 'source_id' },
      rules: [{ id: 'health', metric: 'health', select: 'node', join: 'node_id' }],
      version: 1
    }, [{ fields: {}, labels: { node_id: 'leaf1', source_id: 'branch-b' }, metric: 'health', value: 1 }]);
    expect(coverage.summary.ignored).toBe(1);
    expect(coverage.items[0].message).toContain('source identity');
  });
});
