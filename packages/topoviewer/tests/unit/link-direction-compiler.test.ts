import { describe, expect, it } from 'vitest';
import { compileTopoGraph, type TopoDocument } from '../../src';

describe('compileTopoGraph link directions', () => {
  it('compiles link directions as independent styles on one physical edge', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'fabric' }],
        nodes: [
          { id: 'leaf-1', layers: ['fabric'], position: [0, 0] },
          { id: 'spine-1', layers: ['fabric'], position: [240, 0] }
        ],
        links: [
          {
            id: 'leaf-spine',
            source: 'leaf-1',
            target: 'spine-1',
            layers: ['fabric'],
            directions: {
              sourceToTarget: {
                label: '3.2 Gbps',
                labels: { metric: 'tx' },
                data: { metric: 'if_out_bps' }
              },
              targetToSource: {
                label: '1.1 Gbps',
                labels: { metric: 'rx' },
                data: { metric: 'if_in_bps' }
              }
            }
          }
        ]
      },
      stylesheet: [
        {
          selector: 'link',
          style: {
            lineColor: '#64748b',
            lineWidth: 2,
            directionalStrokes: true,
            directionCenterGap: 56,
            directionStartGap: 18
          }
        },
        {
          selector: 'linkDirection',
          style: {
            lineWidth: 4,
            sourceArrowShape: 'triangle',
            targetArrowShape: 'triangle'
          }
        },
        {
          selector: 'linkDirection[linkId = "leaf-spine"]',
          style: {
            lineCap: 'round'
          }
        },
        {
          selector: 'linkDirection[labels.metric = "tx"]',
          style: {
            lineWidth: 5
          }
        },
        {
          selector: 'linkDirection[data.metric = "if_in_bps"]',
          style: {
            labelColor: '#01579b',
            lineWidth: 7
          }
        },
        {
          selector: 'linkDirection[direction = "sourceToTarget"]',
          style: {
            lineColor: '#4caf50',
            targetArrowColor: '#4caf50',
            targetArrowOffset: 3
          }
        },
        {
          selector: 'linkDirection[direction = "targetToSource"]',
          style: {
            lineColor: '#ff9800',
            sourceArrowColor: '#ff9800',
            sourceArrowOffset: 4,
            lineStyle: 'dashed',
            lineDashPattern: '12 8'
          }
        }
      ]
    };

    const compiled = compileTopoGraph(document, ['fabric'], { showEdgeLabels: true });
    expect(compiled.edges).toHaveLength(1);

    const edge = compiled.edges[0];
    const edgeData = edge.data as Record<string, unknown>;
    const directions = edgeData.linkDirections as Array<Record<string, unknown>>;

    expect(edge.id).toBe('leaf-spine');
    expect(edgeData).toMatchObject({
      directionalStrokes: true,
      directionCenterGap: 56,
      directionStartGap: 18
    });
    expect(directions).toHaveLength(2);

    const byDirection = new Map(directions.map((direction) => [direction.direction, direction]));
    expect(byDirection.get('sourceToTarget')).toMatchObject({
      id: 'leaf-spine:sourceToTarget',
      label: '3.2 Gbps',
      style: expect.objectContaining({
        stroke: '#4caf50',
        strokeWidth: 5,
        strokeLinecap: 'round'
      }),
      data: expect.objectContaining({
        lineWidth: 5,
        targetArrowShape: 'triangle',
        targetArrowColor: '#4caf50',
        targetArrowOffset: 3
      })
    });
    expect(byDirection.get('targetToSource')).toMatchObject({
      id: 'leaf-spine:targetToSource',
      label: '1.1 Gbps',
      style: expect.objectContaining({
        stroke: '#ff9800',
        strokeWidth: 7,
        strokeDasharray: '12 8',
        strokeLinecap: 'round'
      }),
      labelStyle: expect.objectContaining({
        fill: '#01579b'
      }),
      data: expect.objectContaining({
        lineWidth: 7,
        sourceArrowShape: 'triangle',
        sourceArrowColor: '#ff9800',
        sourceArrowOffset: 4
      })
    });
  });

  it('keeps directional lanes attached to their physical parallel link corridor metadata', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'fabric' }],
        nodes: [
          { id: 'leaf', layers: ['fabric'], position: [0, 0] },
          { id: 'spine', layers: ['fabric'], position: [240, 0] }
        ],
        links: [
          {
            id: 'leaf-spine-a',
            source: 'leaf',
            target: 'spine',
            layers: ['fabric'],
            directions: {
              sourceToTarget: { label: 'A tx' },
              targetToSource: { label: 'A rx' }
            }
          },
          {
            id: 'leaf-spine-b',
            source: 'leaf',
            target: 'spine',
            layers: ['fabric'],
            directions: {
              sourceToTarget: { label: 'B tx' },
              targetToSource: { label: 'B rx' }
            }
          }
        ]
      },
      stylesheet: [
        {
          selector: 'link',
          style: {
            curveStyle: 'straight',
            laneGap: 22,
            directionalStrokes: true,
            directionStartGap: 14,
            directionCenterGap: 44
          }
        }
      ]
    };

    const compiled = compileTopoGraph(document, ['fabric'], { showEdgeLabels: true });
    expect(compiled.edges).toHaveLength(2);
    expect(compiled.edges.map((edge) => (edge.data as Record<string, unknown>).parallelLinkGroup)).toEqual([
      'leaf::spine::fabric',
      'leaf::spine::fabric'
    ]);
    expect(compiled.edges.map((edge) => (edge.data as Record<string, unknown>).laneIndex)).toEqual([0, 1]);
    expect(compiled.edges.every((edge) => Array.isArray((edge.data as Record<string, unknown>).linkDirections))).toBe(true);
  });
});
