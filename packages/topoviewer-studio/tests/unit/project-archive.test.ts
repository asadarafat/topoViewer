import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { decodeStudioProjectArchive, encodeStudioProjectArchive } from '../../src/archive/projectArchive';
import { createStarterProject } from '../../src/hosts/starterProject';

const portableFixtureRoot = new URL('../fixtures/portable-consumer/', import.meta.url);

function portableFixture(name: string) {
  return readFileSync(new URL(name, portableFixtureRoot), 'utf8');
}

describe('Studio project archive', () => {
  it('is deterministic and round-trips source comments, mapper, metadata, and assets', () => {
    const project = createStarterProject({ id: 'portable', name: 'Portable topology', now: '2026-07-09T09:00:00.000Z' });
    project.documents.topology.text = `# preserved comment\n${project.documents.topology.text}`;
    project.documents.mapper = {
      contentHash: 'mapper', kind: 'mapper', path: 'mapper.yaml', text: 'version: 1\nmappings: []\n'
    };
    const assets = [{ bytes: new Uint8Array([1, 2, 3]), mediaType: 'image/png', name: 'assets/router.png' }];

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
    expect(() => decodeStudioProjectArchive(new Uint8Array(25 * 1024 * 1024 + 1))).toThrow(/25 MiB/);
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
