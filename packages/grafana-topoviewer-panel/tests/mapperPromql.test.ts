import { describe, expect, it } from 'vitest';
import { starterPromQlForMapper } from '../src/mapperPromql';

describe('mapper PromQL starters', () => {
  it('builds identity-filtered PromQL from mapper rules', () => {
    const starters = starterPromQlForMapper({
      version: 1,
      identity: {
        sourceId: 'branch-core',
        sourceIdLabel: 'source_id'
      },
      mappings: [
        {
          id: 'link-utilization',
          metric: 'interface_utilization_percent',
          target: {
            kind: 'link',
            resolve: {
              by: 'id',
              metricLabel: 'link_id'
            }
          }
        },
        {
          id: 'errors',
          metric: 'interface_errors_total',
          target: {
            kind: 'link',
            resolve: {
              by: 'id',
              metricLabel: 'link_id'
            }
          }
        }
      ]
    });

    expect(starters).toEqual([
      {
        id: 'link-utilization',
        label: 'link-utilization (link)',
        query: 'interface_utilization_percent{source_id="branch-core"}'
      },
      {
        id: 'errors',
        label: 'errors (link)',
        query: 'rate(interface_errors_total{source_id="branch-core"}[5m])'
      }
    ]);
  });
});
