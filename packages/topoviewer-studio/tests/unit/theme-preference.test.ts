import { describe, expect, it } from 'vitest';
import {
  normalizeStudioColorModePreference,
  resolveStudioEffectiveColorMode,
  studioColorModePreferenceKey
} from '../../src/ui/themePreference';

describe('Studio appearance preference', () => {
  it('normalizes only supported persisted values', () => {
    expect(normalizeStudioColorModePreference('system')).toBe('system');
    expect(normalizeStudioColorModePreference('light')).toBe('light');
    expect(normalizeStudioColorModePreference('dark')).toBe('dark');
    expect(normalizeStudioColorModePreference('auto')).toBe('system');
    expect(normalizeStudioColorModePreference({ mode: 'dark' })).toBe('system');
    expect(normalizeStudioColorModePreference(undefined)).toBe('system');
  });

  it('resolves System without changing explicit overrides', () => {
    expect(resolveStudioEffectiveColorMode('system', 'light')).toBe('light');
    expect(resolveStudioEffectiveColorMode('system', 'dark')).toBe('dark');
    expect(resolveStudioEffectiveColorMode('light', 'dark')).toBe('light');
    expect(resolveStudioEffectiveColorMode('dark', 'light')).toBe('dark');
  });

  it('owns one versioned host preference key', () => {
    expect(studioColorModePreferenceKey).toBe('studio.color-mode');
  });
});
