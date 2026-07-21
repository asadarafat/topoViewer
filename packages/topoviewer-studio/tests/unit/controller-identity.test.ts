import { describe, expect, it } from 'vitest';
import { parse, stringify } from 'yaml';
import type { StudioCommand, StudioProject } from '../../src';
import { planStudioSelectionDuplication } from '../../src/features/canvas/duplication';
import { createStudioCanonicalRenameCommand, detectStudioDraftIdentityChange, previewStudioCanonicalRename } from '../../src/features/inspector/identityCapability';
import { mutationsForAuthoringEditPlan } from '../../src/commands/authoringPlans';
import { createStudioCommandDispatcher } from '../../src/commands';
import { createStudioDocumentSession } from '../../src/session';

function project(): StudioProject {
  const topology = {
    version: '0.2',
    graph: {
      id: 'identity-test',
      layers: [{ id: 'physical', labels: { name: 'Physical' } }],
      nodes: [
        { id: 'A', labels: { name: 'Shared router', peerHint: 'A' }, layers: ['physical'], position: [80, 80] },
        { id: 'B', labels: { name: 'Shared router' }, layers: ['physical'], position: [320, 80] }
      ],
      links: [{ id: 'A-B', source: 'A', target: 'B', layers: ['physical'] }],
      paths: [{ id: 'service', sequence: ['A', 'B'], layers: ['physical'] }],
      regions: [{ id: 'site', members: ['A', 'B'], layers: ['physical'] }]
    },
    attention: { query: { ids: ['A'], selectors: ['node[id = "A"]'] } }
  };
  const stylesheet = {
    stylesheet: [
      { selector: 'node[id = "A"]', style: { backgroundColor: '#123456' } },
      { selector: 'node[labels.name = "Shared router"]', style: { borderWidth: 3 } }
    ]
  };
  const mapper = {
    version: 1,
    rules: [{ id: 'health', join: 'node_id', metric: 'node_up', select: 'node[id = "A"]' }],
    mappings: [{
      id: 'static-health',
      metric: 'node_health',
      target: { kind: 'node', resolve: { by: 'staticObjectIds', objectIds: ['A'] } }
    }]
  };
  return {
    assets: [],
    documents: {
      topology: { contentHash: 'topology', kind: 'topology', path: 'identity.topo.tv.yaml', text: `# topology comment\n${stringify(topology)}` },
      stylesheet: { contentHash: 'stylesheet', kind: 'stylesheet', path: 'identity.style.tv.yaml', text: `# stylesheet comment\n${stringify(stylesheet)}` },
      mapper: { contentHash: 'mapper', kind: 'mapper', path: 'identity.mapper.tv.yaml', text: `# mapper comment\n${stringify(mapper)}` }
    },
    id: 'identity',
    metadata: { createdAt: '', profileVersion: 1, schemaVersion: 1, updatedAt: '' },
    name: 'Identity',
    revision: 'fixture'
  };
}

describe('Studio canonical identity rename', () => {
  it('reports internal file impact separately from external identity risks', () => {
    const preview = previewStudioCanonicalRename(
      createStudioDocumentSession(project()),
      { id: 'A', kind: 'node' },
      'router-a'
    );

    expect(preview).toEqual({
      affectedDocuments: 3,
      affectedReferences: 8,
      externalRisks: 1
    });
  });

  it('commits topology, stylesheet, and mapper references as one undoable source batch', () => {
    const session = createStudioDocumentSession(project());
    session.setSelection([{ id: 'A', kind: 'node' }]);
    const dispatcher = createStudioCommandDispatcher(session);
    const before = session.snapshot();
    const rename = createStudioCanonicalRenameCommand(session, { id: 'A', kind: 'node' }, 'router-a');

    expect(rename.changed).toBe(true);
    expect(rename.command.execute({ project: before.project, selection: before.selection }).mutations.map((mutation) => mutation.document).sort()).toEqual([
      'mapper',
      'stylesheet',
      'topology',
    ]);
    dispatcher.dispatch(rename.command);

    const after = session.snapshot();
    const topology = parse(after.project.documents.topology.text);
    const stylesheet = parse(after.project.documents.stylesheet.text);
    const mapper = parse(after.project.documents.mapper?.text || '');
    expect(topology.graph.nodes[0]).toMatchObject({ id: 'router-a', labels: { name: 'Shared router', peerHint: 'A' } });
    expect(topology.graph.links[0].source).toBe('router-a');
    expect(topology.graph.paths[0].sequence).toEqual(['router-a', 'B']);
    expect(topology.graph.regions[0].members).toEqual(['router-a', 'B']);
    expect(topology.attention.query).toMatchObject({ ids: ['router-a'], selectors: ['node[id = "router-a"]'] });
    expect(stylesheet.stylesheet[0].selector).toBe('node[id = "router-a"]');
    expect(stylesheet.stylesheet[1].selector).toBe('node[labels.name = "Shared router"]');
    expect(mapper.rules[0].select).toBe('node[id = "router-a"]');
    expect(mapper.mappings[0].target.resolve.objectIds).toEqual(['router-a']);
    expect(after.selection).toEqual([{ id: 'router-a', kind: 'node' }]);
    expect(after.project.documents.topology.text).toContain('# topology comment');
    expect(after.project.documents.stylesheet.text).toContain('# stylesheet comment');
    expect(after.project.documents.mapper?.text).toContain('# mapper comment');
    expect(dispatcher.historyEntries()).toEqual([
      expect.objectContaining({ documents: ['topology', 'stylesheet', 'mapper'], summary: 'Renamed A to router-a' })
    ]);

    dispatcher.undo();
    expect(session.snapshot().project.documents).toEqual(before.project.documents);
    expect(session.snapshot().selection).toEqual([{ id: 'A', kind: 'node' }]);
    dispatcher.redo();
    expect(session.snapshot().selection).toEqual([{ id: 'router-a', kind: 'node' }]);
  });

  it('rejects collisions before producing a command or changing any source', () => {
    const session = createStudioDocumentSession(project());
    const before = session.snapshot();
    expect(() => createStudioCanonicalRenameCommand(session, { id: 'A', kind: 'node' }, 'B')).toThrow(/already used/);
    expect(session.snapshot()).toEqual(before);
  });

  it('duplicates a styled object and then renames the duplicate as two stable transactions', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session);
    const snapshot = session.snapshot();
    const duplication = planStudioSelectionDuplication(
      snapshot.projection.document,
      parse(snapshot.project.documents.stylesheet.text),
      [{ id: 'A', kind: 'node' }]
    );
    const duplicateSelection = duplication.plan.insertions.map((insertion) => insertion.selection);
    dispatcher.dispatch({
      id: 'duplicate-A',
      label: 'Duplicate A',
      execute: () => ({
        mutations: mutationsForAuthoringEditPlan(
          duplication.plan,
          (path) => Boolean(session.sourceRange('topology', path)),
          duplication.additionalMutations
        ),
        selection: duplicateSelection,
        summary: 'Duplicated A'
      })
    });

    expect(session.snapshot().selection).toEqual([{ id: 'a-1', kind: 'node' }]);
    expect(parse(session.snapshot().project.documents.topology.text).graph.nodes.at(-1)).toMatchObject({
      id: 'a-1',
      labels: { name: 'Shared router', peerHint: 'A' }
    });
    expect(parse(session.snapshot().project.documents.stylesheet.text).stylesheet).toContainEqual({
      selector: 'node[id = "a-1"]',
      style: { backgroundColor: '#123456' }
    });

    dispatcher.dispatch(createStudioCanonicalRenameCommand(session, { id: 'a-1', kind: 'node' }, 'router-copy').command);
    expect(session.snapshot().selection).toEqual([{ id: 'router-copy', kind: 'node' }]);
    expect(parse(session.snapshot().project.documents.stylesheet.text).stylesheet).toContainEqual({
      selector: 'node[id = "router-copy"]',
      style: { backgroundColor: '#123456' }
    });
    expect(dispatcher.historyState().undoEntries).toBe(2);

    dispatcher.undo();
    expect(session.snapshot().selection).toEqual([{ id: 'a-1', kind: 'node' }]);
    dispatcher.undo();
    expect(session.snapshot().selection).toEqual([]);
    expect(parse(session.snapshot().project.documents.topology.text).graph.nodes).toHaveLength(2);
  });

  it('recognizes a Code-mode ID edit and completes references omitted from the draft', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session);
    const draft = session.snapshot().project.documents.topology.text.replace('    - id: A\n', '    - id: edge-a\n');
    const change = detectStudioDraftIdentityChange(session, draft);

    expect(change).toEqual({ nextId: 'edge-a', selection: { id: 'A', kind: 'node' }, status: 'rename' });
    if (change.status !== 'rename') return;
    dispatcher.dispatch(createStudioCanonicalRenameCommand(session, change.selection, change.nextId, draft).command);

    const topology = parse(session.snapshot().project.documents.topology.text);
    expect(topology.graph.nodes[0].id).toBe('edge-a');
    expect(topology.graph.links[0].source).toBe('edge-a');
    expect(topology.graph.paths[0].sequence).toEqual(['edge-a', 'B']);
    expect(session.snapshot().selection).toEqual([{ id: 'edge-a', kind: 'node' }]);
    expect(dispatcher.historyState().undoEntries).toBe(1);
  });

  it('reports multiple Code-mode ID edits instead of guessing a refactor', () => {
    const session = createStudioDocumentSession(project());
    const draft = session.snapshot().project.documents.topology.text
      .replace('    - id: A\n', '    - id: edge-a\n')
      .replace('    - id: B\n', '    - id: edge-b\n');

    expect(detectStudioDraftIdentityChange(session, draft)).toEqual({ changes: 2, status: 'ambiguous' });
  });

  it('rejects an invalid multi-source replacement without partial state', () => {
    const session = createStudioDocumentSession(project());
    const dispatcher = createStudioCommandDispatcher(session);
    const before = session.snapshot();
    const command: StudioCommand = {
      id: 'invalid-batch',
      label: 'Invalid batch',
      execute: () => ({
        mutations: [
          { document: 'topology', kind: 'replace-source', text: before.project.documents.topology.text.replace('id: A', 'id: changed') },
          { document: 'stylesheet', kind: 'replace-source', text: 'stylesheet: [{ selector: node, style: { definitelyUnknown: true } }]\n' }
        ],
        summary: 'Invalid batch'
      })
    };

    expect(() => dispatcher.dispatch(command)).toThrow();
    expect(session.snapshot()).toEqual(before);
    expect(dispatcher.historyState().undoEntries).toBe(0);
  });
});
