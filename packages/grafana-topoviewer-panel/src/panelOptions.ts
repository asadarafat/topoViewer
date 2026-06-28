import type { PanelOptionsEditorBuilder } from '@grafana/data';
import { listHarnessFixtureOptions } from './harnessFixtureCatalog';
import {
  DEFAULT_FIXTURE_ID,
  DEFAULT_MOUNTED_BUNDLE_ROOT,
  type GrafanaTopoViewerSourceMode,
  type GrafanaTopoViewerThemeMode,
  type InteractionPersistenceMode
} from './types';
import type { TopoViewerGrafanaPanelOptions } from './types';

export const sourceModeOptions: Array<{ value: GrafanaTopoViewerSourceMode; label: string; description: string }> = [
  { value: 'mountedBundle', label: 'Topology bundle', description: 'Render topology/style/mapper YAML mounted into the Grafana container.' },
  { value: 'fixture', label: 'Bundled example', description: 'Compatibility mode for generated TopoViewer examples used by demos and CI.' }
];

export const themeModeOptions: Array<{ value: GrafanaTopoViewerThemeMode; label: string; description: string }> = [
  { value: 'auto', label: 'Auto', description: 'Follow the Grafana container theme where possible.' },
  { value: 'light', label: 'Light', description: 'Force light theme intent for future parity checks.' },
  { value: 'dark', label: 'Dark', description: 'Force dark theme intent for future parity checks.' }
];

export const interactionPersistenceOptions: Array<{ value: InteractionPersistenceMode; label: string; description: string }> = [
  { value: 'off', label: 'Off', description: 'Do not persist this interaction state.' },
  { value: 'session', label: 'Session', description: 'Persist until the browser tab/session ends.' },
  { value: 'browser', label: 'Browser', description: 'Persist in browser storage across tab and browser restarts.' }
];

export function applyTopoViewerPanelOptions(builder: PanelOptionsEditorBuilder<TopoViewerGrafanaPanelOptions>) {
  builder
    .addSelect<GrafanaTopoViewerSourceMode, { options: typeof sourceModeOptions }>({
      path: 'sourceMode',
      name: 'Topology source',
      description: 'Choose whether the panel renders a production topology bundle or a bundled example fixture.',
      defaultValue: 'mountedBundle',
      settings: {
        options: sourceModeOptions
      }
    })
    .addSelect<string, { options: Array<{ value: string; label: string; description: string }> }>({
      path: 'fixtureId',
      name: 'Example topology',
      description: 'Bundled TopoViewer example to render for demos and regression checks.',
      defaultValue: DEFAULT_FIXTURE_ID,
      settings: {
        options: listHarnessFixtureOptions()
      }
    })
    .addTextInput({
      path: 'mountedBundle.bundleRoot',
      name: 'Bundle root',
      description: 'Container path containing one directory per TopoViewer bundle. Each bundle needs *.topo.tv.yaml, *.style.tv.yaml, and *.mapper.tv.yaml.',
      defaultValue: DEFAULT_MOUNTED_BUNDLE_ROOT
    })
    .addTextInput({
      path: 'mountedBundle.manifestPath',
      name: 'Bundle manifest',
      description: 'Optional manifest path under the mounted bundle root. Use it to select explicit topology/style/mapper files when suffix discovery is ambiguous.',
      defaultValue: ''
    })
    .addTextInput({
      path: 'mountedBundle.selectedBundleId',
      name: 'Selected topology',
      description: 'Optional topology bundle directory name. If omitted, the panel selects the first discovered complete bundle.',
      defaultValue: ''
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
    })
    .addBooleanSwitch({
      path: 'interaction.enabled',
      name: 'Enable interaction state',
      description: 'Capture panel viewport, selection, and optional node position overrides as Grafana runtime state.',
      defaultValue: true
    })
    .addBooleanSwitch({
      path: 'interaction.allowNodeDrag',
      name: 'Allow node drag',
      description: 'Let operators drag nodes locally without changing canonical topology YAML.',
      defaultValue: true
    })
    .addSelect<InteractionPersistenceMode, { options: typeof interactionPersistenceOptions }>({
      path: 'interaction.persistViewport',
      name: 'Persist viewport',
      description: 'Controls whether pan and zoom are restored after refresh.',
      defaultValue: 'session',
      settings: {
        options: interactionPersistenceOptions
      }
    })
    .addSelect<InteractionPersistenceMode, { options: typeof interactionPersistenceOptions }>({
      path: 'interaction.persistSelection',
      name: 'Persist selection',
      description: 'Controls whether selected and focused topology objects are restored after refresh.',
      defaultValue: 'session',
      settings: {
        options: interactionPersistenceOptions
      }
    })
    .addSelect<InteractionPersistenceMode, { options: typeof interactionPersistenceOptions }>({
      path: 'interaction.persistNodePositions',
      name: 'Persist node positions',
      description: 'Controls whether local node drag overrides are restored after refresh.',
      defaultValue: 'session',
      settings: {
        options: interactionPersistenceOptions
      }
    })
    .addBooleanSwitch({
      path: 'interaction.resetOnTopologyIdentityChange',
      name: 'Reset on topology change',
      description: 'Use a separate interaction state key for each topology source and graph identity.',
      defaultValue: true
    });
}
