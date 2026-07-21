export interface StableActionFacade<T extends object> {
  readonly actions: T;
  update(actions: T): void;
}

export function createStableActionFacade<T extends object>(initialActions: T): StableActionFacade<T> {
  const keys = Object.keys(initialActions) as Array<keyof T>;
  const current = { actions: initialActions };
  const actions = Object.fromEntries(
    keys.map((key) => {
      if (typeof initialActions[key] !== 'function') {
        throw new TypeError(`Stable action "${String(key)}" must be a function.`);
      }
      return [
        key,
        (...args: unknown[]) =>
          (current.actions[key] as (...parameters: unknown[]) => unknown)(...args)
      ];
    })
  ) as T;

  return {
    actions,
    update(nextActions) {
      const nextKeys = Object.keys(nextActions);
      if (nextKeys.length !== keys.length || keys.some((key) => !Object.hasOwn(nextActions, key))) {
        throw new Error('Stable action keys cannot change after initialization.');
      }
      current.actions = nextActions;
    }
  };
}
