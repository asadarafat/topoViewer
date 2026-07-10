import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import type { StudioAssetContent } from '../contracts/host';
import type { StudioDocumentKind, StudioProject, StudioProjectMetadata } from '../contracts/project';
import { validateStudioAssetContent } from '../security/assetSecurity';
import { studioSecurityLimits } from '../security/limits';
import { canonicalStudioPath } from '../security/pathSecurity';
import { validateStudioProjectContent } from '../security/projectSecurity';
import { stableTextHash } from '../session/hash';

const archiveFormat = 'topoviewer-studio-project';
const archiveVersion = 1;
const documentKinds = new Set<StudioDocumentKind>(['topology', 'stylesheet', 'mapper']);
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

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function boundedString(value: unknown, field: string, maximum = 256): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`Archive manifest ${field} is invalid.`);
  }
  return value;
}

function metadata(value: unknown): StudioProjectMetadata {
  if (!record(value)) throw new Error('Archive manifest project metadata is invalid.');
  const createdAt = boundedString(value.createdAt, 'project.metadata.createdAt', 64);
  const updatedAt = boundedString(value.updatedAt, 'project.metadata.updatedAt', 64);
  const profileVersion = value.profileVersion;
  const schemaVersion = value.schemaVersion;
  if (
    !Number.isInteger(profileVersion) || Number(profileVersion) < 1
    || !Number.isInteger(schemaVersion) || Number(schemaVersion) < 1
    || !Number.isFinite(Date.parse(createdAt)) || !Number.isFinite(Date.parse(updatedAt))
  ) throw new Error('Archive manifest project metadata is invalid.');
  return { createdAt, profileVersion: Number(profileVersion), schemaVersion: Number(schemaVersion), updatedAt };
}

function projectIdentity(value: unknown): ArchiveManifest['project'] {
  if (!record(value)) throw new Error('Archive manifest project is invalid.');
  return {
    id: boundedString(value.id, 'project.id'),
    metadata: metadata(value.metadata),
    name: boundedString(value.name, 'project.name'),
    revision: boundedString(value.revision, 'project.revision')
  };
}

export function canonicalArchivePath(path: string): string {
  try {
    return canonicalStudioPath(path);
  } catch {
    throw new Error(`Archive path "${path}" is not canonical.`);
  }
}

export function fileHash(bytes: Uint8Array): string {
  return `fnv1a-${stableTextHash(strFromU8(bytes, true))}`;
}

function manifestText(manifest: ArchiveManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function validateSource(kind: StudioDocumentKind, path: string, text: string) {
  const bytes = strToU8(text);
  if (bytes.byteLength > studioSecurityLimits.sourceBytes) {
    throw new Error(`Archive source "${path}" exceeds the ${studioSecurityLimits.sourceBytes} byte limit.`);
  }
  return { bytes, documentKind: kind, mediaType: 'application/yaml', path: canonicalArchivePath(path) } satisfies ArchiveInputFile;
}

function assertArchivePayload(files: ArchiveInputFile[]) {
  if (files.length + 1 > studioSecurityLimits.archiveFiles) throw new Error('Archive contains too many files.');
  const expandedBytes = files.reduce((total, file) => total + file.bytes.byteLength, 0);
  if (expandedBytes > studioSecurityLimits.archiveExpandedBytes) throw new Error('Archive exceeds the expanded-size limit.');
  if (new Set(files.map((file) => file.path)).size !== files.length) throw new Error('Archive paths must be unique.');
}

export function encodeStudioProjectArchive(project: StudioProject, assets: StudioAssetContent[] = []): Uint8Array {
  projectIdentity(project);
  const validatedAssets = validateStudioProjectContent(project, assets);
  const sourceFiles: ArchiveInputFile[] = (['topology', 'stylesheet', 'mapper'] as const).flatMap((kind) => {
    const document = project.documents[kind];
    return document ? [validateSource(kind, document.path, document.text)] : [];
  });
  const assetFiles: ArchiveInputFile[] = validatedAssets.map((asset) => {
    const validated = validateStudioAssetContent(asset, { allowMediaTypeSniffing: false });
    return { bytes: validated.bytes, mediaType: validated.mediaType, path: validated.name };
  });
  const files = [...sourceFiles, ...assetFiles].sort((left, right) => left.path.localeCompare(right.path));
  assertArchivePayload(files);
  const manifest: ArchiveManifest = {
    files: files.map((file) => ({
      contentHash: fileHash(file.bytes),
      ...(file.documentKind ? { documentKind: file.documentKind } : {}),
      mediaType: file.mediaType,
      path: file.path,
      size: file.bytes.byteLength
    })),
    format: archiveFormat,
    project: projectIdentity(project),
    version: archiveVersion
  };
  const entries = Object.fromEntries([
    ['manifest.json', strToU8(manifestText(manifest))],
    ...files.map((file) => [file.path, file.bytes] as const)
  ]);
  const archive = zipSync(entries, { level: 6, mtime: fixedZipTime });
  if (archive.byteLength > studioSecurityLimits.archiveCompressedBytes) throw new Error('Archive exceeds the compressed-size limit.');
  return archive;
}

function manifestEntry(value: unknown): ArchiveFileEntry {
  if (!record(value)) throw new Error('Archive manifest contains an invalid file entry.');
  const path = canonicalArchivePath(boundedString(value.path, 'file.path', 1_024));
  if (path === 'manifest.json') throw new Error('Archive manifest cannot declare itself as a project file.');
  const contentHash = boundedString(value.contentHash, `file ${path} contentHash`, 128);
  if (!/^fnv1a-[a-z0-9]+$/i.test(contentHash)) throw new Error(`Archive file "${path}" has an invalid content hash.`);
  if (!Number.isSafeInteger(value.size) || Number(value.size) < 1 || Number(value.size) > studioSecurityLimits.assetBytes) {
    throw new Error(`Archive file "${path}" has an invalid size.`);
  }
  const mediaType = boundedString(value.mediaType, `file ${path} mediaType`, 128);
  const documentKind = value.documentKind;
  if (documentKind !== undefined && (typeof documentKind !== 'string' || !documentKinds.has(documentKind as StudioDocumentKind))) {
    throw new Error(`Archive file "${path}" has an invalid document kind.`);
  }
  if (documentKind && mediaType !== 'application/yaml') throw new Error(`Archive source "${path}" must use application/yaml.`);
  if (!documentKind && !['image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'].includes(mediaType)) {
    throw new Error(`Archive asset "${path}" has unsupported media type "${mediaType}".`);
  }
  if (documentKind && Number(value.size) > studioSecurityLimits.sourceBytes) {
    throw new Error(`Archive source "${path}" exceeds the source-size limit.`);
  }
  return { contentHash, ...(documentKind ? { documentKind: documentKind as StudioDocumentKind } : {}), mediaType, path, size: Number(value.size) };
}

function parseManifest(files: Record<string, Uint8Array>): ArchiveManifest {
  const bytes = files['manifest.json'];
  if (!bytes) throw new Error('Archive manifest.json is missing.');
  if (bytes.byteLength > studioSecurityLimits.archiveManifestBytes) throw new Error('Archive manifest exceeds the size limit.');
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new Error('Archive manifest is not valid UTF-8 JSON.');
  }
  if (!record(raw) || raw.format !== archiveFormat || raw.version !== archiveVersion || !Array.isArray(raw.files)) {
    throw new Error('Archive manifest format or version is unsupported.');
  }
  const entries = raw.files.map(manifestEntry);
  const paths = entries.map((entry) => entry.path);
  if (new Set(paths).size !== paths.length) throw new Error('Archive manifest paths must be unique.');
  const kinds = entries.flatMap((entry) => entry.documentKind ? [entry.documentKind] : []);
  if (new Set(kinds).size !== kinds.length) throw new Error('Archive manifest document kinds must be unique.');
  return { files: entries, format: archiveFormat, project: projectIdentity(raw.project), version: archiveVersion };
}

function unzipBounded(bytes: Uint8Array): Record<string, Uint8Array> {
  if (bytes.byteLength > studioSecurityLimits.archiveCompressedBytes) throw new Error('Archive exceeds the compressed-size limit.');
  let expandedBytes = 0;
  let fileCount = 0;
  const names = new Set<string>();
  return unzipSync(bytes, {
    filter(file) {
      fileCount += 1;
      if (fileCount > studioSecurityLimits.archiveFiles) throw new Error('Archive contains too many files.');
      const name = canonicalArchivePath(file.name);
      if (name !== file.name || names.has(name)) throw new Error(`Archive entry "${file.name}" is duplicate or non-canonical.`);
      names.add(name);
      const maximum = name === 'manifest.json' ? studioSecurityLimits.archiveManifestBytes : studioSecurityLimits.assetBytes;
      if (file.originalSize < 1 || file.originalSize > maximum) throw new Error(`Archive entry "${name}" exceeds its size limit.`);
      expandedBytes += file.originalSize;
      if (expandedBytes > studioSecurityLimits.archiveExpandedBytes) throw new Error('Archive exceeds the expanded-size limit.');
      const ratio = file.originalSize / Math.max(1, file.size);
      if (ratio > studioSecurityLimits.archiveMaximumCompressionRatio) {
        throw new Error(`Archive entry "${name}" exceeds the compression-ratio limit.`);
      }
      return true;
    }
  });
}

function sourceDocument(manifest: ArchiveManifest, files: Record<string, Uint8Array>, kind: StudioDocumentKind) {
  const conventional = `${kind}.yaml`;
  const entry = manifest.files.find((file) => file.documentKind === kind)
    || manifest.files.find((file) => file.path === conventional);
  if (!entry) return undefined;
  const bytes = files[entry.path];
  if (!bytes) throw new Error(`Archive source "${entry.path}" is missing.`);
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`Archive source "${entry.path}" is not valid UTF-8.`);
  }
  return { contentHash: entry.contentHash, kind, path: entry.path, text };
}

export function decodeStudioProjectArchive(bytes: Uint8Array): StudioProjectArchive {
  const files = unzipBounded(bytes);
  const manifest = parseManifest(files);
  const expectedPaths = new Set(['manifest.json', ...manifest.files.map((file) => file.path)]);
  const actualPaths = Object.keys(files);
  if (actualPaths.length !== expectedPaths.size || actualPaths.some((path) => !expectedPaths.has(path))) {
    throw new Error('Archive contains undeclared files.');
  }
  for (const entry of manifest.files) {
    const file = files[entry.path];
    if (!file || file.byteLength !== entry.size || fileHash(file) !== entry.contentHash) {
      throw new Error(`Archive file "${entry.path}" failed integrity validation.`);
    }
  }
  const topology = sourceDocument(manifest, files, 'topology');
  const stylesheet = sourceDocument(manifest, files, 'stylesheet');
  const mapper = sourceDocument(manifest, files, 'mapper');
  if (!topology || !stylesheet) throw new Error('Archive must contain topology and stylesheet YAML.');
  const sourcePaths = new Set([topology.path, stylesheet.path, mapper?.path].filter((path): path is string => Boolean(path)));
  const assetEntries = manifest.files.filter((entry) => !sourcePaths.has(entry.path));
  const assets = assetEntries.map((entry) => validateStudioAssetContent({
    bytes: files[entry.path], mediaType: entry.mediaType, name: entry.path
  }, { allowMediaTypeSniffing: false }));
  const project: StudioProject = {
    assets: assets.map((asset) => ({
      contentHash: fileHash(asset.bytes), mediaType: asset.mediaType, path: asset.name, size: asset.bytes.byteLength
    })),
    documents: { topology, stylesheet, ...(mapper ? { mapper } : {}) },
    ...manifest.project
  };
  validateStudioProjectContent(project, assets);
  return { assets, project };
}
