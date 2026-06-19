import { describe, expect, it } from 'vitest';
import { compileTopoGraph, validateTopoDocument, type TopoDocument } from '../../src';
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
});
