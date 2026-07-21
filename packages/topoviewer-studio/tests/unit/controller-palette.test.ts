import { describe, expect, it } from 'vitest';
import type { StudioProject } from '../../src';
import type { TopoDocument } from 'topoviewer';
import { createStudioCommandDispatcher } from '../../src/commands';
import { createStudioDocumentSession } from '../../src/session';
import { planStudioEdgeCreation, planStudioPaletteCreation } from '../../src/app/controllerPalette';
import { mutationsForAuthoringEditPlan } from '../../src/app/controllerUtils';

const document: TopoDocument = {
  graph: {
    id: 'palette-test',
    layers: [{ id: 'physical', labels: { name: 'Physical' } }],
    links: [],
    nodes: [
      { id: 'node-a', labels: { name: 'Node A' }, layers: ['physical'], position: [80, 120] },
      { id: 'node-b', labels: { name: 'Node B' }, layers: ['physical'], position: [320, 120] }
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
    stylesheet: { stylesheet: [] },
    templateId
  });
}

function stylesheetRules(creation: ReturnType<typeof planStudioPaletteCreation>) {
  return (creation.additionalMutations || []).flatMap((mutation) => {
    if (mutation.document !== 'stylesheet' || (mutation.kind !== 'insert-value' && mutation.kind !== 'upsert-value') || mutation.path.join('.') !== 'stylesheet') return [];
    return Array.isArray(mutation.value) ? mutation.value : [mutation.value];
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
    expect(creation.plan.insertions[0]?.value).not.toHaveProperty('style');
  });

  it('preserves declared physical-port handles when a caller explicitly supplies them', () => {
    const creation = planStudioEdgeCreation({
      document,
      source: 'node-a',
      sourceHandle: 'ethernet-1/1',
      target: 'node-b',
      targetHandle: 'ethernet-1/49',
      templateId: 'link'
    });
    expect(creation.plan.insertions[0]?.value).toMatchObject({
      sourceHandle: 'ethernet-1/1',
      targetHandle: 'ethernet-1/49'
    });
  });

  it('scopes legacy Studio parallel grouping before adding an ordinary link', () => {
    const legacyDocument: TopoDocument = {
      ...structuredClone(document),
      attention: {
        links: {
          grouping: {
            by: ['endpoints', 'layer'],
            enabled: true,
            expandOnClick: true,
            threshold: 2
          }
        }
      }
    };
    legacyDocument.graph!.links = [1, 2, 3].map((index) => ({
      id: `parallel-${index}`,
      labels: { link: 'parallel' },
      layers: ['physical'],
      source: 'node-a',
      target: 'node-b'
    }));

    const creation = planStudioEdgeCreation({
      document: legacyDocument,
      source: 'node-a',
      target: 'node-b',
      templateId: 'link'
    });

    expect(creation.additionalMutations).toEqual([
      expect.objectContaining({
        kind: 'upsert-value',
        path: ['attention', 'links', 'grouping'],
        value: expect.objectContaining({ selector: 'link[labels.link = "parallel"]' })
      })
    ]);
  });

  it('keeps deliberate global grouping without the Studio parallel-link signature', () => {
    const globalGroupingDocument: TopoDocument = {
      ...structuredClone(document),
      attention: {
        links: {
          grouping: {
            by: ['endpoints', 'layer'],
            enabled: true,
            expandOnClick: true,
            threshold: 2
          }
        }
      }
    };

    const creation = planStudioEdgeCreation({
      document: globalGroupingDocument,
      source: 'node-a',
      target: 'node-b',
      templateId: 'link'
    });

    expect(creation.additionalMutations).toBeUndefined();
  });

  it('creates three sibling links and enables canonical click-to-expand grouping', () => {
    const creation = plan('parallel-link');
    expect(creation.label).toBe('Create parallel link group');
    expect(creation.plan.insertions).toHaveLength(3);
    expect(creation.plan.insertions.map((insertion) => insertion.value)).toEqual([
      expect.objectContaining({ labels: { layer: 'physical', link: 'parallel', name: 'Link A' }, source: 'node-a', target: 'node-b' }),
      expect.objectContaining({ labels: { layer: 'physical', link: 'parallel', name: 'Link B' }, source: 'node-a', target: 'node-b' }),
      expect.objectContaining({ labels: { layer: 'physical', link: 'parallel', name: 'Link C' }, source: 'node-a', target: 'node-b' })
    ]);
    expect(creation.plan.insertions.every((insertion) => !Object.hasOwn(insertion.value, 'style'))).toBe(true);
    expect(stylesheetRules(creation)).toEqual([
      expect.objectContaining({ selector: 'link[id = "link-1"]', style: expect.objectContaining({ lineColor: '#0f766e' }) }),
      expect.objectContaining({ selector: 'link[id = "link-2"]', style: expect.objectContaining({ lineColor: '#2563eb' }) }),
      expect.objectContaining({ selector: 'link[id = "link-3"]', style: expect.objectContaining({ lineColor: '#dc2626' }) })
    ]);
    expect(creation.plan.insertions.every((insertion) => !Object.hasOwn(insertion.value, 'parent'))).toBe(true);
    expect(creation.additionalMutations).toContainEqual(
      expect.objectContaining({
        document: 'topology',
        kind: 'upsert-value',
        path: ['attention', 'links', 'grouping'],
        value: {
          by: ['endpoints', 'layer'],
          enabled: true,
          expandOnClick: true,
          selector: 'link[labels.link = "parallel"]',
          threshold: 2
        }
      })
    );
  });

  it('creates a parent carrier pipe and child lane as a separate edge template', () => {
    const creation = plan('parent-link-pipe');
    const [carrier, child] = creation.plan.insertions.map((insertion) => insertion.value);
    expect(creation.label).toBe('Create parent link pipe');
    expect(creation.plan.insertions).toHaveLength(2);
    expect(carrier).toMatchObject({
      labels: { layer: 'physical', link: 'carrier', name: 'Parent Link Pipe' },
      source: 'node-a',
      target: 'node-b'
    });
    expect(child).toMatchObject({
      labels: { layer: 'physical', link: 'child', name: 'Child Link Lane' },
      parent: carrier?.id,
      source: 'node-a',
      target: 'node-b'
    });
    expect(carrier).not.toHaveProperty('style');
    expect(child).not.toHaveProperty('style');
    expect(stylesheetRules(creation)).toEqual([
      expect.objectContaining({ selector: `link[id = "${String(carrier?.id)}"]`, style: expect.objectContaining({ pipe: true, pipeWidth: 24 }) }),
      expect.objectContaining({ selector: `link[id = "${String(child?.id)}"]`, style: expect.objectContaining({ lineColor: '#22c55e' }) })
    ]);
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
      target: 'node-b'
    });
    expect(creation.plan.insertions[0]?.value).not.toHaveProperty('style');
    expect(stylesheetRules(creation)).toEqual([
      expect.objectContaining({
        selector: 'link[id = "link-1"]',
        style: expect.objectContaining({ directionalStrokes: true })
      })
    ]);
  });

  it('rejects selection-based link creation unless exactly two nodes are selected', () => {
    expect(() =>
      planStudioPaletteCreation({
        document,
        pathMode: 'loose',
        presets: [],
        selection: [{ id: 'node-a', kind: 'node' }],
        templateId: 'link'
      })
    ).toThrow('exactly two selected nodes');
  });

  it('creates parent and child nodes atomically with explicit containment', () => {
    const creation = planStudioPaletteCreation({
      document,
      pathMode: 'loose',
      position: { x: 500, y: 300 },
      presets: [],
      selection: [],
      stylesheet: { stylesheet: [] },
      templateId: 'parent-child'
    });
    const [parent, child] = creation.plan.insertions.map((insertion) => insertion.value);
    expect(creation.plan.insertions).toHaveLength(2);
    expect(parent).toMatchObject({ id: 'node-1', labels: { name: 'Parent Node' } });
    expect(child).toMatchObject({ id: 'node-2', labels: { name: 'Child Node' }, parent: 'node-1' });
    expect(parent).not.toHaveProperty('style');
    expect(child).not.toHaveProperty('style');
    expect(stylesheetRules(creation)).toHaveLength(2);
  });

  it('creates a region with topology position and stylesheet-owned dimensions', () => {
    const creation = planStudioPaletteCreation({
      document,
      pathMode: 'loose',
      position: { x: 500, y: 300 },
      presets: [],
      selection: [],
      stylesheet: { stylesheet: [] },
      templateId: 'region'
    });

    expect(creation.plan.insertions[0]?.value).not.toHaveProperty('style');
    expect(creation.plan.insertions[0]?.value).not.toHaveProperty('size');
    expect(stylesheetRules(creation)).toEqual([{
      selector: 'region[id = "region-1"]',
      style: { draggable: true, height: 180, selectable: true, width: 280 }
    }]);
  });

  it('creates a shape with semantic topology and stylesheet-owned presentation', () => {
    const creation = planStudioPaletteCreation({
      document,
      pathMode: 'loose',
      position: { x: 500, y: 300 },
      presets: [],
      selection: [],
      stylesheet: { stylesheet: [] },
      templateId: 'shape'
    });

    const shape = creation.plan.insertions[0]?.value;
    expect(shape).toMatchObject({ id: 'shape-1', layers: ['annotations'], position: [500, 300] });
    expect(shape).not.toHaveProperty('type');
    expect(shape).not.toHaveProperty('size');
    expect(shape).not.toHaveProperty('rotation');
    expect(stylesheetRules(creation)).toEqual([{
      selector: 'shape[id = "shape-1"]',
      style: { height: 96, shape: 'rectangle', width: 180 }
    }]);
  });

  it('keeps palette node appearance in an exact-ID stylesheet rule', () => {
    const creation = planStudioPaletteCreation({
      document,
      pathMode: 'loose',
      position: { x: 180, y: 240 },
      presets: [],
      selection: [],
      stylesheet: { stylesheet: [] },
      templateId: 'router'
    });
    const node = creation.plan.insertions[0]?.value;

    expect(node).toMatchObject({ id: 'router-1', position: [180, 240] });
    expect(node).not.toHaveProperty('icon');
    expect(node).not.toHaveProperty('style');
    expect(stylesheetRules(creation)).toEqual([
      {
        selector: 'node[id = "router-1"]',
        style: { height: 64, icon: 'nokia.router', shape: 'square', width: 64 }
      }
    ]);
  });

  it('creates a missing annotations layer atomically with the first text object', () => {
    const topology = ['version: "0.2"', 'graph:', '  id: imported-topology', '  layers:', '    - id: physical', '      labels:', '        name: Physical', '  nodes: []', '  links: []', 'diagram:', '  shapes: []', '  callouts: []', '  connectors: []', ''].join('\n');
    const project: StudioProject = {
      assets: [],
      documents: {
        topology: { contentHash: 'topology', kind: 'topology', path: 'topology.yaml', text: topology },
        stylesheet: { contentHash: 'stylesheet', kind: 'stylesheet', path: 'stylesheet.yaml', text: 'stylesheet: []\n' }
      },
      id: 'imported',
      metadata: {
        createdAt: '2026-07-15T00:00:00.000Z',
        profileVersion: 1,
        schemaVersion: 1,
        updatedAt: '2026-07-15T00:00:00.000Z'
      },
      name: 'Imported topology',
      revision: 'fixture'
    };
    const session = createStudioDocumentSession(project);
    const creation = planStudioPaletteCreation({
      document: session.snapshot().projection.document,
      pathMode: 'loose',
      position: { x: 240, y: 180 },
      presets: [],
      selection: [],
      templateId: 'text'
    });

    expect(creation.additionalMutations).toEqual([
      {
        document: 'topology',
        kind: 'insert-value',
        path: ['graph', 'layers'],
        value: { id: 'annotations', labels: { name: 'Annotations' } }
      }
    ]);

    const dispatcher = createStudioCommandDispatcher(session);
    dispatcher.dispatch({
      id: creation.commandId,
      label: creation.label,
      execute: () => ({
        mutations: mutationsForAuthoringEditPlan(creation.plan, (path) => Boolean(session.sourceRange('topology', path)), creation.additionalMutations),
        summary: creation.label
      })
    });

    const snapshot = session.snapshot();
    expect(snapshot.projection.document.graph?.layers).toContainEqual({ id: 'annotations', labels: { name: 'Annotations' } });
    expect(snapshot.projection.document.diagram?.texts?.[0]).toMatchObject({
      id: 'text-1',
      layers: ['annotations'],
      text: 'Text'
    });
    expect(snapshot.project.documents.topology.text).toContain('    - id: annotations\n      labels:\n        name: Annotations');
    expect(snapshot.project.documents.topology.text).toContain('  texts:\n    - id: text-1');
  });
});
