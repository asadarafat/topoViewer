import { describe, expect, it } from 'vitest';
import type { StylesheetDocument, TopoDocument } from '../../src';
import { planAuthoringBundleDeletion, planAuthoringStylesheetDeletionCleanup } from '../../src/authoring';

const topology: TopoDocument = {
  graph: {
    links: [
      {
        directions: {
          sourceToTarget: { id: 'eastbound' },
          targetToSource: {}
        },
        id: 'A-B',
        source: 'A',
        target: 'B'
      }
    ],
    nodes: [
      { id: 'A', labels: { role: 'router' } },
      { id: 'B', labels: { role: 'router' } }
    ]
  },
  stylesheet: [
    { selector: 'node[id = "A"]', style: { width: 80 } },
    { selector: 'node[labels.role = "router"]', style: { height: 60 } }
  ]
};

const stylesheet: StylesheetDocument = {
  stylesheet: [
    { selector: 'node', style: { width: 64 } },
    { selector: 'node[id = "A"]', style: { backgroundColor: '#123456' } },
    { selector: 'node[id = "A"][labels.role = "router"]', style: { borderWidth: 4 } },
    { selector: 'node[labels.role = "router"]', style: { borderWidth: 2 } },
    { selector: 'link[id = "A-B"]', style: { lineWidth: 4 } },
    { selector: 'linkDirection[id = "eastbound"]', style: { lineWidth: 5 } },
    { selector: 'linkDirection[id = "A-B:targetToSource"]', style: { lineWidth: 6 } },
    { selector: 'node[id = "B"]', style: { backgroundColor: '#654321' } }
  ]
};

describe('authoring bundle deletion cleanup', () => {
  it('removes exact object-owned rules for deleted objects and their dependents', () => {
    const plan = planAuthoringBundleDeletion({ stylesheet, topology }, [{ id: 'A', kind: 'node' }]);

    expect(plan.deletedSelections).toEqual(expect.arrayContaining([
      { id: 'A', kind: 'node' },
      { id: 'A-B', kind: 'link' },
      { id: 'eastbound', kind: 'linkDirection' },
      { id: 'A-B:targetToSource', kind: 'linkDirection' }
    ]));
    expect(plan.stylesheet.removals.map((removal) => removal.path)).toEqual([
      ['stylesheet', 6],
      ['stylesheet', 5],
      ['stylesheet', 4],
      ['stylesheet', 2],
      ['stylesheet', 1]
    ]);
    expect(plan.topology.removals.map((removal) => removal.path)).toEqual(expect.arrayContaining([
      ['graph', 'links', 0],
      ['graph', 'nodes', 0],
      ['stylesheet', 0]
    ]));
  });

  it('preserves reusable rules and rules owned by surviving objects', () => {
    const cleanup = planAuthoringStylesheetDeletionCleanup(stylesheet, [{ id: 'A', kind: 'node' }]);
    const removedIndices = new Set(cleanup.removals.map((removal) => Number(removal.path.at(-1))));
    const retained = stylesheet.stylesheet?.filter((_, index) => !removedIndices.has(index)).map((rule) => rule.selector);

    expect(retained).toEqual([
      'node',
      'node[labels.role = "router"]',
      'link[id = "A-B"]',
      'linkDirection[id = "eastbound"]',
      'linkDirection[id = "A-B:targetToSource"]',
      'node[id = "B"]'
    ]);
  });
});
