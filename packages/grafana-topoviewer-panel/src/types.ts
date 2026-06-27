import type { TopoDocument, TopoViewerProps } from 'topoviewer';

export const GRAFANA_TOPOVIEWER_PLUGIN_ID = 'asadarafat-topoviewer-panel';
export const DEFAULT_FIXTURE_ID = 'layered-network';

export type GrafanaTopoViewerThemeMode = 'auto' | 'light' | 'dark';

export interface TopoViewerGrafanaTelemetryOptions {
  enabled?: boolean;
  infoPercent?: number;
  warningPercent?: number;
  errorPercent?: number;
}

export interface TopoViewerGrafanaPanelOptions {
  fixtureId?: string;
  themeMode?: GrafanaTopoViewerThemeMode;
  showControls?: boolean;
  controlsOpen?: boolean;
  telemetry?: TopoViewerGrafanaTelemetryOptions;
}

export interface GrafanaHarnessFixture {
  id: string;
  name: string;
  order: number;
  source: {
    topology: string;
    stylesheet: string;
  };
  topologyYaml: string;
  stylesheetYaml: string;
}

export interface GrafanaPanelDiagnostic {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
}

export interface GrafanaTopoViewerRuntimeModel {
  fixture?: GrafanaHarnessFixture;
  document?: TopoDocument;
  diagnostics: GrafanaPanelDiagnostic[];
  topoviewerProps?: Pick<
    TopoViewerProps,
    'document' | 'controlPanelToggle' | 'className' | 'extensions' | 'selectedObjectIds' | 'onObjectClick' | 'onPaneClick'
  >;
}
