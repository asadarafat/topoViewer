import { describe, expect, it } from 'vitest';
import {
  compileTopoGraph,
  lintTopoDocument,
  parseNodeShapePoints,
  validateTopoDocument,
  type TopoDocument
} from '../../src';

describe('declarative node shapes', () => {
  function decodedMask(style: Record<string, unknown> | undefined): string {
    return decodeURIComponent(String(style?.maskImage || ''));
  }

  it('uses rectangle as the default node body shape', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'default-1', labels: { name: 'Default 1' }, layers: ['physical'], position: [0, 0] }
        ]
      },
      stylesheet: [
        { selector: 'node', style: { iconSize: 48, borderWidth: 3 } }
      ]
    };

    const compiled = compileTopoGraph(document, ['physical']);
    const data = compiled.nodes[0].data as Record<string, unknown>;

    expect(data.nodeShapeType).toBe('rectangle');
  });

  it('keeps default rectangle dimensions independent for body and edge anchors', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'default-1', labels: { name: 'Default 1' }, layers: ['physical'], position: [0, 0] }
        ]
      },
      stylesheet: [
        { selector: 'node', style: { width: 96, height: 56 } }
      ]
    };

    const compiled = compileTopoGraph(document, ['physical']);
    const node = compiled.nodes[0];
    const data = node.data as Record<string, unknown>;

    expect(data.nodeShapeType).toBe('rectangle');
    expect(node.style).toMatchObject({ width: 96 });
    expect(data.nodeStyle).toMatchObject({ width: 96, minHeight: 56 });
    expect(data.iconStyle).toMatchObject({ width: 96, height: 56 });
    expect(data.edgeAnchor).toMatchObject({ width: 96, height: 56 });
  });

  it('derives missing square and circle dimensions from the authored dimension', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'square-1', labels: { name: 'Square 1' }, layers: ['physical'], position: [0, 0] },
          { id: 'circle-1', labels: { name: 'Circle 1' }, layers: ['physical'], position: [120, 0] }
        ]
      },
      stylesheet: [
        { selector: 'node[id = "square-1"]', style: { shape: 'square', width: 96 } },
        { selector: 'node[id = "circle-1"]', style: { shape: 'circle', height: 64 } }
      ]
    };

    const compiled = compileTopoGraph(document, ['physical']);
    const byId = new Map(compiled.nodes.map((node) => [node.id, node]));
    const squareData = byId.get('square-1')?.data as Record<string, unknown>;
    const circleData = byId.get('circle-1')?.data as Record<string, unknown>;

    expect(squareData.nodeShapeType).toBe('square');
    expect(squareData.edgeAnchor).toMatchObject({ width: 96, height: 96 });
    expect(squareData.iconStyle).toMatchObject({ width: 96, height: 96 });
    expect(circleData.nodeShapeType).toBe('circle');
    expect(circleData.edgeAnchor).toMatchObject({ width: 64, height: 64 });
    expect(circleData.iconStyle).toMatchObject({ width: 64, height: 64 });
  });

  it('clips icon content to the node body shape', () => {
    const compiled = compileTopoGraph({
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'circle-1', labels: { name: 'Circle 1' }, layers: ['physical'], position: [0, 0] },
          { id: 'triangle-1', labels: { name: 'Triangle 1' }, layers: ['physical'], position: [160, 0] },
          { id: 'polygon-1', labels: { name: 'Polygon 1' }, layers: ['physical'], position: [320, 0] }
        ]
      },
      stylesheet: [
        { selector: 'node', style: { iconWidth: 100, iconHeight: 100 } },
        { selector: 'node[id = "circle-1"]', style: { shape: 'circle', width: 120 } },
        { selector: 'node[id = "triangle-1"]', style: { shape: 'triangle' } },
        {
          selector: 'node[id = "polygon-1"]',
          style: {
            shape: 'polygon',
            shapePolygonPoints: [0, -1, 1, 0.2, 0.35, 1, -1, 0.2]
          }
        }
      ]
    }, ['physical']);

    const byId = new Map(compiled.nodes.map((node) => [node.id, node.data as Record<string, unknown>]));

    expect(byId.get('circle-1')?.iconContentStyle).toMatchObject({
      width: 120,
      height: 120
    });
    expect(decodedMask(byId.get('circle-1')?.iconContentStyle as Record<string, unknown>)).toContain('<circle cx="50" cy="50" r="50" fill="#000"/>');
    expect(decodedMask(byId.get('triangle-1')?.iconContentStyle as Record<string, unknown>)).toContain('<polygon points="50,0 100,100 0,100" fill="#000"/>');
    expect(decodedMask(byId.get('polygon-1')?.iconContentStyle as Record<string, unknown>)).toContain('<polygon points="50,10 90,58 64,90 10,58" fill="#000"/>');
  });

  it('compiles canonical named node shape values into node body metadata', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'pe-1', labels: { name: 'PE 1' }, layers: ['physical'], position: [0, 0] },
          { id: 'fw-1', labels: { name: 'FW 1' }, layers: ['physical'], position: [160, 0] },
          { id: 'svc-1', labels: { name: 'SVC 1' }, layers: ['physical'], position: [320, 0] },
          { id: 'circle-1', labels: { name: 'Circle 1' }, layers: ['physical'], position: [480, 0] },
          { id: 'square-1', labels: { name: 'Square 1' }, layers: ['physical'], position: [640, 0] }
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
            labels: { name: 'Custom' },
            layers: ['physical'],
            position: [0, 0]
          }
        ]
      },
      stylesheet: [
        {
          selector: 'node[id = "custom"]',
          style: {
              shape: 'polygon',
              shapePolygonPoints: '0 -1 1 0.35 0 1 -1 0.35'
          }
        }
      ]
    };

    const compiled = compileTopoGraph(document, ['physical']);
    const data = compiled.nodes[0].data as Record<string, unknown>;

    expect(data.nodeShapeType).toBe('polygon');
    expect(data.nodeShapePoints).toBe('50,10 90,64 50,90 10,64');
  });

  it('rejects non-canonical polygon style keys and invalid polygon points during validation', () => {
    expect(() => validateTopoDocument({
      stylesheet: [{ selector: 'node[id = "bad"]', style: { 'shape-polygon-points': '0 -1 1 1 -1 1' } }]
    })).toThrow(/shape-polygon-points/);

    expect(() => validateTopoDocument({
      stylesheet: [{ selector: 'node[id = "bad"]', style: { shape: 'polygon', shapePolygonPoints: '0 -1 2 0 0 1' } }]
    })).toThrow(/\[-1, 1\]/);
  });

  it('reports unsupported node shape names through semantic lint', () => {
    const issues = lintTopoDocument({
      graph: {
        nodes: [
          { id: 'legacy' }
        ]
      },
      stylesheet: [
        { selector: 'node[id = "legacy"]', style: { shape: 'roundrectangle' } },
        { selector: 'node', style: { shape: 'bottom-round-rectangle' } }
      ]
    });

    expect(issues.filter((issue) => issue.code === 'unsupported-node-shape')).toEqual([
      expect.objectContaining({ path: 'stylesheet[0].style.shape' }),
      expect.objectContaining({ path: 'stylesheet[1].style.shape' })
    ]);
  });

  it('reports unequal square and circle dimensions through semantic lint', () => {
    const issues = lintTopoDocument({
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'square-rule', layers: ['physical'] },
          { id: 'circle-rule', layers: ['physical'] }
        ]
      },
      stylesheet: [
        { selector: 'node[id = "square-rule"]', style: { shape: 'square', width: 96, height: 56 } },
        { selector: 'node[id = "circle-rule"]', style: { shape: 'circle', width: 96, height: 56 } }
      ]
    }, { requireNames: false });

    expect(issues.filter((issue) => issue.code === 'invalid-node-aspect-dimensions')).toEqual([
      expect.objectContaining({ path: 'stylesheet[0].style.height', severity: 'error' }),
      expect.objectContaining({ path: 'stylesheet[1].style.height', severity: 'error' })
    ]);
  });

  it('reports effective unequal square dimensions assembled from multiple matching rules', () => {
    const issues = lintTopoDocument({
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'square-effective', layers: ['physical'] }
        ]
      },
      stylesheet: [
        { selector: 'node', style: { shape: 'square', width: 96 } },
        { selector: 'node[id = "square-effective"]', style: { height: 56 } }
      ]
    }, { requireNames: false });

    expect(issues.filter((issue) => issue.code === 'invalid-node-aspect-dimensions')).toEqual([
      expect.objectContaining({ path: 'graph.nodes[0].effectiveStyle.height', severity: 'error' })
    ]);
  });

  it('compiles enhanced node style controls into renderer data', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          {
            id: 'agg-1',
            labels: { name: 'Aggregate 1', severity: 'critical' },
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
            badgeBorderColor: '#ef4444',
            badgeBorderWidth: 2,
            badgeFontSize: 11,
            badgeFontWeight: 900,
            badgeMinWidth: 22,
            badgeMinHeight: 22,
            badgePadding: 3,
            badgeOffset: 11,
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
    expect(data.iconImageStyle).toMatchObject({
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      minWidth: 0,
      minHeight: 0,
      maxWidth: 'none',
      maxHeight: 'none',
      display: 'block',
      alignSelf: 'stretch',
      justifySelf: 'stretch',
      aspectRatio: 'auto',
      objectPosition: 'center',
      objectFit: 'cover'
    });
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
      backgroundColor: '#fee2e2',
      borderColor: '#ef4444',
      borderWidth: '2px',
      fontSize: '11px',
      fontWeight: 900,
      minWidth: '22px',
      minHeight: '22px',
      padding: '3px',
      '--topoviewer-node-badge-offset': '11px'
    });
    expect(data.statusStyle).toMatchObject({
      backgroundColor: 'var(--topoviewer-danger)',
      width: '12px',
      height: '12px'
    });
  });

  it('keeps legacy node rendering data unchanged when card layout is absent', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'svc-1', labels: { name: 'Service 1' }, data: { subtitle: 'API' }, layers: ['physical'], position: [0, 0] }
        ]
      },
      stylesheet: [
        { selector: 'node', style: { shape: 'roundRectangle', width: 180, height: 64 } }
      ]
    };

    const compiled = compileTopoGraph(document, ['physical']);
    const data = compiled.nodes[0].data as Record<string, unknown>;

    expect(data.nodeShapeType).toBe('roundRectangle');
    expect(data.nodeLayout).toBeUndefined();
    expect(data.cardTitle).toBeUndefined();
    expect(data.cardSubtitle).toBeUndefined();
  });

  it('compiles nested card node layout for explicit roundRectangle nodes', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          {
            id: 'svc-1',
            labels: { name: 'Inventory API', role: 'api' },
            data: { subtitle: 'Ready / 3 pods' },
            layers: ['physical'],
            position: [0, 0]
          }
        ]
      },
      stylesheet: [
        {
          selector: 'node',
          style: {
            shape: 'roundRectangle',
            width: 190,
            height: 64,
            icon: 'service',
            iconPadding: 8,
            badgeLabel: '3',
            badgeFontSize: 11,
            badgeMinWidth: 22,
            badgeMinHeight: 22,
            badgePadding: 3,
            badgeOffset: 11,
            nodeLayout: {
              type: 'card',
              direction: 'horizontal',
              icon: {
                placement: 'left',
                width: 44,
                height: 44
              },
              content: {
                align: 'left',
                titleField: 'labels.name',
                subtitleField: 'data.subtitle'
              }
            }
          }
        }
      ]
    };

    expect(() => validateTopoDocument(document)).not.toThrow();
    expect(lintTopoDocument(document, { requireNames: false }).filter((issue) => issue.severity === 'error')).toEqual([]);

    const compiled = compileTopoGraph(document, ['physical']);
    const data = compiled.nodes[0].data as Record<string, unknown>;

    expect(data.nodeLayout).toMatchObject({
      type: 'card',
      direction: 'horizontal',
      icon: {
        placement: 'left',
        width: 44,
        height: 44
      },
      content: {
        align: 'left',
        titleField: 'labels.name',
        subtitleField: 'data.subtitle'
      }
    });
    expect(data.cardTitle).toBe('Inventory API');
    expect(data.cardSubtitle).toBe('Ready / 3 pods');
    expect(data.cardIconStyle).toMatchObject({ width: 44, height: 44 });
    expect(data.cardIconContentStyle).toMatchObject({ padding: '8px' });
    expect(data.badgePosition).toBe('topRight');
    expect(data.badgeStyle).toMatchObject({
      fontSize: '11px',
      minWidth: '22px',
      minHeight: '22px',
      padding: '3px',
      '--topoviewer-node-badge-offset': '11px'
    });
  });

  it('uses explicit standard layout to override an inherited card layout', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'standard-node', labels: { name: 'Standard' }, layers: ['physical'], position: [0, 0] },
          { id: 'card-node', labels: { name: 'Card' }, layers: ['physical'], position: [120, 0] }
        ]
      },
      stylesheet: [
        {
          selector: 'node',
          style: {
            shape: 'roundRectangle',
            nodeLayout: {
              type: 'card',
              content: { titleField: 'labels.name' }
            }
          }
        },
        {
          selector: 'node[id = "standard-node"]',
          style: { nodeLayout: { type: 'standard' } }
        }
      ]
    };

    expect(() => validateTopoDocument(document)).not.toThrow();
    expect(lintTopoDocument(document, { requireNames: false }).filter((issue) => issue.severity === 'error')).toEqual([]);

    const compiled = compileTopoGraph(document, ['physical']);
    const standard = compiled.nodes.find((node) => node.id === 'standard-node')?.data as Record<string, unknown>;
    const card = compiled.nodes.find((node) => node.id === 'card-node')?.data as Record<string, unknown>;
    expect(standard.nodeLayout).toBeUndefined();
    expect(standard.cardTitle).toBeUndefined();
    expect(card.nodeLayout).toMatchObject({ type: 'card' });
    expect(card.cardTitle).toBe('Card');
  });

  it('reports card node layout when the effective node shape is not roundRectangle', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'bad-card', labels: { name: 'Bad Card' }, layers: ['physical'], position: [0, 0] }
        ]
      },
      stylesheet: [
        { selector: 'node', style: { shape: 'rectangle' } },
        { selector: 'node[id = "bad-card"]', style: { nodeLayout: { type: 'card' } } }
      ]
    };

    const issues = lintTopoDocument(document, { requireNames: false });

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'invalid-node-card-layout-shape',
        path: 'graph.nodes[0].effectiveStyle.nodeLayout',
        severity: 'error'
      })
    ]));
  });

  it('rejects unsupported nested card node layout values during validation', () => {
    expect(() => validateTopoDocument({
      graph: {
        nodes: [{ id: 'bad' }]
      },
      stylesheet: [
        {
          selector: 'node[id = "bad"]',
          style: {
              shape: 'roundRectangle',
              nodeLayout: {
                type: 'card',
                direction: 'vertical',
                icon: {
                  placement: 'right',
                  width: -1
                },
                content: {
                  align: 'start',
                  titleField: 42
                }
              }
          }
        }
      ]
    })).toThrow(/nodeLayout/);
  });

  it('reports icon-scoped card badge placement as unsupported semantic lint', () => {
    const issues = lintTopoDocument({
      graph: {
        nodes: [
          {
            id: 'bad-card-badge',
            layers: ['physical']
          }
        ],
        layers: [{ id: 'physical' }]
      },
      stylesheet: [{
        selector: 'node[id = "bad-card-badge"]',
        style: {
              shape: 'roundRectangle',
              nodeLayout: {
                type: 'card',
                icon: {
                  badgePlacement: 'topRight'
                }
              }
        }
      }]
    }, { requireNames: false });

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'unsupported-node-layout-icon-badge-placement',
        path: 'stylesheet[0].style.nodeLayout.icon.badgePlacement',
        severity: 'error'
      })
    ]));
  });

  it('reports invalid enhanced node style controls', () => {
    const issues = lintTopoDocument({
      graph: {
        nodes: [{ id: 'bad' }]
      },
      stylesheet: [
        {
          selector: 'node[id = "bad"]',
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
