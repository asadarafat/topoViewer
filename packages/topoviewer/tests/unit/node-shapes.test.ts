import { describe, expect, it } from 'vitest';
import {
  compileTopoGraph,
  lintTopoDocument,
  parseNodeShapePoints,
  validateTopoDocument,
  type TopoDocument
} from '../../src';

describe('declarative node shapes', () => {
  it('compiles canonical named node shape values into node body metadata', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'pe-1', name: 'PE 1', layers: ['physical'], position: [0, 0] },
          { id: 'fw-1', name: 'FW 1', layers: ['physical'], position: [160, 0] },
          { id: 'svc-1', name: 'SVC 1', layers: ['physical'], position: [320, 0] }
        ]
      },
      stylesheet: [
        { selector: 'node', style: { iconSize: 48, borderWidth: 3 } },
        { selector: 'node[id = "pe-1"]', style: { shape: 'roundRectangle', backgroundColor: '#dbeafe', borderColor: '#1d4ed8' } },
        { selector: 'node[id = "fw-1"]', style: { shape: 'cutRectangle', backgroundColor: '#fee2e2', borderColor: '#b91c1c' } },
        { selector: 'node[id = "svc-1"]', style: { shape: 'concaveHexagon', backgroundColor: '#ede9fe', borderColor: '#6d28d9' } }
      ]
    };

    const compiled = compileTopoGraph(document, ['physical']);
    const byId = new Map(compiled.nodes.map((node) => [node.id, node.data as Record<string, unknown>]));

    expect(byId.get('pe-1')).toMatchObject({
      nodeShapeType: 'roundRectangle',
      nodeShapeStyle: { fill: '#dbeafe', stroke: '#1d4ed8', strokeWidth: 3 }
    });
    expect(byId.get('fw-1')).toMatchObject({ nodeShapeType: 'cutRectangle' });
    expect(byId.get('svc-1')).toMatchObject({ nodeShapeType: 'concaveHexagon' });
  });

  it('parses custom polygon points from arrays and strings', () => {
    expect(parseNodeShapePoints([0, -1, 1, 0.4, 0, 1, -1, 0.4]).points).toEqual([
      [0, -1],
      [1, 0.4],
      [0, 1],
      [-1, 0.4]
    ]);
    expect(parseNodeShapePoints('0 -1 1 0.35 0 1 -1 0.35').points).toEqual([
      [0, -1],
      [1, 0.35],
      [0, 1],
      [-1, 0.35]
    ]);
  });

  it('compiles polygon point strings into SVG point coordinates', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          {
            id: 'custom',
            name: 'Custom',
            layers: ['physical'],
            position: [0, 0],
            style: {
              shape: 'polygon',
              shapePolygonPoints: '0 -1 1 0.35 0 1 -1 0.35'
            }
          }
        ]
      }
    };

    const compiled = compileTopoGraph(document, ['physical']);
    const data = compiled.nodes[0].data as Record<string, unknown>;

    expect(data.nodeShapeType).toBe('polygon');
    expect(data.nodeShapePoints).toBe('50,10 90,64 50,90 10,64');
  });

  it('rejects non-canonical polygon style keys and invalid polygon points during validation', () => {
    expect(() => validateTopoDocument({
      graph: {
        nodes: [
          { id: 'bad', style: { 'shape-polygon-points': '0 -1 1 1 -1 1' } }
        ]
      }
    })).toThrow(/shape-polygon-points/);

    expect(() => validateTopoDocument({
      graph: {
        nodes: [
          { id: 'bad', style: { shape: 'polygon', shapePolygonPoints: '0 -1 2 0 0 1' } }
        ]
      }
    })).toThrow(/\[-1, 1\]/);
  });

  it('reports unsupported node shape names through semantic lint', () => {
    const issues = lintTopoDocument({
      graph: {
        nodes: [
          { id: 'legacy', style: { shape: 'roundrectangle' } }
        ]
      },
      stylesheet: [
        { selector: 'node', style: { shape: 'bottom-round-rectangle' } }
      ]
    });

    expect(issues.filter((issue) => issue.code === 'unsupported-node-shape')).toEqual([
      expect.objectContaining({ path: 'graph.nodes[0].style.shape' }),
      expect.objectContaining({ path: 'stylesheet[0].style.shape' })
    ]);
  });
});
