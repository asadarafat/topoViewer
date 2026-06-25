import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { compileTopoGraph, lintTopoDocument, validateTopoDocument, type GraphLink, type TopoDocument, type TopoViewerToggles } from '../../src';
import type { CompiledNodeData } from '../../src/core/types';
import { applyEndpointSpacing, segmentRoute, taxiRoute } from '../../src/core/edgeGeometry';
import { compileEdgeStyle } from '../../src/core/style';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const completeNetworkDemoDir = path.resolve(testDir, '../../examples/test-cases/integration/complete-network-demo');

function readYamlFile(fileName: string): Record<string, unknown> {
  return (yaml.load(fs.readFileSync(path.join(completeNetworkDemoDir, fileName), 'utf8')) || {}) as Record<string, unknown>;
}

function readCompleteNetworkDemo(): TopoDocument {
  return {
    ...readYamlFile('topology.yaml'),
    ...readYamlFile('stylesheet.yaml')
  } as TopoDocument;
}

function combinations(items: string[]): string[][] {
  const states: string[][] = [];
  const total = 2 ** items.length;
  for (let mask = 0; mask < total; mask += 1) {
    states.push(items.filter((_, index) => (mask & (1 << index)) !== 0));
  }
  return states;
}

describe('compileTopoGraph', () => {
  it('compiles complete demo layer and display-control permutations deterministically', () => {
    const document = readCompleteNetworkDemo();
    const layerIds = (document.graph?.layers || [])
      .map((layer) => layer.id)
      .filter((id) => id !== 'diagram');
    const toggleIds = (document.toggles || []).map((toggle) => toggle.id);

    for (const selectedLayerIds of combinations(layerIds)) {
      for (const enabledToggleIds of combinations(toggleIds)) {
        const enabledToggles = new Set(enabledToggleIds);
        const toggles = Object.fromEntries(toggleIds.map((id) => [id, enabledToggles.has(id)])) as TopoViewerToggles;
        const compiled = compileTopoGraph(document, selectedLayerIds, toggles);
        const nodeIds = new Set(compiled.nodes.map((node) => String(node.id)));
        const regionCount = compiled.nodes.filter((node) => String(node.id).startsWith('region:')).length;
        const edgeLabelCount = compiled.edges.filter((edge) => Boolean(edge.label)).length;

        compiled.edges.forEach((edge) => {
          expect(nodeIds.has(String(edge.source)), `${edge.id}: source ${edge.source} should be compiled`).toBe(true);
          expect(nodeIds.has(String(edge.target)), `${edge.id}: target ${edge.target} should be compiled`).toBe(true);
        });

        if (!toggles.showRegions) {
          expect(regionCount).toBe(0);
        }

        if (toggles.showRegions && (selectedLayerIds.includes('igp') || selectedLayerIds.includes('bgp'))) {
          expect(regionCount).toBeGreaterThan(0);
        }

        if (toggles.showRegions && !selectedLayerIds.includes('igp') && !selectedLayerIds.includes('bgp')) {
          expect(regionCount).toBe(0);
        }

        if (!toggles.showEdgeLabels) {
          expect(edgeLabelCount).toBe(0);
        }
      }
    }
  });

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

  it('compiles independent label z-index metadata for nodes, regions, and edge labels', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'physical', name: 'Physical' }],
        nodes: [
          {
            id: 'a',
            name: 'A',
            layers: ['physical'],
            position: [0, 0],
            style: { labelZIndex: 70 }
          },
          {
            id: 'b',
            name: 'B',
            layers: ['physical'],
            position: [160, 0]
          }
        ],
        links: [
          {
            id: 'a-b',
            name: 'A-B',
            source: 'a',
            target: 'b',
            layers: ['physical'],
            style: {
              label: 'Link',
              labelZIndex: 80,
              sourceLabel: 'src',
              sourceLabelZIndex: 81,
              targetLabel: 'dst',
              targetLabelZIndex: 82
            }
          }
        ],
        regions: [
          {
            id: 'region-a',
            name: 'Region A',
            layers: ['physical'],
            members: ['a'],
            style: { labelZIndex: 60, labelPosition: 'topRight', labelMargin: 18 }
          }
        ]
      },
      diagram: {
        shapes: [
          {
            id: 'shape-1',
            layers: ['physical'],
            position: [0, 160],
            size: [120, 60],
            style: { labelZIndex: 40 }
          }
        ],
        callouts: [
          {
            id: 'callout-1',
            layers: ['physical'],
            position: [220, 160],
            title: 'Note',
            body: 'Label z-index metadata',
            style: { labelZIndex: 45 }
          }
        ]
      }
    };

    const compiled = compileTopoGraph(document, ['physical'], { showRegions: true, showEdgeLabels: true });
    const node = compiled.nodes.find((item) => item.id === 'a');
    const region = compiled.nodes.find((item) => item.id === 'region:region-a');
    const shape = compiled.nodes.find((item) => item.id === 'shape-1');
    const callout = compiled.nodes.find((item) => item.id === 'callout-1');
    const edge = compiled.edges.find((item) => item.id === 'a-b');

    expect(node?.data).toMatchObject({ labelZIndex: 70 });
    expect(shape?.data).toMatchObject({ labelZIndex: 40 });
    expect(callout?.data).toMatchObject({ labelZIndex: 45 });
    expect(region?.data).toMatchObject({
      labelZIndex: 60,
      labelPosition: 'topRight',
      labelMargin: 18
    });
    expect(edge?.data).toMatchObject({
      labelZIndex: 80,
      sourceLabelZIndex: 81,
      targetLabelZIndex: 82
    });
  });

  it('uses width and height as the visible node body size', () => {
    const compiled = compileTopoGraph({
      version: '1.0',
      graph: {
        layers: [{ id: 'physical', name: 'Physical' }],
        nodes: [
          { id: 'router-1', name: 'Router 1', layers: ['physical'], position: [0, 0] }
        ]
      },
      stylesheet: [
        {
          selector: 'node',
          style: {
            shape: 'square',
            width: 120,
            height: 120
          }
        }
      ]
    }, ['physical']);

    const node = compiled.nodes[0];
    const nodeData = node?.data as CompiledNodeData;

    expect(node?.style).toMatchObject({ width: 120 });
    expect(nodeData.nodeStyle).toMatchObject({
      width: 120,
      minHeight: 120,
      '--topoviewer-node-icon-width': '120px',
      '--topoviewer-node-icon-height': '120px'
    });
    expect(nodeData.iconStyle).toMatchObject({
      width: 120,
      height: 120
    });
    expect(nodeData.iconContentStyle).toMatchObject({
      width: 120,
      height: 120
    });
    expect(nodeData.edgeAnchor).toMatchObject({
      x: 0,
      y: 0,
      width: 120,
      height: 120
    });
  });

  it('uses icon size controls as inner icon content overrides', () => {
    const compiled = compileTopoGraph({
      version: '1.0',
      graph: {
        layers: [{ id: 'physical', name: 'Physical' }],
        nodes: [
          { id: 'router-1', name: 'Router 1', layers: ['physical'], position: [0, 0] },
          { id: 'router-2', name: 'Router 2', layers: ['physical'], position: [200, 0], labels: { size: 'wide' } }
        ]
      },
      stylesheet: [
        {
          selector: 'node',
          style: {
            width: 120,
            height: 96,
            iconSize: 64
          }
        },
        {
          selector: 'node[labels.size = "wide"]',
          style: {
            iconWidth: 88,
            iconHeight: 52
          }
        }
      ]
    }, ['physical']);

    const router1 = compiled.nodes.find((node) => node.id === 'router-1')?.data as CompiledNodeData;
    const router2 = compiled.nodes.find((node) => node.id === 'router-2')?.data as CompiledNodeData;

    expect(router1.iconStyle).toMatchObject({
      width: 120,
      height: 96
    });
    expect(router1.iconContentStyle).toMatchObject({
      width: 64,
      height: 64
    });
    expect(router1.edgeAnchor).toMatchObject({
      width: 120,
      height: 96
    });

    expect(router2.iconStyle).toMatchObject({
      width: 120,
      height: 96
    });
    expect(router2.iconContentStyle).toMatchObject({
      width: 88,
      height: 52
    });
    expect(router2.edgeAnchor).toMatchObject({
      width: 120,
      height: 96
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

  it('rejects non-canonical label z-index casing and invalid values', () => {
    expect(() => validateTopoDocument({
      version: '1.0',
      graph: {
        nodes: [
          { id: 'a', style: { labelZindex: 70 } }
        ]
      }
    })).toThrow(/labelZIndex/);

    expect(() => validateTopoDocument({
      version: '1.0',
      stylesheet: [
        { selector: 'link', style: { labelZIndex: 'above' } }
      ]
    })).toThrow(/finite number/);

    expect(() => validateTopoDocument({
      version: '1.0',
      stylesheet: [
        { selector: 'link', style: { targetLabelZindex: 100 } }
      ]
    })).toThrow(/targetLabelZIndex/);
  });

  it('reports empty color style values caused by unquoted YAML hex colors', () => {
    const issues = lintTopoDocument({
      version: '1.0',
      graph: {
        nodes: [
          { id: 'a', name: 'A', position: [0, 0] }
        ]
      },
      stylesheet: [
        {
          selector: 'node',
          style: {
            labelBackgroundColor: null
          }
        }
      ]
    } as TopoDocument, { requireNames: false });

    expect(issues).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'invalid-style-color',
      path: 'stylesheet[0].style.labelBackgroundColor'
    }));
  });

  it('applies label background opacity to eight-digit hex colors', () => {
    const compiled = compileTopoGraph({
      version: '1.0',
      graph: {
        layers: [{ id: 'underlay' }],
        nodes: [
          { id: 'a', name: 'A', layers: ['underlay'], position: [0, 0] }
        ]
      },
      stylesheet: [
        {
          selector: 'node',
          style: {
            labelBackgroundColor: '#d19d02ff',
            labelBackgroundOpacity: 0.5
          }
        }
      ]
    }, ['underlay']);

    const nodeData = compiled.nodes[0]?.data as CompiledNodeData;
    expect(nodeData.labelStyle).toMatchObject({
      backgroundColor: 'rgba(209, 157, 2, 0.5)'
    });
  });

  it('does not normalize kebab-case style keys inside edge style compilation', () => {
    const link: GraphLink = { id: 'a-b', source: 'a', target: 'b' };
    const edge = compileEdgeStyle(
      { 'curve-style': 'straight', 'line-color': '#dc2626', width: 8 },
      link,
      {},
      true
    );

    expect(edge.type).toBe('floating');
    expect(edge.style).toEqual(expect.objectContaining({ stroke: '#6ea8fe', strokeWidth: 1 }));
    expect((edge.data as Record<string, unknown>).curveType).toBe('bezier');
  });

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
      link,
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
