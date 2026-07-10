import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  StudioAuthoringProfileOverride,
  StudioCommand,
  StudioExportSnapshot,
  StudioHost,
  StudioHostError,
  StudioProject,
  StudioResult,
  StudioSessionSnapshot
} from '../../src';

describe('Studio public contracts', () => {
  it('keeps host payloads serializable and browser/editor neutral', () => {
    const error: StudioHostError = {
      code: 'conflict',
      details: { expected: 'a', actual: 'b' },
      message: 'The project changed outside Studio.',
      retryable: true
    };
    const result: StudioResult<never> = { error, ok: false };
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });

  it('exports the intended contract types without exporting application UI', () => {
    expectTypeOf<StudioHost>().toBeObject();
    expectTypeOf<StudioProject>().toBeObject();
    expectTypeOf<StudioSessionSnapshot>().toBeObject();
    expectTypeOf<StudioCommand>().toBeObject();
    expectTypeOf<StudioExportSnapshot>().toBeObject();
    expectTypeOf<StudioAuthoringProfileOverride>().toBeObject();
  });
});

