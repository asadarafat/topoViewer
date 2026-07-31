import { describe, expect, it } from 'vitest';
import {
  BUILT_IN_LAYOUT_PROVIDERS,
  computeLayoutPositions,
  validateTopoDocument,
  type GraphLink,
  type GraphNode,
  type LayoutPosition,
  type LayoutProvider,
  type LayoutProviderInput,
  type TopoDocument
} from '../../src';

function point(positions: Map<string, { x: number; y: number }>, id: string) {
  const value = positions.get(id);
  expect(value, `${id} should have a position`).toBeDefined();
  return value as { x: number; y: number };
}

const treeNodes: GraphNode[] = [
  { id: 'root' },
  { id: 'child-b' },
  { id: 'child-a' },
  { id: 'grandchild' }
];
const treeLinks: GraphLink[] = [
  { id: 'root-b', source: 'root', target: 'child-b' },
  { id: 'root-a', source: 'root', target: 'child-a' },
  { id: 'a-grandchild', source: 'child-a', target: 'grandchild' }
];

describe('layout provider contract', () => {
  it('publishes immutable built-in providers and dispatches trusted extensions', () => {
    expect([...BUILT_IN_LAYOUT_PROVIDERS.keys()]).toEqual(['manual', 'force', 'clos', 'tree']);
    expect(Object.isFrozen(BUILT_IN_LAYOUT_PROVIDERS)).toBe(true);

    const custom: LayoutProvider = Object.freeze({
      mode: 'custom-test',
      compute: ({ nodes }: LayoutProviderInput) => new Map<string, LayoutPosition>(
        nodes.map((node, index) => [node.id, { x: index * 10, y: 7 }])
      )
    });
    const result = computeLayoutPositions(
      [{ id: 'a' }, { id: 'b' }],
      [],
      { mode: 'custom-test' } as never,
      new Map([['custom-test', custom]])
    );

    expect([...result.entries()]).toEqual([
      ['a', { x: 0, y: 7 }],
      ['b', { x: 10, y: 7 }]
    ]);
  });

  it('rejects unknown providers instead of silently using force layout', () => {
    expect(() => computeLayoutPositions([{ id: 'a' }], [], { mode: 'missing' } as never))
      .toThrow('Unknown layout provider "missing"');
  });

  it('lays out directed trees deterministically regardless of input order', () => {
    const layout = {
      mode: 'tree' as const,
      width: 900,
      height: 600,
      tree: { direction: 'topToBottom' as const, levelGap: 140, nodeGap: 120, componentGap: 220 }
    };
    const first = computeLayoutPositions(treeNodes, treeLinks, layout);
    const second = computeLayoutPositions([...treeNodes].reverse(), [...treeLinks].reverse(), layout);

    expect([...second.entries()].sort()).toEqual([...first.entries()].sort());
    expect(point(first, 'root').y).toBeLessThan(point(first, 'child-a').y);
    expect(point(first, 'child-a').y).toBeLessThan(point(first, 'grandchild').y);
    expect(point(first, 'child-a').x).toBeLessThan(point(first, 'child-b').x);
  });

  it('transforms the canonical tree into every supported direction', () => {
    const top = computeLayoutPositions(treeNodes, treeLinks, { mode: 'tree', width: 900, height: 600, tree: { direction: 'topToBottom' } });
    const bottom = computeLayoutPositions(treeNodes, treeLinks, { mode: 'tree', width: 900, height: 600, tree: { direction: 'bottomToTop' } });
    const left = computeLayoutPositions(treeNodes, treeLinks, { mode: 'tree', width: 900, height: 600, tree: { direction: 'leftToRight' } });
    const right = computeLayoutPositions(treeNodes, treeLinks, { mode: 'tree', width: 900, height: 600, tree: { direction: 'rightToLeft' } });

    expect(point(bottom, 'root').y).toBeGreaterThan(point(bottom, 'child-a').y);
    expect(point(left, 'root').x).toBeLessThan(point(left, 'child-a').x);
    expect(point(right, 'root').x).toBeGreaterThan(point(right, 'child-a').x);
    expect(point(top, 'root').y).toBeLessThan(point(top, 'child-a').y);
  });

  it('packs disconnected graphs and terminates deterministic cycles', () => {
    const nodes: GraphNode[] = [{ id: 'cycle-b' }, { id: 'isolated' }, { id: 'cycle-a' }, { id: 'rooted' }];
    const links: GraphLink[] = [
      { id: 'cycle-a-b', source: 'cycle-a', target: 'cycle-b' },
      { id: 'cycle-b-a', source: 'cycle-b', target: 'cycle-a' },
      { id: 'rooted-isolated', source: 'rooted', target: 'isolated' }
    ];
    const first = computeLayoutPositions(nodes, links, { mode: 'tree' });
    const second = computeLayoutPositions([...nodes].reverse(), [...links].reverse(), { mode: 'tree' });

    expect(first.size).toBe(nodes.length);
    expect([...second.entries()].sort()).toEqual([...first.entries()].sort());
    expect([...first.values()].every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
    expect(new Set([...first.values()].map(({ x, y }) => `${x}:${y}`)).size).toBe(nodes.length);
  });

  it('validates the public tree layout contract and bounded options', () => {
    const document: TopoDocument = {
      graph: { nodes: [{ id: 'root' }, { id: 'child' }], links: [{ id: 'root-child', source: 'root', target: 'child' }] },
      layout: {
        mode: 'tree',
        tree: { direction: 'leftToRight', levelGap: 180, nodeGap: 120, componentGap: 260 }
      }
    };

    expect(() => validateTopoDocument(document)).not.toThrow();
    expect(() => validateTopoDocument({ ...document, layout: { mode: 'tree', tree: { levelGap: 20 } } }))
      .toThrow();
    expect(() => validateTopoDocument({ ...document, layout: { mode: 'missing' as never } }))
      .toThrow();
  });
});
