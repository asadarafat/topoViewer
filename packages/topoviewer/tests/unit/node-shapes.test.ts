import { describe, expect, it } from 'vitest';
import {
  compileTopoGraph,
  lintTopoDocument,
  parseNodeShapePoints,
  validateTopoDocument,
  type TopoDocument
} from '../../src';

describe('declarative node shapes', () => {
  it('uses square as the default node body shape', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'default-1', name: 'Default 1', layers: ['physical'], position: [0, 0] }
        ]
      },
      stylesheet: [
        { selector: 'node', style: { iconSize: 48, borderWidth: 3 } }
      ]
    };

    const compiled = compileTopoGraph(document, ['physical']);
    const data = compiled.nodes[0].data as Record<string, unknown>;

    expect(data.nodeShapeType).toBe('square');
  });

  it('compiles canonical named node shape values into node body metadata', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'pe-1', name: 'PE 1', layers: ['physical'], position: [0, 0] },
          { id: 'fw-1', name: 'FW 1', layers: ['physical'], position: [160, 0] },
          { id: 'svc-1', name: 'SVC 1', layers: ['physical'], position: [320, 0] },
          { id: 'circle-1', name: 'Circle 1', layers: ['physical'], position: [480, 0] },
          { id: 'square-1', name: 'Square 1', layers: ['physical'], position: [640, 0] }
        ]
      },
      stylesheet: [
        { selector: 'node', style: { iconSize: 48, borderWidth: 3 } },
        { selector: 'node[id = "pe-1"]', style: { shape: 'roundRectangle', backgroundColor: '#dbeafe', borderColor: '#1d4ed8' } },
        { selector: 'node[id = "fw-1"]', style: { shape: 'cutRectangle', backgroundColor: '#fee2e2', borderColor: '#b91c1c' } },
        { selector: 'node[id = "svc-1"]', style: { shape: 'concaveHexagon', backgroundColor: '#ede9fe', borderColor: '#6d28d9' } },
        { selector: 'node[id = "circle-1"]', style: { shape: 'circle', backgroundColor: '#ccfbf1', borderColor: '#0f766e' } },
        { selector: 'node[id = "square-1"]', style: { shape: 'square', backgroundColor: '#ffedd5', borderColor: '#ea580c' } }
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
    expect(byId.get('circle-1')).toMatchObject({ nodeShapeType: 'circle' });
    expect(byId.get('square-1')).toMatchObject({ nodeShapeType: 'square' });
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

  it('compiles enhanced node style controls into renderer data', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          {
            id: 'agg-1',
            name: 'Aggregate 1',
            labels: { severity: 'critical' },
            data: { isAggregate: true, childCount: 42 },
            layers: ['physical'],
            position: [0, 0]
          }
        ]
      },
      icons: {
        router: {
          glyph: 'R',
          fill: '#1d4ed8',
          stroke: '#bfdbfe'
        }
      },
      stylesheet: [
        {
          selector: 'node',
          style: {
            icon: 'router',
            labelPosition: 'right',
            labelXOffset: 6,
            labelYOffset: -2,
            labelTextWrap: 'wrap',
            labelTextMaxWidth: 96,
            labelTextOverflow: 'ellipsis',
            labelBackgroundColor: '#f8fafc',
            labelBackgroundOpacity: 0.92,
            labelBorderColor: '#94a3b8',
            labelBorderWidth: 1,
            labelPadding: 4,
            labelOpacity: 0.94,
            minZoomedLabelFontSize: 7,
            borderStyle: 'dashed',
            borderDashPattern: [7, 3],
            borderOpacity: 0.72,
            outlineColor: '#f97316',
            outlineWidth: 4,
            outlineOpacity: 0.8,
            underlayColor: '#fef3c7',
            underlayPadding: 10,
            underlayOpacity: 0.55,
            iconOpacity: 0.86,
            iconPadding: 3,
            iconFit: 'cover',
            iconBackgroundColor: '#0f172a',
            badgeBackgroundColor: '#fee2e2',
            badgeColor: '#991b1b',
            statusSize: 12
          }
        }
      ]
    };

    const compiled = compileTopoGraph(document, ['physical']);
    const data = compiled.nodes[0].data as Record<string, unknown>;

    expect(data).toMatchObject({
      labelPosition: 'right',
      labelMinZoom: 7,
      badgeLabel: '42',
      badgePosition: 'topRight',
      statusPlacement: 'bottomRight'
    });
    expect(data.nodeShapeStyle).toMatchObject({
      strokeDasharray: '7 3',
      strokeOpacity: 0.72
    });
    expect(data.nodeOutlineStyle).toMatchObject({
      stroke: '#f97316',
      strokeWidth: 4,
      strokeOpacity: 0.8
    });
    expect(data.nodeUnderlayStyle).toMatchObject({
      fill: '#fef3c7',
      fillOpacity: 0.55
    });
    expect(data.iconContentStyle).toMatchObject({
      padding: '3px',
      backgroundColor: '#0f172a',
      opacity: 0.86
    });
    expect(data.iconImageStyle).toMatchObject({ objectFit: 'cover' });
    expect(data.labelStyle).toMatchObject({
      backgroundColor: 'rgba(248, 250, 252, 0.92)',
      borderColor: '#94a3b8',
      borderWidth: 1,
      maxWidth: '96px',
      whiteSpace: 'normal',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    });
    expect(data.badgeStyle).toMatchObject({
      color: '#991b1b',
      backgroundColor: '#fee2e2'
    });
    expect(data.statusStyle).toMatchObject({
      backgroundColor: '#dc2626',
      width: '12px',
      height: '12px'
    });
  });

  it('reports invalid enhanced node style controls', () => {
    const issues = lintTopoDocument({
      graph: {
        nodes: [
          {
            id: 'bad',
            style: {
              labelPosition: 'inside-right',
              labelTextWrap: 'balance',
              labelTextOverflow: 'fade',
              borderStyle: 'double',
              borderDashPattern: 'late',
              iconFit: 'scale-down',
              badgePosition: 'upperRight',
              statusPlacement: 'edge',
              labelOpacity: 1.4,
              underlayPadding: -1,
              labelXOffset: 'far',
              badgeLabel: 'far too much badge text'
            }
          }
        ]
      }
    }, { requireNames: false });

    expect(issues.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      'unsupported-node-label-position',
      'unsupported-node-label-wrap',
      'unsupported-node-label-overflow',
      'unsupported-node-border-style',
      'unsupported-node-icon-fit',
      'unsupported-node-badge-position',
      'unsupported-node-status-placement',
      'invalid-node-opacity',
      'invalid-node-style-number',
      'invalid-node-border-dash-pattern',
      'long-node-badge-label'
    ]));
  });
});
