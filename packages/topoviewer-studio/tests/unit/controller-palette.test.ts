import { describe, expect, it } from 'vitest';
import type { TopoDocument } from 'topoviewer';
import { planStudioPaletteCreation } from '../../src/app/controllerPalette';

const document: TopoDocument = {
  graph: {
    id: 'palette-test',
    layers: [{ id: 'physical', name: 'Physical' }],
    links: [],
    nodes: [
      { id: 'node-a', layers: ['physical'], name: 'Node A', position: [80, 120] },
      { id: 'node-b', layers: ['physical'], name: 'Node B', position: [320, 120] }
    ]
  }
};

function plan(templateId: Parameters<typeof planStudioPaletteCreation>[0]['templateId']) {
  return planStudioPaletteCreation({
    document,
    pathMode: 'loose',
    presets: [],
    selection: [
      { id: 'node-b', kind: 'node' },
      { id: 'node-a', kind: 'node' }
    ],
    templateId
  });
}

describe('Studio palette creation', () => {
  it('normalizes link endpoints while preserving physical-layer ownership', () => {
    const creation = plan('link');
    expect(creation.label).toBe('Create link');
    expect(creation.plan.insertions[0]?.value).toMatchObject({
      layers: ['physical'],
      source: 'node-a',
      target: 'node-b'
    });
  });

  it('creates three sibling links and enables canonical click-to-expand grouping', () => {
    const creation = plan('parallel-link');
    expect(creation.label).toBe('Create parallel link group');
    expect(creation.plan.insertions).toHaveLength(3);
    expect(creation.plan.insertions.map((insertion) => insertion.value)).toEqual([
      expect.objectContaining({ labels: { layer: 'physical', link: 'parallel' }, name: 'Link A', source: 'node-a', style: expect.objectContaining({ lineColor: '#0f766e' }), target: 'node-b' }),
      expect.objectContaining({ labels: { layer: 'physical', link: 'parallel' }, name: 'Link B', source: 'node-a', style: expect.objectContaining({ lineColor: '#2563eb' }), target: 'node-b' }),
      expect.objectContaining({ labels: { layer: 'physical', link: 'parallel' }, name: 'Link C', source: 'node-a', style: expect.objectContaining({ lineColor: '#dc2626' }), target: 'node-b' })
    ]);
    expect(creation.plan.insertions.every((insertion) => !Object.hasOwn(insertion.value, 'parent'))).toBe(true);
    expect(creation.additionalMutations).toEqual([expect.objectContaining({
      document: 'topology',
      kind: 'upsert-value',
      path: ['attention', 'links', 'grouping'],
      value: {
        by: ['endpoints', 'layer'],
        enabled: true,
        expandOnClick: true,
        threshold: 2
      }
    })]);
  });

  it('creates a parent carrier pipe and child lane as a separate edge template', () => {
    const creation = plan('parent-link-pipe');
    const [carrier, child] = creation.plan.insertions.map((insertion) => insertion.value);
    expect(creation.label).toBe('Create parent link pipe');
    expect(creation.plan.insertions).toHaveLength(2);
    expect(carrier).toMatchObject({
      labels: { layer: 'physical', link: 'carrier' },
      name: 'Parent Link Pipe',
      style: { pipe: true, pipeWidth: 24 },
      source: 'node-a',
      target: 'node-b'
    });
    expect(child).toMatchObject({
      labels: { layer: 'physical', link: 'child' },
      name: 'Child Link Lane',
      parent: carrier?.id,
      source: 'node-a',
      target: 'node-b'
    });
    expect(creation.additionalMutations).toBeUndefined();
  });

  it('creates bidirectional traffic as two direction objects on one physical link', () => {
    const creation = plan('directional-link');
    expect(creation.label).toBe('Create directional traffic link');
    expect(creation.plan.insertions[0]?.value).toMatchObject({
      directions: {
        sourceToTarget: { label: 'A to B' },
        targetToSource: { label: 'B to A' }
      },
      layers: ['physical'],
      source: 'node-a',
      style: { directionalStrokes: true },
      target: 'node-b'
    });
  });

  it('rejects selection-based link creation unless exactly two nodes are selected', () => {
    expect(() => planStudioPaletteCreation({
      document,
      pathMode: 'loose',
      presets: [],
      selection: [{ id: 'node-a', kind: 'node' }],
      templateId: 'link'
    })).toThrow('exactly two selected nodes');
  });

  it('creates parent and child nodes atomically with explicit containment', () => {
    const creation = planStudioPaletteCreation({
      document,
      pathMode: 'loose',
      position: { x: 500, y: 300 },
      presets: [],
      selection: [],
      templateId: 'parent-child'
    });
    const [parent, child] = creation.plan.insertions.map((insertion) => insertion.value);
    expect(creation.plan.insertions).toHaveLength(2);
    expect(parent).toMatchObject({ id: 'node-1', name: 'Parent Node' });
    expect(child).toMatchObject({ id: 'node-2', name: 'Child Node', parent: 'node-1' });
  });
});
