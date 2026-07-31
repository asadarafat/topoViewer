import { describe, expect, it } from 'vitest';
import {
  defaultStudioWorkbenchPreferences,
  normalizeStudioSourceFraction,
  normalizeStudioWorkbenchPreferences,
  studioSourceFractionFromPointer
} from '../../src/features/workspace/workbenchLayout';

describe('Studio YAML-first workbench layout', () => {
  it('defaults to topology in a one-quarter source and three-quarter preview split', () => {
    expect(defaultStudioWorkbenchPreferences).toEqual({
      activeDocument: 'topology',
      activeDock: 'problems',
      authoringOpen: false,
      contextDrawer: undefined,
      dockCollapsed: false,
      layout: 'split',
      navigatorOpen: true,
      previewMode: 'edit',
      sourceFraction: 0.25
    });
    expect(normalizeStudioWorkbenchPreferences(undefined)).toEqual(defaultStudioWorkbenchPreferences);
  });

  it('normalizes persisted document, drawer, layout, navigator, and divider state', () => {
    expect(
      normalizeStudioWorkbenchPreferences({
        activeDocument: 'mapper',
        activeDock: 'history',
        authoringOpen: true,
        contextDrawer: 'mapper',
        dockCollapsed: true,
        layout: 'preview',
        navigatorOpen: false,
        previewMode: 'inspect',
        sourceFraction: 0.4
      })
    ).toEqual({
      activeDocument: 'mapper',
      activeDock: 'history',
      authoringOpen: true,
      contextDrawer: 'mapper',
      dockCollapsed: true,
      layout: 'preview',
      navigatorOpen: false,
      previewMode: 'inspect',
      sourceFraction: 0.4
    });

    expect(
      normalizeStudioWorkbenchPreferences({
        activeDocument: 'unknown',
        activeDock: 'unknown',
        authoringOpen: 'yes',
        contextDrawer: 'unknown',
        dockCollapsed: 'yes',
        layout: 'unknown',
        navigatorOpen: 'yes',
        previewMode: 'unknown',
        sourceFraction: 9
      })
    ).toEqual({
      ...defaultStudioWorkbenchPreferences,
      sourceFraction: 0.5
    });
  });

  it('migrates the previous rail preference without copying project state', () => {
    expect(
      normalizeStudioWorkbenchPreferences({
        panelOpen: true,
        workspaceView: 'properties',
        workspaceWidth: 420
      })
    ).toEqual({
      ...defaultStudioWorkbenchPreferences,
      contextDrawer: 'properties'
    });
    expect(
      normalizeStudioWorkbenchPreferences({
        panelOpen: false,
        workspaceView: 'mapper',
        workspaceWidth: 420
      })
    ).toEqual({
      ...defaultStudioWorkbenchPreferences,
      contextDrawer: undefined
    });
  });

  it('clamps source width and derives it from workbench pointer geometry', () => {
    expect(normalizeStudioSourceFraction(undefined)).toBe(0.25);
    expect(normalizeStudioSourceFraction(Number.NaN)).toBe(0.25);
    expect(normalizeStudioSourceFraction(0.05)).toBe(0.2);
    expect(normalizeStudioSourceFraction(0.36)).toBe(0.36);
    expect(normalizeStudioSourceFraction(0.9)).toBe(0.5);
    expect(studioSourceFractionFromPointer(450, 100, 1000)).toBe(0.35);
    expect(studioSourceFractionFromPointer(0, 100, 1000)).toBe(0.2);
    expect(studioSourceFractionFromPointer(900, 100, 1000)).toBe(0.5);
  });
});
