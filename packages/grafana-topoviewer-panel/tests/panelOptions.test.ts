import { describe, expect, it } from 'vitest';
import type { PanelOptionsEditorBuilder } from '@grafana/data';
import { applyTopoViewerPanelOptions } from '../src/panelOptions';
import type { TopoViewerGrafanaPanelOptions } from '../src/types';

class RecordingBuilder {
  calls: Array<{ kind: 'select' | 'boolean' | 'number'; config: Record<string, unknown> }> = [];

  addSelect(config: Record<string, unknown>) {
    this.calls.push({ kind: 'select', config });
    return this;
  }

  addBooleanSwitch(config: Record<string, unknown>) {
    this.calls.push({ kind: 'boolean', config });
    return this;
  }

  addNumberInput(config: Record<string, unknown>) {
    this.calls.push({ kind: 'number', config });
    return this;
  }
}

function asGrafanaBuilder(builder: RecordingBuilder) {
  return builder as unknown as PanelOptionsEditorBuilder<TopoViewerGrafanaPanelOptions>;
}

describe('panel options', () => {
  it('registers stable Phase 1 option defaults', () => {
    const builder = new RecordingBuilder();
    applyTopoViewerPanelOptions(asGrafanaBuilder(builder));

    expect(builder.calls.map((call) => call.config.path)).toEqual([
      'fixtureId',
      'themeMode',
      'showControls',
      'controlsOpen',
      'telemetry.enabled',
      'telemetry.infoPercent',
      'telemetry.warningPercent',
      'telemetry.errorPercent',
      'interaction.enabled',
      'interaction.allowNodeDrag',
      'interaction.persistViewport',
      'interaction.persistSelection',
      'interaction.persistNodePositions',
      'interaction.resetOnTopologyIdentityChange'
    ]);
    expect(builder.calls[0]?.config.defaultValue).toBe('layered-network');
    expect(builder.calls[1]?.config.defaultValue).toBe('auto');
    expect(builder.calls[2]?.config.defaultValue).toBe(true);
    expect(builder.calls[3]?.config.defaultValue).toBe(false);
    expect(builder.calls[4]?.config.defaultValue).toBe(false);
    expect(builder.calls[5]?.config.defaultValue).toBe(50);
    expect(builder.calls[6]?.config.defaultValue).toBe(80);
    expect(builder.calls[7]?.config.defaultValue).toBe(90);
    expect(builder.calls[8]?.config.defaultValue).toBe(true);
    expect(builder.calls[9]?.config.defaultValue).toBe(true);
    expect(builder.calls[10]?.config.defaultValue).toBe('session');
    expect(builder.calls[11]?.config.defaultValue).toBe('session');
    expect(builder.calls[12]?.config.defaultValue).toBe('session');
    expect(builder.calls[13]?.config.defaultValue).toBe(true);
  });

  it('offers all generated harness fixtures in the fixture selector', () => {
    const builder = new RecordingBuilder();
    applyTopoViewerPanelOptions(asGrafanaBuilder(builder));

    const settings = builder.calls[0]?.config.settings as { options: Array<{ value: string; label: string }> };
    expect(settings.options.map((option) => option.value)).toContain('clos-2spine-4leaf');
    expect(settings.options.map((option) => option.value)).toContain('region-label-placement');
  });
});
