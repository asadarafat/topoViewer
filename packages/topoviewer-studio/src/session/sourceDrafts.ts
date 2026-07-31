import type {
  StudioSourceDraftDocument,
  StudioSourceDraftRecovery
} from '../contracts/project';

export interface StudioSourceDraftState {
  dirty: boolean;
  drafts: StudioSourceDraftRecovery;
  revision: number;
}

export interface StudioSourceDraftController {
  clear(document: StudioSourceDraftDocument): void;
  getSnapshot(): StudioSourceDraftState;
  reconcile(document: StudioSourceDraftDocument, sessionText: string): void;
  replace(
    document: StudioSourceDraftDocument,
    text: string,
    sessionText: string
  ): void;
  subscribe(listener: () => void): () => void;
}

function normalizedDrafts(recovery?: StudioSourceDraftRecovery): StudioSourceDraftRecovery {
  const drafts: StudioSourceDraftRecovery = {};
  if (typeof recovery?.topology === 'string') drafts.topology = recovery.topology;
  if (typeof recovery?.mapper === 'string') drafts.mapper = recovery.mapper;
  return drafts;
}

function immutableState(
  drafts: StudioSourceDraftRecovery,
  revision: number
): StudioSourceDraftState {
  const immutableDrafts = Object.freeze({ ...drafts });
  return Object.freeze({
    dirty: Object.keys(immutableDrafts).length > 0,
    drafts: immutableDrafts,
    revision
  });
}

export function createStudioSourceDraftController(
  recovery?: StudioSourceDraftRecovery
): StudioSourceDraftController {
  let state = immutableState(normalizedDrafts(recovery), 0);
  const listeners = new Set<() => void>();

  function publish(drafts: StudioSourceDraftRecovery) {
    state = immutableState(drafts, state.revision + 1);
    for (const listener of listeners) listener();
  }

  function clear(document: StudioSourceDraftDocument) {
    if (state.drafts[document] === undefined) return;
    const drafts = { ...state.drafts };
    delete drafts[document];
    publish(drafts);
  }

  return {
    clear,
    getSnapshot: () => state,
    reconcile(document, sessionText) {
      if (state.drafts[document] === sessionText) clear(document);
    },
    replace(document, text, sessionText) {
      if (text === sessionText) {
        clear(document);
        return;
      }
      if (state.drafts[document] === text) return;
      publish({ ...state.drafts, [document]: text });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

export function serializeStudioSourceDraftRecovery(
  state: StudioSourceDraftState
): StudioSourceDraftRecovery | undefined {
  return state.dirty ? { ...state.drafts } : undefined;
}
