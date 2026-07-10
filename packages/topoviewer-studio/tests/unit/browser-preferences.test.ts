import { describe, expect, it } from 'vitest';
import { safeReadBrowserPreference, safeWriteBrowserPreference } from '../../src/hosts/browserPreferences';

function storage(): Storage {
  const values = new Map<string, string>();
  return {
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); }
  };
}

describe('safe browser preferences', () => {
  it('round-trips a small versioned UI preference', () => {
    const target = storage();
    expect(safeWriteBrowserPreference(target, 'authoring-profile.v1', { density: 'compact' }).ok).toBe(true);
    expect(safeReadBrowserPreference(target, 'authoring-profile.v1')).toEqual({
      ok: true,
      value: { density: 'compact' }
    });
    expect(target.key(0)).toMatch(/^topoviewer-studio:preference:v1:/);
  });

  it('rejects project-like keys and oversized values', () => {
    const target = storage();
    expect(safeWriteBrowserPreference(target, 'topology-source', 'forbidden')).toMatchObject({
      error: { code: 'invalid-request' }, ok: false
    });
    expect(safeWriteBrowserPreference(target, 'large-ui-state', 'x'.repeat(20_000))).toMatchObject({
      error: { code: 'invalid-request' }, ok: false
    });
    expect(target.length).toBe(0);
  });

  it('contains unavailable and quota failures', () => {
    const target = storage();
    target.setItem = () => { throw new DOMException('full', 'QuotaExceededError'); };
    expect(safeWriteBrowserPreference(target, 'theme', 'dark')).toMatchObject({
      error: { code: 'quota-exceeded', retryable: true }, ok: false
    });
    expect(safeReadBrowserPreference(undefined, 'theme')).toMatchObject({
      error: { code: 'unavailable' }, ok: false
    });
  });
});
