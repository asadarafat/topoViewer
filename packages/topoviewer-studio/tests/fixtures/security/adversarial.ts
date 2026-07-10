import { strToU8, unzipSync, zipSync } from 'fflate';

export const adversarialArchivePaths = [
  '../topology.yaml',
  'assets/../../secret.txt',
  '/etc/passwd',
  'C:\\Windows\\system.ini',
  'assets//router.svg',
  'assets/./router.svg',
  'assets/\u0000router.svg'
] as const;

export const adversarialAssetReferences = [
  'data:text/html;base64,PHNjcmlwdD4=',
  'data:image/svg+xml,<svg onload=alert(1)>',
  'javascript:alert(1)',
  'https://attacker.invalid/track.png',
  '//attacker.invalid/track.png'
] as const;

export const adversarialMediaTypes = [
  'application/octet-stream',
  'application/javascript',
  'image/svg+xml; charset=utf-8',
  'text/html'
] as const;

export const malformedArchiveManifests = [
  { files: [], format: 'wrong-format', project: {}, version: 1 },
  { files: {}, format: 'topoviewer-studio-project', project: {}, version: 1 },
  { files: [], format: 'topoviewer-studio-project', project: {}, version: 999 },
  { files: [{ path: '../topology.yaml' }], format: 'topoviewer-studio-project', project: {}, version: 1 },
  { files: [{ path: 'topology.yaml' }, { path: 'topology.yaml' }], format: 'topoviewer-studio-project', project: {}, version: 1 },
  { files: [], format: 'topoviewer-studio-project', project: { id: '', metadata: {}, name: '', revision: '' }, version: 1 }
] as const;

export function compressedBombArchive(uncompressedBytes = 2 * 1024 * 1024): Uint8Array {
  return zipSync({ 'bomb.bin': new Uint8Array(uncompressedBytes) }, { level: 9 });
}

export function excessFileArchive(fileCount = 257): Uint8Array {
  const entries = Object.fromEntries(Array.from({ length: fileCount }, (_, index) => [
    `assets/file-${String(index).padStart(3, '0')}.txt`,
    strToU8('x')
  ]));
  return zipSync(entries, { level: 1 });
}

export function malformedManifestArchive(manifest: unknown): Uint8Array {
  return zipSync({ 'manifest.json': strToU8(JSON.stringify(manifest)) }, { level: 1 });
}

export function oversizedFileArchive(bytes = 10 * 1024 * 1024 + 1): Uint8Array {
  const payload = new Uint8Array(bytes);
  for (let index = 0; index < payload.length; index += 4_096) payload[index] = index % 251;
  return zipSync({ 'oversized.bin': payload }, { level: 9 });
}

export function maximumCompressionRatio(archive: Uint8Array): number {
  let maximum = 0;
  unzipSync(archive, {
    filter(file) {
      maximum = Math.max(maximum, file.originalSize / Math.max(1, file.size));
      return false;
    }
  });
  return maximum;
}

export const symbolicLinkWorkspaceEntry = {
  bytes: strToU8('<svg/>'),
  mediaType: 'image/svg+xml',
  path: 'assets/router.svg',
  symbolicLink: true
} as const;
