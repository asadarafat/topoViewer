import { describe, expect, it } from 'vitest';
import type { TopoDocument } from 'topoviewer';
import { planStudioEdgeCreation, planStudioPaletteCreation } from '../../src/features/palette/paletteAuthoring';
import { canSaveSelectionAsPreset, createStudioUserPreset, loadStudioUserPresets, renamedStudioUserPreset, studioUserPresetCollection } from '../../src/features/palette/userPresets';

const document: TopoDocument = {
  graph: {
    id: 'preset-test',
    layers: [{ id: 'physical', labels: { name: 'Physical' } }],
    links: [
      {
        id: 'link-a',
        labels: { name: 'Core link', protocol: 'isis' },
        layers: ['physical'],
        source: 'parent',
        target: 'router-a'
      }
    ],
    nodes: [
      { id: 'parent', labels: { name: 'Parent' }, layers: ['physical'], position: [40, 40] },
      {
        id: 'router-a',
        labels: { name: 'Router A', role: 'router' },
        layers: ['physical'],
        parent: 'parent',
        position: [180, 140]
      }
    ],
    regions: [{ id: 'region-a', labels: { name: 'Region A' }, layers: ['physical'], members: ['router-a'], position: [20, 20] }]
  },
  diagram: {
    callouts: [{ id: 'callout-a', layers: ['physical'], position: [320, 140], source: 'callout-a', target: 'router-a', title: 'Inspect' }]
  },
  icons: {
    router: { fill: '#1565c0', glyph: 'R', stroke: '#90caf9' }
  },
  stylesheet: [
    {
      selector: 'node[labels.role = "router"]',
      style: { backgroundColor: '#123456', borderWidth: 4, icon: 'router' }
    },
    {
      selector: 'link[id = "link-a"]',
      style: { controlPointDistance: 100, controlPointWeight: 0.4, curveStyle: 'bezier', lineColor: '#ef4444', lineWidth: 5 }
    }
  ]
};

describe('Studio Object Palette presets', () => {
  it('materializes appearance while removing instance identity, placement, and parent membership', () => {
    const preset = createStudioUserPreset(document, [{ id: 'router-a', kind: 'node' }], []);

    expect(preset).toMatchObject({ id: 'preset-1', name: 'Router A preset' });
    expect(preset?.item.selection).toEqual({ id: 'router-a', kind: 'node' });
    expect(preset?.item.value).toMatchObject({
      labels: { name: 'Router A', role: 'router' },
      layers: ['physical'],
      position: [0, 0],
      style: {
        backgroundColor: '#123456',
        borderWidth: 4,
        icon: 'studio-preset-1-icon'
      }
    });
    expect(preset?.item.value).not.toHaveProperty('id');
    expect(preset?.item.value).not.toHaveProperty('parent');
    expect(preset?.icons).toEqual({
      'studio-preset-1-icon': { fill: '#1565c0', glyph: 'R', stroke: '#90caf9' }
    });
  });

  it('removes relationships that would become dangling in region and callout presets', () => {
    const region = createStudioUserPreset(document, [{ id: 'region-a', kind: 'region' }], []);
    const callout = createStudioUserPreset(document, [{ id: 'callout-a', kind: 'callout' }], []);

    expect(region?.item.value).toMatchObject({ members: [], position: [0, 0] });
    expect(callout?.item.value).not.toHaveProperty('source');
    expect(callout?.item.value).not.toHaveProperty('target');
    expect(callout?.item.value).toMatchObject({ position: [0, 0], title: 'Inspect' });
  });

  it('only accepts one reusable object and round-trips a versioned bounded collection', () => {
    expect(canSaveSelectionAsPreset([{ id: 'router-a', kind: 'node' }])).toBe(true);
    expect(canSaveSelectionAsPreset([{ id: 'link-a', kind: 'link' }])).toBe(true);
    expect(
      canSaveSelectionAsPreset([
        { id: 'router-a', kind: 'node' },
        { id: 'parent', kind: 'node' }
      ])
    ).toBe(false);

    const preset = createStudioUserPreset(document, [{ id: 'router-a', kind: 'node' }], []);
    const collection = studioUserPresetCollection(preset ? [preset] : []);
    expect(loadStudioUserPresets(collection)).toEqual({ presets: [preset], warnings: [] });
  });

  it('saves a link as an endpoint-free edge template and recreates it on new endpoints', () => {
    const preset = createStudioUserPreset(document, [{ id: 'link-a', kind: 'link' }], []);
    expect(preset).toMatchObject({ id: 'preset-1', name: 'Core link preset' });
    expect(preset?.item.value).toMatchObject({
      labels: { name: 'Core link', protocol: 'isis' },
      layers: ['physical'],
      style: {
        controlPointDistance: 100,
        controlPointWeight: 0.4,
        curveStyle: 'bezier',
        lineColor: '#ef4444',
        lineWidth: 5
      }
    });
    expect(preset?.item.value).not.toHaveProperty('id');
    expect(preset?.item.value).not.toHaveProperty('position');
    expect(preset?.item.value).not.toHaveProperty('source');
    expect(preset?.item.value).not.toHaveProperty('target');
    if (!preset) throw new Error('Expected a link preset.');

    const creation = planStudioEdgeCreation({
      document,
      presets: [preset],
      source: 'router-a',
      sourceHandle: 'right',
      stylesheet: { stylesheet: document.stylesheet },
      target: 'parent',
      targetHandle: 'left',
      templateId: 'preset:preset-1'
    });
    expect(creation.plan.insertions[0]?.value).toMatchObject({
      labels: { name: 'Core link', protocol: 'isis' },
      source: 'parent',
      target: 'router-a'
    });
    expect(creation.plan.insertions[0]?.value).not.toHaveProperty('style');
    expect(creation.additionalMutations).toContainEqual(
      expect.objectContaining({
        document: 'stylesheet',
        value: expect.objectContaining({
          style: expect.objectContaining({ controlPointDistance: 100, curveStyle: 'bezier', lineColor: '#ef4444' })
        })
      })
    );
  });

  it('creates a fresh object at the requested position without adding Copy to its name', () => {
    const preset = createStudioUserPreset(document, [{ id: 'router-a', kind: 'node' }], []);
    if (!preset) throw new Error('Expected a node preset.');
    const creation = planStudioPaletteCreation({
      document,
      pathMode: 'shortest',
      position: { x: 640, y: 360 },
      presets: [preset],
      selection: [],
      stylesheet: { icons: document.icons, stylesheet: [] },
      templateId: 'preset:preset-1'
    });

    expect(creation.plan.insertions[0]?.value).toMatchObject({
      id: 'router-a-1',
      labels: { name: 'Router A', role: 'router' },
      position: [640, 360]
    });
    expect(creation.plan.insertions[0]?.value).not.toHaveProperty('style');
    expect(creation.additionalMutations).toContainEqual(
      expect.objectContaining({
        document: 'stylesheet',
        path: ['icons', 'studio-preset-1-icon']
      })
    );
    expect(creation.additionalMutations).toContainEqual(
      expect.objectContaining({
        document: 'stylesheet',
        path: ['stylesheet'],
        value: {
          selector: 'node[id = "router-a-1"]',
          style: {
            backgroundColor: '#123456',
            borderWidth: 4,
            icon: 'studio-preset-1-icon'
          }
        }
      })
    );
  });

  it('renames saved items without allowing empty or duplicate names', () => {
    const first = createStudioUserPreset(document, [{ id: 'router-a', kind: 'node' }], []);
    const second = createStudioUserPreset(document, [{ id: 'parent', kind: 'node' }], first ? [first] : []);
    const presets = [first, second].filter((preset): preset is NonNullable<typeof preset> => Boolean(preset));

    expect(renamedStudioUserPreset(presets, 'preset-1', '  Core Router  ')[0].name).toBe('Core Router');
    expect(() => renamedStudioUserPreset(presets, 'preset-1', '  ')).toThrow('cannot be empty');
    expect(() => renamedStudioUserPreset(presets, 'preset-1', presets[1].name)).toThrow('already exists');
  });
});
