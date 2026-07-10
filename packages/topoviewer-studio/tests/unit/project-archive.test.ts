import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { canonicalArchivePath, decodeStudioProjectArchive, encodeStudioProjectArchive, fileHash } from '../../src/archive/projectArchive';
import { createStarterProject } from '../../src/hosts/starterProject';
import {
  adversarialArchivePaths,
  adversarialMediaTypes,
  compressedBombArchive,
  excessFileArchive,
  malformedArchiveManifests,
  malformedManifestArchive,
  oversizedFileArchive
} from '../fixtures/security/adversarial';

const portableFixtureRoot = new URL('../../../topoviewer/content/examples/integration/studio-portable-bundle/', import.meta.url);

function portableFixture(name: string) {
  return readFileSync(new URL(name, portableFixtureRoot), 'utf8');
}

function pngHeader(width = 64, height = 64): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  bytes.set([0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52], 8);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

function rewriteManifest(archive: Uint8Array, change: (manifest: Record<string, unknown>) => void): Uint8Array {
  const files = unzipSync(archive);
  const manifest = JSON.parse(strFromU8(files['manifest.json'])) as Record<string, unknown>;
  change(manifest);
  files['manifest.json'] = Uint8Array.from(strToU8(JSON.stringify(manifest)));
  return zipSync(files, { level: 6 });
}

describe('Studio project archive', () => {
  it('is deterministic and round-trips source comments, mapper, metadata, and assets', () => {
    const project = createStarterProject({ id: 'portable', name: 'Portable topology', now: '2026-07-09T09:00:00.000Z' });
    project.documents.topology.text = `# preserved comment\n${project.documents.topology.text}`;
    project.documents.mapper = {
      contentHash: 'mapper', kind: 'mapper', path: 'mapper.yaml', text: 'version: 1\nmappings: []\n'
    };
    const assetBytes = pngHeader();
    const assets = [{ bytes: assetBytes, mediaType: 'image/png', name: 'assets/router.png' }];
    project.assets = [{ contentHash: fileHash(assetBytes), mediaType: 'image/png', path: 'assets/router.png', size: assetBytes.byteLength }];

    const first = encodeStudioProjectArchive(project, assets);
    const second = encodeStudioProjectArchive(project, assets);
    expect(first).toEqual(second);
    const entries = unzipSync(first);
    const manifest = JSON.parse(strFromU8(entries['manifest.json'])) as {
      files: Array<{ contentHash: string; documentKind?: string; path: string; size: number }>;
      format: string;
      version: number;
    };
    expect(manifest).toMatchObject({ format: 'topoviewer-studio-project', version: 1 });
    expect(manifest.files.map((file) => file.path)).toEqual(manifest.files.map((file) => file.path).sort());
    expect(manifest.files.map((file) => file.documentKind).filter(Boolean)).toEqual(['mapper', 'stylesheet', 'topology']);
    expect(manifest.files.every((file) => file.contentHash.startsWith('fnv1a-') && file.size === entries[file.path].byteLength)).toBe(true);
    const decoded = decodeStudioProjectArchive(first);
    expect(decoded.project).toMatchObject({ id: 'portable', name: 'Portable topology' });
    expect(decoded.project.documents.topology.text).toContain('# preserved comment');
    expect(decoded.project.documents.mapper?.text).toContain('mappings: []');
    expect(decoded.assets).toEqual(assets);
  });

  it('rejects non-archive and oversized input', () => {
    expect(() => decodeStudioProjectArchive(new Uint8Array([1, 2, 3]))).toThrow();
    expect(() => decodeStudioProjectArchive(new Uint8Array(25 * 1024 * 1024 + 1))).toThrow(/compressed-size limit/);
  });

  it('rejects traversal paths, excessive expansion, excess files, and oversized entries', () => {
    for (const path of adversarialArchivePaths) expect(() => canonicalArchivePath(path)).toThrow();
    expect(() => decodeStudioProjectArchive(compressedBombArchive())).toThrow(/compression-ratio|manifest/i);
    expect(() => decodeStudioProjectArchive(excessFileArchive())).toThrow(/too many files/i);
    expect(() => decodeStudioProjectArchive(oversizedFileArchive())).toThrow(/size limit/i);
  });

  it('rejects malformed manifests, duplicate declarations, and unsupported media types', () => {
    for (const manifest of malformedArchiveManifests) {
      expect(() => decodeStudioProjectArchive(malformedManifestArchive(manifest))).toThrow();
    }

    const project = createStarterProject({ id: 'malformed', name: 'Malformed archive' });
    const archive = encodeStudioProjectArchive(project);
    const duplicate = rewriteManifest(archive, (manifest) => {
      const files = manifest.files as unknown[];
      files.push(structuredClone(files[0]));
    });
    expect(() => decodeStudioProjectArchive(duplicate)).toThrow(/unique/i);

    for (const mediaType of adversarialMediaTypes) {
      const assetBytes = pngHeader();
      project.assets = [{ contentHash: fileHash(assetBytes), mediaType: 'image/png', path: 'assets/router.png', size: assetBytes.byteLength }];
      const withAsset = encodeStudioProjectArchive(project, [{ bytes: assetBytes, mediaType: 'image/png', name: 'assets/router.png' }]);
      const hostile = rewriteManifest(withAsset, (manifest) => {
        const entry = (manifest.files as Array<Record<string, unknown>>).find((file) => file.path === 'assets/router.png');
        if (entry) entry.mediaType = mediaType;
      });
      expect(() => decodeStudioProjectArchive(hostile)).toThrow(/media type/i);
    }
  });

  it('rejects undeclared archive entries atomically', () => {
    const archive = encodeStudioProjectArchive(createStarterProject({ id: 'undeclared', name: 'Undeclared entry' }));
    const files = unzipSync(archive);
    files['assets/hidden.png'] = Uint8Array.from(pngHeader());
    expect(() => decodeStudioProjectArchive(zipSync(files, { level: 6 }))).toThrow(/undeclared/i);
  });

  it('exports the portable consumer fixture without rewriting source documents', () => {
    const project = createStarterProject({ id: 'studio-portable-consumer', name: 'Studio Portable Consumer' });
    project.documents.topology = {
      contentHash: 'portable-topology',
      kind: 'topology',
      path: 'topology.yaml',
      text: portableFixture('topology.yaml')
    };
    project.documents.stylesheet = {
      contentHash: 'portable-stylesheet',
      kind: 'stylesheet',
      path: 'stylesheet.yaml',
      text: portableFixture('stylesheet.yaml')
    };
    project.documents.mapper = {
      contentHash: 'portable-mapper',
      kind: 'mapper',
      path: 'mapper.yaml',
      text: portableFixture('mapper.yaml')
    };

    const decoded = decodeStudioProjectArchive(encodeStudioProjectArchive(project));
    expect(decoded.project.documents.topology.text).toBe(project.documents.topology.text);
    expect(decoded.project.documents.stylesheet.text).toBe(project.documents.stylesheet.text);
    expect(decoded.project.documents.mapper?.text).toBe(project.documents.mapper.text);
  });
});
