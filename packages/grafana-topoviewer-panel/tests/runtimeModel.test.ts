import { describe, expect, it } from 'vitest';
import { createRuntimeModel, normalizePanelOptions } from '../src/runtimeModel';

describe('runtime model', () => {
  it('normalizes missing panel options', () => {
    expect(normalizePanelOptions(undefined)).toEqual({
      fixtureId: 'layered-network',
      themeMode: 'auto',
      showControls: true,
      controlsOpen: false,
      telemetry: {
        enabled: false,
        infoPercent: 50,
        warningPercent: 80,
        errorPercent: 90
      },
      interaction: {
        enabled: true,
        allowNodeDrag: true,
        persistViewport: 'session',
        persistSelection: 'session',
        persistNodePositions: 'session',
        resetOnTopologyIdentityChange: true
      }
    });
  });

  it('builds TopoViewer props from the selected generated fixture', () => {
    const model = createRuntimeModel({ fixtureId: 'clos-2spine-4leaf' });

    expect(model.diagnostics).toEqual([]);
    expect(model.fixture?.id).toBe('clos-2spine-4leaf');
    expect(model.document?.graph?.id).toBe('clos-2spine-4leaf');
    expect(model.topoviewerProps?.document).toBe(model.document);
    expect(model.topoviewerProps?.className).toContain('topoviewer-parity-theme');
  });

  it('returns an actionable diagnostic for an unknown fixture', () => {
    const model = createRuntimeModel({ fixtureId: 'missing-fixture' });

    expect(model.document).toBeUndefined();
    expect(model.diagnostics).toHaveLength(1);
    expect(model.diagnostics[0]?.code).toBe('invalid-fixture-id');
    expect(model.diagnostics[0]?.message).toContain('layered-network');
  });
});
