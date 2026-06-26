import { describe, expect, it } from 'vitest';
import {
  analyzeClosLayoutDiagnostics,
  computeLayoutPositions,
  lintTopoDocument,
  validateTopoDocument,
  type GraphLink,
  type GraphNode,
  type TopoDocument
} from '../../src';

function position(positions: Map<string, { x: number; y: number }>, id: string): { x: number; y: number } {
  const value = positions.get(id);
  expect(value, `${id} should have a computed position`).toBeDefined();
  return value as { x: number; y: number };
}

function warningCodes(document: TopoDocument): string[] {
  return lintTopoDocument(document).filter((issue) => issue.severity === 'warning').map((issue) => issue.code);
}

describe('CLOS layout', () => {
  it('places a two-stage graph deterministically without semantic role names', () => {
    const nodes: GraphNode[] = [
      { id: 'top-a', name: 'Top A' },
      { id: 'top-b', name: 'Top B' },
      { id: 'bottom-a', name: 'Bottom A' },
      { id: 'bottom-b', name: 'Bottom B' }
    ];
    const links: GraphLink[] = [
      { id: 'top-a-bottom-a', source: 'top-a', target: 'bottom-a' },
      { id: 'top-a-bottom-b', source: 'top-a', target: 'bottom-b' },
      { id: 'top-b-bottom-a', source: 'top-b', target: 'bottom-a' },
      { id: 'top-b-bottom-b', source: 'top-b', target: 'bottom-b' }
    ];

    const layout = { mode: 'clos' as const, width: 800, height: 420 };
    const first = computeLayoutPositions(nodes, links, layout);
    const second = computeLayoutPositions([...nodes].reverse(), [...links].reverse(), layout);

    expect(position(first, 'top-a').y).toBeLessThan(position(first, 'bottom-a').y);
    nodes.forEach((node) => {
      expect(position(second, node.id)).toEqual(position(first, node.id));
    });
  });

  it('uses explicit generic stage order when authors provide stage metadata', () => {
    const nodes: GraphNode[] = [
      { id: 'stage-a-1', labels: { stage: 'edge' } },
      { id: 'stage-a-2', labels: { stage: 'edge' } },
      { id: 'stage-b-1', labels: { stage: 'aggregation' } },
      { id: 'stage-b-2', labels: { stage: 'aggregation' } },
      { id: 'stage-c-1', labels: { stage: 'access' } },
      { id: 'stage-c-2', labels: { stage: 'access' } }
    ];
    const links: GraphLink[] = [
      { id: 'a1-b1', source: 'stage-a-1', target: 'stage-b-1' },
      { id: 'a2-b2', source: 'stage-a-2', target: 'stage-b-2' },
      { id: 'b1-c1', source: 'stage-b-1', target: 'stage-c-1' },
      { id: 'b2-c2', source: 'stage-b-2', target: 'stage-c-2' }
    ];

    const positions = computeLayoutPositions(nodes, links, {
      mode: 'clos',
      width: 900,
      height: 600,
      clos: {
        stageKey: 'labels.stage',
        stageOrder: ['edge', 'aggregation', 'access']
      }
    });

    expect(position(positions, 'stage-a-1').y).toBeLessThan(position(positions, 'stage-b-1').y);
    expect(position(positions, 'stage-b-1').y).toBeLessThan(position(positions, 'stage-c-1').y);
    expect(position(positions, 'stage-a-1').y).toBe(position(positions, 'stage-a-2').y);
  });

  it('uses low endpoint count as a fuzzy root signal when direction is not usable', () => {
    const nodes: GraphNode[] = [
      { id: 'hub-1', name: 'Hub 1' },
      { id: 'hub-2', name: 'Hub 2' },
      { id: 'edge-1', name: 'Edge 1' },
      { id: 'edge-2', name: 'Edge 2' },
      { id: 'edge-3', name: 'Edge 3' },
      { id: 'edge-4', name: 'Edge 4' }
    ];
    const fabricLinks: GraphLink[] = [
      { id: 'edge-1-hub-1', source: 'edge-1', target: 'hub-1' },
      { id: 'edge-1-hub-2', source: 'edge-1', target: 'hub-2' },
      { id: 'edge-2-hub-1', source: 'edge-2', target: 'hub-1' },
      { id: 'edge-2-hub-2', source: 'edge-2', target: 'hub-2' },
      { id: 'edge-3-hub-1', source: 'edge-3', target: 'hub-1' },
      { id: 'edge-3-hub-2', source: 'edge-3', target: 'hub-2' },
      { id: 'edge-4-hub-1', source: 'edge-4', target: 'hub-1' },
      { id: 'edge-4-hub-2', source: 'edge-4', target: 'hub-2' }
    ];
    const links = [
      ...fabricLinks,
      ...fabricLinks.map((link) => ({
        id: `${link.id}-reverse`,
        source: link.target,
        target: link.source
      }))
    ];

    const positions = computeLayoutPositions(nodes, links, { mode: 'clos', width: 900, height: 500 });

    expect(position(positions, 'edge-1').y).toBeLessThan(position(positions, 'hub-1').y);
    expect(position(positions, 'hub-2').y).toBe(position(positions, 'hub-1').y);
    expect(position(positions, 'edge-4').y).toBe(position(positions, 'edge-1').y);
  });

  it('does not treat labels.role as inferLabelRole unless authors opt in', () => {
    const accessNodes: GraphNode[] = Array.from({ length: 12 }, (_, index) => ({
      id: `ACCESS-${index + 1}`,
      labels: { role: 'access' }
    }));
    const nodes: GraphNode[] = [
      { id: 'P1', labels: { role: 'p' } },
      { id: 'PE1', labels: { role: 'pe' } },
      { id: 'PE2', labels: { role: 'pe' } },
      { id: 'AGG1', labels: { role: 'agg' } },
      ...accessNodes
    ];
    const links: GraphLink[] = [
      { id: 'p1-pe1', source: 'P1', target: 'PE1' },
      { id: 'p1-pe2', source: 'P1', target: 'PE2' },
      { id: 'pe1-agg1', source: 'PE1', target: 'AGG1' },
      ...accessNodes.map((node) => ({ id: `pe1-${node.id}`, source: 'PE1', target: node.id }))
    ];

    const positions = computeLayoutPositions(nodes, links, { mode: 'clos', width: 900, height: 640 });

    expect(position(positions, 'P1').y).toBeLessThan(position(positions, 'PE1').y);
    expect(position(positions, 'PE1').y).toBeLessThan(position(positions, 'AGG1').y);
    expect(position(positions, 'PE1').y).toBeLessThan(position(positions, 'ACCESS-1').y);
  });

  it('lets layout.inferLabelRole override fuzzy degree inference', () => {
    const nodes: GraphNode[] = [
      { id: 'P1', labels: { role: 'p' } },
      { id: 'PE1', labels: { role: 'pe' } },
      { id: 'AGG1', labels: { role: 'agg' } },
      { id: 'ACCESS1', labels: { role: 'access' } },
      { id: 'ACCESS2', labels: { role: 'access' } }
    ];
    const links: GraphLink[] = [
      { id: 'access1-p1', source: 'ACCESS1', target: 'P1' },
      { id: 'access2-p1', source: 'ACCESS2', target: 'P1' },
      { id: 'p1-pe1', source: 'P1', target: 'PE1' },
      { id: 'pe1-agg1', source: 'PE1', target: 'AGG1' },
      { id: 'agg1-access1', source: 'AGG1', target: 'ACCESS1' },
      { id: 'agg1-access2', source: 'AGG1', target: 'ACCESS2' }
    ];

    const positions = computeLayoutPositions(nodes, links, {
      mode: 'clos',
      width: 900,
      height: 640,
      inferLabelRole: [
        { 'stage-1': 'p' },
        { 'stage-2': 'pe' },
        { 'stage-3': 'agg' },
        { 'stage-4': 'access' }
      ]
    });

    expect(position(positions, 'P1').y).toBeLessThan(position(positions, 'PE1').y);
    expect(position(positions, 'PE1').y).toBeLessThan(position(positions, 'AGG1').y);
    expect(position(positions, 'AGG1').y).toBeLessThan(position(positions, 'ACCESS1').y);
    expect(position(positions, 'ACCESS1').y).toBe(position(positions, 'ACCESS2').y);
  });

  it('infers CLOS-like stages from graph structure when no metadata is present', () => {
    const nodes: GraphNode[] = [
      { id: 'leaf-1' },
      { id: 'leaf-2' },
      { id: 'spine-1' },
      { id: 'spine-2' },
      { id: 'upper-1' },
      { id: 'upper-2' }
    ];
    const links: GraphLink[] = [
      { id: 'leaf-1-spine-1', source: 'leaf-1', target: 'spine-1' },
      { id: 'leaf-1-spine-2', source: 'leaf-1', target: 'spine-2' },
      { id: 'leaf-2-spine-1', source: 'leaf-2', target: 'spine-1' },
      { id: 'leaf-2-spine-2', source: 'leaf-2', target: 'spine-2' },
      { id: 'spine-1-upper-1', source: 'spine-1', target: 'upper-1' },
      { id: 'spine-1-upper-2', source: 'spine-1', target: 'upper-2' },
      { id: 'spine-2-upper-1', source: 'spine-2', target: 'upper-1' },
      { id: 'spine-2-upper-2', source: 'spine-2', target: 'upper-2' }
    ];

    const positions = computeLayoutPositions(nodes, links, { mode: 'clos', width: 900, height: 600 });
    const rows = new Set([...positions.values()].map((value) => value.y));

    expect(rows.size).toBe(3);
    expect(position(positions, 'spine-1').y).toBe(position(positions, 'spine-2').y);
    expect(position(positions, 'spine-1').y).not.toBe(position(positions, 'leaf-1').y);
    expect(position(positions, 'spine-1').y).not.toBe(position(positions, 'upper-1').y);
  });

  it('preserves explicitly pinned node positions', () => {
    const nodes: GraphNode[] = [
      { id: 'spine', labels: { node: 'spine' }, position: [321, 123] },
      { id: 'leaf', labels: { node: 'leaf' }, position: [10, 20] }
    ];
    const links: GraphLink[] = [{ id: 'spine-leaf', source: 'spine', target: 'leaf' }];

    const positions = computeLayoutPositions(nodes, links, {
      mode: 'clos',
      clos: {
        preservePinned: true,
        pinnedNodeIds: ['spine']
      }
    });

    expect(position(positions, 'spine')).toEqual({ x: 321, y: 123 });
    expect(position(positions, 'leaf')).not.toEqual({ x: 10, y: 20 });
  });

  it('uses explicit group keys to keep same-stage peers close together', () => {
    const nodes: GraphNode[] = [
      { id: 'top', labels: { stage: 'top' } },
      { id: 'east-a', labels: { stage: 'bottom', group: 'east' } },
      { id: 'east-b', labels: { stage: 'bottom', group: 'east' } },
      { id: 'west-a', labels: { stage: 'bottom', group: 'west' } }
    ];
    const links: GraphLink[] = [
      { id: 'top-east-a', source: 'top', target: 'east-a' },
      { id: 'top-east-b', source: 'top', target: 'east-b' },
      { id: 'top-west-a', source: 'top', target: 'west-a' }
    ];

    const positions = computeLayoutPositions(nodes, links, {
      mode: 'clos',
      width: 900,
      height: 420,
      clos: {
        stageKey: 'labels.stage',
        stageOrder: ['top', 'bottom'],
        groupKey: 'labels.group',
        nodeGap: 100,
        groupGap: 260
      }
    });

    const eastDistance = Math.abs(position(positions, 'east-a').x - position(positions, 'east-b').x);
    const westDistance = Math.abs(position(positions, 'east-b').x - position(positions, 'west-a').x);
    expect(eastDistance).toBeLessThan(westDistance);
  });

  it('supports five and ten directed stages without semantic role names', () => {
    for (const stageCount of [5, 10]) {
      const nodes: GraphNode[] = Array.from({ length: stageCount }, (_, index) => ({
        id: `stage-${stageCount}-${index}`,
        name: `Stage ${index}`
      }));
      const links: GraphLink[] = Array.from({ length: stageCount - 1 }, (_, index) => ({
        id: `stage-${stageCount}-${index}-stage-${index + 1}`,
        source: `stage-${stageCount}-${index}`,
        target: `stage-${stageCount}-${index + 1}`
      }));

      const positions = computeLayoutPositions(nodes, links, {
        mode: 'clos',
        width: 1000,
        height: 1000,
        clos: {
          maxStages: 10
        }
      });
      const rows = [...new Set([...positions.values()].map((value) => value.y))].sort((a, b) => a - b);

      expect(rows).toHaveLength(stageCount);
      for (let index = 0; index < stageCount - 1; index += 1) {
        expect(position(positions, `stage-${stageCount}-${index}`).y).toBeLessThan(position(positions, `stage-${stageCount}-${index + 1}`).y);
      }
    }
  });

  it('validates clos layout options in TopoViewer documents', () => {
    const document: TopoDocument = {
      graph: {
        nodes: [{ id: 'a', labels: { stage: 'edge' } }],
        links: []
      },
      layout: {
        mode: 'clos',
        clos: {
          direction: 'leftToRight',
          stageCount: 'auto',
          maxStages: 10,
          stageKey: 'labels.stage',
          inferLabelRole: [
            { 'stage-1': 'edge' }
          ],
          groupKey: 'labels.pod',
          preservePinned: true,
          pinnedNodeIds: ['a']
        }
      }
    };

    expect(() => validateTopoDocument(document)).not.toThrow();
  });

  it('warns when CLOS inference confidence is low', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'fabric' }],
        nodes: [
          { id: 'a', name: 'A', layers: ['fabric'] },
          { id: 'b', name: 'B', layers: ['fabric'] },
          { id: 'c', name: 'C', layers: ['fabric'] }
        ]
      },
      layout: { mode: 'clos' }
    };

    expect(warningCodes(document)).toContain('clos-low-confidence-inference');
  });

  it('exposes low-confidence inference diagnostics through the public layout helper', () => {
    const nodes: GraphNode[] = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' }
    ];

    expect(analyzeClosLayoutDiagnostics(nodes, [], { mode: 'clos' }).map((issue) => issue.code)).toContain('clos-low-confidence-inference');
    expect(analyzeClosLayoutDiagnostics(nodes, [], { mode: 'manual' })).toEqual([]);
  });

  it('warns when explicit stage hints conflict', () => {
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'fabric' }],
        nodes: [
          { id: 'a', name: 'A', labels: { stage: 'core', role: 'edge-role' }, layers: ['fabric'] },
          { id: 'b', name: 'B', labels: { stage: 'access', role: 'edge-role' }, layers: ['fabric'] }
        ],
        links: [
          { id: 'a-b', name: 'A-B', source: 'a', target: 'b', layers: ['fabric'] }
        ]
      },
      layout: {
        mode: 'clos',
        inferLabelRole: [
          { 'stage-3': 'edge-role' }
        ],
        clos: {
          stageKey: 'labels.stage',
          stageOrder: ['core', 'aggregation', 'access']
        }
      }
    };

    expect(warningCodes(document)).toContain('clos-conflicting-stage-hints');
  });

  it('exposes conflicting explicit stage hints through the public layout helper', () => {
    const nodes: GraphNode[] = [
      { id: 'a', labels: { stage: 'core', role: 'edge-role' } },
      { id: 'b', labels: { stage: 'access', role: 'edge-role' } }
    ];
    const links: GraphLink[] = [{ id: 'a-b', source: 'a', target: 'b' }];

    expect(
      analyzeClosLayoutDiagnostics(nodes, links, {
        mode: 'clos',
        inferLabelRole: [{ 'stage-3': 'edge-role' }],
        clos: {
          stageKey: 'labels.stage',
          stageOrder: ['core', 'aggregation', 'access']
        }
      }).map((issue) => issue.code)
    ).toContain('clos-conflicting-stage-hints');
  });

  it('warns when automatic CLOS inference is capped by maxStages', () => {
    const nodes: GraphNode[] = Array.from({ length: 5 }, (_, index) => ({
      id: `stage-${index}`,
      name: `Stage ${index}`,
      layers: ['fabric']
    }));
    const links: GraphLink[] = Array.from({ length: 4 }, (_, index) => ({
      id: `stage-${index}-stage-${index + 1}`,
      name: `Stage ${index} to ${index + 1}`,
      source: `stage-${index}`,
      target: `stage-${index + 1}`,
      layers: ['fabric']
    }));
    const document: TopoDocument = {
      graph: {
        layers: [{ id: 'fabric' }],
        nodes,
        links
      },
      layout: {
        mode: 'clos',
        clos: { maxStages: 2 }
      }
    };

    expect(warningCodes(document)).toContain('clos-max-stages-reached');
  });

  it('exposes max-stage cap diagnostics through the public layout helper', () => {
    const nodes: GraphNode[] = Array.from({ length: 5 }, (_, index) => ({
      id: `stage-${index}`,
      name: `Stage ${index}`
    }));
    const links: GraphLink[] = Array.from({ length: 4 }, (_, index) => ({
      id: `stage-${index}-stage-${index + 1}`,
      source: `stage-${index}`,
      target: `stage-${index + 1}`
    }));

    expect(analyzeClosLayoutDiagnostics(nodes, links, { mode: 'clos', clos: { maxStages: 2 } }).map((issue) => issue.code)).toContain(
      'clos-max-stages-reached'
    );
  });
});
