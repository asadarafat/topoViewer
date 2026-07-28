import { describe, expect, it } from 'vitest';
import {
  transitionStudioWorkspace,
  type StudioWorkspaceView
} from '../../src/features/workspace/workspaceTransitions';

describe('contextual Studio workspace transitions', () => {
  const cases: Array<{
    event:
      | { type: 'activate'; view: StudioWorkspaceView }
      | { type: 'canvas-selected' }
      | { type: 'creation-completed' }
      | { type: 'creation-cancelled' }
      | { type: 'multi-selection' }
      | { type: 'panel-collapsed' }
      | { type: 'panel-expanded' }
      | { type: 'object-selected' };
    expected: StudioWorkspaceView;
    initial: StudioWorkspaceView;
  }> = [
    { event: { type: 'activate', view: 'add' }, expected: 'add', initial: 'properties' },
    { event: { type: 'activate', view: 'mapper' }, expected: 'mapper', initial: 'add' },
    { event: { type: 'object-selected' }, expected: 'properties', initial: 'add' },
    { event: { type: 'object-selected' }, expected: 'mapper', initial: 'mapper' },
    { event: { type: 'multi-selection' }, expected: 'properties', initial: 'add' },
    { event: { type: 'multi-selection' }, expected: 'mapper', initial: 'mapper' },
    { event: { type: 'canvas-selected' }, expected: 'properties', initial: 'add' },
    { event: { type: 'canvas-selected' }, expected: 'mapper', initial: 'mapper' },
    { event: { type: 'creation-completed' }, expected: 'properties', initial: 'add' },
    { event: { type: 'creation-cancelled' }, expected: 'add', initial: 'add' },
    { event: { type: 'creation-cancelled' }, expected: 'properties', initial: 'properties' },
    { event: { type: 'panel-collapsed' }, expected: 'properties', initial: 'properties' },
    { event: { type: 'panel-expanded' }, expected: 'mapper', initial: 'mapper' }
  ];

  for (const entry of cases) {
    it(`${entry.initial} + ${entry.event.type} -> ${entry.expected}`, () => {
      expect(transitionStudioWorkspace(entry.initial, entry.event)).toBe(entry.expected);
    });
  }
});
