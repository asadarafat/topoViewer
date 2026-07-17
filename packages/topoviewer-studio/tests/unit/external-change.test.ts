import { describe, expect, it } from 'vitest';
import { externalDocumentDifferences } from '../../src/features/projects/ExternalChangeDialog';
import { createStarterProject } from '../../src/hosts/starterProject';
import { createStudioDocumentSession } from '../../src/session';

describe('Studio external-change decisions', () => {
  it('rebases a kept draft onto the observed disk revision without marking it saved', () => {
    const session = createStudioDocumentSession(createStarterProject());
    session.replaceDraft('topology', `${session.snapshot().project.documents.topology.text}# local draft\n`);
    session.setStatus('conflict');
    session.rebaseRevision('workspace-external');
    expect(session.snapshot()).toMatchObject({
      project: {
        documents: { topology: { text: expect.stringContaining('# local draft') } },
        revision: 'workspace-external'
      },
      status: 'modified'
    });
  });

  it('reports only changed documents and bounds the rendered diff preview', () => {
    const studio = createStarterProject();
    const disk = structuredClone(studio);
    disk.documents.stylesheet.text = `${'x'.repeat(13_000)}\n`;
    expect(externalDocumentDifferences(studio, disk)).toEqual([
      expect.objectContaining({
        disk: expect.stringContaining('Diff preview truncated'),
        kind: 'stylesheet',
        truncated: true
      })
    ]);
  });
});
