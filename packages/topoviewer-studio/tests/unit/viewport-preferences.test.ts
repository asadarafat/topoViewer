import { describe, expect, it } from 'vitest';
import { defaultStudioViewportPreferences, normalizeStudioViewportPreferences } from '../../src/features/viewport/types';

describe('Studio viewport preferences', () => {
  it('uses the MUI dark surface as the canvas default', () => {
    expect(defaultStudioViewportPreferences.backgroundColor).toBe('#121212');
  });

  it('normalizes untrusted host preferences against bounded defaults', () => {
    expect(
      normalizeStudioViewportPreferences({
        backgroundColor: '#123456',
        fitViewOnOpen: false,
        gridColor: '#abcdef',
        gridSize: 33.7,
        gridVisible: false,
        helperLinesEnabled: false,
        miniMapVisible: true,
        snapToAlignment: false,
        viewportControlsVisible: false
      })
    ).toEqual({
      backgroundColor: '#123456',
      fitViewOnOpen: false,
      gridColor: '#abcdef',
      gridSize: 34,
      gridVisible: false,
      helperLinesEnabled: false,
      miniMapVisible: true,
      snapToAlignment: false,
      viewportControlsVisible: false
    });
  });

  it('rejects out-of-range or malformed values without weakening the defaults', () => {
    expect(
      normalizeStudioViewportPreferences({
        backgroundColor: '',
        gridSize: 4096,
        miniMapVisible: 'yes'
      })
    ).toEqual(defaultStudioViewportPreferences);
  });

  it('migrates the previous canvas default to the MUI dark surface color', () => {
    expect(
      normalizeStudioViewportPreferences({
        backgroundColor: '#0D151E'
      }).backgroundColor
    ).toBe('#121212');
  });
});
