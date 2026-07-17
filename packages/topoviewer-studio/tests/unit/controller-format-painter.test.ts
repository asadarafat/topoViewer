import { describe, expect, it } from 'vitest';
import type { TopoDocument } from 'topoviewer';
import { canUseStudioFormatPainter, planStudioFormatPainter } from '../../src/app/controllerFormatPainter';

const document: TopoDocument = {
  graph: {
    id: 'format-painter',
    layers: [{ id: 'physical', name: 'Physical' }],
    links: [
      { id: 'link-a', layers: ['physical'], name: 'Source link', source: 'node-a', target: 'node-b' },
      {
        id: 'link-b',
        layers: ['physical'],
        name: 'Target link',
        source: 'node-a',
        style: { lineColor: '#000000' },
        target: 'node-b'
      }
    ],
    nodes: [
      { id: 'node-a', labels: { role: 'core' }, layers: ['physical'], name: 'Source node', position: [80, 80] },
      { id: 'node-b', labels: { role: 'access' }, layers: ['physical'], name: 'Target node', position: [320, 80] }
    ]
  },
  stylesheet: [
    { selector: 'node[labels.role = "core"]', style: { backgroundColor: '#123456', borderWidth: 4 } },
    { selector: 'link[id = "link-a"]', style: { controlPointDistance: 100, controlPointWeight: 0.35, curveStyle: 'bezier', lineColor: '#ef4444' } }
  ]
};

describe('Studio Format Painter', () => {
  it('copies effective node appearance without copying topology identity or metadata', () => {
    const format = planStudioFormatPainter(
      document,
      { stylesheet: document.stylesheet },
      { id: 'node-a', kind: 'node' },
      { id: 'node-b', kind: 'node' }
    );

    expect(format.plan).toEqual({ insertions: [], removals: [], updates: [] });
    expect(format.additionalMutations).toEqual([
      expect.objectContaining({
        document: 'stylesheet',
        path: ['stylesheet'],
        value: {
          selector: 'node[id = "node-b"]',
          style: expect.objectContaining({ backgroundColor: '#123456', borderWidth: 4 })
        }
      })
    ]);
    expect(document.graph?.nodes?.[1]).toMatchObject({ labels: { role: 'access' }, name: 'Target node' });
  });

  it('moves target inline appearance out of topology and copies Bezier formatting', () => {
    const format = planStudioFormatPainter(
      document,
      { stylesheet: document.stylesheet },
      { id: 'link-a', kind: 'link' },
      { id: 'link-b', kind: 'link' }
    );

    expect(format.additionalMutations[0]).toEqual({
      document: 'topology',
      kind: 'remove-value',
      path: ['graph', 'links', 1, 'style'],
      scopePath: ['graph', 'links', 1]
    });
    expect(format.additionalMutations[1]).toEqual(
      expect.objectContaining({
        document: 'stylesheet',
        value: {
          selector: 'link[id = "link-b"]',
          style: expect.objectContaining({ controlPointDistance: 100, controlPointWeight: 0.35, curveStyle: 'bezier', lineColor: '#ef4444' })
        }
      })
    );
  });

  it('requires one compatible source and target', () => {
    expect(canUseStudioFormatPainter([{ id: 'link-a', kind: 'link' }])).toBe(true);
    expect(canUseStudioFormatPainter([])).toBe(false);
    expect(() => planStudioFormatPainter(document, { stylesheet: document.stylesheet }, { id: 'node-a', kind: 'node' }, { id: 'link-a', kind: 'link' })).toThrow(
      'cannot apply node appearance to link'
    );
  });
});
