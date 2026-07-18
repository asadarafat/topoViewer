import { describe, expect, it } from 'vitest';
import type { StylesheetDocument, TopoDocument } from 'topoviewer';
import { planStudioSelectionDeletion } from '../../src/app/controllerDeletion';

describe('Studio selection deletion planning', () => {
  it('maps core object-owned style cleanup to stylesheet mutations', () => {
    const topology: TopoDocument = {
      graph: {
        links: [{ id: 'A-B', source: 'A', target: 'B' }],
        nodes: [{ id: 'A' }, { id: 'B' }]
      }
    };
    const stylesheet: StylesheetDocument = {
      stylesheet: [
        { selector: 'node[id = "A"]', style: { width: 96 } },
        { selector: 'node[labels.role = "router"]', style: { width: 80 } },
        { selector: 'link[id = "A-B"]', style: { lineWidth: 4 } }
      ]
    };

    const deletion = planStudioSelectionDeletion(topology, stylesheet, [{ id: 'A', kind: 'node' }]);

    expect(deletion.additionalMutations).toEqual([
      {
        document: 'stylesheet',
        kind: 'remove-value',
        path: ['stylesheet', 2],
        scopePath: ['stylesheet']
      },
      {
        document: 'stylesheet',
        kind: 'remove-value',
        path: ['stylesheet', 0],
        scopePath: ['stylesheet']
      }
    ]);
    expect(deletion.plan.removals.map((removal) => removal.selection)).toEqual(expect.arrayContaining([
      { id: 'A', kind: 'node' },
      { id: 'A-B', kind: 'link' }
    ]));
  });
});
