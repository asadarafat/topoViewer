import { describe, expect, it } from 'vitest';
import {
  defaultStudioViewportPreferences,
  normalizeStudioViewportPreferences,
  resolveStudioThemeColor
} from '../../src/features/viewport/types';

describe('Studio viewport preferences', () => {
  it('keeps default canvas colors under theme ownership', () => {
    expect(defaultStudioViewportPreferences).toMatchObject({
      backgroundColor: { mode: 'theme' },
      gridColor: { mode: 'theme' },
      version: 2
    });
  });

  it('migrates historical default colors to theme ownership', () => {
    for (const backgroundColor of ['#121212', '#0D151E']) {
      expect(
        normalizeStudioViewportPreferences({
          backgroundColor,
          gridColor: '#49657f'
        })
      ).toMatchObject({
        backgroundColor: { mode: 'theme' },
        gridColor: { mode: 'theme' },
        version: 2
      });
    }
  });

  it('preserves valid legacy custom colors and bounded interaction preferences', () => {
    expect(
      normalizeStudioViewportPreferences({
        backgroundColor: '#123456',
        gridColor: 'rgba(10, 20, 30, 0.5)',
        gridSize: 33.7,
        gridVisible: false,
        helperLinesEnabled: false,
        miniMapVisible: true,
        snapToAlignment: false,
        viewportControlsVisible: false
      })
    ).toEqual({
      backgroundColor: { mode: 'custom', value: '#123456' },
      gridColor: { mode: 'custom', value: 'rgba(10, 20, 30, 0.5)' },
      gridSize: 34,
      gridVisible: false,
      helperLinesEnabled: false,
      miniMapVisible: true,
      snapToAlignment: false,
      version: 2,
      viewportControlsVisible: false
    });
  });

  it('rejects malformed colors and out-of-range values', () => {
    expect(
      normalizeStudioViewportPreferences({
        backgroundColor: 'not a color(',
        gridColor: { mode: 'custom', value: '<script>' },
        gridSize: 4096,
        miniMapVisible: 'yes'
      })
    ).toEqual(defaultStudioViewportPreferences);
  });

  it('round-trips versioned theme and custom preferences', () => {
    const stored = {
      ...defaultStudioViewportPreferences,
      backgroundColor: { mode: 'custom' as const, value: 'color-mix(in srgb, #123456 70%, transparent)' },
      gridColor: { mode: 'theme' as const },
      gridSize: 48
    };
    expect(normalizeStudioViewportPreferences(stored)).toEqual(stored);
  });

  it('resolves theme colors while preserving explicit custom values', () => {
    expect(resolveStudioThemeColor({ mode: 'theme' }, '#ffffff')).toBe('#ffffff');
    expect(resolveStudioThemeColor({ mode: 'custom', value: '#123456' }, '#ffffff')).toBe('#123456');
  });
});
