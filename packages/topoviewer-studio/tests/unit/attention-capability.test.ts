import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import type { StudioCommand, StudioProject } from '../../src';
import { createStudioCommandDispatcher } from '../../src/commands';
import { createStudioAttentionCapability } from '../../src/features/attention/attentionCapability';
import { createStudioDocumentSession } from '../../src/session';

const topology = [
  'graph:',
  '  layers: [{ id: physical }]',
  '  nodes:',
  '    - id: core',
  '      layers: [physical]',
  '    - id: leaf',
  '      parent: core',
  '      layers: [physical]',
  '  links:',
  '    - id: core-leaf',
  '      source: core',
  '      target: leaf',
  '      layers: [physical]',
  '  paths: []',
  '  regions:',
  '    - id: west',
  '      members: [core, leaf]',
  '      layers: [physical]',
  'attention:',
  '  query:',
  '    labels: { role: router }',
  '    mode: dim-context',
  '  aggregate:',
  '    viewport: { collapseBelowZoom: 0.6 }',
  ''
].join('\n');

function project(): StudioProject {
  return {
    assets: [],
    documents: {
      topology: { contentHash: 'topology', kind: 'topology', path: 'topology.yaml', text: topology },
      stylesheet: { contentHash: 'stylesheet', kind: 'stylesheet', path: 'stylesheet.yaml', text: 'stylesheet: []\n' }
    },
    id: 'attention',
    metadata: { createdAt: '', profileVersion: 1, schemaVersion: 1, updatedAt: '' },
    name: 'Attention',
    revision: 'fixture'
  };
}

function capability() {
  const session = createStudioDocumentSession(project());
  const dispatcher = createStudioCommandDispatcher(session);
  const announcements: string[] = [];
  const errors: Array<string | undefined> = [];
  const commands: StudioCommand[] = [];
  const attention = createStudioAttentionCapability({
    announce: (message) => announcements.push(message),
    execute: (command) => {
      commands.push(command);
      dispatcher.dispatch(command);
      return true;
    },
    session,
    setError: (message) => errors.push(message)
  });
  return { announcements, attention, commands, dispatcher, errors, session };
}

describe('Studio attention capability', () => {
  it('commits one top-level policy mutation and preserves selection through undo and redo', async () => {
    const { attention, commands, dispatcher, session } = capability();
    session.setSelection([{ id: 'leaf', kind: 'node' }]);
    const before = session.snapshot();

    expect(await attention.applyAttentionAction({ type: 'set-focus-ids', ids: ['leaf'] })).toBe(true);

    expect(commands).toHaveLength(1);
    const plan = commands[0].execute({ project: before.project, selection: before.selection });
    expect(plan.mutations).toEqual([
      {
        document: 'topology',
        kind: 'upsert-value',
        path: ['attention'],
        scopePath: [],
        value: expect.objectContaining({ query: expect.objectContaining({ ids: ['leaf'] }) })
      }
    ]);
    expect(session.snapshot().selection).toEqual([{ id: 'leaf', kind: 'node' }]);
    expect(parse(session.snapshot().project.documents.topology.text).attention).toMatchObject({
      query: { ids: ['leaf'], labels: { role: 'router' }, mode: 'dim-context' },
      aggregate: { viewport: { collapseBelowZoom: 0.6 } }
    });
    expect(dispatcher.historyState().undoEntries).toBe(1);

    dispatcher.undo();
    expect(session.snapshot().project.documents.topology.text).toBe(topology);
    dispatcher.redo();
    expect(parse(session.snapshot().project.documents.topology.text).attention.query.ids).toEqual(['leaf']);
  });

  it('rejects invalid attention actions before dispatch without changing session state', async () => {
    const { attention, commands, errors, session } = capability();
    const before = session.snapshot();

    expect(await attention.applyAttentionAction({ type: 'set-focus-ids', ids: ['missing'] })).toBe(false);

    expect(commands).toHaveLength(0);
    expect(errors.at(-1)).toMatch(/missing/);
    expect(session.snapshot()).toEqual(before);
  });

  it('protects an invalid topology draft and does not evaluate a stale valid projection', async () => {
    const { announcements, attention, commands, errors, session } = capability();
    expect(session.replaceDraft('topology', 'graph:\n  nodes: [').status).toBe('invalid');
    const before = session.snapshot();

    expect(await attention.applyAttentionAction({ type: 'set-interactive', enabled: true })).toBe(false);

    expect(commands).toHaveLength(0);
    expect(errors.at(-1)).toMatch(/invalid topology draft/i);
    expect(announcements.at(-1)).toMatch(/attention change rejected/i);
    expect(session.snapshot()).toEqual(before);
  });

  it('removes only the complete attention policy as one command', async () => {
    const { attention, commands, session } = capability();

    expect(await attention.applyAttentionAction({ type: 'remove-attention' })).toBe(true);

    expect(commands).toHaveLength(1);
    expect(parse(session.snapshot().project.documents.topology.text).attention).toBeUndefined();
    expect(parse(session.snapshot().project.documents.topology.text).graph.nodes).toHaveLength(2);
  });

  it('serializes rapid actions against the latest committed policy', async () => {
    const { attention, commands, session } = capability();

    const results = await Promise.all([
      attention.applyAttentionAction({ type: 'set-interactive', enabled: true }),
      attention.applyAttentionAction({ type: 'set-focus-ids', ids: ['leaf'] })
    ]);

    expect(results).toEqual([true, true]);
    expect(commands).toHaveLength(2);
    expect(parse(session.snapshot().project.documents.topology.text).attention).toMatchObject({
      interactive: true,
      query: { ids: ['leaf'], labels: { role: 'router' }, mode: 'dim-context' }
    });
  });
});
