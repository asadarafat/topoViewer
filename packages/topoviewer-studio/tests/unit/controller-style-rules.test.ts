import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import {
  createStudioInlineStyleMigrationCommand,
  createStudioStyleRuleCommand,
  deleteStudioStyleRuleCommand,
  duplicateStudioStyleRuleCommand,
  moveStudioStyleRuleCommand,
  renameStudioStyleRuleCommand
} from '../../src/app/controllerStyleRules';
import { createStarterProject } from '../../src/hosts/starterProject';
import { createStudioCommandDispatcher } from '../../src/commands';
import { createStudioDocumentSession } from '../../src/session';

const selection = [{ id: 'node-1', kind: 'node' as const }];
const rules = [
  { selector: 'node', style: { shape: 'rectangle' } },
  { selector: 'node[labels.role = "leaf"]', style: { backgroundColor: '#123456' } }
];
const state = { project: {} as never, selection };

describe('Studio style rule commands', () => {
  it('creates and renames selector rules in stylesheet.yaml', () => {
    expect(createStudioStyleRuleCommand({ selection, selector: 'node[labels.role = "spine"]' }).execute(state).mutations).toEqual([
      {
        document: 'stylesheet',
        kind: 'insert-value',
        path: ['stylesheet'],
        value: { selector: 'node[labels.role = "spine"]', style: {} }
      }
    ]);

    expect(renameStudioStyleRuleCommand({ index: 1, selection, selector: 'node[labels.role = "edge"]' }).execute(state).mutations).toEqual([
      {
        document: 'stylesheet',
        kind: 'set-value',
        path: ['stylesheet', 1, 'selector'],
        value: 'node[labels.role = "edge"]'
      }
    ]);
  });

  it('can insert a missing default before existing specific selectors', () => {
    expect(createStudioStyleRuleCommand({ insertAt: 1, ruleCount: 2, selection, selector: 'node' }).execute(state).mutations).toEqual([
      {
        document: 'stylesheet',
        kind: 'insert-value',
        path: ['stylesheet'],
        value: { selector: 'node', style: {} }
      },
      {
        document: 'stylesheet',
        from: 2,
        kind: 'move-sequence-value',
        path: ['stylesheet'],
        to: 1
      }
    ]);
  });

  it('duplicates and deletes rules without changing topology ownership', () => {
    expect(duplicateStudioStyleRuleCommand({ rule: rules[1], selection }).execute(state).mutations).toEqual([
      {
        document: 'stylesheet',
        kind: 'insert-value',
        path: ['stylesheet'],
        value: rules[1]
      }
    ]);
    expect(deleteStudioStyleRuleCommand({ index: 0, selection }).execute(state).mutations).toEqual([
      {
        document: 'stylesheet',
        kind: 'remove-value',
        path: ['stylesheet', 0],
        scopePath: ['stylesheet']
      }
    ]);
  });

  it('reorders rules with one atomic two-value command', () => {
    expect(moveStudioStyleRuleCommand({ direction: -1, index: 1, rules, selection })?.execute(state).mutations).toEqual([
      {
        document: 'stylesheet',
        from: 1,
        kind: 'move-sequence-value',
        path: ['stylesheet'],
        to: 0
      }
    ]);
    expect(moveStudioStyleRuleCommand({ direction: -1, index: 0, rules, selection })).toBeUndefined();
  });

  it('moves inline style through one command with two replace-source mutations', () => {
    const project = createStarterProject({ template: 'backbone' });
    const command = createStudioInlineStyleMigrationCommand({
      fieldPaths: [['shape'], ['width']],
      selection: [{ id: 'edge-01', kind: 'node' }],
      target: { id: 'edge-01', kind: 'node' }
    });

    const plan = command.execute({ project, selection: [{ id: 'edge-01', kind: 'node' }] });

    expect(plan.mutations).toHaveLength(2);
    expect(plan.mutations.map((mutation) => [mutation.document, mutation.kind])).toEqual([
      ['topology', 'replace-source'],
      ['stylesheet', 'replace-source']
    ]);
    const topologyMutation = plan.mutations[0];
    expect(topologyMutation).toMatchObject({ document: 'topology', kind: 'replace-source' });
    if (topologyMutation.kind !== 'replace-source') return;
    const migratedNode = (parse(topologyMutation.text) as { graph: { nodes: Array<{ id: string; style?: object }> } }).graph.nodes.find((node) => node.id === 'edge-01');
    expect(migratedNode?.style).not.toHaveProperty('shape');
    expect(migratedNode?.style).not.toHaveProperty('width');
    expect(plan.mutations[1]).toMatchObject({ document: 'stylesheet', text: expect.stringContaining('node[id = "edge-01"]') });

    const session = createStudioDocumentSession(project);
    const dispatcher = createStudioCommandDispatcher(session);
    const before = session.snapshot();
    dispatcher.dispatch(command);
    expect(dispatcher.historyEntries()[0]).toMatchObject({
      documents: ['topology', 'stylesheet'],
      summary: 'Move edge-01 inline style to stylesheet'
    });
    expect(session.snapshot().project.documents.topology.text).not.toBe(before.project.documents.topology.text);
    expect(session.snapshot().project.documents.stylesheet.text).not.toBe(before.project.documents.stylesheet.text);
    dispatcher.undo();
    expect(session.snapshot().project.documents.topology.text).toBe(before.project.documents.topology.text);
    expect(session.snapshot().project.documents.stylesheet.text).toBe(before.project.documents.stylesheet.text);
  });
});
