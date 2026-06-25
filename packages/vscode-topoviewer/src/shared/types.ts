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
  kind?: 'template' | 'saved';
  name: string;
}

export interface WebviewDiagnostic {
  column?: number;
  document?: 'topology' | 'stylesheet';
  line?: number;
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

export interface ExportImagePayload {
  dataUrl: string;
  fileName: string;
  format: 'png' | 'svg';
}

export interface TopoViewerWebviewHost {
  readonly kind: 'vscode' | 'browser';
  loadInitialState(): Promise<WebviewState>;
  createTopology?(): Promise<WebviewState>;
  listFixtures?(): Promise<HarnessFixture[]>;
  loadFixture?(id: string): Promise<WebviewState>;
  revertState?(state: WebviewState): Promise<WebviewState>;
  saveState?(state: WebviewState): Promise<void> | void;
  validate(state: WebviewState): Promise<ValidationResult>;
  openDocs(target: string): Promise<void>;
  exportImage(payload: ExportImagePayload): Promise<void>;
}
