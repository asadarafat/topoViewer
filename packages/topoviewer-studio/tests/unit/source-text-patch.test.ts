import { describe, expect, it } from 'vitest';
import { applyStudioSourceTextPatch, createStudioSourceTextPatch } from '../../src/features/workspace/sourceTextPatch';

describe('Studio source text patches', () => {
  it('does not produce work for identical source', () => {
    expect(createStudioSourceTextPatch('graph:\n  id: demo\n', 'graph:\n  id: demo\n')).toBeUndefined();
  });

  it('limits a direct-manipulation update to the changed source span', () => {
    const before = [
      'graph:',
      '  nodes:',
      '    - id: leaf-1',
      '      position: [120, 240]',
      '    - id: leaf-2',
      '      position: [640, 240]',
      ''
    ].join('\n');
    const after = before.replace('[120, 240]', '[184, 288]');
    const patch = createStudioSourceTextPatch(before, after);

    expect(patch).toEqual({
      endOffset: before.indexOf('120') + '120, 240'.length,
      startOffset: before.indexOf('120'),
      text: '184, 288'
    });
    expect(applyStudioSourceTextPatch(before, patch)).toBe(after);
    expect(patch?.text.length).toBeLessThan(before.length / 4);
  });

  it('covers multiple scalar updates with one deterministic bounded replacement', () => {
    const before = 'position:\n  - 100\n  - 200\nmetadata: unchanged\n';
    const after = 'position:\n  - 125\n  - 260\nmetadata: unchanged\n';
    const patch = createStudioSourceTextPatch(before, after);

    expect(applyStudioSourceTextPatch(before, patch)).toBe(after);
    expect(patch).toMatchObject({
      startOffset: before.indexOf('100'),
      text: '125\n  - 260'
    });
  });

  it('supports insertion, deletion, and complete replacement', () => {
    const cases = [
      ['graph:\n', 'graph:\n  nodes: []\n'],
      ['graph:\n  nodes: []\n', 'graph:\n'],
      ['', 'graph:\n  id: demo\n']
    ] as const;

    cases.forEach(([before, after]) => {
      expect(applyStudioSourceTextPatch(before, createStudioSourceTextPatch(before, after))).toBe(after);
    });
  });
});
