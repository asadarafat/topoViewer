import { describe, expect, it } from 'vitest';
import {
  createStudioStyleRuleCommand,
  deleteStudioStyleRuleCommand,
  duplicateStudioStyleRuleCommand,
  moveStudioStyleRuleCommand,
  renameStudioStyleRuleCommand
} from '../../src/app/controllerStyleRules';

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
});
