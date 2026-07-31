import { describe, expect, it } from 'vitest';
import { createStarterProject } from '../../src/hosts/starterProject';
import { createStudioDocumentSession, createStylesheetCandidateController } from '../../src/session';
import {
  createStudioSourceDocumentModel,
  listStudioProjectSources,
  studioDiagnosticSourceRange,
  studioStylesheetCandidateRangeAtPath,
  studioStylesheetCandidateRangeForSelection,
  studioStylesheetTargetForSelection
} from '../../src/features/workspace/sourceDocumentModel';

function fixture() {
  const session = createStudioDocumentSession(
    createStarterProject({
      id: 'source-workbench',
      name: 'Source workbench',
      template: 'backbone'
    })
  );
  const snapshot = session.snapshot();
  const candidate = createStylesheetCandidateController({
    appliedProjection: snapshot.projection,
    appliedSourceRevision: snapshot.projection.sourceRevision,
    appliedStylesheetText: snapshot.project.documents.stylesheet.text,
    mapperText: snapshot.project.documents.mapper?.text,
    topologyText: snapshot.project.documents.topology.text
  });

  return { candidate, session };
}

describe('Studio source document presentation', () => {
  it('maps one-based diagnostic coordinates to an exact source range', () => {
    const text = 'graph:\r\n  id: demo\r\n  nodes: []\r\n';
    expect(
      studioDiagnosticSourceRange(
        {
          code: 'invalid-id',
          column: 7,
          document: 'topology',
          endColumn: 11,
          line: 2,
          message: 'Invalid id',
          severity: 'error'
        },
        text
      )
    ).toEqual({
      column: 7,
      endColumn: 11,
      endLine: 2,
      endOffset: 18,
      line: 2,
      startOffset: 14
    });
    expect(
      studioDiagnosticSourceRange(
        {
          code: 'missing-location',
          document: 'topology',
          message: 'No range',
          severity: 'error'
        },
        text
      )
    ).toBeUndefined();
  });

  it('lists topology, stylesheet, and optional mapper in stable workbench order', () => {
    const { candidate, session } = fixture();

    expect(listStudioProjectSources(session.snapshot(), candidate.getSnapshot())).toEqual([
      expect.objectContaining({ exists: true, kind: 'topology', path: 'topology.yaml' }),
      expect.objectContaining({ exists: true, kind: 'stylesheet', path: 'stylesheet.yaml' }),
      expect.objectContaining({ exists: false, kind: 'mapper', path: 'mapper.yaml' })
    ]);
    candidate.dispose();
  });

  it('presents an invalid topology draft without replacing the valid projection', () => {
    const { candidate, session } = fixture();
    const projection = session.snapshot().projection;
    session.replaceDraft('topology', 'graph:\n  nodes: [');

    const model = createStudioSourceDocumentModel('topology', session.snapshot(), candidate.getSnapshot());
    expect(model).toMatchObject({
      applyLabel: 'Apply topology',
      dirty: true,
      exists: true,
      invalid: true,
      kind: 'topology',
      revertLabel: 'Revert invalid draft',
      text: 'graph:\n  nodes: ['
    });
    expect(model.diagnostics[0]?.code).toBe('invalid-yaml');
    expect(session.snapshot().projection).toBe(projection);
    candidate.dispose();
  });

  it('resolves stylesheet navigation against the candidate source and semantic selection', () => {
    const { candidate } = fixture();
    const state = candidate.getSnapshot();

    expect(
      studioStylesheetTargetForSelection([{ id: 'edge-01', kind: 'node' }])
    ).toEqual({ id: 'edge-01', kind: 'node' });
    expect(
      studioStylesheetTargetForSelection([{ id: 'physical', kind: 'layer' }])
    ).toBeUndefined();
    const stylesheet = studioStylesheetCandidateRangeAtPath(state, ['stylesheet']);
    const selectedRule = studioStylesheetCandidateRangeForSelection(state, [
      { id: 'edge-01', kind: 'node' }
    ]);
    expect(stylesheet?.line).toBeGreaterThan(1);
    expect(selectedRule?.line).toBeGreaterThan(stylesheet?.line || 0);

    candidate.dispose();
  });

  it('presents the stylesheet candidate instead of duplicating candidate ownership', () => {
    const { candidate, session } = fixture();
    const changed = session.snapshot().project.documents.stylesheet.text.replace(
      'backgroundColor: "#44546a"',
      'backgroundColor: "#1976d2"'
    );
    candidate.replaceRawText(changed);

    const model = createStudioSourceDocumentModel('stylesheet', session.snapshot(), candidate.getSnapshot());
    expect(model).toMatchObject({
      applyLabel: 'Apply stylesheet',
      dirty: true,
      exists: true,
      invalid: false,
      kind: 'stylesheet',
      path: 'stylesheet.yaml',
      text: changed
    });
    expect(model.candidateStatus).toBe('validating');
    candidate.dispose();
  });

  it('presents an absent mapper as an optional source instead of a fake document', () => {
    const { candidate, session } = fixture();

    expect(createStudioSourceDocumentModel('mapper', session.snapshot(), candidate.getSnapshot())).toEqual({
      applyLabel: 'Apply mapper',
      candidateStatus: undefined,
      diagnostics: [],
      dirty: false,
      exists: false,
      invalid: false,
      kind: 'mapper',
      label: 'Mapper',
      optional: true,
      path: 'mapper.yaml',
      revertLabel: 'Revert mapper',
      text: ''
    });
    candidate.dispose();
  });
});
