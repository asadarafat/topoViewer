import { describe, expect, it } from 'vitest';
import {
  createStudioInspectorEditCommand,
  createStudioViewportEditCommand
} from '../../src/app/controllerSourceEdit';

const selection = [{ id: 'node-1', kind: 'node' as const }];

describe('Studio source edit commands', () => {
  it('writes an existing object field to topology.yaml with object-local coalescing', () => {
    const command = createStudioInspectorEditCommand({
      existing: true,
      path: ['graph', 'nodes', 0, 'name'],
      scopePath: ['graph', 'nodes', 0],
      selection,
      value: 'Core Router'
    });
    expect(command.coalescingKey).toBe('node:node-1:graph.nodes.0.name');
    expect(command.execute({ project: {} as never, selection }).mutations).toEqual([{
      document: 'topology',
      kind: 'set-value',
      path: ['graph', 'nodes', 0, 'name'],
      value: 'Core Router'
    }]);
  });

  it('upserts a missing viewport field into stylesheet.yaml without losing selection', () => {
    const command = createStudioViewportEditCommand({
      existing: false,
      path: ['layout', 'width'],
      scopePath: ['layout'],
      selection,
      value: 1440
    });
    const result = command.execute({ project: {} as never, selection });
    expect(command.coalescingKey).toBe('viewport:layout.width');
    expect(result.selection).toEqual(selection);
    expect(result.mutations).toEqual([{
      document: 'stylesheet',
      kind: 'upsert-value',
      path: ['layout', 'width'],
      scopePath: ['layout'],
      value: 1440
    }]);
  });
});
