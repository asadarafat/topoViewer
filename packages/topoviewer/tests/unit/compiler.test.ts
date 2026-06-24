import { describe, expect, it } from 'vitest';
import { compileTopoGraph, lintTopoDocument, validateTopoDocument, type TopoDocument } from '../../src';
import { applyEndpointSpacing, segmentRoute, taxiRoute } from '../../src/core/edgeGeometry';
import { compileEdgeStyle } from '../../src/core/style';

describe('compileTopoGraph', () => {
  it('compiles edge endpoint labels and offsets when edge labels are enabled', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'transport', name: 'Transport' }],
        nodes: [
          { id: 'a', name: 'A', layers: ['transport'], position: [0, 0] },
          { id: 'b', name: 'B', layers: ['transport'], position: [240, 0] }
        ],
        links: [
          { id: 'a-b', name: 'A-B', source: 'a', target: 'b', layers: ['transport'] }
        ]
      },
      stylesheet: [
        {
          selector: 'link',
          style: {
            sourceLabel: 'source side',
            targetLabel: 'target side',
            sourceLabelXOffset: -8,
            sourceLabelYOffset: -12,
            targetLabelXOffset: 8,
            targetLabelYOffset: 12
          }
        }
      ]
    };

    const compiled = compileTopoGraph(document, ['transport'], { showEdgeLabels: true });
    const edgeData = compiled.edges[0].data as Record<string, unknown>;

    expect(edgeData).toMatchObject({
      sourceLabel: 'source side',
      targetLabel: 'target side',
      sourceLabelXOffset: -8,
      sourceLabelYOffset: -12,
      targetLabelXOffset: 8,
      targetLabelYOffset: 12
    });
  });

  it('assigns lane metadata to visible parallel links', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'transport', name: 'Transport' }],
        nodes: [
          { id: 'a', name: 'A', layers: ['transport'], position: [0, 0] },
          { id: 'b', name: 'B', layers: ['transport'], position: [240, 0] }
        ],
        links: [
          { id: 'a-b-1', name: 'A-B 1', source: 'a', target: 'b', layers: ['transport'] },
          { id: 'a-b-2', name: 'A-B 2', source: 'a', target: 'b', layers: ['transport'] },
          { id: 'a-b-3', name: 'A-B 3', source: 'a', target: 'b', layers: ['transport'] }
        ]
      },
      stylesheet: [
        { selector: 'link', style: { curveStyle: 'bezier', controlPointStepSize: 18, lineWidth: 3, lineColor: '#2563eb' } }
      ]
    };

    const compiled = compileTopoGraph(document, ['transport']);
    const laneData = compiled.edges.map((edge) => edge.data as Record<string, unknown>);

    expect(laneData.map((data) => data.isLane)).toEqual([true, true, true]);
    expect(laneData.map((data) => data.laneIndex)).toEqual([0, 1, 2]);
    expect(laneData.map((data) => data.laneCount)).toEqual([3, 3, 3]);
    expect(laneData.map((data) => data.laneGap)).toEqual([18, 18, 18]);
    expect(laneData.map((data) => data.controlPointStepSize)).toEqual([18, 18, 18]);
    expect(laneData.map((data) => data.curveType)).toEqual(['bezier', 'bezier', 'bezier']);
    expect(compiled.edges.map((edge) => edge.style)).toEqual([
      expect.objectContaining({ stroke: '#2563eb', strokeWidth: 3 }),
      expect.objectContaining({ stroke: '#2563eb', strokeWidth: 3 }),
      expect.objectContaining({ stroke: '#2563eb', strokeWidth: 3 })
    ]);
    expect(new Set(laneData.map((data) => data.parallelLinkGroup)).size).toBe(1);
  });

  it('rejects kebab-case style keys during document validation', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        nodes: [
          { id: 'a', name: 'A', position: [0, 0] },
          { id: 'b', name: 'B', position: [100, 0] }
        ],
        links: [
          { id: 'a-b', source: 'a', target: 'b' }
        ]
      },
      stylesheet: [
        { selector: 'link', style: { 'line-color': '#dc2626' } }
      ]
    };

    expect(() => validateTopoDocument(document)).toThrow(/line-color/);
  });

  it('does not normalize kebab-case style keys inside edge style compilation', () => {
    const edge = compileEdgeStyle(
      { 'curve-style': 'straight', 'line-color': '#dc2626', width: 8 },
      { id: 'a-b', source: 'a', target: 'b' },
      {},
      true
    );

    expect(edge.type).toBe('floating');
    expect(edge.style).toEqual(expect.objectContaining({ stroke: '#6ea8fe', strokeWidth: 1 }));
    expect((edge.data as Record<string, unknown>).curveType).toBe('bezier');
  });

  it('compiles enhanced edge style controls into renderer data', () => {
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
        sourceArrowSize: 12,
        targetArrowSize: 14,
        label: 'WAN',
        labelColor: '#0f172a',
        labelBorderColor: '#94a3b8',
        labelBorderWidth: 1,
        labelFontStyle: 'italic',
        sourceLabel: '10G',
        sourceLabelColor: '#0369a1',
        sourceLabelBackgroundColor: '#e0f2fe',
        targetLabel: '20G',
        targetLabelFontWeight: 700,
        sourceDistanceFromNode: 8,
        targetDistanceFromNode: 10,
        curveStyle: 'segments',
        segmentDistances: [24],
        segmentWeights: [0.4],
        interactive: false,
        labelInteractive: false
      },
      { id: 'a-b', source: 'a', target: 'b' },
      {},
      true
    );

    expect(edge.selectable).toBe(false);
    expect(edge.interactionWidth).toBe(0);
    expect(edge.labelStyle).toMatchObject({ fill: '#0f172a', fontStyle: 'italic' });
    expect(edge.data).toMatchObject({
      routeKind: 'segments',
      interactive: false,
      labelInteractive: false,
      sourceArrowShape: 'circle',
      targetArrowShape: 'vee',
      sourceArrowColor: '#16a34a',
      targetArrowColor: '#dc2626',
      sourceArrowSize: 12,
      targetArrowSize: 14,
      labelBorderColor: '#94a3b8',
      labelBorderWidth: 1,
      sourceLabel: '10G',
      sourceLabelColor: '#0369a1',
      sourceLabelBackgroundColor: '#e0f2fe',
      targetLabel: '20G',
      targetLabelFontWeight: 700,
      sourceDistanceFromNode: 8,
      targetDistanceFromNode: 10,
      segmentDistances: [24],
      segmentWeights: [0.4],
      lineFill: 'linearGradient',
      lineGradientStopColors: ['#2563eb', '#f97316'],
      lineGradientStopPositions: ['0%', '100%']
    });
  });

  it('reports invalid enhanced edge style controls', () => {
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
            style: {
              targetArrowShape: 'triangle-cross',
              sourceArrowSize: -1,
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
      }
    };

    const issues = lintTopoDocument(document, { requireNames: false });
    expect(issues.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      'unsupported-edge-arrow-shape',
      'invalid-edge-arrow-size',
      'invalid-edge-endpoint-distance',
      'invalid-edge-segment-controls',
      'invalid-edge-taxi-direction',
      'invalid-edge-taxi-turn',
      'invalid-edge-gradient',
      'invalid-edge-interaction-flag'
    ]));
  });

  it('compiles region label placement and margin controls', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'site' }],
        nodes: [
          { id: 'a', name: 'A', layers: ['site'], position: [0, 0] }
        ],
        regions: [
          {
            id: 'region-a',
            name: 'Region A',
            layers: ['site'],
            members: ['a'],
            style: {
              labelPosition: 'bottomCenter',
              labelMargin: 18,
              labelColor: '#0f172a',
              labelBackgroundColor: '#e0f2fe'
            }
          }
        ]
      }
    };

    const compiled = compileTopoGraph(document, ['site']);
    const region = compiled.nodes.find((node) => node.id === 'region:region-a');

    expect(region?.data).toMatchObject({
      fill: 'rgba(76, 201, 240, 0.12)',
      stroke: 'rgba(76, 201, 240, 0.62)'
    });
    expect(region?.data?.labelStyle).toMatchObject({
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
            members: ['a'],
            style: {
              labelPosition: 'rightBoottom',
              labelMargin: -4
            }
          }
        ]
      }
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
