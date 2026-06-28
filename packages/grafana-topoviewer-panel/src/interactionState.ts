import type { TopoDocument, TopoViewerExtension, TopoViewerViewport } from 'topoviewer';
import { GRAFANA_TOPOVIEWER_PLUGIN_ID, type InteractionPersistenceMode, type TopoViewerGrafanaInteractionOptions } from './types';

export interface PanelNodePosition {
  x: number;
  y: number;
}

export interface PanelInteractionState {
  topologyIdentity: string;
  viewport?: TopoViewerViewport;
  selectedObjectIds?: string[];
  focusedObjectIds?: string[];
  nodePositionOverrides?: Record<string, PanelNodePosition>;
  updatedAt: string;
}

type InteractionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const emptyStateTimestamp = '1970-01-01T00:00:00.000Z';

export function topologyIdentityForDocument(document: TopoDocument | undefined, topologySourceId: string): string {
  return `${topologySourceId}:${document?.graph?.id || 'unknown'}`;
}

export function emptyInteractionState(topologyIdentity: string): PanelInteractionState {
  return {
    topologyIdentity,
    updatedAt: emptyStateTimestamp
  };
}

export function normalizeInteractionOptions(options: TopoViewerGrafanaInteractionOptions | undefined): Required<TopoViewerGrafanaInteractionOptions> {
  return {
    enabled: options?.enabled ?? true,
    allowNodeDrag: options?.allowNodeDrag ?? true,
    persistViewport: options?.persistViewport ?? 'session',
    persistSelection: options?.persistSelection ?? 'session',
    persistNodePositions: options?.persistNodePositions ?? 'session',
    resetOnTopologyIdentityChange: options?.resetOnTopologyIdentityChange ?? true
  };
}

export function interactionStateStorageKey(topologyIdentity: string, mode: Exclude<InteractionPersistenceMode, 'off'>): string {
  return `${GRAFANA_TOPOVIEWER_PLUGIN_ID}:interaction:${mode}:${topologyIdentity}`;
}

export function storageForInteractionMode(mode: InteractionPersistenceMode): InteractionStorage | undefined {
  if (mode === 'off' || typeof window === 'undefined') return undefined;
  try {
    return mode === 'browser' ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined;
  }
}

function readState(storage: InteractionStorage | undefined, key: string): PanelInteractionState | undefined {
  if (!storage) return undefined;
  try {
    const raw = storage.getItem(key);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as PanelInteractionState;
    if (!parsed || typeof parsed !== 'object') return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function stateForMode(state: PanelInteractionState, options: Required<TopoViewerGrafanaInteractionOptions>, mode: Exclude<InteractionPersistenceMode, 'off'>): PanelInteractionState {
  return {
    topologyIdentity: state.topologyIdentity,
    updatedAt: state.updatedAt,
    ...(options.persistViewport === mode && state.viewport ? { viewport: state.viewport } : {}),
    ...(options.persistSelection === mode && state.selectedObjectIds?.length ? { selectedObjectIds: state.selectedObjectIds } : {}),
    ...(options.persistSelection === mode && state.focusedObjectIds?.length ? { focusedObjectIds: state.focusedObjectIds } : {}),
    ...(options.persistNodePositions === mode && state.nodePositionOverrides ? { nodePositionOverrides: state.nodePositionOverrides } : {})
  };
}

function hasPersistedFields(state: PanelInteractionState): boolean {
  return Boolean(
    state.viewport ||
    state.selectedObjectIds?.length ||
    state.focusedObjectIds?.length ||
    Object.keys(state.nodePositionOverrides || {}).length
  );
}

export function loadInteractionState(
  topologyIdentity: string,
  options: Required<TopoViewerGrafanaInteractionOptions>
): PanelInteractionState {
  if (!options.enabled) return emptyInteractionState(topologyIdentity);
  const sessionState = readState(storageForInteractionMode('session'), interactionStateStorageKey(topologyIdentity, 'session'));
  const browserState = readState(storageForInteractionMode('browser'), interactionStateStorageKey(topologyIdentity, 'browser'));
  return {
    topologyIdentity,
    updatedAt: sessionState?.updatedAt || browserState?.updatedAt || emptyStateTimestamp,
    viewport: options.persistViewport === 'session' ? sessionState?.viewport : options.persistViewport === 'browser' ? browserState?.viewport : undefined,
    selectedObjectIds: options.persistSelection === 'session' ? sessionState?.selectedObjectIds : options.persistSelection === 'browser' ? browserState?.selectedObjectIds : undefined,
    focusedObjectIds: options.persistSelection === 'session' ? sessionState?.focusedObjectIds : options.persistSelection === 'browser' ? browserState?.focusedObjectIds : undefined,
    nodePositionOverrides: options.persistNodePositions === 'session' ? sessionState?.nodePositionOverrides : options.persistNodePositions === 'browser' ? browserState?.nodePositionOverrides : undefined
  };
}

export function persistInteractionState(
  state: PanelInteractionState,
  options: Required<TopoViewerGrafanaInteractionOptions>
) {
  if (!options.enabled) return;
  for (const mode of ['session', 'browser'] as const) {
    const storage = storageForInteractionMode(mode);
    if (!storage) continue;
    const key = interactionStateStorageKey(state.topologyIdentity, mode);
    const nextState = stateForMode(state, options, mode);
    if (!hasPersistedFields(nextState)) {
      storage.removeItem(key);
      continue;
    }
    storage.setItem(key, JSON.stringify(nextState));
  }
}

export function withInteractionTimestamp(state: Omit<PanelInteractionState, 'updatedAt'>): PanelInteractionState {
  return {
    ...state,
    updatedAt: new Date().toISOString()
  };
}

export function createPositionOverrideExtension(
  nodePositionOverrides: PanelInteractionState['nodePositionOverrides'] | undefined
): TopoViewerExtension | undefined {
  if (!nodePositionOverrides || !Object.keys(nodePositionOverrides).length) return undefined;
  return {
    name: 'grafana-interaction-position-overrides',
    beforeCompile(document) {
      if (!document.graph?.nodes?.length) return document;
      return {
        ...document,
        graph: {
          ...document.graph,
          nodes: document.graph.nodes.map((node) => {
            const override = nodePositionOverrides[node.id];
            return override ? { ...node, position: [override.x, override.y] } : node;
          })
        }
      };
    }
  };
}
