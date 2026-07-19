import { strToU8, zipSync } from 'fflate';
import type { StudioAssetContent } from '../contracts/host';
import type { StudioExportSnapshot } from '../contracts/export';
import { canonicalArchivePath, fileHash, fixedZipTime } from '../archive/projectArchive';
import { studioSecurityLimits } from '../security/limits';
import { studioArtifactSlug } from './artifactName';
import { createDocumentationSnippet, type DocumentationSnippetKind } from './documentationSnippets';

interface DocumentationBundleFile {
  bytes: Uint8Array;
  mediaType: string;
  path: string;
}

function deploymentReadme(target: DocumentationSnippetKind): string {
  const targetSteps = target === 'mkdocs'
    ? [
        '1. Copy this directory into the MkDocs `docs_dir`.',
        '2. Install and configure `mkdocs-topoviewer` in the documentation project.',
        '3. Add `embed.mkdocs.md` to the navigation or move its fenced block into an existing page.',
        '4. Keep the YAML and asset paths relative to that Markdown page.'
      ]
    : [
        '1. Publish this directory through an HTTP server; browser `file://` loading is not supported.',
        '2. Provide `topoviewer-embed.css` and `topoviewer-embed.iife.js` at `/assets/topoviewer/`, or adjust those URLs in `embed.static.html`.',
        '3. Include `embed.static.html` in the target page.',
        '4. Keep the YAML and asset paths relative to that page.'
      ];
  return [
    '# TopoViewer documentation bundle',
    '',
    `Target: ${target === 'mkdocs' ? 'MkDocs' : 'Static HTML'}`,
    '',
    ...targetSteps,
    '',
    'The manifest records the source revision and hashes for every exported file.',
    ''
  ].join('\n');
}

function sourceFiles(snapshot: StudioExportSnapshot): DocumentationBundleFile[] {
  return (['topology', 'stylesheet', 'mapper'] as const).flatMap((kind) => {
    const source = snapshot.project.documents[kind];
    return source
      ? [{ bytes: strToU8(source.text), mediaType: 'application/yaml', path: canonicalArchivePath(source.path) }]
      : [];
  });
}

export function encodeDocumentationBundle(
  snapshot: StudioExportSnapshot,
  target: DocumentationSnippetKind,
  assets: StudioAssetContent[] = []
): StudioAssetContent {
  const id = studioArtifactSlug(snapshot.project.name);
  const snippetName = target === 'mkdocs' ? 'embed.mkdocs.md' : 'embed.static.html';
  const files = [
    ...sourceFiles(snapshot),
    ...assets.map((asset) => ({
      bytes: Uint8Array.from(asset.bytes),
      mediaType: asset.mediaType,
      path: canonicalArchivePath(asset.name)
    })),
    {
      bytes: strToU8(createDocumentationSnippet(snapshot, target)),
      mediaType: target === 'mkdocs' ? 'text/markdown' : 'text/html',
      path: snippetName
    },
    {
      bytes: strToU8(deploymentReadme(target)),
      mediaType: 'text/markdown',
      path: 'README.md'
    }
  ].sort((left, right) => left.path.localeCompare(right.path));
  if (new Set(files.map((file) => file.path)).size !== files.length) throw new Error('Documentation bundle paths must be unique.');
  if (files.length + 1 > studioSecurityLimits.archiveFiles) throw new Error('Documentation bundle contains too many files.');
  if (files.reduce((total, file) => total + file.bytes.byteLength, 0) > studioSecurityLimits.archiveExpandedBytes) {
    throw new Error('Documentation bundle exceeds the expanded-size limit.');
  }
  const manifest = strToU8(
    `${JSON.stringify(
      {
        bundle: { id, name: snapshot.project.name },
        files: files.map((file) => ({
          contentHash: fileHash(file.bytes),
          mediaType: file.mediaType,
          path: file.path,
          size: file.bytes.byteLength
        })),
        format: 'topoviewer-documentation-bundle',
        sourceRevision: snapshot.sourceRevision,
        target,
        version: 1
      },
      null,
      2
    )}\n`
  );
  const bytes = zipSync(
    Object.fromEntries([
      [`${id}/manifest.json`, manifest],
      ...files.map((file) => [`${id}/${file.path}`, file.bytes] as const)
    ]),
    { level: 6, mtime: fixedZipTime }
  );
  if (bytes.byteLength > studioSecurityLimits.archiveCompressedBytes) throw new Error('Documentation bundle exceeds the compressed-size limit.');
  return { bytes, mediaType: 'application/zip', name: `${id}.${target}.docs.zip` };
}
