import type { StaticExportOptions, StaticPdfExportOptions } from './export';

type ExportImplementation = typeof import('./export');

let exportImplementation: Promise<ExportImplementation> | undefined;

function loadExportImplementation(): Promise<ExportImplementation> {
  exportImplementation ??= import('./export');
  return exportImplementation;
}

export async function topoviewerToPng(element: HTMLElement, options?: StaticExportOptions): Promise<string> {
  return (await loadExportImplementation()).topoviewerToPng(element, options);
}

export async function topoviewerToSvg(element: HTMLElement, options?: StaticExportOptions): Promise<string> {
  return (await loadExportImplementation()).topoviewerToSvg(element, options);
}

export async function topoviewerToPdf(element: HTMLElement, options?: StaticPdfExportOptions): Promise<Blob> {
  return (await loadExportImplementation()).topoviewerToPdf(element, options);
}

export async function downloadTopoViewerPng(element: HTMLElement, options?: StaticExportOptions): Promise<void> {
  return (await loadExportImplementation()).downloadTopoViewerPng(element, options);
}

export async function downloadTopoViewerSvg(element: HTMLElement, options?: StaticExportOptions): Promise<void> {
  return (await loadExportImplementation()).downloadTopoViewerSvg(element, options);
}

export async function downloadTopoViewerPdf(element: HTMLElement, options?: StaticPdfExportOptions): Promise<void> {
  return (await loadExportImplementation()).downloadTopoViewerPdf(element, options);
}
