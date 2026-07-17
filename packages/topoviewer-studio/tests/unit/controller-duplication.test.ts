import { describe, expect, it } from 'vitest';
import type { TopoDocument } from 'topoviewer';
import { planStudioSelectionDuplication } from '../../src/app/controllerDuplication';

const document: TopoDocument = {
  graph: {
    id: 'duplicate-style-test',
    layers: [{ id: 'physical', name: 'Physical' }],
    nodes: [{
      id: 'router-a',
      labels: { role: 'router' },
      layers: ['physical'],
      name: 'Router A',
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
      labels: { role: 'router' },
      name: 'Router A Copy',
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

  it('keeps copied inline appearance in the stylesheet rather than topology YAML', () => {
    const inlineDocument = structuredClone(document);
    const node = inlineDocument.graph?.nodes?.[0];
    if (!node) throw new Error('Expected duplicate fixture node.');
    node.style = { backgroundColor: '#7b1fa2', height: 72 };

    const duplication = planStudioSelectionDuplication(inlineDocument, { stylesheet: inlineDocument.stylesheet }, [{ id: 'router-a', kind: 'node' }]);

    expect(duplication.plan.insertions[0]?.value).not.toHaveProperty('style');
    expect(duplication.additionalMutations[0]).toMatchObject({
      document: 'stylesheet',
      value: {
        selector: 'node[id = "router-a-1"]',
        style: {
          backgroundColor: '#7b1fa2',
          borderColor: '#ffdddd',
          borderWidth: 4,
          height: 72,
          icon: 'router.special'
        }
      }
    });
  });
});
