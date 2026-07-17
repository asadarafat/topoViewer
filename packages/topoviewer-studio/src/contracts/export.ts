import type { StudioDiagnostic, StudioProject } from './project';
import type { StudioAssetContent, StudioExportKind } from './host';

export interface StudioExportOptions {
  background?: string;
  height?: number;
  kind: StudioExportKind;
  theme?: 'light' | 'dark';
  width?: number;
}

export interface StudioExportSnapshot {
  project: Readonly<StudioProject>;
  sourceRevision: string;
}

export interface StudioExportResult {
  artifacts: StudioAssetContent[];
  diagnostics: StudioDiagnostic[];
  sourceRevision: string;
}

export interface StudioExporter {
  export(snapshot: StudioExportSnapshot, options: StudioExportOptions): Promise<StudioExportResult>;
  readonly kind: StudioExportKind;
}
