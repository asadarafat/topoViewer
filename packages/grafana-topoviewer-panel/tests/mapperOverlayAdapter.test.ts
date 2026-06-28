import { describe, expect, it } from 'vitest';
import type { TopoDocument } from 'topoviewer';
import { createMapperTelemetryOverlay, createMapperTelemetryOverlayExtension } from '../src/mapperOverlayAdapter';
import type { MapperTelemetrySample, TopoViewerMapper } from '../src/mapperTypes';

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
      { id: 'pe1-p1', source: 'pe1', target: 'p1', labels: { protocol: 'isis' }, layers: ['underlay'] }
    ],
    regions: [
      { id: 'core', name: 'Core', labels: { site: 'core' }, members: ['pe1', 'p1'], layers: ['underlay'] }
    ]
  }
};

describe('mapper telemetry overlay adapter', () => {
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
