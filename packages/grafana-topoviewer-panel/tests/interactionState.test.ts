import { afterEach, describe, expect, it } from 'vitest';
import type { TopoDocument } from 'topoviewer';
import {
  createPositionOverrideExtension,
  interactionStateStorageKey,
  loadInteractionState,
  normalizeInteractionOptions,
  persistInteractionState,
  topologyIdentityForDocument
} from '../src/interactionState';

class MemoryStorage {
  values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) || null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

function installWindowStorage() {
  const sessionStorage = new MemoryStorage();
  const localStorage = new MemoryStorage();
  (globalThis as { window?: unknown }).window = {
    sessionStorage,
    localStorage
  };
  return { sessionStorage, localStorage };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe('interaction state', () => {
  it('uses fixture and graph ID as topology identity', () => {
    expect(topologyIdentityForDocument({ graph: { id: 'graph-a' } }, 'fixture-a')).toBe('fixture-a:graph-a');
  });

  it('persists viewport, selection, and node positions to session storage by default', () => {
    const { sessionStorage } = installWindowStorage();
    const options = normalizeInteractionOptions(undefined);
    const state = {
      topologyIdentity: 'fixture-a:graph-a',
      viewport: { x: 10, y: 20, zoom: 1.4 },
      selectedObjectIds: ['node-a'],
      focusedObjectIds: ['node-a', 'link-a'],
      nodePositionOverrides: {
        'node-a': { x: 120, y: 240 }
      },
      updatedAt: '2026-06-27T00:00:00.000Z'
    };

    persistInteractionState(state, options);

    expect(sessionStorage.getItem(interactionStateStorageKey('fixture-a:graph-a', 'session'))).toContain('node-a');
    expect(loadInteractionState('fixture-a:graph-a', options)).toEqual(state);
  });

  it('keeps browser and session persistence fields separate', () => {
    installWindowStorage();
    const options = normalizeInteractionOptions({
      persistViewport: 'browser',
      persistSelection: 'session',
      persistNodePositions: 'off'
    });

    persistInteractionState({
      topologyIdentity: 'fixture-a:graph-a',
      viewport: { x: 1, y: 2, zoom: 3 },
      selectedObjectIds: ['node-a'],
      nodePositionOverrides: {
        'node-a': { x: 20, y: 30 }
      },
      updatedAt: '2026-06-27T00:00:00.000Z'
    }, options);

    expect(loadInteractionState('fixture-a:graph-a', options)).toMatchObject({
      viewport: { x: 1, y: 2, zoom: 3 },
      selectedObjectIds: ['node-a'],
      nodePositionOverrides: undefined
    });
  });

  it('creates a non-mutating position override extension', () => {
    const document: TopoDocument = {
      graph: {
        nodes: [
          { id: 'node-a', position: [0, 0] },
          { id: 'node-b', position: [10, 10] }
        ]
      }
    };
    const extension = createPositionOverrideExtension({
      'node-a': { x: 100, y: 200 }
    });

    const nextDocument = extension?.beforeCompile?.(document, {
      document,
      selectedLayerIds: [],
      toggles: {}
    });

    expect(document.graph?.nodes?.[0]?.position).toEqual([0, 0]);
    expect(nextDocument?.graph?.nodes?.[0]?.position).toEqual([100, 200]);
    expect(nextDocument?.graph?.nodes?.[1]?.position).toEqual([10, 10]);
  });
});
