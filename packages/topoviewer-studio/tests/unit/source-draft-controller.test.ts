import { describe, expect, it, vi } from 'vitest';
import {
  createStudioSourceDraftController,
  serializeStudioSourceDraftRecovery
} from '../../src/session/sourceDrafts';

describe('Studio source draft controller', () => {
  it('owns only topology and mapper text that differs from applied source', () => {
    const controller = createStudioSourceDraftController();
    const listener = vi.fn();
    controller.subscribe(listener);

    controller.replace('topology', 'graph:\n  id: changed\n', 'graph:\n  id: applied\n');

    expect(controller.getSnapshot()).toEqual({
      dirty: true,
      drafts: { topology: 'graph:\n  id: changed\n' },
      revision: 1
    });
    expect(listener).toHaveBeenCalledTimes(1);

    controller.replace('topology', 'graph:\n  id: applied\n', 'graph:\n  id: applied\n');
    expect(controller.getSnapshot()).toEqual({
      dirty: false,
      drafts: {},
      revision: 2
    });
  });

  it('restores bounded string drafts and clears text after session ownership changes', () => {
    const controller = createStudioSourceDraftController({
      mapper: 'version: "0.2"\nrules: []\n',
      topology: 'graph:\n  id: recovered\n'
    });

    expect(serializeStudioSourceDraftRecovery(controller.getSnapshot())).toEqual({
      mapper: 'version: "0.2"\nrules: []\n',
      topology: 'graph:\n  id: recovered\n'
    });

    controller.reconcile('topology', 'graph:\n  id: recovered\n');
    expect(controller.getSnapshot().drafts).toEqual({
      mapper: 'version: "0.2"\nrules: []\n'
    });

    controller.clear('mapper');
    expect(serializeStudioSourceDraftRecovery(controller.getSnapshot())).toBeUndefined();
  });

  it('ignores malformed recovery values instead of exposing them to Monaco', () => {
    const controller = createStudioSourceDraftController({
      mapper: 17,
      topology: 'graph:\n  id: recovered\n',
      stylesheet: 'not-owned-here'
    } as never);

    expect(controller.getSnapshot().drafts).toEqual({
      topology: 'graph:\n  id: recovered\n'
    });
  });
});
