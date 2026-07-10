import { describe, expect, it } from 'vitest';
import { ingestMapperSamples } from '../../src/authoring';

describe('mapper sample ingestion', () => {
  it('ingests documented generic records', () => {
    const result = ingestMapperSamples(JSON.stringify({ samples: [{
      metric: 'node_health', value: 1, labels: { node_id: 'leaf1' }, fields: { source: 'test' }
    }] }));
    expect(result).toMatchObject({ format: 'generic-records', truncated: false });
    expect(result.samples).toEqual([{
      metric: 'node_health', value: 1, labels: { node_id: 'leaf1' }, fields: { source: 'test' }
    }]);
  });

  it('ingests Prometheus vector and matrix results using the latest value', () => {
    const vector = ingestMapperSamples({ data: { result: [{
      metric: { __name__: 'interface_up', link_id: 'a-b' }, value: [10, '1']
    }] } });
    expect(vector.format).toBe('prometheus');
    expect(vector.samples[0]).toMatchObject({ metric: 'interface_up', value: 1, labels: { link_id: 'a-b' } });

    const matrix = ingestMapperSamples({ data: { result: [{
      metric: { __name__: 'interface_bps', link_id: 'a-b' }, values: [[10, '100'], [20, '200']]
    }] } });
    expect(matrix.samples[0].value).toBe(200);
  });

  it('ingests Grafana time-series and table JSON without Grafana types', () => {
    const timeSeries = ingestMapperSamples({ frames: [{
      name: 'interface_bps',
      fields: [
        { name: 'Time', values: [1, 2] },
        { name: 'Value', labels: { __name__: 'interface_bps', link_id: 'a-b' }, values: [100, 200] }
      ]
    }] });
    expect(timeSeries.format).toBe('grafana-data-frames');
    expect(timeSeries.samples[0]).toMatchObject({ metric: 'interface_bps', value: 200, labels: { link_id: 'a-b' } });

    const table = ingestMapperSamples({ frames: [{
      name: 'table',
      fields: [
        { name: 'node_id', values: ['leaf1'] },
        { name: 'node_health', values: [1] }
      ]
    }] });
    expect(table.samples[0]).toMatchObject({ metric: 'node_health', value: 1, labels: { node_id: 'leaf1' } });
  });

  it('bounds bytes, cardinality, labels, fields, and malformed records', () => {
    expect(ingestMapperSamples('x'.repeat(20), { maximumBytes: 10 }).diagnostics[0]?.code)
      .toBe('sample-input-too-large');
    expect(ingestMapperSamples('{').diagnostics[0]?.code).toBe('sample-json-invalid');
    const result = ingestMapperSamples(Array.from({ length: 5 }, (_, index) => ({
      fields: { a: 1, b: 2 }, labels: { a: '1', b: '2' }, metric: `m${index}`, value: index
    })), { maximumFields: 1, maximumLabels: 1, maximumSamples: 2 });
    expect(result.samples).toHaveLength(2);
    expect(Object.keys(result.samples[0].labels)).toHaveLength(1);
    expect(Object.keys(result.samples[0].fields)).toHaveLength(1);
    expect(result).toMatchObject({ truncated: true });
    expect(result.diagnostics.map((item) => item.code)).toContain('sample-limit-reached');
  });
});
