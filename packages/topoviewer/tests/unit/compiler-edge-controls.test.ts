import { describe, expect, it } from 'vitest';
import { compileTopoGraph, lintTopoDocument, type GraphLink, type TopoDocument } from '../../src';
import { applyEndpointSpacing, segmentRoute, taxiRoute } from '../../src/core/edgeGeometry';
import { compileEdgeStyle } from '../../src/core/style';
import type { CompiledNodeData } from '../../src/core/types';

describe('compileTopoGraph edge controls', () => {
  it('compiles enhanced edge style controls into renderer data', () => {
    const link: GraphLink = { id: 'a-b', source: 'a', target: 'b' };
    const edge = compileEdgeStyle(
      {
        lineColor: '#2563eb',
        lineFill: 'linearGradient',
        lineGradientStopColors: ['#2563eb', '#f97316'],
        lineGradientStopPositions: ['0%', '100%'],
        sourceArrowShape: 'circle',
        targetArrowShape: 'vee',
        sourceArrowColor: '#16a34a',
        targetArrowColor: '#dc2626',
        sourceArrowBorderColor: '#bbf7d0',
        targetArrowBorderColor: '#fecaca',
        sourceArrowBorderWidth: 2,
        targetArrowBorderWidth: 1,
        sourceArrowSize: 12,
        targetArrowSize: 14,
        sourceArrowOffset: 2,
        targetArrowOffset: -3,
        label: 'WAN',
        labelColor: '#0f172a',
        edgeLabelColor: '#fef3c7',
        labelBorderColor: '#94a3b8',
        labelBorderWidth: 1,
        labelFontStyle: 'italic',
        labelCollisionPolicy: 'hide',
        sourceLabel: '10G',
        sourceLabelColor: '#0369a1',
        sourceLabelBackgroundColor: '#e0f2fe',
        sourceLabelOpacity: 0.8,
        sourceLabelAutoPosition: true,
        sourceLabelDistance: 20,
        sourceLabelSideOffset: 4,
        targetLabel: '20G',
        targetLabelFontWeight: 700,
        targetLabelOverlayLayer: 'physical-port',
        directionOverlayLayer: 'bandwidth',
        sourceDistanceFromNode: 8,
        targetDistanceFromNode: 10,
        curveStyle: 'segments',
        segmentDistances: [24],
        segmentWeights: [0.4],
        interactive: false,
        labelInteractive: false
      },
      link,
      {},
      true
    );

    expect(edge.selectable).toBe(false);
    expect(edge.interactionWidth).toBe(0);
    expect(edge.labelStyle).toMatchObject({ fill: '#fef3c7', fontStyle: 'italic' });
    expect(edge.data).toMatchObject({
      routeKind: 'segments',
      interactive: false,
      labelInteractive: false,
      sourceArrowShape: 'circle',
      targetArrowShape: 'vee',
      sourceArrowColor: '#16a34a',
      targetArrowColor: '#dc2626',
      sourceArrowBorderColor: '#bbf7d0',
      targetArrowBorderColor: '#fecaca',
      sourceArrowBorderWidth: 2,
      targetArrowBorderWidth: 1,
      lineWidth: 1,
      sourceArrowSize: 12,
      targetArrowSize: 14,
      sourceArrowOffset: 2,
      targetArrowOffset: -3,
      labelBorderColor: '#94a3b8',
      labelBorderWidth: 1,
      labelCollisionPolicy: 'hide',
      edgeLabelColor: '#fef3c7',
      sourceLabel: '10G',
      sourceLabelColor: '#0369a1',
      sourceLabelBackgroundColor: '#e0f2fe',
      sourceLabelOpacity: 0.8,
      sourceLabelAutoPosition: true,
      sourceLabelDistance: 20,
      sourceLabelSideOffset: 4,
      targetLabel: '20G',
      targetLabelFontWeight: 700,
      targetLabelOverlayLayer: 'physical-port',
      directionOverlayLayer: 'bandwidth',
      sourceDistanceFromNode: 8,
      targetDistanceFromNode: 10,
      segmentDistances: [24],
      segmentWeights: [0.4],
      lineFill: 'linearGradient',
      lineGradientStopColors: ['#2563eb', '#f97316'],
      lineGradientStopPositions: ['0%', '100%']
    });
  });

  it('defaults edge label colors to the rendered edge color', () => {
    const link: GraphLink = { id: 'a-b', source: 'a', target: 'b' };
    const edge = compileEdgeStyle(
      {
        lineColor: '#22c55e',
        label: 'fabric'
      },
      link,
      {},
      true
    );

    expect(edge.labelStyle).toMatchObject({ fill: '#22c55e' });
    expect(edge.data).toMatchObject({
      edgeLabelColor: '#22c55e'
    });
  });

  it('falls back to the canonical ID only when the visible alias is absent', () => {
    const link: GraphLink = { id: 'a-b', source: 'a', target: 'b' };

    expect(compileEdgeStyle({}, link, {}, true).label).toBe('a-b');
    expect(compileEdgeStyle({}, { ...link, labels: { name: '' } }, {}, true).label).toBeUndefined();
  });

  it('reports invalid enhanced edge style controls', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        nodes: [
          { id: 'a', position: [0, 0] },
          { id: 'b', position: [100, 0] }
        ],
        links: [{ id: 'a-b', source: 'a', target: 'b' }]
      },
      stylesheet: [
        {
          selector: 'link[id = "a-b"]',
          style: {
              targetArrowShape: 'triangle-cross',
              sourceArrowSize: -1,
              sourceArrowBorderWidth: -2,
              targetArrowOffset: 'center',
              labelYOffset: 'above',
              sourceLabelOpacity: 2,
              endpointLabelAutoPosition: 'yes',
              endpointLabelOverlayLayer: '',
              endpointLabelDistance: -4,
              sourceDistanceFromNode: -4,
              segmentDistances: [10, 20],
              segmentWeights: [0.4],
              taxiDirection: 'diagonal',
              taxiTurn: 'late',
              lineFill: 'linearGradient',
              lineGradientStopColors: ['#111827'],
            interactive: 'no'
          }
        }
      ]
    };

    const issues = lintTopoDocument(document, { requireNames: false });
    expect(issues.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      'unsupported-edge-arrow-shape',
      'invalid-edge-arrow-size',
      'invalid-edge-arrow-border-width',
      'invalid-edge-arrow-offset',
      'invalid-edge-label-offset',
      'invalid-edge-label-opacity',
      'invalid-edge-label-auto-position',
      'invalid-edge-overlay-layer',
      'invalid-edge-label-distance',
      'invalid-edge-endpoint-distance',
      'invalid-edge-segment-controls',
      'invalid-edge-taxi-direction',
      'invalid-edge-taxi-turn',
      'invalid-edge-gradient',
      'invalid-edge-interaction-flag'
    ]));
  });

  it('reports invalid link direction declarations', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        nodes: [
          { id: 'a', position: [0, 0] },
          { id: 'b', position: [100, 0] }
        ],
        links: [
          {
            id: 'a-b',
            source: 'a',
            target: 'b',
            directions: {
              sourceToTarget: {
                id: 'a-b'
              },
              upstream: {
                label: 'invalid'
              }
            } as never
          }
        ]
      }
    };

    const issues = lintTopoDocument(document, { requireNames: false });
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'invalid-link-direction-key',
        path: 'graph.links[0].directions.upstream'
      }),
      expect.objectContaining({
        code: 'duplicate-id',
        path: 'graph.links[0].directions.sourceToTarget.id'
      })
    ]));
  });

  it('reports invalid node handle declarations and link handle references', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        nodes: [
          {
            id: 'leaf1',
            position: [0, 0],
            handles: [
              { id: 'e1-49', type: 'target', position: 'top', offset: 110 },
              { id: 'e1-49', type: 'source', position: 'bottom' }
            ]
          },
          {
            id: 'spine1',
            position: [100, 0],
            handles: [
              { id: 'e1-1', type: 'source', position: 'bottom' }
            ]
          }
        ],
        links: [
          {
            id: 'leaf1-spine1',
            source: 'leaf1',
            sourceHandle: 'missing-source',
            target: 'spine1',
            targetHandle: 'e1-1'
          }
        ]
      }
    };

    const issues = lintTopoDocument(document, { requireNames: false });
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'duplicate-node-handle',
        path: 'graph.nodes[0].handles[1].id'
      }),
      expect.objectContaining({
        code: 'node-handle-offset-clamped',
        path: 'graph.nodes[0].handles[0].offset'
      }),
      expect.objectContaining({
        code: 'broken-source-handle',
        path: 'graph.links[0].sourceHandle'
      }),
      expect.objectContaining({
        code: 'broken-target-handle',
        path: 'graph.links[0].targetHandle'
      })
    ]));
  });

  it('accepts stable implicit shape ports only when nodes do not declare custom handles', () => {
    const implicitDocument: TopoDocument = {
      version: '1.0',
      graph: {
        nodes: [
          { id: 'leaf1', position: [0, 0] },
          { id: 'spine1', position: [100, 0] }
        ],
        links: [{
          id: 'leaf1-spine1',
          source: 'leaf1',
          sourceHandle: 'shape-port-2',
          target: 'spine1',
          targetHandle: 'shape-port-4'
        }]
      }
    };
    expect(lintTopoDocument(implicitDocument, { requireNames: false })).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'broken-source-handle' }),
      expect.objectContaining({ code: 'broken-target-handle' })
    ]));

    implicitDocument.graph!.nodes![0].handles = [{ id: 'port-a', type: 'source', position: 'right' }];
    expect(lintTopoDocument(implicitDocument, { requireNames: false })).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'broken-source-handle', path: 'graph.links[0].sourceHandle' })
    ]));
  });

  it('compiles region label placement and margin controls', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'site' }],
        nodes: [
          { id: 'a', labels: { name: 'A' }, layers: ['site'], position: [0, 0] }
        ],
        regions: [
          {
            id: 'region-a',
            labels: { name: 'Region A' },
            layers: ['site'],
            members: ['a']
          }
        ]
      },
      stylesheet: [
        {
          selector: 'region[id = "region-a"]',
          style: {
              labelPosition: 'bottomCenter',
              labelMargin: 18,
              labelColor: '#0f172a',
            labelBackgroundColor: '#e0f2fe'
          }
        }
      ]
    };

    const compiled = compileTopoGraph(document, ['site']);
    const region = compiled.nodes.find((node) => node.id === 'region:region-a');

    expect(region?.data).toMatchObject({
      fill: 'rgba(76, 201, 240, 0.12)',
      stroke: 'rgba(76, 201, 240, 0.62)'
    });
    const regionData = region?.data as CompiledNodeData | undefined;
    expect(regionData?.labelStyle).toMatchObject({
      color: '#0f172a',
      background: '#e0f2fe',
      top: 'auto',
      right: 'auto',
      bottom: 18,
      left: '50%',
      transform: 'translateX(-50%)'
    });
  });

  it('reports invalid region label placement controls', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'site' }],
        nodes: [{ id: 'a', layers: ['site'], position: [0, 0] }],
        regions: [
          {
            id: 'region-a',
            layers: ['site'],
            members: ['a']
          }
        ]
      },
      stylesheet: [
        {
          selector: 'region[id = "region-a"]',
          style: {
              labelPosition: 'rightBoottom',
              labelMargin: -4
          }
        }
      ]
    };

    const issues = lintTopoDocument(document, { requireNames: false });
    expect(issues.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      'unsupported-region-label-position',
      'invalid-region-label-margin'
    ]));
  });

  it('warns when renderable entities omit layer membership', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'site' }],
        nodes: [
          { id: 'a', position: [0, 0] },
          { id: 'b', position: [100, 0] }
        ],
        links: [
          { id: 'a-b', source: 'a', target: 'b' }
        ],
        paths: [
          { id: 'path-a-b', sequence: ['a', 'b'] }
        ],
        regions: [
          {
            id: 'region-a',
            members: ['a']
          }
        ]
      },
      diagram: {
        shapes: [
          { id: 'shape-a', position: [40, 40] }
        ],
        connectors: [
          { id: 'connector-a-shape', source: 'a', target: 'shape-a' }
        ],
        callouts: [
          { id: 'callout-a', position: [80, 80], title: 'A', target: 'a' }
        ]
      }
    };

    const issues = lintTopoDocument(document, { requireNames: false });
    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        severity: 'warning',
        code: 'missing-node-layers',
        path: 'graph.nodes[0].layers'
      }),
      expect.objectContaining({
        severity: 'warning',
        code: 'missing-link-layers',
        path: 'graph.links[0].layers'
      }),
      expect.objectContaining({
        severity: 'warning',
        code: 'missing-path-layers',
        path: 'graph.paths[0].layers'
      }),
      expect.objectContaining({
        severity: 'warning',
        code: 'missing-region-layers',
        path: 'graph.regions[0].layers'
      }),
      expect.objectContaining({
        severity: 'warning',
        code: 'missing-shape-layers',
        path: 'diagram.shapes[0].layers'
      }),
      expect.objectContaining({
        severity: 'warning',
        code: 'missing-connector-layers',
        path: 'diagram.connectors[0].layers'
      }),
      expect.objectContaining({
        severity: 'warning',
        code: 'missing-callout-layers',
        path: 'diagram.callouts[0].layers'
      })
    ]));
  });

  it('reports broken connector and callout visual anchors', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'site' }],
        nodes: [
          { id: 'a', layers: ['site'], position: [0, 0], pins: [{ id: 'east', x: 20, y: 0 }] }
        ]
      },
      diagram: {
        connectors: [
          {
            id: 'connector-b-c',
            layers: ['site'],
            source: 'b',
            sourcePin: 'west',
            target: 'a',
            targetPin: 'missing'
          }
        ],
        callouts: [
          {
            id: 'callout-a',
            layers: ['site'],
            position: [80, 80],
            title: 'A',
            sourcePin: 'missing-source-pin',
            target: 'b'
          }
        ]
      }
    };

    const issues = lintTopoDocument(document, { requireNames: false });
    expect(issues.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      'broken-connector-source',
      'broken-connector-target-pin',
      'broken-callout-source-pin',
      'broken-callout-target'
    ]));
  });

  it('builds deterministic endpoint spacing, segment, and taxi geometry', () => {
    const spaced = applyEndpointSpacing({ sourceX: 0, sourceY: 0, targetX: 20, targetY: 0 }, 20, 20);
    expect(spaced.sourceX).toBeCloseTo(6);
    expect(spaced.targetX).toBeCloseTo(14);

    expect(segmentRoute(
      { sourceX: 0, sourceY: 0, targetX: 100, targetY: 0 },
      [20],
      [0.5]
    )?.path).toBe('M0,0 L50,20 L100,0');

    expect(taxiRoute(
      { sourceX: 0, sourceY: 0, targetX: 100, targetY: 50 },
      'horizontal'
    )?.path).toBe('M0,0 L50,0 L50,50 L100,50');
  });
});
