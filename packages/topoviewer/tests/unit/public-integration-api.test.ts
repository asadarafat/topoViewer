import { describe, expect, it } from 'vitest';
import {
  ViewportSettingsPanel,
  authoringHelperLinesOptions,
  layerIds,
  reconcileSelectedLayerIds,
  toggleSelectedLayerId
} from '../../src/integration';

const layers = [
  { id: 'physical', name: 'Physical' },
  { id: 'services', name: 'Services' }
];

describe('public integration API', () => {
  it('exports shared viewport UI and the authoring helper-line policy', () => {
    expect(ViewportSettingsPanel).toBeTypeOf('function');
    expect(authoringHelperLinesOptions).toMatchObject({
      enabled: true,
      snap: true,
      snapMode: 'commit'
    });
  });

  it('exports deterministic layer selection helpers for host surfaces', () => {
    expect(layerIds(layers)).toEqual(['physical', 'services']);
    expect(reconcileSelectedLayerIds(layers, ['services', 'missing'])).toEqual(['services']);
    expect(reconcileSelectedLayerIds(layers, ['missing'])).toEqual(['physical', 'services']);
    expect(toggleSelectedLayerId(['physical'], 'services', true)).toEqual(['physical', 'services']);
    expect(toggleSelectedLayerId(['physical', 'services'], 'physical', false)).toEqual(['services']);
  });
});
