import { describe, expect, it } from 'vitest';
import type { TopoDocument } from 'topoviewer';
import { createStudioPaletteNodePlan } from '../../src/app/controllerTemplates';

const document: TopoDocument = {
  graph: {
    layers: [{ id: 'physical', labels: { name: 'Physical' } }],
    links: [],
    nodes: []
  }
};

describe('Studio visual node templates', () => {
  it('adds the trusted icon and node in one command plan when the stylesheet has no catalog', () => {
    const plan = createStudioPaletteNodePlan(document, { stylesheet: [] }, 'switch', { x: 120, y: 240 });
    expect(plan.value).toMatchObject({ id: 'switch-1' });
    expect(plan.style).toMatchObject({ icon: 'topoviewer.switch', shape: 'square' });
    expect(plan.additionalMutations).toEqual([
      expect.objectContaining({
        document: 'stylesheet',
        kind: 'upsert-value',
        path: ['icons', 'topoviewer.switch'],
        scopePath: []
      })
    ]);
  });

  it('keeps legacy project icon aliases from downgrading the visual preset', () => {
    const plan = createStudioPaletteNodePlan(
      document,
      {
        icons: { 'router.generic': { glyph: 'CUSTOM' } },
        stylesheet: []
      },
      'router',
      { x: 40, y: 80 }
    );
    expect(plan.style?.icon).toBe('topoviewer.router');
    expect(plan.additionalMutations).toEqual([
      expect.objectContaining({
        path: ['icons', 'topoviewer.router']
      })
    ]);
  });

  it('preserves an existing namespaced visual template declaration', () => {
    const plan = createStudioPaletteNodePlan(
      document,
      {
        icons: { 'topoviewer.router': { glyph: 'CUSTOM' } },
        stylesheet: []
      },
      'router',
      { x: 40, y: 80 }
    );
    expect(plan.style?.icon).toBe('topoviewer.router');
    expect(plan.additionalMutations).toEqual([]);
  });

  it('keeps the Basic node independent from the visual template catalog', () => {
    const plan = createStudioPaletteNodePlan(document, undefined, 'node', { x: 20, y: 30 });
    expect(plan.style).toBeUndefined();
    expect(plan.additionalMutations).toEqual([]);
  });
});
