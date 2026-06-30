import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { compileTopoGraph, type TopoDocument } from 'topoviewer';
import { createMapperTelemetryOverlay, createMapperTelemetryOverlayExtension } from '../src/mapperOverlayAdapter';
import { parseTopoViewerMapperYaml } from '../src/mapperParser';
import type { MapperTelemetrySample, TopoViewerMapper } from '../src/mapperTypes';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../../..');

const document: TopoDocument = {
  graph: {
    id: 'branch',
    layers: [
      { id: 'underlay', name: 'Underlay' }
    ],
    nodes: [
      { id: 'pe1', name: 'PE1', labels: { role: 'pe' }, data: { device: 'pe1' }, layers: ['underlay'] },
      { id: 'p1', name: 'P1', labels: { role: 'p' }, data: { device: 'p1' }, layers: ['underlay'] }
    ],
    links: [
      {
        id: 'pe1-p1',
        source: 'pe1',
        target: 'p1',
        labels: { protocol: 'isis' },
        layers: ['underlay'],
        directions: {
          sourceToTarget: {
            label: 'PE1 to P1'
          },
          targetToSource: {
            label: 'P1 to PE1'
          }
        }
      }
    ],
    regions: [
      { id: 'core', name: 'Core', labels: { site: 'core' }, members: ['pe1', 'p1'], layers: ['underlay'] }
    ]
  }
};

describe('mapper telemetry overlay adapter', () => {
  it('renders compact rule states as runtime style overrides', () => {
    const parsed = parseTopoViewerMapperYaml([
      'version: 1',
      'rules:',
      '  - id: link-state',
      '    metric: topoviewer_link_up',
      '    select: link',
      '    join: link_id',
      '    value: up',
      '    states:',
      '      down: "==0"',
      '    style:',
      '      default:',
      '        label: UP',
      '        lineColor: "#4caf50"',
      '      down:',
      '        label: DOWN',
      '        lineColor: "#d32f2f"',
      '        lineStyle: dashed'
    ].join('\n'));

    expect(parsed.diagnostics).toEqual([]);
    const overlay = createMapperTelemetryOverlay(document, parsed.mapper, [{
      metric: 'topoviewer_link_up',
      value: 0,
      labels: { link_id: 'pe1-p1' },
      fields: { value: 0 }
    }]);

    expect(overlay.linkStylesById['pe1-p1']).toMatchObject({
      label: 'DOWN',
      lineColor: '#d32f2f',
      lineStyle: 'dashed'
    });
  });

  it('maps a metric to a link by ID and styles its endpoints', () => {
    const mapper: TopoViewerMapper = {
      version: 1,
      identity: {
        sourceId: 'branch',
        sourceIdLabel: 'fixture_id'
      },
      mappings: [
        {
          id: 'utilization',
          metric: 'topoviewer_link_utilization_percent',
          target: {
            kind: 'link',
            resolve: {
              by: 'id',
              metricLabel: 'link_id'
            }
          },
          value: { as: 'utilizationPercent' },
          thresholds: { info: 50, warning: 80, error: 90 },
          overlay: {
            lineColorBySeverity: true,
            lineWidthBySeverity: true,
            statusMarker: true,
            outlineBySeverity: true,
            label: '{{ value | round }}%'
          }
        }
      ]
    };
    const sample: MapperTelemetrySample = {
      metric: 'topoviewer_link_utilization_percent',
      value: 91,
      labels: {
        fixture_id: 'branch',
        link_id: 'pe1-p1'
      },
      fields: { value: 91 }
    };

    const overlay = createMapperTelemetryOverlay(document, mapper, [sample]);

    expect(overlay.diagnostics).toEqual([]);
    expect(overlay.linkStylesById['pe1-p1']).toMatchObject({
      lineColor: '#d32f2f',
      lineWidth: 7,
      label: '91%'
    });
    expect(overlay.nodeStylesById.pe1).toMatchObject({
      statusColor: '#d32f2f',
      outlineColor: '#d32f2f'
    });
    expect(overlay.coverage).toMatchObject({
      totalSamples: 1,
      sourceMatchedSamples: 1,
      metricMatchedSamples: 1,
      resolvedSamples: 1,
      appliedObjects: 1
    });
  });

  it('maps telemetry to one link direction without changing the parent link style', () => {
    const parsed = parseTopoViewerMapperYaml([
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
      '        lineWidth: 4',
      '      busy:',
      '        label: "busy {{ value | round }}%"',
      '        lineColor: "#ff9800"',
      '        lineWidth: 7'
    ].join('\n'));

    expect(parsed.diagnostics).toEqual([]);
    const overlay = createMapperTelemetryOverlay(document, parsed.mapper, [{
      metric: 'interface_direction_utilization_percent',
      value: 82,
      labels: { link_id: 'pe1-p1', direction: 'sourceToTarget' },
      fields: { value: 82 }
    }]);

    expect(overlay.linkStylesById['pe1-p1']).toBeUndefined();
    expect(overlay.linkDirectionStylesById['pe1-p1:sourceToTarget']).toMatchObject({
      label: 'busy 82%',
      lineColor: '#ff9800',
      lineWidth: 7
    });

    const extension = createMapperTelemetryOverlayExtension(overlay);
    const renderedDocument = extension?.beforeCompile?.(document, {
      document,
      selectedLayerIds: [],
      toggles: {}
    });

    expect(renderedDocument?.graph?.links?.[0]?.style).toBeUndefined();
    expect(renderedDocument?.graph?.links?.[0]?.directions?.sourceToTarget?.style).toMatchObject({
      label: 'busy 82%',
      lineColor: '#ff9800',
      lineWidth: 7
    });
    expect(renderedDocument?.graph?.links?.[0]?.directions?.targetToSource?.style).toBeUndefined();
  });

  it('formats link direction bandwidth labels from bps telemetry', () => {
    const parsed = parseTopoViewerMapperYaml([
      'version: 1',
      'rules:',
      '  - id: directional-bandwidth',
      '    metric: interface_direction_bps',
      '    select: linkDirection',
      '    join:',
      '      link: link_id',
      '      direction: direction',
      '    style:',
      '      default:',
      '        label: "{{ value | bps }}"',
      '        lineWidth: 4'
    ].join('\n'));

    expect(parsed.diagnostics).toEqual([]);
    const overlay = createMapperTelemetryOverlay(document, parsed.mapper, [{
      metric: 'interface_direction_bps',
      value: 3_580_000,
      labels: { link_id: 'pe1-p1', direction: 'targetToSource' },
      fields: { value: 3_580_000 }
    }]);

    expect(overlay.linkDirectionStylesById['pe1-p1:targetToSource']).toMatchObject({
      label: '3.58 Mb/s',
      lineWidth: 4
    });
  });

  it('resolves link directions by parent link and direction even when the direction has a custom ID', () => {
    const customDirectionDocument: TopoDocument = {
      graph: {
        nodes: [{ id: 'a' }, { id: 'b' }],
        links: [
          {
            id: 'a-b',
            source: 'a',
            target: 'b',
            directions: {
              sourceToTarget: { id: 'custom-a-to-b' }
            }
          }
        ]
      }
    };

    const parsed = parseTopoViewerMapperYaml([
      'version: 1',
      'rules:',
      '  - id: directional-state',
      '    metric: link_direction_up',
      '    select: linkDirection',
      '    join:',
      '      link: link_id',
      '      direction: direction',
      '    value: up',
      '    states:',
      '      down: "==0"',
      '    style:',
      '      default:',
      '        lineColor: "#4caf50"',
      '      down:',
      '        lineColor: "#d32f2f"'
    ].join('\n'));

    const overlay = createMapperTelemetryOverlay(customDirectionDocument, parsed.mapper, [{
      metric: 'link_direction_up',
      value: 0,
      labels: { link_id: 'a-b', direction: 'sourceToTarget' },
      fields: { value: 0 }
    }]);

    expect(overlay.diagnostics).toEqual([]);
    expect(overlay.linkDirectionStylesById['custom-a-to-b']).toMatchObject({
      lineColor: '#d32f2f'
    });
    expect(overlay.coverage.resolvedSamples).toBe(1);
  });

  it('applies the checked-in Containerlab CLOS mapper to links, directions, and nodes', () => {
    const mapperYaml = fs.readFileSync(
      path.join(repoRoot, 'labs/grafana-topoviewer/topoviewer-bundles/clab-clos/clab-clos.mapper.tv.yaml'),
      'utf8'
    );
    const parsed = parseTopoViewerMapperYaml(mapperYaml, 'clab-clos mapper');
    expect(parsed.diagnostics).toEqual([]);

    const clabDocument: TopoDocument = {
      graph: {
        id: 'clab-clos',
        nodes: [
          { id: 'spine1' },
          { id: 'leaf1' }
        ],
        links: [
          {
            id: 'spine1-leaf1',
            source: 'spine1',
            target: 'leaf1',
            directions: {
              sourceToTarget: {},
              targetToSource: {}
            }
          }
        ]
      }
    };

    const overlay = createMapperTelemetryOverlay(clabDocument, parsed.mapper, [
      {
        metric: 'topoviewer_clab_link_up',
        value: 0,
        labels: { topology: 'clab-clos', link_id: 'spine1-leaf1' },
        fields: { value: 0 }
      },
      {
        metric: 'topoviewer_clab_link_direction_utilization_percent',
        value: 95,
        labels: { topology: 'clab-clos', link_id: 'spine1-leaf1', direction: 'sourceToTarget' },
        fields: { value: 95 }
      },
      {
        metric: 'topoviewer_clab_node_health',
        value: 0,
        labels: { topology: 'clab-clos', node_id: 'leaf1' },
        fields: { value: 0 }
      },
      {
        metric: 'topoviewer_clab_adjacency_up',
        value: 0,
        labels: { topology: 'clab-clos', link_id: 'spine1-leaf1' },
        fields: { value: 0 }
      }
    ]);

    expect(overlay.coverage).toMatchObject({
      totalSamples: 4,
      sourceMatchedSamples: 4,
      metricMatchedSamples: 4,
      resolvedSamples: 4
    });
    expect(overlay.linkStylesById['spine1-leaf1']).toMatchObject({
      label: 'DOWN',
      lineColor: '#d32f2f',
      lineStyle: 'dashed',
      sourceLabel: 'adjacency',
      targetLabel: 'down'
    });
    expect(overlay.linkDirectionStylesById['spine1-leaf1:sourceToTarget']).toMatchObject({
      label: 'sourceToTarget saturated 95%',
      lineColor: '#d32f2f',
      lineWidth: 7
    });
    expect(overlay.nodeStylesById.leaf1).toMatchObject({
      badgeLabel: 'NODE',
      outlineColor: '#d32f2f',
      statusColor: '#d32f2f'
    });
  });

  it('classifies unresolved link direction samples by missing parent, missing direction, and unsupported direction', () => {
    const parsed = parseTopoViewerMapperYaml([
      'version: 1',
      'rules:',
      '  - id: directional-state',
      '    metric: link_direction_up',
      '    select: linkDirection',
      '    join:',
      '      link: link_id',
      '      direction: direction',
      '    value: up',
      '    states:',
      '      down: "==0"',
      '    style:',
      '      default:',
      '        lineColor: "#4caf50"',
      '      down:',
      '        lineColor: "#d32f2f"'
    ].join('\n'));

    const overlay = createMapperTelemetryOverlay(document, parsed.mapper, [
      {
        metric: 'link_direction_up',
        value: 0,
        labels: { link_id: 'missing-link', direction: 'sourceToTarget' },
        fields: { value: 0 }
      },
      {
        metric: 'link_direction_up',
        value: 0,
        labels: { link_id: 'pe1-p1', direction: 'sideways' },
        fields: { value: 0 }
      },
      {
        metric: 'link_direction_up',
        value: 0,
        labels: { link_id: 'pe1-p1', direction: 'targetToSource' },
        fields: { value: 0 }
      }
    ]);

    expect(overlay.coverage).toMatchObject({
      totalSamples: 3,
      resolvedSamples: 1,
      unresolvedSamples: 2,
      missingParentLinkSamples: 1,
      unsupportedDirectionSamples: 1,
      missingDirectionSamples: 0
    });
    expect(overlay.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(expect.arrayContaining([
      'mapper-link-direction-missing-parent-link',
      'mapper-link-direction-unsupported-direction'
    ]));
  });

  it('reports missing direction declarations and duplicate direction mappings', () => {
    const oneDirectionDocument: TopoDocument = {
      graph: {
        nodes: [{ id: 'a' }, { id: 'b' }],
        links: [
          {
            id: 'a-b',
            source: 'a',
            target: 'b',
            directions: {
              sourceToTarget: {}
            }
          }
        ]
      }
    };
    const parsed = parseTopoViewerMapperYaml([
      'version: 1',
      'rules:',
      '  - id: directional-state',
      '    metric: link_direction_up',
      '    select: linkDirection',
      '    join:',
      '      link: link_id',
      '      direction: direction',
      '    value: up',
      '    states:',
      '      down: "==0"',
      '    style:',
      '      default:',
      '        lineColor: "#4caf50"',
      '      down:',
      '        lineColor: "#d32f2f"'
    ].join('\n'));

    const overlay = createMapperTelemetryOverlay(oneDirectionDocument, parsed.mapper, [
      {
        metric: 'link_direction_up',
        value: 0,
        labels: { link_id: 'a-b', direction: 'targetToSource' },
        fields: { value: 0 }
      },
      {
        metric: 'link_direction_up',
        value: 1,
        labels: { link_id: 'a-b', direction: 'sourceToTarget' },
        fields: { value: 1 }
      },
      {
        metric: 'link_direction_up',
        value: 0,
        labels: { link_id: 'a-b', direction: 'sourceToTarget' },
        fields: { value: 0 }
      }
    ]);

    expect(overlay.coverage).toMatchObject({
      resolvedSamples: 2,
      unresolvedSamples: 1,
      missingDirectionSamples: 1,
      duplicateDirectionMappings: 1
    });
    expect(overlay.diagnostics.map((diagnostic) => diagnostic.code)).toEqual(expect.arrayContaining([
      'mapper-link-direction-missing-direction',
      'mapper-duplicate-object-mapping'
    ]));
  });

  it('uses mapper palette colors for severity-driven overlays', () => {
    const mapper: TopoViewerMapper = {
      version: 1,
      palette: {
        error: {
          color: '#e91e63',
          accent: '#ad1457'
        }
      },
      mappings: [
        {
          id: 'utilization',
          metric: 'topoviewer_link_utilization_percent',
          target: {
            kind: 'link',
            resolve: {
              by: 'id',
              metricLabel: 'link_id'
            }
          },
          value: { as: 'utilizationPercent' },
          thresholds: { error: 90 },
          overlay: {
            lineColorBySeverity: true,
            statusMarker: true,
            outlineBySeverity: true,
            label: '{{ value | round }}%'
          }
        }
      ]
    };
    const overlay = createMapperTelemetryOverlay(document, mapper, [{
      metric: 'topoviewer_link_utilization_percent',
      value: 95,
      labels: { link_id: 'pe1-p1' },
      fields: { value: 95 }
    }]);

    expect(overlay.linkStylesById['pe1-p1']).toMatchObject({
      lineColor: '#e91e63',
      labelColor: '#ad1457'
    });
    expect(overlay.nodeStylesById.pe1).toMatchObject({
      statusColor: '#e91e63',
      outlineColor: '#e91e63'
    });
  });

  it('applies selector-driven conditional style patches to any matching topology object', () => {
    const mapper: TopoViewerMapper = {
      version: 1,
      mappings: [
        {
          id: 'pe-cpu-policy',
          metric: 'device_cpu_percent',
          target: {
            kind: 'node',
            resolve: {
              by: 'selector',
              selector: 'node[labels.role = "pe"]'
            }
          },
          value: { as: 'utilizationPercent' },
          thresholds: { warning: 80, error: 90 },
          overlay: {
            badgeLabel: '{{ value | round }}%'
          },
          conditions: [
            {
              id: 'warning-style',
              when: {
                severity: 'warning',
                label: {
                  key: 'device',
                  eq: 'pe1'
                }
              },
              style: {
                label: '{{ target.id }} CPU {{ value | round }}%',
                backgroundColor: '#ff9800',
                borderColor: '#ed6c02'
              }
            }
          ]
        }
      ]
    };

    const overlay = createMapperTelemetryOverlay(document, mapper, [{
      metric: 'device_cpu_percent',
      value: 84,
      labels: { device: 'pe1' },
      fields: { value: 84 }
    }]);

    expect(overlay.nodeStylesById.pe1).toMatchObject({
      badgeLabel: '84%',
      label: 'pe1 CPU 84%',
      backgroundColor: '#ff9800',
      borderColor: '#ed6c02'
    });
  });

  it('keeps hostile telemetry labels from becoming executable mapper style payloads', () => {
    const mapper: TopoViewerMapper = {
      version: 1,
      mappings: [
        {
          id: 'hostile-labels',
          metric: 'topoviewer_link_utilization_percent',
          target: {
            kind: 'link',
            resolve: {
              by: 'id',
              metricLabel: 'link_id'
            }
          },
          overlay: {
            style: {
              label: 'util {{ label.injected_label }}',
              lineColor: '{{ label.injected_color }}',
              textBackgroundColor: '{{ label.injected_background }}',
              lineWidth: '{{ label.injected_width }}',
              lineDashPattern: '{{ label.injected_dash }}'
            }
          },
          conditions: [
            {
              when: {
                value: { gte: 1 }
              },
              style: {
                targetArrowColor: '{{ label.injected_arrow_color }}'
              }
            }
          ]
        }
      ]
    };

    const overlay = createMapperTelemetryOverlay(document, mapper, [{
      metric: 'topoviewer_link_utilization_percent',
      value: 91,
      labels: {
        link_id: 'pe1-p1',
        injected_label: '<img src=x onerror="window.__topoviewerHostileExecuted=true">',
        injected_color: 'url(javascript:alert(1))',
        injected_background: 'data:image/svg+xml,<svg onload=alert(1)>',
        injected_width: '7',
        injected_dash: '12 6',
        injected_arrow_color: 'javascript:alert(1)'
      },
      fields: { value: 91 }
    }]);

    expect(overlay.linkStylesById['pe1-p1']).toMatchObject({
      label: 'util <img src=x onerror="window.__topoviewerHostileExecuted=true">',
      lineWidth: 7,
      lineDashPattern: '12 6'
    });
    expect(overlay.linkStylesById['pe1-p1']).not.toHaveProperty('lineColor');
    expect(overlay.linkStylesById['pe1-p1']).not.toHaveProperty('textBackgroundColor');
    expect(overlay.linkStylesById['pe1-p1']).not.toHaveProperty('targetArrowColor');

    const extension = createMapperTelemetryOverlayExtension(overlay);
    const renderedDocument = extension?.beforeCompile?.(document, {
      document,
      selectedLayerIds: [],
      toggles: {}
    }) as TopoDocument;
    const compiled = compileTopoGraph(renderedDocument, ['underlay'], { showEdgeLabels: true });
    const compiledLink = compiled.edges.find((edge) => edge.id === 'pe1-p1') as { data?: { style?: unknown }; style?: unknown } | undefined;
    expect(JSON.stringify({ dataStyle: compiledLink?.data?.style, style: compiledLink?.style }))
      .not.toMatch(/javascript:|data:image\/svg\+xml|url\(/i);
  });

  it('uses conditional style rules to map metric values to label text', () => {
    const mapper: TopoViewerMapper = {
      version: 1,
      mappings: [
        {
          id: 'link-state-labels',
          metric: 'topoviewer_link_up',
          target: {
            kind: 'link',
            resolve: {
              by: 'id',
              metricLabel: 'link_id'
            }
          },
          value: { as: 'up' },
          conditions: [
            {
              when: {
                value: { eq: 0 }
              },
              style: {
                label: 'DOWN',
                lineColor: '#d32f2f',
                lineStyle: 'dashed'
              }
            },
            {
              when: {
                value: { eq: 1 }
              },
              style: {
                label: 'UP',
                lineColor: '#4caf50'
              }
            }
          ]
        }
      ]
    };

    const overlay = createMapperTelemetryOverlay(document, mapper, [{
      metric: 'topoviewer_link_up',
      value: 0,
      labels: { link_id: 'pe1-p1' },
      fields: { value: 0 }
    }]);

    expect(overlay.linkStylesById['pe1-p1']).toMatchObject({
      label: 'DOWN',
      lineColor: '#d32f2f',
      lineStyle: 'dashed'
    });
  });

  it('maps a metric to a node by data key', () => {
    const mapper: TopoViewerMapper = {
      version: 1,
      mappings: [
        {
          id: 'cpu',
          metric: 'device_cpu_percent',
          target: {
            kind: 'node',
            resolve: {
              by: 'data',
              key: 'device',
              metricLabel: 'device'
            }
          },
          thresholds: { warning: 80, error: 90 },
          overlay: {
            statusMarker: true,
            outlineBySeverity: true,
            badgeLabel: '{{ value | round }}%'
          }
        }
      ]
    };

    const overlay = createMapperTelemetryOverlay(document, mapper, [{
      metric: 'device_cpu_percent',
      value: 83,
      labels: { device: 'pe1' },
      fields: { value: 83 }
    }]);

    expect(overlay.nodeStylesById.pe1).toMatchObject({
      statusColor: '#ff9800',
      badgeLabel: '83%'
    });
  });

  it('can propagate a layer-level metric to layer members', () => {
    const mapper: TopoViewerMapper = {
      version: 1,
      mappings: [
        {
          id: 'layer-health',
          metric: 'layer_health',
          target: {
            kind: 'layer',
            resolve: {
              by: 'id',
              metricLabel: 'layer_id'
            }
          },
          value: { as: 'up' },
          overlay: {
            statusMarker: true,
            lineColorBySeverity: true,
            borderColorBySeverity: true
          }
        }
      ]
    };

    const overlay = createMapperTelemetryOverlay(document, mapper, [{
      metric: 'layer_health',
      value: 0,
      labels: { layer_id: 'underlay' },
      fields: { value: 0 }
    }]);

    expect(overlay.nodeStylesById.pe1).toMatchObject({ statusColor: '#d32f2f' });
    expect(overlay.linkStylesById['pe1-p1']).toMatchObject({ lineColor: '#d32f2f' });
    expect(overlay.regionStylesById.core).toMatchObject({ borderColor: '#d32f2f' });
  });

  it('warns when endpoint matching is ambiguous for parallel links', () => {
    const parallelDocument: TopoDocument = {
      graph: {
        id: 'parallel',
        nodes: [
          { id: 'a' },
          { id: 'b' }
        ],
        links: [
          { id: 'a-b-1', source: 'a', target: 'b' },
          { id: 'a-b-2', source: 'a', target: 'b' }
        ]
      }
    };
    const overlay = createMapperTelemetryOverlay(parallelDocument, {
      version: 1,
      mappings: [
        {
          id: 'endpoint',
          metric: 'adjacency_up',
          target: {
            kind: 'link',
            resolve: {
              by: 'endpoint',
              sourceLabel: 'source',
              targetLabel: 'target'
            }
          },
          value: { as: 'up' },
          overlay: {
            lineColorBySeverity: true
          }
        }
      ]
    }, [{
      metric: 'adjacency_up',
      value: 0,
      labels: { source: 'a', target: 'b' },
      fields: { value: 0 }
    }]);

    expect(overlay.coverage.ambiguousMatches).toBe(1);
    expect(overlay.diagnostics.map((diagnostic) => diagnostic.code)).toContain('mapper-endpoint-ambiguous');
  });

  it('warns when an overlay control does not apply to the selected target kind', () => {
    const overlay = createMapperTelemetryOverlay(document, {
      version: 1,
      mappings: [
        {
          id: 'bad-node-overlay',
          metric: 'node_health',
          target: {
            kind: 'node',
            resolve: {
              by: 'id',
              metricLabel: 'node_id'
            }
          },
          value: { as: 'up' },
          overlay: {
            lineColorBySeverity: true
          }
        }
      ]
    }, [{
      metric: 'node_health',
      value: 0,
      labels: { node_id: 'pe1' },
      fields: { value: 0 }
    }]);

    expect(overlay.diagnostics.map((diagnostic) => diagnostic.code)).toContain('mapper-overlay-unsupported');
  });

  it('creates a TopoViewer extension without mutating the source document', () => {
    const overlay = createMapperTelemetryOverlay(document, {
      version: 1,
      mappings: [
        {
          id: 'selector',
          metric: 'pe_health',
          target: {
            kind: 'node',
            resolve: {
              by: 'selector',
              selector: 'node[labels.role = "pe"]'
            }
          },
          value: { as: 'up' },
          overlay: {
            outlineBySeverity: true
          }
        }
      ]
    }, [{
      metric: 'pe_health',
      value: 0,
      labels: {},
      fields: { value: 0 }
    }]);
    const extension = createMapperTelemetryOverlayExtension(overlay);
    const renderedDocument = extension?.beforeCompile?.(document, {
      document,
      selectedLayerIds: [],
      toggles: {}
    });

    expect(document.graph?.nodes?.[0]?.style).toBeUndefined();
    expect(renderedDocument?.graph?.nodes?.[0]?.style).toMatchObject({
      outlineColor: '#d32f2f'
    });
  });
});
