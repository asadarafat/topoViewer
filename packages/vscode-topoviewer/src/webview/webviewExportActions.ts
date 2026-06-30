import { downloadTopoViewerPng, topoviewerToPng, type TopoDocument } from 'topoviewer';
import type { TopoViewerWebviewHost, ValidationResult, WebviewState } from '../shared/types';

export type ExportStatus = 'idle' | 'exporting' | 'complete' | 'error';

export async function exportPreviewImage(options: {
  flash: (message: string) => void;
  hasExportBlockers: boolean;
  host: TopoViewerWebviewHost;
  setExportStatus: (status: ExportStatus) => void;
  state?: WebviewState;
  target: HTMLElement | null;
  themeMode: 'light' | 'dark';
  visibleDocument?: TopoDocument;
}) {
  const { flash, hasExportBlockers, host, setExportStatus, state, target, themeMode, visibleDocument } = options;
  if (!target) {
    flash('Export target is not ready');
    return;
  }
  if (hasExportBlockers) {
    flash('Fix diagnostics before exporting');
    return;
  }
  const fileName = `${visibleDocument?.graph?.id || state?.fixtureId || 'topoviewer'}.png`;
  setExportStatus('exporting');
  try {
    if (host.kind === 'browser') {
      await downloadTopoViewerPng(target, { fileName, backgroundColor: themeMode === 'dark' ? '#0b1118' : '#f8fafc' });
    } else {
      const dataUrl = await topoviewerToPng(target, { backgroundColor: themeMode === 'dark' ? '#0b1118' : '#f8fafc' });
      await host.exportImage({ dataUrl, fileName, format: 'png' });
    }
    setExportStatus('complete');
    flash(`Exported ${fileName}`);
  } catch (error) {
    setExportStatus('error');
    flash(error instanceof Error ? error.message : 'Export failed');
  } finally {
    window.setTimeout(() => setExportStatus('idle'), 1800);
  }
}

function bundleBaseName(visibleDocument: TopoDocument | undefined, state: WebviewState | undefined) {
  const raw = String(visibleDocument?.graph?.id || state?.fixtureId || 'topoviewer');
  return raw.trim().replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'topoviewer';
}

function downloadTextFile(fileName: string, text: string) {
  const blob = new Blob([text], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadYamlBundle(options: {
  draftMapperText: string;
  draftStylesheetText: string;
  draftTopologyText: string;
  flash: (message: string) => void;
  host: TopoViewerWebviewHost;
  setDraftValidation: (validation: ValidationResult) => void;
  state?: WebviewState;
  visibleDocument?: TopoDocument;
}) {
  const { draftMapperText, draftStylesheetText, draftTopologyText, flash, host, setDraftValidation, state, visibleDocument } = options;
  if (!state) return;
  const draftState = {
    ...state,
    mapperText: draftMapperText,
    stylesheetText: draftStylesheetText,
    topologyText: draftTopologyText
  };
  const result = await host.validate(draftState);
  setDraftValidation(result);
  if (result.diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    flash('Fix YAML diagnostics before exporting bundle');
    return;
  }
  const baseName = bundleBaseName(visibleDocument, state);
  downloadTextFile(`${baseName}.topo.tv.yaml`, draftTopologyText);
  downloadTextFile(`${baseName}.style.tv.yaml`, draftStylesheetText);
  downloadTextFile(`${baseName}.mapper.tv.yaml`, draftMapperText || 'version: 1\nrules: []\n');
  flash(`Exported ${baseName} bundle`);
}

export async function copyTextToClipboard(label: string, text: string, flash: (message: string) => void) {
  try {
    let copied = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        copied = false;
      }
    }
    if (!copied) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    flash(`Copied ${label}`);
  } catch (error) {
    flash(error instanceof Error ? error.message : 'Copy failed');
  }
}
