import { sanitizeSvg } from 'topoviewer/security';
import type { StudioAssetContent } from '../contracts/host';
import { studioSecurityLimits } from './limits';
import { canonicalStudioPath } from './pathSecurity';

export const maximumStudioAssetBytes = studioSecurityLimits.assetBytes;
export const maximumStudioImageDimension = studioSecurityLimits.imageDimension;
export const maximumStudioImagePixels = studioSecurityLimits.imagePixels;

export const studioImageMediaTypes = new Set(['image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']);

interface ImageDimensions {
  height: number;
  width: number;
}

export interface StudioAssetValidationOptions {
  allowMediaTypeSniffing?: boolean;
  maximumBytes?: number;
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

function detectedRasterMediaType(bytes: Uint8Array): string | undefined {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38]) && (bytes[4] === 0x37 || bytes[4] === 0x39) && bytes[5] === 0x61) return 'image/gif';
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return undefined;
}

function rasterDimensions(bytes: Uint8Array, mediaType: string): ImageDimensions | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (mediaType === 'image/png' && bytes.byteLength >= 24) {
    return { height: view.getUint32(20), width: view.getUint32(16) };
  }
  if (mediaType === 'image/gif' && bytes.byteLength >= 10) {
    return { height: view.getUint16(8, true), width: view.getUint16(6, true) };
  }
  if (mediaType === 'image/jpeg') {
    let offset = 2;
    while (offset + 9 < bytes.byteLength) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      if (offset + 4 > bytes.byteLength) break;
      const length = view.getUint16(offset + 2);
      if (length < 2 || offset + 2 + length > bytes.byteLength) break;
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
        if (length < 7) break;
        return {
          height: view.getUint16(offset + 5),
          width: view.getUint16(offset + 7)
        };
      }
      offset += 2 + length;
    }
  }
  if (mediaType === 'image/webp' && bytes.byteLength >= 30) {
    const chunk = String.fromCharCode(...bytes.slice(12, 16));
    if (chunk === 'VP8X') {
      const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
      return { height, width };
    }
    if (chunk === 'VP8 ' && bytes.byteLength >= 30 && startsWith(bytes.slice(23), [0x9d, 0x01, 0x2a])) {
      return {
        height: view.getUint16(28, true) & 0x3fff,
        width: view.getUint16(26, true) & 0x3fff
      };
    }
    if (chunk === 'VP8L' && bytes.byteLength >= 25 && bytes[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      return {
        height: 1 + ((bits >> 14) & 0x3fff),
        width: 1 + (bits & 0x3fff)
      };
    }
  }
  return undefined;
}

function svgDimensions(svg: string): ImageDimensions | undefined {
  const root = svg.match(/<svg\b([^>]*)>/i)?.[1];
  if (root === undefined) throw new Error('SVG asset does not contain an svg root element.');
  const width = root.match(/\bwidth\s*=\s*["']([0-9]+(?:\.[0-9]+)?)(?:px)?["']/i)?.[1];
  const height = root.match(/\bheight\s*=\s*["']([0-9]+(?:\.[0-9]+)?)(?:px)?["']/i)?.[1];
  if (width && height) return { height: Number(height), width: Number(width) };
  const viewBox = root.match(/\bviewBox\s*=\s*["']\s*[-+0-9.e]+[ ,]+[-+0-9.e]+[ ,]+([-+0-9.e]+)[ ,]+([-+0-9.e]+)\s*["']/i);
  return viewBox
    ? {
        height: Math.abs(Number(viewBox[2])),
        width: Math.abs(Number(viewBox[1]))
      }
    : undefined;
}

function assertDimensions(name: string, dimensions: ImageDimensions | undefined) {
  if (!dimensions) throw new Error(`Image asset "${name}" does not expose supported dimensions.`);
  const { height, width } = dimensions;
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new Error(`Image asset "${name}" has invalid dimensions.`);
  }
  if (width > maximumStudioImageDimension || height > maximumStudioImageDimension) {
    throw new Error(`Image asset "${name}" exceeds the ${maximumStudioImageDimension} pixel dimension limit.`);
  }
  if (width * height > maximumStudioImagePixels) {
    throw new Error(`Image asset "${name}" exceeds the ${maximumStudioImagePixels.toLocaleString()} pixel limit.`);
  }
}

export function validateStudioAssetContent(asset: StudioAssetContent, options: StudioAssetValidationOptions = {}): StudioAssetContent {
  const name = canonicalStudioPath(asset.name);
  const bytes = Uint8Array.from(asset.bytes);
  const maximumBytes = options.maximumBytes ?? maximumStudioAssetBytes;
  if (bytes.byteLength < 1 || bytes.byteLength > maximumBytes) {
    throw new Error(`Asset "${name}" must contain between 1 and ${maximumBytes} bytes.`);
  }
  if (asset.mediaType !== asset.mediaType.trim().toLowerCase() || asset.mediaType.includes(';')) {
    throw new Error(`Asset "${name}" has an unsupported media type "${asset.mediaType}".`);
  }

  const rasterType = detectedRasterMediaType(bytes);
  let mediaType = asset.mediaType;
  if (mediaType === 'application/octet-stream' && options.allowMediaTypeSniffing && rasterType) mediaType = rasterType;
  if (mediaType === 'application/octet-stream' && options.allowMediaTypeSniffing) {
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes).trimStart();
      if (/^<svg\b/i.test(text)) mediaType = 'image/svg+xml';
    } catch {
      // Binary data remains unsupported when its signature is unknown.
    }
  }
  if (!studioImageMediaTypes.has(mediaType)) {
    throw new Error(`Asset "${name}" has unsupported media type "${asset.mediaType}".`);
  }

  if (mediaType === 'image/svg+xml') {
    if (rasterType) throw new Error(`Asset "${name}" media type does not match its content.`);
    let svg: string;
    try {
      svg = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      throw new Error(`SVG asset "${name}" is not valid UTF-8.`);
    }
    if (sanitizeSvg(svg) !== svg) throw new Error(`SVG asset "${name}" contains unsafe executable or remote content.`);
    assertDimensions(name, svgDimensions(svg));
  } else {
    if (rasterType !== mediaType) throw new Error(`Asset "${name}" media type does not match its content.`);
    assertDimensions(name, rasterDimensions(bytes, mediaType));
  }
  return { bytes, mediaType, name };
}
