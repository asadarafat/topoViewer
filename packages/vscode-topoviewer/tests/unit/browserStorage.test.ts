import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeGetJson, safeGetString, safeRemoveItem, safeSetJson, safeSetString } from '../../src/webview/browserStorage';
import { initialSavedPresets, initialSplitPercent, presetStorageKey, splitStorageKey } from '../../src/webview/webviewAppSupport';

function storageMock(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    values
  };
}

describe('browser storage helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back when window storage is unavailable', () => {
    vi.stubGlobal('window', undefined);

    expect(safeGetString('missing', 'fallback')).toBe('fallback');
    expect(safeSetString('key', 'value')).toBe(false);
    expect(safeRemoveItem('key')).toBe(false);
  });

  it('falls back when storage access throws', () => {
    vi.stubGlobal('window', {
      get localStorage() {
        throw new Error('blocked');
      }
    });

    expect(safeGetString('blocked', 'fallback')).toBe('fallback');
    expect(safeSetString('blocked', 'value')).toBe(false);
  });

  it('ignores invalid JSON and preserves valid JSON', () => {
    const localStorage = storageMock({
      invalid: '{',
      valid: '{"enabled":true}'
    });
    vi.stubGlobal('window', { localStorage });

    expect(safeGetJson('invalid', { enabled: false })).toEqual({ enabled: false });
    expect(safeGetJson('valid', { enabled: false })).toEqual({ enabled: true });
  });

  it('handles write failures without throwing', () => {
    const localStorage = storageMock();
    localStorage.setItem.mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    vi.stubGlobal('window', { localStorage });

    expect(safeSetString('key', 'value')).toBe(false);
    expect(safeSetJson('key', { value: true })).toBe(false);
  });

  it('keeps current versioned harness preference keys readable', () => {
    const localStorage = storageMock({
      [splitStorageKey]: '42',
      [presetStorageKey]: JSON.stringify([{ id: 'router', kind: 'node', name: 'Router' }])
    });
    vi.stubGlobal('window', { localStorage });

    expect(initialSplitPercent()).toBe(42);
    expect(initialSavedPresets()).toEqual([{ id: 'router', kind: 'node', name: 'Router' }]);
  });
});
