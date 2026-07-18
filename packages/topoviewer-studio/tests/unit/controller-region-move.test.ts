import { describe, expect, it } from 'vitest';
import type { StudioProject } from '../../src';
import { planStudioObjectMove } from '../../src/app/controllerAuthoring';
import { mutationsForAuthoringEditPlan } from '../../src/app/controllerUtils';
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
  '      paddingX: 34',
  '      paddingY: 28',
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
        text: 'stylesheet: []\n'
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
});
