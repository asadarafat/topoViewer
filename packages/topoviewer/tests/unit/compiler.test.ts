import { describe, expect, it } from 'vitest';
import { compileTopoGraph, type TopoDocument } from '../../src';

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
            'target-label-x-offset': 8,
            'target-label-y-offset': 12
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
        { selector: 'link', style: { 'curve-style': 'bezier', 'control-point-step-size': 18, width: 3, 'line-color': '#2563eb' } }
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
});
