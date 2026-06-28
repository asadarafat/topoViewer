import { describe, expect, it } from 'vitest';
import type { DataFrame } from '@grafana/data';
import { parseMapperTelemetryDataFrames } from '../src/mapperTelemetryFrames';
import type { TopoViewerMapper } from '../src/mapperTypes';

const mapper: TopoViewerMapper = {
  version: 1,
  mappings: [
    {
      id: 'link-utilization',
      metric: 'topoviewer_link_utilization_percent',
      target: {
        kind: 'link',
        resolve: {
          by: 'id',
          metricLabel: 'link_id'
        }
      }
    }
  ]
};

describe('mapper telemetry frame parser', () => {
  it('extracts Prometheus-style time series samples by mapper metric name', () => {
    const result = parseMapperTelemetryDataFrames([
      {
        name: 'topoviewer_link_utilization_percent',
        fields: [
          { name: 'Time', values: [1, 2] },
          {
            name: 'Value',
            labels: {
              __name__: 'topoviewer_link_utilization_percent',
              fixture_id: 'layered-network',
              link_id: 'underlay-ams-lon'
            },
            values: [72, 93]
          }
        ]
      } as unknown as DataFrame
    ], mapper);

    expect(result.diagnostics).toEqual([]);
    expect(result.samples).toEqual([
      {
        metric: 'topoviewer_link_utilization_percent',
        value: 93,
        labels: {
          __name__: 'topoviewer_link_utilization_percent',
          fixture_id: 'layered-network',
          link_id: 'underlay-ams-lon'
        },
        fields: {
          value: 93,
          field: 'Value',
          frame: 'topoviewer_link_utilization_percent'
        }
      }
    ]);
  });

  it('extracts table samples when metrics are columns', () => {
    const result = parseMapperTelemetryDataFrames([
      {
        name: 'table',
        fields: [
          { name: 'link_id', values: ['a-b'] },
          { name: 'topoviewer_link_utilization_percent', values: [84] }
        ]
      } as unknown as DataFrame
    ], mapper);

    expect(result.samples).toHaveLength(1);
    expect(result.samples[0]).toMatchObject({
      metric: 'topoviewer_link_utilization_percent',
      value: 84,
      labels: {
        link_id: 'a-b'
      }
    });
  });
});
