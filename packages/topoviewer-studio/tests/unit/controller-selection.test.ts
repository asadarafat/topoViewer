import { describe, expect, it } from 'vitest';
import type { StudioSelection } from '../../src/contracts/project';
import { sameSelection, uniqueSelection } from '../../src/app/controllerUtils';

const node = (id: string): StudioSelection => ({ id, kind: 'node' });
const link = (id: string): StudioSelection => ({ id, kind: 'link' });

describe('Studio selection reconciliation', () => {
  it('treats a selection as an unordered semantic set', () => {
    expect(sameSelection([node('leaf1'), link('leaf1-spine1')], [link('leaf1-spine1'), node('leaf1')])).toBe(true);
  });

  it('rejects missing, different, and duplicate semantic objects', () => {
    expect(sameSelection([node('leaf1')], [])).toBe(false);
    expect(sameSelection([node('leaf1')], [node('leaf2')])).toBe(false);
    expect(sameSelection([node('leaf1'), node('leaf1')], [node('leaf1'), link('leaf1')])).toBe(false);
  });

  it('collapses multiple runtime fragments into one semantic selection', () => {
    expect(uniqueSelection([link('protected-path'), link('protected-path'), node('leaf1')])).toEqual([
      link('protected-path'),
      node('leaf1')
    ]);
  });
});
