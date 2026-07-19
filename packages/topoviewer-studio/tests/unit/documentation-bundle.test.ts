import { describe, expect, it } from 'vitest';
import { strFromU8, unzipSync } from 'fflate';
import { createStudioExportSnapshot } from '../../src/export/exportSnapshot';
import { encodeDocumentationBundle } from '../../src/export/documentationBundle';
import { createStarterProject } from '../../src/hosts/starterProject';

describe('Documentation bundle export', () => {
  it('packages source YAML, assets, snippet, and manifest deterministically', () => {
    const project = createStarterProject({ name: 'Branch Core' });
    project.documents.mapper = { contentHash: 'mapper', kind: 'mapper', path: 'runtime.mapper.tv.yaml', text: 'version: 1\nrules: []\n' };
    project.assets = [{ contentHash: 'router-icon', mediaType: 'image/svg+xml', path: 'assets/router.svg', size: 6 }];
    const snapshot = createStudioExportSnapshot(project, 'revision-1');
    const assets = [{ bytes: new TextEncoder().encode('<svg/>'), mediaType: 'image/svg+xml', name: 'assets/router.svg' }];
    const first = encodeDocumentationBundle(snapshot, 'mkdocs', assets);
    const second = encodeDocumentationBundle(snapshot, 'mkdocs', assets);
    expect(first.bytes).toEqual(second.bytes);
    expect(first.name).toBe('branch-core.mkdocs.docs.zip');

    const files = unzipSync(first.bytes);
    expect(Object.keys(files).sort()).toEqual([
      'branch-core/README.md',
      'branch-core/assets/router.svg',
      'branch-core/embed.mkdocs.md',
      'branch-core/manifest.json',
      'branch-core/runtime.mapper.tv.yaml',
      'branch-core/stylesheet.yaml',
      'branch-core/topology.yaml'
    ]);
    expect(strFromU8(files['branch-core/embed.mkdocs.md'])).toContain('```topoviewer\ntopology: topology.yaml');
    expect(strFromU8(files['branch-core/embed.mkdocs.md'])).toContain('mapper: runtime.mapper.tv.yaml');
    expect(strFromU8(files['branch-core/README.md'])).toContain('Install and configure `mkdocs-topoviewer`');
    expect(JSON.parse(strFromU8(files['branch-core/manifest.json']))).toMatchObject({
      format: 'topoviewer-documentation-bundle',
      sourceRevision: 'revision-1',
      target: 'mkdocs',
      version: 1
    });
  });

  it('packages a static HTML snippet for adapter deployments', () => {
    const snapshot = createStudioExportSnapshot(createStarterProject({ name: 'Static Demo' }), 'revision-2');
    const artifact = encodeDocumentationBundle(snapshot, 'static');
    const files = unzipSync(artifact.bytes);
    expect(strFromU8(files['static-demo/embed.static.html'])).toContain('class="topoviewer-embed"');
    expect(strFromU8(files['static-demo/README.md'])).toContain('browser `file://` loading is not supported');
  });
});
