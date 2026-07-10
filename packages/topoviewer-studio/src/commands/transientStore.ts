export interface StudioTransientDrag {
  id: string;
  position: { x: number; y: number };
}

export interface StudioTransientState {
  activeDrag?: StudioTransientDrag;
  helperLines?: { horizontal?: number; vertical?: number };
  hoveredObjectId?: string;
}

export interface StudioTransientStore {
  snapshot(): StudioTransientState;
  subscribe<T>(selector: (state: StudioTransientState) => T, listener: (value: T) => void): () => void;
  update(patch: Partial<StudioTransientState>): void;
}

export function createStudioTransientStore(initial: StudioTransientState = {}): StudioTransientStore {
  let state = initial;
  const subscriptions = new Set<{
    current: unknown;
    listener: (value: unknown) => void;
    selector: (state: StudioTransientState) => unknown;
  }>();

  return {
    snapshot: () => state,
    subscribe(selector, listener) {
      const subscription = {
        current: selector(state),
        listener: listener as (value: unknown) => void,
        selector: selector as (value: StudioTransientState) => unknown
      };
      subscriptions.add(subscription);
      return () => subscriptions.delete(subscription);
    },
    update(patch) {
      state = { ...state, ...patch };
      for (const subscription of subscriptions) {
        const next = subscription.selector(state);
        if (Object.is(next, subscription.current)) continue;
        subscription.current = next;
        subscription.listener(next);
      }
    }
  };
}
