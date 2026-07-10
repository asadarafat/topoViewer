import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import type { StudioAssetContent } from '../contracts/host';
import type { StudioDocumentKind, StudioProject } from '../contracts/project';
import { stableTextHash } from '../session/hash';

const archiveFormat = 'topoviewer-studio-project';
const archiveVersion = 1;
export const fixedZipTime = new Date('1980-01-01T00:00:00.000Z');

interface ArchiveFileEntry {
  contentHash: string;
  documentKind?: StudioDocumentKind;
  mediaType: string;
  path: string;
  size: number;
}

interface ArchiveInputFile {
  bytes: Uint8Array;
  documentKind?: StudioDocumentKind;
  mediaType: string;
  path: string;
}

interface ArchiveManifest {
  files: ArchiveFileEntry[];
  format: typeof archiveFormat;
  project: Pick<StudioProject, 'id' | 'metadata' | 'name' | 'revision'>;
  version: typeof archiveVersion;
}

export interface StudioProjectArchive {
  assets: StudioAssetContent[];
  project: StudioProject;
}

export function canonicalArchivePath(path: string): string {
  const normalized = path.replaceAll('\\', '/').replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('/') || normalized.includes('\0')) throw new Error(`Archive path "${path}" is invalid.`);
  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error(`Archive path "${path}" is not canonical.`);
  }
  return normalized;
}

export function fileHash(bytes: Uint8Array): string {
  return `fnv1a-${stableTextHash(strFromU8(bytes, true))}`;
}

function manifestText(manifest: ArchiveManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export function encodeStudioProjectArchive(project: StudioProject, assets: StudioAssetContent[] = []): Uint8Array {
  const sourceFiles: ArchiveInputFile[] = (['topology', 'stylesheet', 'mapper'] as const).flatMap((kind) => {
    const document = project.documents[kind];
    return document ? [{ bytes: strToU8(document.text), documentKind: kind, mediaType: 'application/yaml', path: canonicalArchivePath(document.path) }] : [];
  });
  const assetFiles: ArchiveInputFile[] = assets.map((asset) => ({
    bytes: Uint8Array.from(asset.bytes),
    mediaType: asset.mediaType,
    path: canonicalArchivePath(asset.name)
  }));
  const files = [...sourceFiles, ...assetFiles].sort((left, right) => left.path.localeCompare(right.path));
  if (new Set(files.map((file) => file.path)).size !== files.length) throw new Error('Archive paths must be unique.');
  const manifest: ArchiveManifest = {
    files: files.map((file) => ({
      contentHash: fileHash(file.bytes),
      ...(file.documentKind ? { documentKind: file.documentKind } : {}),
      mediaType: file.mediaType,
      path: file.path,
      size: file.bytes.byteLength
    })),
    format: archiveFormat,
    project: {
      id: project.id,
      metadata: project.metadata,
      name: project.name,
      revision: project.revision
    },
    version: archiveVersion
  };
  const entries = Object.fromEntries([
    ['manifest.json', strToU8(manifestText(manifest))],
    ...files.map((file) => [file.path, file.bytes] as const)
  ]);
  return zipSync(entries, { level: 6, mtime: fixedZipTime });
}

function parseManifest(files: Record<string, Uint8Array>): ArchiveManifest {
  const bytes = files['manifest.json'];
  if (!bytes) throw new Error('Archive manifest.json is missing.');
  const manifest = JSON.parse(strFromU8(bytes)) as ArchiveManifest;
  if (manifest.format !== archiveFormat || manifest.version !== archiveVersion || !Array.isArray(manifest.files)) {
    throw new Error('Archive manifest format or version is unsupported.');
  }
  return manifest;
}

function sourceDocument(manifest: ArchiveManifest, files: Record<string, Uint8Array>, kind: StudioDocumentKind) {
  const conventional = `${kind}.yaml`;
  const entry = manifest.files.find((file) => file.documentKind === kind)
    || manifest.files.find((file) => file.path === conventional);
  if (!entry) return undefined;
  const bytes = files[entry.path];
  if (!bytes) throw new Error(`Archive source "${entry.path}" is missing.`);
  return { contentHash: entry.contentHash, kind, path: entry.path, text: strFromU8(bytes) };
}

export function decodeStudioProjectArchive(bytes: Uint8Array): StudioProjectArchive {
  if (bytes.byteLength > 25 * 1024 * 1024) throw new Error('Archive exceeds the 25 MiB import limit.');
  const files = unzipSync(bytes, { filter: (file) => file.name === 'manifest.json' || file.size <= 10 * 1024 * 1024 });
  if (Object.keys(files).length > 256) throw new Error('Archive contains too many files.');
  const manifest = parseManifest(files);
  const declaredPaths = new Set(manifest.files.map((file) => canonicalArchivePath(file.path)));
  for (const entry of manifest.files) {
    const file = files[entry.path];
    if (!file || file.byteLength !== entry.size || fileHash(file) !== entry.contentHash) {
      throw new Error(`Archive file "${entry.path}" failed integrity validation.`);
    }
  }
  const topology = sourceDocument(manifest, files, 'topology');
  const stylesheet = sourceDocument(manifest, files, 'stylesheet');
  const mapper = sourceDocument(manifest, files, 'mapper');
  if (!topology || !stylesheet) throw new Error('Archive must contain topology.yaml and stylesheet.yaml.');
  const assetEntries = manifest.files.filter((entry) => (
    ![topology.path, stylesheet.path, mapper?.path].includes(entry.path)
  ));
  const project: StudioProject = {
    assets: assetEntries.map((entry) => ({
      contentHash: entry.contentHash,
      mediaType: entry.mediaType,
      path: entry.path,
      size: entry.size
    })),
    documents: { topology, stylesheet, ...(mapper ? { mapper } : {}) },
    id: manifest.project.id,
    metadata: manifest.project.metadata,
    name: manifest.project.name,
    revision: manifest.project.revision
  };
  return {
    assets: assetEntries.filter((entry) => declaredPaths.has(entry.path)).map((entry) => ({
      bytes: files[entry.path],
      mediaType: entry.mediaType,
      name: entry.path
    })),
    project
  };
}
