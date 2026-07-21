import { useRef } from 'react';
import { createStableActionFacade, type StableActionFacade } from './stableActions';

export function useStableActions<T extends object>(actions: T): T {
  const facade = useRef<StableActionFacade<T>>();
  if (!facade.current) facade.current = createStableActionFacade(actions);
  facade.current.update(actions);
  return facade.current.actions;
}
