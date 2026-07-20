import { describe, expect, it } from 'vitest';
import type { StudioSelection } from '../../src/contracts/project';
import { reconcileCanvasSelection, sameSelection, uniqueSelection } from '../../src/app/controllerUtils';

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

  it('waits for React Flow to acknowledge semantic selection without a wall-clock timeout', () => {
    const pending = [node('leaf1')];
    const intermediate = reconcileCanvasSelection([], pending);
    expect(intermediate).toEqual({
      accepted: false,
      pendingSemanticSelection: pending,
      selection: pending
    });

    const repeatedIntermediate = reconcileCanvasSelection([], intermediate.pendingSemanticSelection);
    expect(repeatedIntermediate.accepted).toBe(false);
    expect(repeatedIntermediate.pendingSemanticSelection).toEqual(pending);

    expect(reconcileCanvasSelection([node('leaf1')], repeatedIntermediate.pendingSemanticSelection)).toEqual({
      accepted: true,
      selection: pending
    });
  });

  it('accepts native selection immediately when no semantic selection is pending', () => {
    expect(reconcileCanvasSelection([node('leaf2')])).toEqual({
      accepted: true,
      selection: [node('leaf2')]
    });
  });
});
