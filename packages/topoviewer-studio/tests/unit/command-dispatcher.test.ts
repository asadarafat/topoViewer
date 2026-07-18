import { describe, expect, it } from 'vitest';
import type { StudioCommand, StudioProject } from '../../src';
import { createStudioCommandDispatcher, createStudioTransientStore, StudioCommandExecutionError } from '../../src/commands';
import { createStudioDocumentSession } from '../../src/session';

const topology = [
  'version: "0.2"',
  'graph:',
  '  layers:',
  '    - id: physical',
  '      labels: { name: Physical }',
  '  nodes:',
  '    - id: A',
  '      labels: { name: Node A }',
  '      layers: [physical]',
  '      position: [100, 100]',
  '    - id: B',
  '      labels: { name: Node B }',
  '      layers: [physical]',
  '      position: [300, 100]',
  ''
].join('\n');

function project(): StudioProject {
  return {
    assets: [],
    documents: {
      topology: { contentHash: 'topology', kind: 'topology', path: 'topology.yaml', text: topology },
      stylesheet: { contentHash: 'stylesheet', kind: 'stylesheet', path: 'stylesheet.yaml', text: 'stylesheet: []\n' }
    },
    id: 'commands',
    metadata: {
      createdAt: '2026-07-09T00:00:00.000Z',
      profileVersion: 1,
      schemaVersion: 1,
      updatedAt: '2026-07-09T00:00:00.000Z'
    },
    name: 'Commands',
    revision: 'fixture'
  };
}

function setValueCommand(id: string, path: Array<string | number>, value: unknown, options: { coalescingKey?: string; selectionId?: string } = {}): StudioCommand {
  return {
    coalescingKey: options.coalescingKey,
    execute: () => ({
      mutations: [{ document: 'topology', kind: 'set-value', path, value }],
      selection: options.selectionId ? [{ id: options.selectionId, kind: 'node' }] : undefined,
      summary: `Set ${path.join('.')}`
    }),
    id,
    label: `Set ${path.join('.')}`
  };
}

describe('Studio command dispatcher', () => {
  it('executes, reports source changes, and restores selection through undo and redo', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session, { clock: () => '2026-07-09T00:00:00.000Z' });

    const result = dispatcher.dispatch(setValueCommand('rename-a', ['graph', 'nodes', 0, 'labels', 'name'], 'Router A', { selectionId: 'A' }));

    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]).toMatchObject({ document: 'topology', operation: 'update' });
    expect(result.changes[0].before).toContain('name: Node A');
    expect(result.changes[0].after).toContain('name: Router A');
    expect(session.snapshot().selection).toEqual([{ id: 'A', kind: 'node' }]);
    expect(dispatcher.canUndo()).toBe(true);

    dispatcher.undo();
    expect(session.snapshot().project.documents.topology.text).toBe(topology);
    expect(session.snapshot().selection).toEqual([]);
    expect(dispatcher.canRedo()).toBe(true);

    dispatcher.redo();
    expect(session.snapshot().project.documents.topology.text).toContain('name: Router A');
    expect(session.snapshot().selection).toEqual([{ id: 'A', kind: 'node' }]);
  });

  it('creates and removes the optional mapper through undoable source commands', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session);

    const enabled = dispatcher.dispatch({
      id: 'enable-mapper',
      label: 'Enable telemetry mapper',
      execute: () => ({
        mutations: [
          {
            document: 'mapper',
            kind: 'create-document',
            path: 'mapper.yaml',
            text: 'version: 1\nrules: []\n'
          }
        ],
        summary: 'Enabled telemetry mapper'
      })
    });
    expect(enabled.changes).toEqual([
      {
        after: 'version: 1\nrules: []\n',
        before: undefined,
        document: 'mapper',
        operation: 'create'
      }
    ]);
    expect(session.snapshot().project.documents.mapper?.text).toContain('rules: []');

    dispatcher.undo();
    expect(session.snapshot().project.documents.mapper).toBeUndefined();
    dispatcher.redo();
    expect(session.snapshot().project.documents.mapper).toBeDefined();

    const removed = dispatcher.dispatch({
      id: 'remove-mapper',
      label: 'Remove telemetry mapper',
      execute: () => ({
        mutations: [{ document: 'mapper', kind: 'remove-document' }],
        summary: 'Removed telemetry mapper'
      })
    });
    expect(removed.changes[0]).toMatchObject({ document: 'mapper', operation: 'remove' });
    expect(session.snapshot().project.documents.mapper).toBeUndefined();
    dispatcher.undo();
    expect(session.snapshot().project.documents.mapper?.text).toContain('rules: []');
  });

  it('composes a transaction into one undo item and can cancel it atomically', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session);

    dispatcher.beginTransaction('drag-a', 'Move node A');
    dispatcher.dispatch(setValueCommand('move-a-x', ['graph', 'nodes', 0, 'position', 0], 180));
    dispatcher.dispatch(setValueCommand('move-a-y', ['graph', 'nodes', 0, 'position', 1], 220));
    const record = dispatcher.commitActiveTransaction();

    expect(record?.commandIds).toEqual(['move-a-x', 'move-a-y']);
    expect(dispatcher.historyState().undoEntries).toBe(1);
    dispatcher.undo();
    expect(session.snapshot().project.documents.topology.text).toBe(topology);

    dispatcher.beginTransaction('cancelled-drag', 'Move node A');
    dispatcher.dispatch(setValueCommand('move-a-x-again', ['graph', 'nodes', 0, 'position', 0], 260));
    dispatcher.cancelActiveTransaction();
    expect(session.snapshot().project.documents.topology.text).toBe(topology);
    expect(dispatcher.historyState().undoEntries).toBe(0);
  });

  it('coalesces repeated control edits and bounds history memory', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session, { maxBytes: 200_000, maxEntries: 2 });

    dispatcher.dispatch(setValueCommand('name-1', ['graph', 'nodes', 0, 'labels', 'name'], 'R', { coalescingKey: 'node-a-name' }));
    dispatcher.dispatch(setValueCommand('name-2', ['graph', 'nodes', 0, 'labels', 'name'], 'Ro', { coalescingKey: 'node-a-name' }));
    dispatcher.dispatch(setValueCommand('name-3', ['graph', 'nodes', 0, 'labels', 'name'], 'Router', { coalescingKey: 'node-a-name' }));
    expect(dispatcher.historyState()).toMatchObject({ undoEntries: 1, redoEntries: 0 });
    dispatcher.undo();
    expect(session.snapshot().project.documents.topology.text).toBe(topology);

    dispatcher.dispatch(setValueCommand('a', ['graph', 'nodes', 0, 'labels', 'name'], 'A1'));
    dispatcher.dispatch(setValueCommand('b', ['graph', 'nodes', 1, 'labels', 'name'], 'B1'));
    dispatcher.dispatch(setValueCommand('c', ['graph', 'nodes', 0, 'labels', 'name'], 'A2'));
    expect(dispatcher.historyState().undoEntries).toBe(2);
    expect(dispatcher.historyState().estimatedBytes).toBeLessThanOrEqual(200_000);
  });

  it('rolls back every mutation when a command fails part way through', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session);
    const invalid: StudioCommand = {
      id: 'atomic-failure',
      label: 'Atomic failure',
      execute: () => ({
        mutations: [
          { document: 'topology', kind: 'set-value', path: ['graph', 'nodes', 0, 'labels', 'name'], value: 'Changed' },
          { document: 'mapper', kind: 'set-value', path: ['rules', 0, 'metric'], value: 'missing' }
        ],
        summary: 'Must fail'
      })
    };

    expect(() => dispatcher.dispatch(invalid)).toThrow(/missing mapper/i);
    expect(session.snapshot().project.documents.topology.text).toBe(topology);
    expect(dispatcher.historyState().undoEntries).toBe(0);
  });

  it('isolates the session from a command that mutates its input and throws', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session);
    const broken: StudioCommand = {
      id: 'broken-command',
      label: 'Broken command',
      execute: (state) => {
        state.project.documents.topology.text = 'corrupt';
        throw new Error('failed before planning');
      }
    };

    expect(() => dispatcher.dispatch(broken)).toThrow('failed before planning');
    expect(session.snapshot().project.documents.topology.text).toBe(topology);
    expect(dispatcher.historyState().undoEntries).toBe(0);
  });

  it('keeps pointer-time interaction outside YAML and history', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session);
    const transient = createStudioTransientStore();
    const revision = session.snapshot().projection.sourceRevision;
    let hoverNotifications = 0;
    transient.subscribe(
      (state) => state.hoveredObjectId,
      () => {
        hoverNotifications += 1;
      }
    );

    for (let index = 0; index < 1000; index += 1) {
      transient.update({ activeDrag: { id: 'A', position: { x: index, y: index % 17 } } });
    }

    expect(session.snapshot().projection.sourceRevision).toBe(revision);
    expect(dispatcher.historyState().undoEntries).toBe(0);
    expect(hoverNotifications).toBe(0);

    dispatcher.dispatch({
      id: 'drag-stop',
      label: 'Move node A',
      execute: () => ({
        mutations: [
          { document: 'topology', kind: 'set-value', path: ['graph', 'nodes', 0, 'position', 0], value: 999 },
          { document: 'topology', kind: 'set-value', path: ['graph', 'nodes', 0, 'position', 1], value: 12 }
        ],
        summary: 'Move node A'
      })
    });
    expect(dispatcher.historyState().undoEntries).toBe(1);
  });

  it('serializes recovery with current source once and history summaries only', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session);
    dispatcher.dispatch(setValueCommand('rename', ['graph', 'nodes', 0, 'labels', 'name'], 'Router A'));

    const recovery = dispatcher.recoveryState();
    expect(recovery.snapshot.project.documents.topology.text).toContain('Router A');
    expect(recovery.undo).toEqual([{ commandIds: ['rename'], summary: 'Set graph.nodes.0.labels.name' }]);
    expect(JSON.stringify(recovery.undo)).not.toContain('graph:');
  });

  it('exposes human-readable history with affected source documents', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session, { clock: () => '2026-07-09T12:00:00.000Z' });
    dispatcher.dispatch({
      id: 'rename-node',
      label: 'Rename node',
      execute: () => ({
        mutations: [
          {
            document: 'topology',
            kind: 'set-value',
            path: ['graph', 'nodes', 0, 'labels', 'name'],
            value: 'Renamed'
          }
        ],
        summary: 'Rename node'
      })
    });

    expect(dispatcher.historyEntries()).toEqual([
      expect.objectContaining({
        committedAt: '2026-07-09T12:00:00.000Z',
        documents: ['topology'],
        summary: 'Rename node',
        state: 'undo'
      })
    ]);
  });

  it('returns normalization review details without committing the structural rewrite', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session);
    let failure: unknown;
    try {
      dispatcher.dispatch({
        id: 'replace-labels',
        label: 'Replace node labels',
        execute: () => ({
          mutations: [
            {
              document: 'topology',
              kind: 'set-value',
              path: ['graph', 'nodes', 0, 'labels'],
              value: { role: 'edge' }
            }
          ],
          summary: 'Replace node labels'
        })
      });
    } catch (error) {
      failure = error;
    }

    expect(failure).toBeInstanceOf(StudioCommandExecutionError);
    expect((failure as StudioCommandExecutionError).review).toMatchObject({
      document: 'topology',
      path: ['graph', 'nodes', 0, 'labels']
    });
    expect(session.snapshot().project.documents.topology.text).toBe(topology);
  });
});
