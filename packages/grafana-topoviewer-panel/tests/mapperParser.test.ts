import { describe, expect, it } from 'vitest';
import { parseTopoViewerMapperYaml } from '../src/mapperParser';

describe('TopoViewer mapper parser', () => {
  it('parses compact authoring rules into canonical mapper rules', () => {
    const result = parseTopoViewerMapperYaml([
      'version: 1',
      'rules:',
      '  - id: link-utilization',
      '    metric: topoviewer_link_utilization_percent',
      '    select: link',
      '    join: link_id',
      '    value: percent',
      '    states:',
      '      busy: ">=70"',
      '      saturated: ">=90"',
      '    style:',
      '      default:',
      '        lineColor: "#4caf50"',
      '        label: "{{ value | round }}%"',
      '      busy:',
      '        lineColor: "#ff9800"',
      '        lineWidth: 4',
      '      saturated:',
      '        lineColor: "#d32f2f"',
      '        lineWidth: 7',
      '        label: "{{ state }} {{ value | round }}%"'
    ].join('\n'));

    expect(result.diagnostics).toEqual([]);
    expect(result.mapper?.mappings[0]).toMatchObject({
      id: 'link-utilization',
      metric: 'topoviewer_link_utilization_percent',
      target: {
        kind: 'link',
        resolve: {
          by: 'id',
          metricLabel: 'link_id'
        }
      },
      value: {
        as: 'utilizationPercent'
      },
      overlay: {
        style: {
          lineColor: '#4caf50',
          label: '{{ value | round }}%'
        }
      },
      conditions: [
        {
          id: 'busy',
          when: {
            value: {
              gte: 70
            }
          },
          style: {
            lineColor: '#ff9800',
            lineWidth: 4
          }
        },
        {
          id: 'saturated',
          when: {
            value: {
              gte: 90
            }
          },
          style: {
            lineColor: '#d32f2f',
            lineWidth: 7,
            label: 'saturated {{ value | round }}%'
          }
        }
      ]
    });
  });

  it('parses explicit metric-to-object mapping rules', () => {
    const result = parseTopoViewerMapperYaml([
      'version: 1',
      'identity:',
      '  sourceId: layered-network',
      '  sourceIdLabel: fixture_id',
      'palette:',
      '  error:',
      '    color: "#e91e63"',
      '    accent: "#ad1457"',
      'mappings:',
      '  - id: link-utilization',
      '    metric: topoviewer_link_utilization_percent',
      '    target:',
      '      kind: link',
      '      resolve:',
      '        by: id',
      '        metricLabel: link_id',
      '    value:',
      '      as: utilizationPercent',
      '    thresholds:',
      '      info: 50',
      '      warning: 80',
      '      error: 90',
      '    overlay:',
      '      lineColorBySeverity: true',
      '      label: "{{ value | round }}%"',
      '    conditions:',
      '      - id: hot-link',
      '        when:',
      '          severity: error',
      '        style:',
      '          label: "hot {{ value | round }}%"',
      '          lineColor: "#d32f2f"'
    ].join('\n'));

    expect(result.diagnostics).toEqual([]);
    expect(result.mapper?.identity).toEqual({
      sourceId: 'layered-network',
      sourceIdLabel: 'fixture_id'
    });
    expect(result.mapper?.palette?.error).toEqual({
      color: '#e91e63',
      accent: '#ad1457'
    });
    expect(result.mapper?.mappings[0]).toMatchObject({
      id: 'link-utilization',
      metric: 'topoviewer_link_utilization_percent',
      target: {
        kind: 'link',
        resolve: {
          by: 'id',
          metricLabel: 'link_id'
        }
      }
    });
    expect(result.mapper?.mappings[0]?.conditions?.[0]).toMatchObject({
      id: 'hot-link',
      when: {
        severity: 'error'
      },
      style: {
        label: 'hot {{ value | round }}%',
        lineColor: '#d32f2f'
      }
    });
  });

  it('parses compact linkDirection rules with link and direction joins', () => {
    const result = parseTopoViewerMapperYaml([
      'version: 1',
      'rules:',
      '  - id: directional-utilization',
      '    metric: interface_direction_utilization_percent',
      '    select: linkDirection',
      '    join:',
      '      link: link_id',
      '      direction: direction',
      '    value: percent',
      '    states:',
      '      busy: ">=70"',
      '    style:',
      '      default:',
      '        label: "{{ value | round }}%"',
      '        lineColor: "#4caf50"',
      '      busy:',
      '        lineColor: "#ff9800"',
      '        lineWidth: 6'
    ].join('\n'));

    expect(result.diagnostics).toEqual([]);
    expect(result.mapper?.mappings[0]).toMatchObject({
      id: 'directional-utilization',
      metric: 'interface_direction_utilization_percent',
      target: {
        kind: 'linkDirection',
        resolve: {
          by: 'id',
          linkMetricLabel: 'link_id',
          directionMetricLabel: 'direction'
        }
      },
      value: {
        as: 'utilizationPercent'
      }
    });
  });

  it('parses severity palette shorthand colors', () => {
    const result = parseTopoViewerMapperYaml([
      'version: 1',
      'palette:',
      '  success: "#00c853"',
      '  warning: "#ffab00"',
      'mappings:',
      '  - id: node-health',
      '    metric: node_health',
      '    target:',
      '      kind: node',
      '      resolve:',
      '        by: id',
      '        metricLabel: node_id'
    ].join('\n'));

    expect(result.diagnostics).toEqual([]);
    expect(result.mapper?.palette).toEqual({
      success: '#00c853',
      warning: '#ffab00'
    });
  });

  it('reports invalid target kinds as blocking diagnostics', () => {
    const result = parseTopoViewerMapperYaml([
      'version: 1',
      'mappings:',
      '  - id: bad',
      '    metric: device_cpu_percent',
      '    target:',
      '      kind: interface',
      '      resolve:',
      '        by: id',
      '        metricLabel: interface_id'
    ].join('\n'));

    expect(result.mapper?.mappings).toEqual([]);
    expect(result.diagnostics[0]).toMatchObject({
      severity: 'error',
      code: 'mapper-target-invalid',
      document: 'mapper',
      path: 'mappings[0].target.kind'
    });
  });

  it('reports schema-like diagnostics for unsupported mapper keys', () => {
    const result = parseTopoViewerMapperYaml([
      'version: 1',
      'mappings:',
      '  - id: bad',
      '    metric: device_cpu_percent',
      '    unsupported: true',
      '    target:',
      '      kind: node',
      '      resolve:',
      '        by: id',
      '        metricLabel: node_id'
    ].join('\n'));

    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'mapper-schema-invalid',
      document: 'mapper',
      path: 'mappings[0].unsupported'
    }));
  });

  it('reports invalid condition keys with mapper paths', () => {
    const result = parseTopoViewerMapperYaml([
      'version: 1',
      'mappings:',
      '  - id: bad-condition',
      '    metric: device_cpu_percent',
      '    target:',
      '      kind: node',
      '      resolve:',
      '        by: id',
      '        metricLabel: node_id',
      '    conditions:',
      '      - when:',
      '          label:',
      '            eq: pe',
      '        style:',
      '          label: PE'
    ].join('\n'));

    expect(result.diagnostics).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'mapper-schema-invalid',
      document: 'mapper',
      path: 'mappings[0].conditions[0].when.label.key'
    }));
  });

  it('reports mapper YAML parse line and column', () => {
    const result = parseTopoViewerMapperYaml([
      'version: 1',
      'mappings:',
      '  - id: bad',
      '    metric: device_cpu_percent',
      '    target: ['
    ].join('\n'));

    expect(result.diagnostics[0]).toMatchObject({
      severity: 'error',
      code: 'mapper-yaml-invalid',
      document: 'mapper'
    });
    expect(result.diagnostics[0]?.line).toBeGreaterThan(0);
    expect(result.diagnostics[0]?.column).toBeGreaterThan(0);
  });
});
