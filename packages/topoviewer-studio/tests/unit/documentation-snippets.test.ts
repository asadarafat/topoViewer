import { describe, expect, it } from 'vitest';
import { createDocumentationSnippet } from '../../src/export/documentationSnippets';
import { createStudioExportSnapshot } from '../../src/export/exportSnapshot';
import { createStarterProject } from '../../src/hosts/starterProject';

describe('documentation snippets', () => {
  it('references canonical source paths without creating destination-specific source', () => {
    const project = createStarterProject();
    project.documents.mapper = { contentHash: 'mapper', kind: 'mapper', path: 'runtime.mapper.tv.yaml', text: 'version: 1\nrules: []\n' };
    const snapshot = createStudioExportSnapshot(project, 'revision-1');

    expect(createDocumentationSnippet(snapshot, 'mkdocs')).toContain(`topology: ${project.documents.topology.path}`);
    expect(createDocumentationSnippet(snapshot, 'mkdocs')).toContain('mapper: runtime.mapper.tv.yaml');
    const html = createDocumentationSnippet(snapshot, 'static');
    expect(html).toContain(`data-topology="${project.documents.topology.path}"`);
    expect(html).toContain('data-mapper="runtime.mapper.tv.yaml"');
    expect(project.documents).not.toHaveProperty('mkdocs');
  });
});
