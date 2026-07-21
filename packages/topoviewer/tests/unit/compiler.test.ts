import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { compileTopoGraph, lintTopoDocument, validateTopoDocument, type GraphLink, type TopoDocument, type TopoViewerToggles } from '../../src';
import type { CompiledNodeData } from '../../src/core/types';
import { compileEdgeStyle } from '../../src/core/style';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const completeNetworkDemoDir = path.resolve(testDir, '../../content/examples/integration/complete-network-demo');

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

function expectCompleteDemoCompiles(
  document: TopoDocument,
  selectedLayerIds: string[],
  toggleIds: string[],
  toggleStates: string[][]
) {
  for (const enabledToggleIds of toggleStates) {
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

describe('compileTopoGraph', () => {
  it.each([0, 1, 2, 3])('compiles complete demo layer and display-control permutations deterministically, chunk %i', (chunkIndex) => {
    const document = readCompleteNetworkDemo();
    const layerIds = (document.graph?.layers || [])
      .map((layer) => layer.id)
      .filter((id) => id !== 'diagram');
    const toggleIds = (document.toggles || []).map((toggle) => toggle.id);
    const toggleStates = combinations(toggleIds);

    for (const [index, selectedLayerIds] of combinations(layerIds).entries()) {
      if (index % 4 !== chunkIndex) continue;
      expectCompleteDemoCompiles(document, selectedLayerIds, toggleIds, toggleStates);
    }
  });

  it('compiles edge endpoint labels and offsets when edge labels are enabled', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'transport', labels: { name: 'Transport' } }],
        nodes: [
          { id: 'a', labels: { name: 'A' }, layers: ['transport'], position: [0, 0] },
          { id: 'b', labels: { name: 'B' }, layers: ['transport'], position: [240, 0] }
        ],
        links: [
          {
            id: 'a-b',
            labels: { name: 'A-B' },
            source: 'a',
            target: 'b',
            sourceLabel: 'xe-0/0/0',
            targetLabel: 'ethernet-1/1',
            layers: ['transport']
          }
        ]
      },
      stylesheet: [
        {
          selector: 'link',
          style: {
            labelXOffset: 4,
            labelYOffset: -6,
            sourceLabelXOffset: -8,
            sourceLabelYOffset: -12,
            targetLabelXOffset: 8,
            targetLabelYOffset: 12,
            endpointLabelAutoPosition: true,
            endpointLabelDistance: 20,
            endpointLabelOverlayLayer: 'physical-port'
          }
        }
      ]
    };

    const compiled = compileTopoGraph(document, ['transport'], { showEdgeLabels: true });
    const edgeData = compiled.edges[0].data as Record<string, unknown>;

    expect(edgeData).toMatchObject({
      sourceLabel: 'xe-0/0/0',
      targetLabel: 'ethernet-1/1',
      labelXOffset: 4,
      labelYOffset: -6,
      sourceLabelXOffset: -8,
      sourceLabelYOffset: -12,
      targetLabelXOffset: 8,
      targetLabelYOffset: 12,
      endpointLabelAutoPosition: true,
      endpointLabelDistance: 20,
      endpointLabelOverlayLayer: 'physical-port'
    });
  });

  it('applies annotation overlay toggles without hiding the base link', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'fabric', labels: { name: 'Fabric' } }],
        nodes: [
          { id: 'spine', layers: ['fabric'], position: [0, 0] },
          { id: 'leaf', layers: ['fabric'], position: [200, 0] }
        ],
        links: [
          {
            id: 'spine-leaf',
            source: 'spine',
            target: 'leaf',
            sourceLabel: 'e1-1',
            targetLabel: 'e1-49',
            layers: ['fabric'],
            directions: {
              sourceToTarget: { label: '10G' },
              targetToSource: { label: '6G' }
            }
          }
        ]
      },
      stylesheet: [
        {
          selector: 'link',
          style: {
            directionalStrokes: true,
            endpointLabelOverlayLayer: 'physical-port',
            directionOverlayLayer: 'bandwidth'
          }
        }
      ]
    };

    const compiled = compileTopoGraph(document, ['fabric'], {
      showEdgeLabels: true,
      'physical-port': false,
      bandwidth: false
    });
    const edge = compiled.edges[0];
    const edgeData = edge.data as Record<string, unknown>;

    expect(edge).toBeDefined();
    expect(edgeData.sourceLabel).toBeUndefined();
    expect(edgeData.targetLabel).toBeUndefined();
    expect(edgeData.linkDirections).toBeUndefined();
  });

  it('compiles node handles and link handle endpoints', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'physical', labels: { name: 'Physical' } }],
        nodes: [
          {
            id: 'leaf1',
            labels: { name: 'Leaf 1' },
            layers: ['physical'],
            position: [0, 0],
            handles: [
              { id: 'e1-49', type: 'both', position: 'top', offset: 35 }
            ]
          },
          {
            id: 'spine1',
            labels: { name: 'Spine 1' },
            layers: ['physical'],
            position: [200, 0],
            handles: [
              { id: 'e1-1', type: 'both', position: 'bottom', offset: 65 }
            ]
          }
        ],
        links: [
          {
            id: 'leaf1-spine1',
            source: 'leaf1',
            sourceHandle: 'e1-49',
            target: 'spine1',
            targetHandle: 'e1-1',
            layers: ['physical']
          }
        ]
      }
    };

    const compiled = compileTopoGraph(document, ['physical']);
    const leaf = compiled.nodes.find((node) => node.id === 'leaf1')?.data as CompiledNodeData;
    const edge = compiled.edges.find((item) => item.id === 'leaf1-spine1');

    expect(leaf.handles).toEqual([
      { id: 'e1-49', type: 'both', position: 'top', offset: 35 }
    ]);
    expect(edge).toMatchObject({
      sourceHandle: 'e1-49',
      targetHandle: 'e1-1'
    });
  });

  it('compiles independent label z-index metadata for nodes, regions, and edge labels', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'physical', labels: { name: 'Physical' } }],
        nodes: [
          {
            id: 'a',
            labels: { name: 'A' },
            layers: ['physical'],
            position: [0, 0]
          },
          {
            id: 'b',
            labels: { name: 'B' },
            layers: ['physical'],
            position: [160, 0]
          }
        ],
        links: [
          {
            id: 'a-b',
            labels: { name: 'A-B' },
            source: 'a',
            target: 'b',
            layers: ['physical']
          }
        ],
        regions: [
          {
            id: 'region-a',
            labels: { name: 'Region A' },
            layers: ['physical'],
            members: ['a']
          }
        ]
      },
      diagram: {
        shapes: [
          {
            id: 'shape-1',
            layers: ['physical'],
            position: [0, 160]
          }
        ],
        callouts: [
          {
            id: 'callout-1',
            layers: ['physical'],
            position: [220, 160],
            title: 'Note',
            body: 'Label z-index metadata'
          }
        ]
      },
      stylesheet: [
        { selector: 'node[id = "a"]', style: { labelZIndex: 70 } },
        {
          selector: 'link[id = "a-b"]',
          style: {
            label: 'Link',
            labelZIndex: 80,
            sourceLabel: 'src',
            sourceLabelZIndex: 81,
            targetLabel: 'dst',
            targetLabelZIndex: 82
          }
        },
        { selector: 'region[id = "region-a"]', style: { labelZIndex: 60, labelPosition: 'topRight', labelMargin: 18 } },
        { selector: 'shape[id = "shape-1"]', style: { height: 60, labelZIndex: 40, width: 120 } },
        { selector: 'callout[id = "callout-1"]', style: { labelZIndex: 45 } }
      ]
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
        layers: [{ id: 'physical', labels: { name: 'Physical' } }],
        nodes: [
          { id: 'router-1', labels: { name: 'Router 1' }, layers: ['physical'], position: [0, 0] }
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

  it('uses rectangle by default and aspect-locks explicit circle bodies', () => {
    const compiled = compileTopoGraph({
      version: '1.0',
      graph: {
        layers: [{ id: 'physical', labels: { name: 'Physical' } }],
        nodes: [
          { id: 'default-router', labels: { name: 'Default router' }, layers: ['physical'], position: [0, 0] },
          { id: 'circle-router', labels: { name: 'Circle router' }, layers: ['physical'], position: [180, 0] },
          { id: 'ellipse-router', labels: { name: 'Ellipse router' }, layers: ['physical'], position: [360, 0] }
        ]
      },
      stylesheet: [
        {
          selector: 'node',
          style: {
            height: 60
          }
        },
        {
          selector: 'node[id = "circle-router"]',
          style: {
            shape: 'circle'
          }
        },
        {
          selector: 'node[id = "ellipse-router"]',
          style: {
            shape: 'ellipse',
            width: 84
          }
        }
      ]
    }, ['physical']);

    const byId = new Map(compiled.nodes.map((node) => [node.id, node.data as CompiledNodeData]));

    expect(byId.get('default-router')).toMatchObject({
      nodeShapeType: 'rectangle',
      iconStyle: { width: 82, height: 60 },
      iconContentStyle: { width: 82, height: 60 }
    });
    expect(byId.get('circle-router')).toMatchObject({
      nodeShapeType: 'circle',
      iconStyle: { width: 60, height: 60 },
      iconContentStyle: { width: 60, height: 60 }
    });
    expect(byId.get('ellipse-router')).toMatchObject({
      nodeShapeType: 'ellipse',
      iconStyle: { width: 84, height: 60 },
      iconContentStyle: { width: 84, height: 60 }
    });
  });

  it('keeps the icon fit boundary aligned to the node body', () => {
    const compiled = compileTopoGraph({
      version: '1.0',
      graph: {
        layers: [{ id: 'physical', labels: { name: 'Physical' } }],
        nodes: [
          { id: 'router-1', labels: { name: 'Router 1' }, layers: ['physical'], position: [0, 0] },
          { id: 'router-2', labels: { name: 'Router 2', size: 'wide' }, layers: ['physical'], position: [200, 0] }
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
      width: 120,
      height: 96
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
      width: 120,
      height: 96
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
        layers: [{ id: 'transport', labels: { name: 'Transport' } }],
        nodes: [
          { id: 'a', labels: { name: 'A' }, layers: ['transport'], position: [0, 0] },
          { id: 'b', labels: { name: 'B' }, layers: ['transport'], position: [240, 0] }
        ],
        links: [
          { id: 'a-b-1', labels: { name: 'A-B 1' }, source: 'a', target: 'b', layers: ['transport'] },
          { id: 'a-b-2', labels: { name: 'A-B 2' }, source: 'a', target: 'b', layers: ['transport'] },
          { id: 'a-b-3', labels: { name: 'A-B 3' }, source: 'a', target: 'b', layers: ['transport'] }
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

  it('renders path segments over existing links as overlay lanes', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        layers: [{ id: 'physical', labels: { name: 'Physical' } }],
        nodes: [
          { id: 'a', labels: { name: 'A' }, layers: ['physical'], position: [0, 0] },
          { id: 'b', labels: { name: 'B' }, layers: ['physical'], position: [240, 0] }
        ],
        links: [
          { id: 'a-b', labels: { name: 'A-B' }, source: 'a', target: 'b', layers: ['physical'] }
        ],
        paths: [
          { id: 'path-a-b', labels: { name: 'A to B path' }, sequence: ['a', 'b'], layers: ['physical'] }
        ]
      },
      stylesheet: [
        { selector: 'link', style: { curveStyle: 'bezier', lineColor: '#2563eb', lineWidth: 3 } },
        { selector: 'path', style: { curveStyle: 'bezier', lineColor: '#f97316', lineWidth: 2, laneGap: 20 } }
      ]
    };

    const compiled = compileTopoGraph(document, ['physical']);
    const linkEdge = compiled.edges.find((edge) => edge.id === 'a-b');
    const pathEdge = compiled.edges.find((edge) => edge.id === 'path-a-b:0');
    const pathData = pathEdge?.data as Record<string, unknown> | undefined;

    expect(linkEdge).toBeDefined();
    expect(pathEdge).toBeDefined();
    expect(linkEdge?.data).not.toMatchObject({ isLane: true });
    expect(pathData).toMatchObject({
      isLane: true,
      parallelLinkGroup: 'path-overlay:a::b',
      laneIndex: 1,
      laneCount: 2,
      laneGap: 20,
      controlPointStepSize: 20,
      laneWidth: 2
    });
  });

  it('rejects kebab-case style keys during document validation', () => {
    const document: TopoDocument = {
      version: '1.0',
      graph: {
        nodes: [
          { id: 'a', labels: { name: 'A' }, position: [0, 0] },
          { id: 'b', labels: { name: 'B' }, position: [100, 0] }
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
      stylesheet: [{ selector: 'node[id = "a"]', style: { labelZindex: 70 } }]
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
          { id: 'a', labels: { name: 'A' }, position: [0, 0] }
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

  it('keeps malformed YAML in the parse stage instead of treating it as a valid topology object', () => {
    expect(() => yaml.load([
      'graph:',
      '  nodes: ['
    ].join('\n'))).toThrow();
  });

  it('reports reliability diagnostics before unsafe or broken documents render', () => {
    expect(() => validateTopoDocument({
      version: '1.0',
      stylesheet: [
        {
          selector: 'link',
          style: {
            'line-color': '#d32f2f'
          }
        }
      ]
    })).toThrow(/line-color/);

    const issues = lintTopoDocument({
      version: '1.0',
      limits: {
        maxNodes: 1,
        maxEdges: 1,
        maxImageBytes: 10
      },
      icons: {
        unsafe: {
          src: 'javascript:alert(1)'
        },
        huge: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg"><text>too large</text></svg>'
        }
      },
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'a', labels: { name: 'A' }, layers: ['physical'], position: [0, 0] },
          { id: 'b', labels: { name: 'B' }, layers: ['unknown'], position: [120, 0] }
        ],
        links: [
          {
            id: 'a-missing',
            source: 'a',
            target: 'missing',
            layers: ['physical']
          }
        ]
      }
    } as TopoDocument, { requireNames: false });

    expect(issues.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      'unknown-layer',
      'broken-target',
      'unsafe-image-reference',
      'renderer-limit'
    ]));
  });

  it('falls back to a safe generic icon when an authored icon key is missing', () => {
    const compiled = compileTopoGraph({
      version: '1.0',
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'a', labels: { name: 'A' }, layers: ['physical'], position: [0, 0] }
        ]
      },
      stylesheet: [
        {
          selector: 'node',
          style: {
            icon: 'missing-icon'
          }
        }
      ]
    }, ['physical']);

    const nodeData = compiled.nodes[0]?.data as CompiledNodeData;
    expect(nodeData.iconSpec).toMatchObject({
      glyph: 'R',
      fill: '#6ea8fe',
      stroke: '#d8e8ff'
    });
  });

  it('applies label background opacity to eight-digit hex colors', () => {
    const compiled = compileTopoGraph({
      version: '1.0',
      graph: {
        layers: [{ id: 'underlay' }],
        nodes: [
          { id: 'a', labels: { name: 'A' }, layers: ['underlay'], position: [0, 0] }
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

  it('marks transparent and zero-size node metadata as hidden', () => {
    const compiled = compileTopoGraph({
      version: '1.0',
      graph: {
        layers: [{ id: 'underlay' }],
        nodes: [
          { id: 'transparent-meta', labels: { name: 'Transparent', meta: 'transparent', role: 'pe' }, layers: ['underlay'], position: [0, 0] },
          { id: 'zero-meta', labels: { name: 'Zero', meta: 'zero', role: 'p' }, layers: ['underlay'], position: [160, 0] },
          { id: 'visible-meta', labels: { name: 'Visible', meta: 'visible', role: 'rr' }, layers: ['underlay'], position: [320, 0] }
        ]
      },
      stylesheet: [
        { selector: 'node[labels.meta = "transparent"]', style: { metaColor: 'transparent' } },
        { selector: 'node[labels.meta = "zero"]', style: { metaFontSize: 0 } },
        { selector: 'node[labels.meta = "visible"]', style: { metaColor: '#94a3b8', metaFontSize: 9, metaZIndex: 69, labelCollisionPolicy: 'fade' } }
      ]
    }, ['underlay']);

    const transparentMeta = compiled.nodes.find((node) => node.id === 'transparent-meta')?.data as CompiledNodeData;
    const zeroMeta = compiled.nodes.find((node) => node.id === 'zero-meta')?.data as CompiledNodeData;
    const visibleMeta = compiled.nodes.find((node) => node.id === 'visible-meta')?.data as CompiledNodeData;

    expect(transparentMeta.metaVisible).toBe(false);
    expect(zeroMeta.metaVisible).toBe(false);
    expect(visibleMeta.metaVisible).toBe(true);
    expect(visibleMeta.metaStyle).toMatchObject({
      color: '#94a3b8',
      fontSize: 9
    });
    expect(visibleMeta.metaZIndex).toBe(69);
    expect(visibleMeta.labelCollisionPolicy).toBe('fade');
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

  it('keeps explicit region geometry authoritative and resolves auto-fit policy from styles', () => {
    const compiled = compileTopoGraph({
      layout: { mode: 'manual' },
      graph: {
        layers: [{ id: 'physical' }],
        nodes: [
          { id: 'manual-member', layers: ['physical'], position: [900, 900] },
          { id: 'auto-member', layers: ['physical'], position: [400, 300] }
        ],
        regions: [
          { id: 'manual', layers: ['physical'], members: ['manual-member'], position: [20, 30] },
          { id: 'auto', layers: ['physical'], members: ['auto-member'] }
        ]
      },
      stylesheet: [
        { selector: 'region', style: { selectable: true } },
        { selector: 'region[id = "manual"]', style: { height: 160, width: 240 } },
        { selector: 'region[id = "auto"]', style: { headerPadding: 12, minHeight: 1, minWidth: 1, paddingX: 20, paddingY: 10 } }
      ]
    }, ['physical']);

    const manual = compiled.nodes.find((node) => node.id === 'region:manual');
    const auto = compiled.nodes.find((node) => node.id === 'region:auto');

    expect(manual).toMatchObject({ position: { x: 20, y: 30 }, style: { height: 160, width: 240 } });
    expect(auto).toMatchObject({ position: { x: 380, y: 278 }, style: { height: 106, width: 122 } });
  });

  it('reads shape presentation exclusively from stylesheet rules', () => {
    const compiled = compileTopoGraph({
      graph: { layers: [{ id: 'diagram' }] },
      diagram: {
        shapes: [{
          id: 'legacy-shape',
          layers: ['diagram'],
          position: [20, 30]
        }]
      },
      stylesheet: [{
        selector: 'shape[id = "legacy-shape"]',
        style: { height: 60, rotation: 25, shape: 'ellipse', width: 180 }
      }]
    }, ['diagram']);

    expect(compiled.nodes.find((node) => node.id === 'legacy-shape')).toMatchObject({
      data: { rotation: 25, shapeType: 'ellipse' },
      style: { height: 60, width: 180 }
    });
  });

});
