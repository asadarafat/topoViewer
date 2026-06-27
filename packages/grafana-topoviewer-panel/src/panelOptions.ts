import type { PanelOptionsEditorBuilder } from '@grafana/data';
import { listHarnessFixtureOptions } from './harnessFixtureCatalog';
import { DEFAULT_FIXTURE_ID, type GrafanaTopoViewerThemeMode } from './types';
import type { TopoViewerGrafanaPanelOptions } from './types';

export const themeModeOptions: Array<{ value: GrafanaTopoViewerThemeMode; label: string; description: string }> = [
  { value: 'auto', label: 'Auto', description: 'Follow the Grafana container theme where possible.' },
  { value: 'light', label: 'Light', description: 'Force light theme intent for future parity checks.' },
  { value: 'dark', label: 'Dark', description: 'Force dark theme intent for future parity checks.' }
];

export function applyTopoViewerPanelOptions(builder: PanelOptionsEditorBuilder<TopoViewerGrafanaPanelOptions>) {
  builder
    .addSelect<string, { options: Array<{ value: string; label: string; description: string }> }>({
      path: 'fixtureId',
      name: 'Harness fixture',
      description: 'Canonical TopoViewer harness fixture to render in this exploratory panel.',
      defaultValue: DEFAULT_FIXTURE_ID,
      settings: {
        options: listHarnessFixtureOptions()
      }
    })
    .addSelect<GrafanaTopoViewerThemeMode, { options: typeof themeModeOptions }>({
      path: 'themeMode',
      name: 'Theme mode',
      description: 'Phase 1 records the selected intent; renderer color parity remains driven by shared TopoViewer CSS.',
      defaultValue: 'auto',
      settings: {
        options: themeModeOptions
      }
    })
    .addBooleanSwitch({
      path: 'showControls',
      name: 'Show TopoViewer controls',
      defaultValue: true
    })
    .addBooleanSwitch({
      path: 'controlsOpen',
      name: 'Open controls by default',
      defaultValue: false
    })
    .addBooleanSwitch({
      path: 'telemetry.enabled',
      name: 'Apply telemetry overlay',
      description: 'Use Grafana data frames to style matching TopoViewer links and endpoint nodes.',
      defaultValue: false
    })
    .addNumberInput({
      path: 'telemetry.infoPercent',
      name: 'Info threshold',
      description: 'Utilization percentage where links move from healthy to informational.',
      defaultValue: 50,
      settings: {
        min: 0,
        max: 100,
        integer: true
      }
    })
    .addNumberInput({
      path: 'telemetry.warningPercent',
      name: 'Warning threshold',
      description: 'Utilization percentage where links are rendered as warning.',
      defaultValue: 80,
      settings: {
        min: 0,
        max: 100,
        integer: true
      }
    })
    .addNumberInput({
      path: 'telemetry.errorPercent',
      name: 'Error threshold',
      description: 'Utilization percentage where links are rendered as critical.',
      defaultValue: 90,
      settings: {
        min: 0,
        max: 100,
        integer: true
      }
    });
}
