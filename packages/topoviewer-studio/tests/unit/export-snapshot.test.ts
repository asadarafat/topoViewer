import { describe, expect, it } from 'vitest';
import { createStudioExportSnapshot, runStudioExporter } from '../../src/export/exportSnapshot';
import { createStarterProject } from '../../src/hosts/starterProject';

describe('Studio export snapshots', () => {
  it('isolates one immutable project revision from exporter mutations', async () => {
    const project = createStarterProject({ id: 'export-source', name: 'Export source' });
    const sourceText = project.documents.topology.text;
    const snapshot = createStudioExportSnapshot(project, 'source-revision-1');

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.project.documents.topology)).toBe(true);
    await expect(runStudioExporter({
      kind: 'files',
      export: async (input) => {
        expect(() => {
          (input.project.documents.topology as { text: string }).text = 'mutated';
        }).toThrow();
        return { artifacts: [], diagnostics: [], sourceRevision: input.sourceRevision };
      }
    }, snapshot, { kind: 'files' })).resolves.toMatchObject({ sourceRevision: 'source-revision-1' });

    expect(project.documents.topology.text).toBe(sourceText);
  });

  it('rejects exporters that report a different source revision', async () => {
    const project = createStarterProject({ id: 'export-source', name: 'Export source' });
    const snapshot = createStudioExportSnapshot(project, 'source-revision-1');

    await expect(runStudioExporter({
      kind: 'files',
      export: async () => ({ artifacts: [], diagnostics: [], sourceRevision: 'stale-revision' })
    }, snapshot, { kind: 'files' })).rejects.toThrow(/source revision/i);
  });
});
