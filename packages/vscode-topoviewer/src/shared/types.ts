import type { TopoDocument } from 'topoviewer';

export interface WebviewState {
  topologyText: string;
  stylesheetText: string;
  topologyPath?: string;
  stylesheetPath?: string;
  topologyMissing?: boolean;
  stylesheetMissing?: boolean;
  fixtureId?: string;
}

export interface HarnessFixture {
  id: string;
  name: string;
}

export interface WebviewDiagnostic {
  severity: 'error' | 'warning';
  source: 'schema' | 'semantic' | 'host';
  code: string;
  message: string;
  path?: string;
}

export interface ValidationResult {
  document?: TopoDocument;
  diagnostics: WebviewDiagnostic[];
  layers: Array<{ id: string; name?: string; objectCount: number }>;
}

export interface TopoViewerWebviewHost {
  readonly kind: 'vscode' | 'browser';
  loadInitialState(): Promise<WebviewState>;
  listFixtures?(): Promise<HarnessFixture[]>;
  loadFixture?(id: string): Promise<WebviewState>;
  validate(state: WebviewState): Promise<ValidationResult>;
  openDocs(target: string): Promise<void>;
  exportImage(): Promise<void>;
}
