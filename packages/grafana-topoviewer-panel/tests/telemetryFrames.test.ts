import { describe, expect, it } from 'vitest';
import type { DataFrame } from '@grafana/data';
import { parseTelemetryDataFrames } from '../src/telemetryFrames';

describe('telemetry frame parser', () => {
  it('parses Prometheus-style time series frames by metric labels', () => {
    const frame = {
      name: 'topoviewer_link_utilization_percent',
      fields: [
        { name: 'Time', values: [1, 2] },
        {
          name: 'Value',
          labels: {
            __name__: 'topoviewer_link_utilization_percent',
            fixture_id: 'layered-network',
            link_id: 'underlay-ams-lon',
            source: 'ams-p',
            target: 'lon-pe',
            site: 'core',
            pod: 'east'
          },
          values: [72, 93]
        }
      ]
    } as unknown as DataFrame;

    const result = parseTelemetryDataFrames([frame]);

    expect(result.diagnostics).toEqual([]);
    expect(result.states).toEqual([
      {
        sourceId: 'layered-network',
        linkId: 'underlay-ams-lon',
        source: 'ams-p',
        target: 'lon-pe',
        site: 'core',
        pod: 'east',
        utilizationPercent: 93
      }
    ]);
  });

  it('merges multiple metrics for the same link', () => {
    const labels = {
      fixture_id: 'clos-2spine-4leaf',
      link_id: 'Spine-1-Leaf-3',
      source: 'Spine-1',
      target: 'Leaf-3'
    };
    const result = parseTelemetryDataFrames([
      {
        name: 'topoviewer_link_up',
        fields: [{ name: 'Value', labels: { ...labels, __name__: 'topoviewer_link_up' }, values: [0] }]
      },
      {
        name: 'topoviewer_link_errors_total',
        fields: [{ name: 'Value', labels: { ...labels, __name__: 'topoviewer_link_errors_total' }, values: [18] }]
      }
    ] as unknown as DataFrame[]);

    expect(result.states).toHaveLength(1);
    expect(result.states[0]).toMatchObject({
      sourceId: 'clos-2spine-4leaf',
      linkId: 'Spine-1-Leaf-3',
      up: false,
      errorsTotal: 18
    });
  });

  it('keeps the base topology visible when no frames arrive', () => {
    const result = parseTelemetryDataFrames([]);

    expect(result.states).toEqual([]);
    expect(result.diagnostics[0]?.code).toBe('telemetry-empty');
  });

  it('prefers canonical source labels over legacy fixture labels', () => {
    const result = parseTelemetryDataFrames([
      {
        name: 'topoviewer_link_up',
        fields: [{
          name: 'Value',
          labels: {
            __name__: 'topoviewer_link_up',
            source_id: 'mounted-bundle-a',
            fixture_id: 'legacy-fixture',
            link_id: 'link-a'
          },
          values: [1]
        }]
      }
    ] as unknown as DataFrame[]);

    expect(result.states[0]).toMatchObject({
      sourceId: 'mounted-bundle-a',
      linkId: 'link-a',
      up: true
    });
  });
});
