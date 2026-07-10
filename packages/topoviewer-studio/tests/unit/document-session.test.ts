import { describe, expect, it } from 'vitest';
import type { StudioProject } from '../../src';
import { createStudioDocumentSession } from '../../src/session';

const topologyText = [
  '# topology stays reviewable',
  'graph:',
  '  layers:',
  '    - &physical',
  '      id: physical',
  '      name: Physical',
  '  nodes:',
  '    - id: PE1',
  '      name: "Provider edge" # keep this comment',
  '      layers: [physical]',
  '      position: [120, 160]',
  '      x-extension: keep-me',
  '    - id: P1',
  '      name: Core',
  '      layers: [physical]',
  '      position: [360, 160]',
  '  links:',
  '    - id: PE1-P1',
  '      source: PE1',
  '      target: P1',
  '      layers: [physical]',
  'x-project: true',
  ''
].join('\r\n');

const stylesheetText = [
  '# visual policy',
  'stylesheet:',
  '  - selector: node',
  '    style:',
  '      shape: rectangle',
  '      lineColor: "#42a5f5"',
  ''
].join('\n');

const mapperText = [
  'version: 1',
  'identity:',
  '  sourceId: lab',
  'rules:',
  '  - id: health',
  '    metric: node_health',
  '    select: node',
  '    join: node_id',
  ''
].join('\n');

function hash(text: string) {
  return `fixture-${text.length}`;
}

function project(): StudioProject {
  return {
    assets: [],
    documents: {
      topology: { kind: 'topology', path: 'topology.yaml', text: topologyText, contentHash: hash(topologyText) },
      stylesheet: { kind: 'stylesheet', path: 'stylesheet.yaml', text: stylesheetText, contentHash: hash(stylesheetText) },
      mapper: { kind: 'mapper', path: 'mapper.yaml', text: mapperText, contentHash: hash(mapperText) }
    },
    id: 'session-fixture',
    metadata: {
      createdAt: '2026-07-09T00:00:00.000Z',
      profileVersion: 1,
      schemaVersion: 1,
      updatedAt: '2026-07-09T00:00:00.000Z'
    },
    name: 'Session fixture',
    revision: 'fixture-1'
  };
}

describe('Studio document session', () => {
  it('loads all source documents into one valid immutable snapshot', () => {
    const session = createStudioDocumentSession(project());
    const snapshot = session.snapshot();

    expect(snapshot.status).toBe('saved');
    expect(snapshot.invalidDrafts).toEqual({});
    expect(snapshot.projection.document.graph?.nodes?.map((node) => node.id)).toEqual(['PE1', 'P1']);
    expect(snapshot.project.documents.mapper?.text).toBe(mapperText);
    expect(snapshot.projection.sourceRevision).toMatch(/^source-/);
  });

  it('represents every project lifecycle state and returns to saved after persistence', () => {
    const session = createStudioDocumentSession(project());

    for (const status of ['modified', 'saving', 'conflict', 'recovery'] as const) {
      session.setStatus(status);
      expect(session.snapshot().status).toBe(status);
    }

    session.markSaved('fixture-2', '2026-07-09T12:00:00.000Z');
    expect(session.snapshot()).toMatchObject({
      project: { revision: 'fixture-2', metadata: { updatedAt: '2026-07-09T12:00:00.000Z' } },
      status: 'saved'
    });
  });

  it('isolates invalid YAML and retains the last valid renderer projection', () => {
    const session = createStudioDocumentSession(project());
    const previousProjection = session.snapshot().projection;
    const result = session.replaceDraft('topology', 'graph:\n  nodes: [');

    expect(result.status).toBe('invalid');
    expect(session.snapshot().projection).toBe(previousProjection);
    expect(session.snapshot().project.documents.topology.text).toBe(topologyText);
    expect(session.snapshot().invalidDrafts.topology?.text).toBe('graph:\n  nodes: [');
    expect(session.snapshot().invalidDrafts.topology?.diagnostics[0]).toMatchObject({
      code: 'invalid-yaml',
      document: 'topology',
      severity: 'error'
    });
    expect(session.snapshot().invalidDrafts.topology?.diagnostics[0].line).toBeGreaterThan(0);

    session.discardInvalidDraft('topology');
    expect(session.snapshot().invalidDrafts.topology).toBeUndefined();
    expect(session.snapshot().status).toBe('saved');
  });

  it('maps a source offset back to the narrowest semantic object path', () => {
    const session = createStudioDocumentSession(project());
    const offset = topologyText.indexOf('Provider edge');

    expect(session.sourcePathAtOffset('topology', offset)).toEqual(['graph', 'nodes', 0, 'name']);
    expect(session.semanticIdForPath('topology', session.sourcePathAtOffset('topology', offset) || [])).toBe('node:PE1');
  });

  it('commits a valid draft across the same session and clears invalid state', () => {
    const session = createStudioDocumentSession(project());
    session.replaceDraft('stylesheet', 'stylesheet: [');
    const result = session.replaceDraft('stylesheet', stylesheetText.replace('rectangle', 'roundRectangle'));

    expect(result.status).toBe('applied');
    expect(session.snapshot().status).toBe('modified');
    expect(session.snapshot().invalidDrafts.stylesheet).toBeUndefined();
    expect(session.snapshot().project.documents.stylesheet.text).toContain('roundRectangle');
  });

  it('uses a surgical scalar edit that preserves untouched bytes', () => {
    const session = createStudioDocumentSession(project());
    const result = session.setValue('topology', ['graph', 'nodes', 0, 'name'], 'PE One');

    expect(result.status).toBe('applied');
    const text = session.snapshot().project.documents.topology.text;
    expect(text).toBe(topologyText.replace('"Provider edge"', '"PE One"'));
    expect(text).toContain('# keep this comment');
    expect(text).toContain('x-extension: keep-me');
    expect(text).toContain('&physical');
    expect(text).toContain('\r\n');
    expect(session.snapshot().project.documents.stylesheet.text).toBe(stylesheetText);
  });

  it('requires review before a structural edit can normalize source', () => {
    const session = createStudioDocumentSession(project());
    const result = session.setValue('topology', ['graph', 'nodes', 0, 'data', 'owner'], 'edge-team');

    expect(result.status).toBe('normalization-required');
    if (result.status !== 'normalization-required') return;
    expect(session.snapshot().project.documents.topology.text).toBe(topologyText);
    expect(result.review.reason).toContain('structural');
    expect(result.review.after).toContain('owner: edge-team');
    expect(result.review.diff.startLine).toBeGreaterThan(0);
    expect(result.review.diff.afterLines.join('\n')).toContain('owner: edge-team');

    const confirmation = session.confirmNormalization(result.review.id);
    expect(confirmation.status).toBe('applied');
    expect(session.snapshot().project.documents.topology.text).toContain('owner: edge-team');
    expect(session.snapshot().project.documents.topology.text).toContain('x-extension: keep-me');
  });

  it('maps source ranges and semantic identities in both directions', () => {
    const session = createStudioDocumentSession(project());
    const range = session.sourceRange('topology', ['graph', 'nodes', 0, 'name']);

    expect(range).toMatchObject({ line: 9, column: 13 });
    expect(session.semanticIdForPath('topology', ['graph', 'nodes', 0, 'name'])).toBe('node:PE1');
    expect(session.sourcePathForSelection({ kind: 'node', id: 'P1' })).toEqual({
      document: 'topology',
      path: ['graph', 'nodes', 1]
    });
  });

  it('keeps mapper edits in the same lossless document framework', () => {
    const session = createStudioDocumentSession(project());
    const result = session.setValue('mapper', ['rules', 0, 'metric'], 'node_oper_state');

    expect(result.status).toBe('applied');
    expect(session.snapshot().project.documents.mapper?.text).toBe(
      mapperText.replace('metric: node_health', 'metric: node_oper_state')
    );
    expect(session.snapshot().projection.document.graph?.nodes).toHaveLength(2);
  });

  it('maps semantic diagnostics to the offending source document', () => {
    const invalid = project();
    invalid.documents.topology = {
      ...invalid.documents.topology,
      text: topologyText.replace('target: P1', 'target: missing-node')
    };

    expect(() => createStudioDocumentSession(invalid)).toThrow(/target .* does not exist/i);
  });

  it('appends an object inside one YAML sequence without rewriting the document', () => {
    const session = createStudioDocumentSession(project());
    const result = session.insertValue('topology', ['graph', 'nodes'], {
      id: 'P2', name: 'Second core', layers: ['physical'], position: [560, 160]
    });

    expect(result.status, result.status === 'invalid' ? result.diagnostics.map((item) => item.message).join('; ') : '').toBe('applied');
    const text = session.snapshot().project.documents.topology.text;
    expect(text).toContain('# topology stays reviewable');
    expect(text).toContain('x-extension: keep-me');
    expect(text).toContain('id: P2');
    expect(session.snapshot().projection.document.graph?.nodes).toHaveLength(3);
  });

  it('upserts a field inside one object scope while preserving adjacent objects', () => {
    const session = createStudioDocumentSession(project());
    const result = session.upsertValue(
      'topology',
      ['graph', 'nodes', 0, 'style', 'shape'],
      'roundRectangle',
      ['graph', 'nodes', 0]
    );

    expect(result.status, result.status === 'invalid' ? result.diagnostics.map((item) => item.message).join('; ') : '').toBe('applied');
    const text = session.snapshot().project.documents.topology.text;
    expect(text).toContain('shape: roundRectangle');
    expect(text).toContain('x-extension: keep-me');
    expect(text).toContain('id: P1');
  });

  it('removes one sequence item inside its scope without rewriting adjacent documents', () => {
    const session = createStudioDocumentSession(project());
    const result = session.removeValue('topology', ['graph', 'links', 0], ['graph', 'links']);

    expect(result.status).toBe('applied');
    expect(session.snapshot().projection.document.graph?.links).toEqual([]);
    expect(session.snapshot().projection.document.graph?.nodes?.map((node) => node.id)).toEqual(['PE1', 'P1']);
    expect(session.snapshot().project.documents.topology.text).toContain('x-project: true');
    expect(session.snapshot().project.documents.stylesheet.text).toBe(stylesheetText);
  });
});
