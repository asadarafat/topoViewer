import { topoviewerToPng, topoviewerToSvg } from 'topoviewer';
import type { StudioAssetContent } from '../contracts/host';
import type { StudioExportOptions, StudioExportSnapshot } from '../contracts/export';

const maximumDimension = 8192;
const maximumPixels = 32_000_000;
const maximumOutputBytes = 25 * 1024 * 1024;
const maximumAssetBytes = 10 * 1024 * 1024;
const imageMediaTypes = new Set(['image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']);

export interface StudioImageExportRequest {
  element: HTMLElement;
  onProgress?(stage: 'validate' | 'fonts' | 'render' | 'encode'): void;
  options: StudioExportOptions & { kind: 'png' | 'svg' };
  signal?: AbortSignal;
  snapshot: StudioExportSnapshot;
}

function abortIfRequested(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Image export was cancelled.', 'AbortError');
}

function dimension(value: number | undefined, fallback: number, name: string): number {
  const resolved = Math.round(value || fallback);
  if (!Number.isFinite(resolved) || resolved < 1 || resolved > maximumDimension) {
    throw new Error(`${name} must be between 1 and ${maximumDimension} pixels.`);
  }
  return resolved;
}

function remoteAssetReference(element: HTMLElement): string | undefined {
  const candidates = [...element.querySelectorAll('[src], [href]')];
  return candidates.map((candidate) => candidate.getAttribute('src') || candidate.getAttribute('href') || '')
    .find((value) => /^https?:/i.test(value));
}

export function validateStudioImageExport(request: StudioImageExportRequest) {
  const box = request.element.getBoundingClientRect();
  const width = dimension(request.options.width, Math.ceil(box.width), 'Export width');
  const height = dimension(request.options.height, Math.ceil(box.height), 'Export height');
  if (width * height > maximumPixels) throw new Error(`Image export exceeds the ${maximumPixels.toLocaleString()} pixel limit.`);
  const remoteReference = remoteAssetReference(request.element);
  if (remoteReference) throw new Error(`Image export will not fetch remote asset ${remoteReference}.`);
  request.snapshot.project.assets.forEach((asset) => {
    if (!imageMediaTypes.has(asset.mediaType)) throw new Error(`Asset ${asset.path} has unsupported media type ${asset.mediaType}.`);
    if (asset.size > maximumAssetBytes) throw new Error(`Asset ${asset.path} exceeds the ${maximumAssetBytes} byte limit.`);
  });
  return { height, width };
}

export function exportDataUrlBytes(dataUrl: string): Uint8Array {
  const separator = dataUrl.indexOf(',');
  if (separator < 0) throw new Error('Image exporter returned an invalid data URL.');
  const metadata = dataUrl.slice(0, separator);
  const payload = dataUrl.slice(separator + 1);
  if (/;base64(?:;|$)/i.test(metadata)) return Uint8Array.from(atob(payload), (character) => character.charCodeAt(0));
  return new TextEncoder().encode(decodeURIComponent(payload));
}

export async function exportStudioImage(request: StudioImageExportRequest): Promise<StudioAssetContent> {
  request.onProgress?.('validate');
  abortIfRequested(request.signal);
  const dimensions = validateStudioImageExport(request);
  request.onProgress?.('fonts');
  await document.fonts?.ready;
  abortIfRequested(request.signal);
  request.onProgress?.('render');
  const options = {
    backgroundColor: request.options.background,
    embedFonts: true,
    height: dimensions.height,
    width: dimensions.width
  };
  const dataUrl = request.options.kind === 'png'
    ? await topoviewerToPng(request.element, options)
    : await topoviewerToSvg(request.element, options);
  abortIfRequested(request.signal);
  request.onProgress?.('encode');
  const bytes = exportDataUrlBytes(dataUrl);
  if (bytes.byteLength > maximumOutputBytes) throw new Error(`Image export exceeds the ${maximumOutputBytes} byte output limit.`);
  const slug = request.snapshot.project.name.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'topoviewer';
  return { bytes, mediaType: request.options.kind === 'png' ? 'image/png' : 'image/svg+xml', name: `${slug}.${request.options.kind}` };
}
