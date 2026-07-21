import { describe, expect, it, vi } from 'vitest';
import { createStableActionFacade } from '../../src/contracts/stableActions';

describe('stable action facade', () => {
  it('preserves action identity while invoking the latest implementation', () => {
    const first = vi.fn(() => 'first');
    const second = vi.fn(() => 'second');
    const facade = createStableActionFacade({ run: first });
    const stableRun = facade.actions.run;

    expect(stableRun()).toBe('first');
    facade.update({ run: second });

    expect(facade.actions.run).toBe(stableRun);
    expect(stableRun()).toBe('second');
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('rejects action contract changes after initialization', () => {
    const facade = createStableActionFacade({ run: () => undefined });
    expect(() => facade.update({ stop: () => undefined } as unknown as { run(): undefined })).toThrow(
      'Stable action keys cannot change after initialization.'
    );
  });
});
