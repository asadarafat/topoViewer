import { describe, expect, it } from 'vitest';
import type { TopoDocument } from 'topoviewer';
import { createStudioPaletteNodePlan } from '../../src/features/palette/paletteTemplates';
import { studioBuiltInIcons, studioVisualNodeTemplateDataUri } from '../../src/templates/starterNodeTemplates';

const document: TopoDocument = {
  graph: {
    layers: [{ id: 'physical', labels: { name: 'Physical' } }],
    links: [],
    nodes: []
  }
};

describe('Studio visual node templates', () => {
  it('offers the complete trusted Nokia icon catalog to visual authoring', () => {
    expect(Object.keys(studioBuiltInIcons).sort()).toEqual([
      'nokia.client',
      'nokia.cloud',
      'nokia.controller',
      'nokia.dcgw',
      'nokia.nsp',
      'nokia.pon',
      'nokia.rgw',
      'nokia.router',
      'nokia.server',
      'nokia.spine',
      'nokia.switch',
      'nokia.ue'
    ]);
    expect(studioBuiltInIcons['nokia.router'].svg).toContain('${fillColor}');
  });

  it('adds the trusted icon and node in one command plan when the stylesheet has no catalog', () => {
    const plan = createStudioPaletteNodePlan(document, { stylesheet: [] }, 'switch', { x: 120, y: 240 });
    expect(plan.value).toMatchObject({ id: 'switch-1' });
    expect(plan.style).toMatchObject({ icon: 'nokia.switch', shape: 'square' });
    expect(plan.additionalMutations).toEqual([
      expect.objectContaining({
        document: 'stylesheet',
        kind: 'upsert-value',
        path: ['icons', 'nokia.switch'],
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
    expect(plan.style?.icon).toBe('nokia.router');
    expect(plan.additionalMutations).toEqual([
      expect.objectContaining({
        path: ['icons', 'nokia.router']
      })
    ]);
  });

  it('preserves an existing namespaced visual template declaration', () => {
    const plan = createStudioPaletteNodePlan(
      document,
      {
        icons: { 'nokia.router': { glyph: 'CUSTOM' } },
        stylesheet: []
      },
      'router',
      { x: 40, y: 80 }
    );
    expect(plan.style?.icon).toBe('nokia.router');
    expect(plan.additionalMutations).toEqual([]);
  });

  it('keeps the Basic node independent from the visual template catalog', () => {
    const plan = createStudioPaletteNodePlan(document, undefined, 'node', { x: 20, y: 30 });
    expect(plan.style).toBeUndefined();
    expect(plan.additionalMutations).toEqual([]);
  });

  it('uses the Nokia server asset for the service card template', () => {
    const plan = createStudioPaletteNodePlan(document, { stylesheet: [] }, 'service', { x: 20, y: 30 });
    expect(plan.style).toMatchObject({ icon: 'nokia.server', shape: 'roundRectangle' });
    expect(plan.additionalMutations).toEqual([
      expect.objectContaining({
        path: ['icons', 'nokia.server']
      })
    ]);
  });

  it('recolors Nokia palette previews without changing the portable icon definition', () => {
    const source = studioVisualNodeTemplateDataUri('router', { fill: '#123456', stroke: '#fedcba' });
    expect(source).toBeDefined();
    const svg = decodeURIComponent(String(source).replace('data:image/svg+xml,', ''));
    expect(svg).toContain('fill="#123456"');
    expect(svg).toContain('stroke="#fedcba"');
  });
});
