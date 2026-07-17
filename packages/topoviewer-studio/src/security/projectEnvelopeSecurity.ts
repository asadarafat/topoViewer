import type { StudioAssetContent } from '../contracts/host';
import type { StudioDocumentKind, StudioProject, StudioSourceDocument } from '../contracts/project';
import { validateStudioAssetContent } from './assetSecurity';
import { studioSecurityLimits } from './limits';
import { canonicalStudioPath } from './pathSecurity';

function boundedText(value: unknown, field: string, maximum: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`Studio project ${field} is invalid.`);
  }
  return value;
}

function sourceDocument(value: unknown, kind: StudioDocumentKind): StudioSourceDocument {
  if (!value || typeof value !== 'object') throw new Error(`Studio project ${kind} source is missing.`);
  const document = value as Partial<StudioSourceDocument>;
  if (document.kind !== kind || typeof document.text !== 'string') throw new Error(`Studio project ${kind} source is invalid.`);
  const path = canonicalStudioPath(boundedText(document.path, `${kind} path`, 1_024));
  if (new TextEncoder().encode(document.text).byteLength > studioSecurityLimits.sourceBytes) {
    throw new Error(`Studio project source "${path}" exceeds the source-size limit.`);
  }
  return document as StudioSourceDocument;
}

export function validateStudioProjectEnvelope(project: StudioProject, assets?: StudioAssetContent[]): StudioAssetContent[] {
  boundedText(project.id, 'id', 256);
  boundedText(project.name, 'name', 256);
  boundedText(project.revision, 'revision', 256);
  if (
    !project.metadata ||
    !Number.isInteger(project.metadata.profileVersion) ||
    project.metadata.profileVersion < 1 ||
    !Number.isInteger(project.metadata.schemaVersion) ||
    project.metadata.schemaVersion < 1 ||
    !Number.isFinite(Date.parse(project.metadata.createdAt)) ||
    !Number.isFinite(Date.parse(project.metadata.updatedAt))
  )
    throw new Error('Studio project metadata is invalid.');

  const topology = sourceDocument(project.documents?.topology, 'topology');
  const stylesheet = sourceDocument(project.documents?.stylesheet, 'stylesheet');
  const mapper = project.documents?.mapper ? sourceDocument(project.documents.mapper, 'mapper') : undefined;
  const documentPaths = [topology.path, stylesheet.path, mapper?.path].filter((path): path is string => Boolean(path));
  if (new Set(documentPaths).size !== documentPaths.length) throw new Error('Studio project source paths must be unique.');

  if (!Array.isArray(project.assets)) throw new Error('Studio project assets are invalid.');
  const assetPaths = project.assets.map((asset) => canonicalStudioPath(asset.path));
  if (new Set([...documentPaths, ...assetPaths]).size !== documentPaths.length + assetPaths.length) {
    throw new Error('Studio project paths must be unique.');
  }
  for (const asset of project.assets) {
    if (!Number.isSafeInteger(asset.size) || asset.size < 1 || asset.size > studioSecurityLimits.assetBytes) {
      throw new Error(`Studio project asset "${asset.path}" has an invalid size.`);
    }
    if (!['image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'].includes(asset.mediaType)) {
      throw new Error(`Studio project asset "${asset.path}" has an unsupported media type.`);
    }
    boundedText(asset.contentHash, `asset ${asset.path} contentHash`, 128);
  }
  if (project.assets.length + documentPaths.length > studioSecurityLimits.archiveFiles - 1) {
    throw new Error('Studio project contains too many files.');
  }
  const sourceBytes = [topology, stylesheet, mapper].reduce((total, document) => total + (document ? new TextEncoder().encode(document.text).byteLength : 0), 0);
  const totalBytes = sourceBytes + project.assets.reduce((total, asset) => total + asset.size, 0);
  if (totalBytes > studioSecurityLimits.archiveExpandedBytes) throw new Error('Studio project exceeds the aggregate-size limit.');

  if (!assets) return [];
  const validated = assets.map((asset) => validateStudioAssetContent(asset, { allowMediaTypeSniffing: true }));
  const contentByPath = new Map(validated.map((asset) => [asset.name, asset]));
  if (contentByPath.size !== validated.length || validated.length !== project.assets.length) {
    throw new Error('Studio project asset metadata does not match its content.');
  }
  for (const metadata of project.assets) {
    const content = contentByPath.get(metadata.path);
    if (!content || content.mediaType !== metadata.mediaType || content.bytes.byteLength !== metadata.size) {
      throw new Error(`Studio project asset "${metadata.path}" metadata does not match its content.`);
    }
  }
  return validated;
}
