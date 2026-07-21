import { describe, expect, it } from 'vitest';
import type { TopoDocument } from 'topoviewer';
import { planStudioSelectionDuplication } from '../../src/features/canvas/duplication';

const document: TopoDocument = {
  graph: {
    id: 'duplicate-style-test',
    layers: [{ id: 'physical', labels: { name: 'Physical' } }],
    nodes: [{
      id: 'router-a',
      labels: { name: 'Router A', role: 'router' },
      layers: ['physical'],
      position: [160, 120]
    }]
  },
  icons: {
    'router.special': { fill: '#1565c0', glyph: 'R', stroke: '#90caf9' }
  },
  stylesheet: [
    {
      selector: 'node[labels.role = "router"]',
      style: { backgroundColor: '#123456', borderWidth: 2, width: 96 }
    },
    {
      selector: 'node[id = "router-a"]',
      style: { borderColor: '#ffdddd', borderWidth: 4, icon: 'router.special' }
    }
  ]
};

describe('Studio object duplication', () => {
  it('copies only appearance that the fresh ID would otherwise lose', () => {
    const duplication = planStudioSelectionDuplication(document, { icons: document.icons, stylesheet: document.stylesheet }, [{ id: 'router-a', kind: 'node' }]);

    expect(duplication.plan.insertions[0]?.value).toMatchObject({
      id: 'router-a-1',
      labels: { name: 'Router A', role: 'router' },
      position: [192, 152]
    });
    expect(duplication.plan.insertions[0]?.value).not.toHaveProperty('style');
    expect(duplication.additionalMutations).toEqual([
      {
        document: 'stylesheet',
        kind: 'insert-value',
        path: ['stylesheet'],
        value: {
          selector: 'node[id = "router-a-1"]',
          style: {
            borderColor: '#ffdddd',
            borderWidth: 4,
            icon: 'router.special'
          }
        }
      }
    ]);
  });

  it('preserves an optional display alias without creating topology appearance', () => {
    const duplication = planStudioSelectionDuplication(document, { stylesheet: document.stylesheet }, [{ id: 'router-a', kind: 'node' }]);

    expect(duplication.plan.insertions[0]?.value).toMatchObject({ labels: { name: 'Router A' } });
    expect(duplication.plan.insertions[0]?.value).not.toHaveProperty('name');
    expect(duplication.plan.insertions[0]?.value).not.toHaveProperty('style');
    expect(duplication.plan.insertions[0]?.value).not.toHaveProperty('icon');
  });
});
