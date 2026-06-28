import type { TopoDocument, TopoViewerProps } from 'topoviewer';
import type { TopoViewerMapper } from './mapperTypes';

export const GRAFANA_TOPOVIEWER_PLUGIN_ID = 'asadarafat-topoviewer-panel';
export const DEFAULT_FIXTURE_ID = 'layered-network';
export const DEFAULT_MOUNTED_BUNDLE_ROOT = '/etc/topoviewer/bundles';

export type GrafanaTopoViewerThemeMode = 'auto' | 'light' | 'dark';
export type GrafanaTopoViewerSourceMode = 'fixture' | 'mountedBundle';
export type InteractionPersistenceMode = 'off' | 'session' | 'browser';

export interface TopoViewerGrafanaTelemetryOptions {
  enabled?: boolean;
  infoPercent?: number;
  warningPercent?: number;
  errorPercent?: number;
}

export interface TopoViewerGrafanaInteractionOptions {
  enabled?: boolean;
  allowNodeDrag?: boolean;
  persistViewport?: InteractionPersistenceMode;
  persistSelection?: InteractionPersistenceMode;
  persistNodePositions?: InteractionPersistenceMode;
  resetOnTopologyIdentityChange?: boolean;
}

export interface TopoViewerGrafanaMountedBundleOptions {
  bundleRoot?: string;
  manifestPath?: string;
  selectedBundleId?: string;
}

export interface TopoViewerGrafanaPanelOptions {
  sourceMode?: GrafanaTopoViewerSourceMode;
  fixtureId?: string;
  mountedBundle?: TopoViewerGrafanaMountedBundleOptions;
  themeMode?: GrafanaTopoViewerThemeMode;
  showControls?: boolean;
  controlsOpen?: boolean;
  telemetry?: TopoViewerGrafanaTelemetryOptions;
  interaction?: TopoViewerGrafanaInteractionOptions;
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

export interface GrafanaMountedBundle {
  id: string;
  name: string;
  root: string;
  topologyPath: string;
  stylesheetPath: string;
  mapperPath: string;
}

export interface GrafanaMountedBundlePayload {
  bundle: GrafanaMountedBundle;
  topologyYaml: string;
  stylesheetYaml: string;
  mapperYaml: string;
  diagnostics: GrafanaPanelDiagnostic[];
}

export interface GrafanaMountedBundleIndex {
  root: string;
  manifestPath?: string;
  bundles: GrafanaMountedBundle[];
  diagnostics: GrafanaPanelDiagnostic[];
}

export interface GrafanaPanelDiagnostic {
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  bundleId?: string;
  path?: string;
  document?: string;
  line?: number;
  column?: number;
}

export interface GrafanaTopoViewerRuntimeModel {
  fixture?: GrafanaHarnessFixture;
  mountedBundle?: GrafanaMountedBundlePayload;
  document?: TopoDocument;
  mapper?: TopoViewerMapper;
  diagnostics: GrafanaPanelDiagnostic[];
  topoviewerProps?: Pick<
    TopoViewerProps,
    | 'document'
    | 'controlPanelToggle'
    | 'className'
    | 'extensions'
    | 'initialViewport'
    | 'nodesDraggable'
    | 'selectedObjectIds'
    | 'onObjectClick'
    | 'onPaneClick'
    | 'onNodePositionChange'
    | 'onViewportChange'
  >;
}
