import { useEffect, useRef } from 'react';
import type { TopoViewerWebviewHost } from '../shared/types';
import type { TopoObjectSelection } from '../shared/topologyMutations';

interface BrowserHarnessActions {
  selectObject(selection: TopoObjectSelection): void;
}

declare global {
  interface Window {
    __topoviewerHarnessActions?: BrowserHarnessActions;
  }
}

export function useBrowserHarnessActions(host: TopoViewerWebviewHost, actions: BrowserHarnessActions) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    if (host.kind !== 'browser') return undefined;
    window.__topoviewerHarnessActions = {
      selectObject(selection) {
        actionsRef.current.selectObject(selection);
      }
    };
    return () => {
      delete window.__topoviewerHarnessActions;
    };
  }, [host.kind]);
}
