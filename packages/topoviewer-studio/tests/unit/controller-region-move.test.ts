import { describe, expect, it } from 'vitest';
import type { StudioProject } from '../../src';
import { planStudioObjectMove, planStudioSelectionMove } from '../../src/features/canvas/canvasAuthoring';
import { mutationsForAuthoringEditPlan } from '../../src/commands/authoringPlans';
import { createStudioCommandDispatcher } from '../../src/commands';
import { createStudioDocumentSession } from '../../src/session';

const memberDerivedTopology = [
  'version: "0.2"',
  'graph:',
  '  layers:',
  '    - id: physical',
  '      labels: { name: Physical }',
  '  nodes:',
  '    - id: client',
  '      labels: { name: Client }',
  '      layers: [physical]',
  '      position: [100, 120]',
  '    - id: router',
  '      labels: { name: Router }',
  '      layers: [physical]',
  '      position: [260, 120]',
  '  regions:',
  '    - id: tactical',
  '      labels: { name: Tactical site }',
  '      members: [client, router]',
  '      layers: [physical]',
  ''
].join('\n');

function project(topology = memberDerivedTopology): StudioProject {
  return {
    assets: [],
    documents: {
      stylesheet: {
        contentHash: 'stylesheet',
        kind: 'stylesheet',
        path: 'stylesheet.yaml',
        text: [
          'stylesheet:',
          '  - selector: region[id = "tactical"]',
          '    style:',
          '      paddingX: 34',
          '      paddingY: 28',
          ''
        ].join('\n')
      },
      topology: {
        contentHash: `topology-${topology.length}`,
        kind: 'topology',
        path: 'topology.yaml',
        text: topology
      }
    },
    id: 'member-derived-region-move',
    metadata: {
      createdAt: '2026-07-18T00:00:00.000Z',
      profileVersion: 1,
      schemaVersion: 1,
      updatedAt: '2026-07-18T00:00:00.000Z'
    },
    name: 'Member-derived region move',
    revision: 'fixture'
  };
}

describe('Studio region move persistence', () => {
  it('persists a member-derived region move through source and reload', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session);
    const planned = planStudioObjectMove(
      session.snapshot().projection.document,
      'tactical',
      { x: 160, y: 150 },
      { x: 120, y: 90 }
    );
    expect(planned).toBeDefined();
    if (!planned) return;

    dispatcher.dispatch({
      id: 'move-tactical',
      label: planned.label,
      execute: () => ({
        mutations: mutationsForAuthoringEditPlan(
          planned.plan,
          (path) => Boolean(session.sourceRange('topology', path))
        ),
        selection: [planned.selection],
        summary: planned.label
      })
    });

    const source = session.snapshot().project.documents.topology.text;
    expect(source).toContain('position: [220, 210]');
    expect(source).toContain('position: [380, 210]');

    const reloaded = createStudioDocumentSession(project(source));
    expect(reloaded.snapshot().projection.document.graph?.regions?.[0].position).toBeUndefined();
    expect(reloaded.snapshot().projection.document.graph?.nodes?.map((node) => node.position)).toEqual([
      [220, 210],
      [380, 210]
    ]);
  });

  it('plans a multi-node drag as one geometry-only edit', () => {
    const document = createStudioDocumentSession(project()).snapshot().projection.document;
    const planned = planStudioSelectionMove(
      document,
      [{ id: 'client', kind: 'node' }, { id: 'router', kind: 'node' }],
      [
        { id: 'client', runtimeId: 'client', position: { x: 140, y: 150 }, delta: { x: 40, y: 30 }, data: {} },
        { id: 'router', runtimeId: 'router', position: { x: 300, y: 150 }, delta: { x: 40, y: 30 }, data: {} }
      ]
    );

    expect(planned?.label).toBe('Move 2 objects');
    expect(planned?.plan.updates.map((update) => [update.path, update.value])).toEqual([
      [['graph', 'nodes', 0, 'position', 0], 140],
      [['graph', 'nodes', 0, 'position', 1], 150],
      [['graph', 'nodes', 1, 'position', 0], 300],
      [['graph', 'nodes', 1, 'position', 1], 150]
    ]);
    expect(planned?.plan.updates.some((update) => update.path.includes('members'))).toBe(false);
  });

  it('lets a selected region own movement of selected descendants', () => {
    const document = createStudioDocumentSession(project()).snapshot().projection.document;
    const planned = planStudioSelectionMove(
      document,
      [{ id: 'tactical', kind: 'region' }, { id: 'client', kind: 'node' }],
      [
        { id: 'tactical', runtimeId: 'region:tactical', position: { x: 100, y: 80 }, delta: { x: 60, y: 40 }, data: {} },
        { id: 'client', runtimeId: 'client', position: { x: 160, y: 160 }, delta: { x: 60, y: 40 }, data: {} }
      ]
    );

    const clientXUpdates = planned?.plan.updates.filter((update) => (
      update.path.join('.') === 'graph.nodes.0.position.0'
    ));
    expect(clientXUpdates).toEqual([expect.objectContaining({ value: 160 })]);
  });

  it('uses the renderer drag batch when Studio selection is stale', () => {
    const document = createStudioDocumentSession(project()).snapshot().projection.document;
    const planned = planStudioSelectionMove(
      document,
      [{ id: 'client', kind: 'node' }],
      [
        { id: 'tactical', runtimeId: 'region:tactical', position: { x: 100, y: 80 }, delta: { x: 60, y: 40 }, data: {} },
        { id: 'client', runtimeId: 'client', position: { x: 160, y: 160 }, delta: { x: 60, y: 40 }, data: {} }
      ]
    );

    expect(planned?.selection).toEqual([
      { id: 'tactical', kind: 'region' },
      { id: 'client', kind: 'node' }
    ]);
    expect(planned?.plan.updates).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: ['graph', 'nodes', 0, 'position', 0], value: 160 }),
      expect.objectContaining({ path: ['graph', 'nodes', 1, 'position', 0], value: 320 })
    ]));
  });
});
