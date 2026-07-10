import { toPng, toSvg } from 'html-to-image';
import { jsPDF } from 'jspdf';

export interface StaticExportOptions {
  fileName?: string;
  backgroundColor?: string;
  pixelRatio?: number;
  embedFonts?: boolean;
  height?: number;
  width?: number;
}

export interface StaticPdfExportOptions extends StaticExportOptions {
  orientation?: 'portrait' | 'landscape';
  unit?: 'pt' | 'px' | 'mm' | 'cm' | 'in';
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}

function exportTarget(element: HTMLElement): HTMLElement {
  return element.querySelector('.react-flow') as HTMLElement || element;
}

export async function topoviewerToPng(element: HTMLElement, options: StaticExportOptions = {}): Promise<string> {
  await document.fonts?.ready;
  return toPng(exportTarget(element), {
    backgroundColor: options.backgroundColor,
    ...(options.height ? { canvasHeight: options.height, height: options.height } : {}),
    ...(options.width ? { canvasWidth: options.width, width: options.width } : {}),
    pixelRatio: options.pixelRatio || (options.height || options.width ? 1 : 2),
    skipFonts: options.embedFonts !== true
  });
}

export async function topoviewerToSvg(element: HTMLElement, options: StaticExportOptions = {}): Promise<string> {
  await document.fonts?.ready;
  return toSvg(exportTarget(element), {
    backgroundColor: options.backgroundColor,
    ...(options.height ? { height: options.height } : {}),
    ...(options.width ? { width: options.width } : {}),
    skipFonts: options.embedFonts !== true
  });
}

export async function topoviewerToPdf(element: HTMLElement, options: StaticPdfExportOptions = {}): Promise<Blob> {
  const target = exportTarget(element);
  const box = target.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(box.width));
  const height = Math.max(1, Math.ceil(box.height));
  const orientation = options.orientation || (width >= height ? 'landscape' : 'portrait');
  const pdf = new jsPDF({
    orientation,
    unit: options.unit || 'px',
    format: [width, height],
    compress: true
  });
  const dataUrl = await topoviewerToPng(element, options);
  pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
  return pdf.output('blob');
}

export async function downloadTopoViewerPng(element: HTMLElement, options: StaticExportOptions = {}) {
  const dataUrl = await topoviewerToPng(element, options);
  downloadDataUrl(dataUrl, options.fileName || 'topoviewer.png');
}

export async function downloadTopoViewerSvg(element: HTMLElement, options: StaticExportOptions = {}) {
  const dataUrl = await topoviewerToSvg(element, options);
  downloadDataUrl(dataUrl, options.fileName || 'topoviewer.svg');
}

export async function downloadTopoViewerPdf(element: HTMLElement, options: StaticPdfExportOptions = {}) {
  const blob = await topoviewerToPdf(element, options);
  const dataUrl = URL.createObjectURL(blob);
  try {
    downloadDataUrl(dataUrl, options.fileName || 'topoviewer.pdf');
  } finally {
    setTimeout(() => URL.revokeObjectURL(dataUrl), 1000);
  }
}
