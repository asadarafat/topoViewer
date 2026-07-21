import { describe, expectTypeOf, it } from 'vitest';
import type { StudioCanvasActions, StudioCanvasModel } from '../../src/features/canvas/contracts';

describe('Studio canvas feature contract', () => {
  it('exposes state through one immutable model', () => {
    expectTypeOf<StudioCanvasModel>().toHaveProperty('snapshot');
    expectTypeOf<StudioCanvasModel>().toHaveProperty('viewportPreferences');
    expectTypeOf<StudioCanvasModel>().toHaveProperty('stylesheetCandidate');
  });

  it('exposes mutations through one action interface', () => {
    expectTypeOf<StudioCanvasActions>().toHaveProperty('createConnection');
    expectTypeOf<StudioCanvasActions>().toHaveProperty('moveObjects');
    expectTypeOf<StudioCanvasActions>().toHaveProperty('resizeObject');
    expectTypeOf<StudioCanvasActions>().toHaveProperty('selectFromCanvas');
  });
});
