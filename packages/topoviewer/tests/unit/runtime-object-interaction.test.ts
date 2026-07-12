import { describe, expect, it } from 'vitest';
import { runtimeObjectInteraction } from '../../src/components/runtimeGraph';

describe('runtime object interaction', () => {
  it('preserves source identity and pointer context for double-click callbacks', () => {
    expect(runtimeObjectInteraction({
      data: { id: 'source-node', objectKind: 'node' },
      id: 'runtime-node'
    }, 'node', {
      clientX: 240,
      clientY: 180,
      ctrlKey: false,
      metaKey: true,
      shiftKey: false
    })).toEqual({
      clientX: 240,
      clientY: 180,
      data: { id: 'source-node', objectKind: 'node' },
      element: 'node',
      id: 'source-node',
      modifiers: { ctrlKey: false, metaKey: true, shiftKey: false },
      runtimeId: 'runtime-node'
    });
  });
});
