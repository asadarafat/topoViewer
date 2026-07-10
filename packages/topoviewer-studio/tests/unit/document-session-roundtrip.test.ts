import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'yaml';
import type { StudioProject } from '../../src';
import { createStudioDocumentSession } from '../../src/session';

function project(topology: string, stylesheet = 'stylesheet: []\n', mapper?: string): StudioProject {
  const source = (kind: 'topology' | 'stylesheet' | 'mapper', text: string) => ({
    contentHash: `${kind}-${text.length}`,
    kind,
    path: `${kind}.yaml`,
    text
  });
  return {
    assets: [],
    documents: {
      topology: source('topology', topology),
      stylesheet: source('stylesheet', stylesheet),
      ...(mapper ? { mapper: source('mapper', mapper) } : {})
    },
    id: 'roundtrip',
    metadata: {
      createdAt: '2026-07-09T00:00:00.000Z',
      profileVersion: 1,
      schemaVersion: 1,
      updatedAt: '2026-07-09T00:00:00.000Z'
    },
    name: 'Round trip',
    revision: 'fixture'
  };
}

const corpus = [
  {
    name: 'comments, quotes, flow collections, and unknown fields',
    text: [
      '# document comment',
      'graph:',
      '  layers: [{ id: physical, name: "Physical" }]',
      '  nodes:',
      '    - id: PE1',
      "      name: 'Provider edge' # inline comment",
      '      labels: { role: pe, owner: "netops" }',
      '      position: [10, 20]',
      '      x-future: { keep: true }',
      'x-document: preserve',
      ''
    ].join('\n'),
    path: ['graph', 'nodes', 0, 'name'] as Array<string | number>,
    replacement: 'PE One'
  },
  {
    name: 'anchors and aliases',
    text: [
      'defaults: &defaults',
      '  role: edge',
      'graph:',
      '  layers:',
      '    - id: physical',
      '      name: Physical',
      '  nodes:',
      '    - id: PE1',
      '      name: "Edge"',
      '      labels: *defaults',
      '      layers: [physical]',
      '      position: [10, 20]',
      ''
    ].join('\n'),
    path: ['graph', 'nodes', 0, 'name'] as Array<string | number>,
    replacement: 'Provider Edge'
  },
  {
    name: 'CRLF and block scalar',
    text: [
      'graph:',
      '  layers:',
      '    - id: physical',
      '      name: Physical',
      '  nodes:',
      '    - id: PE1',
      '      name: |',
      '        Provider',
      '        Edge',
      '      layers: [physical]',
      '      position: [10, 20]',
      'x-tail: keep',
      ''
    ].join('\r\n'),
    path: ['graph', 'nodes', 0, 'name'] as Array<string | number>,
    replacement: 'PE One\nPrimary'
  }
];

describe('Studio lossless YAML corpus', () => {
  for (const fixture of corpus) {
    it(`preserves untouched source for ${fixture.name}`, () => {
      const session = createStudioDocumentSession(project(fixture.text));
      const before = session.snapshot().project.documents.topology.text;
      const range = session.sourceRange('topology', fixture.path);
      const result = session.setValue('topology', fixture.path, fixture.replacement);

      expect(result.status).toBe('applied');
      const after = session.snapshot().project.documents.topology.text;
      expect(range).toBeDefined();
      expect(after.slice(0, range?.startOffset)).toBe(before.slice(0, range?.startOffset));
      const startOffset = range?.startOffset || 0;
      const endOffset = range?.endOffset || 0;
      const replacementLength = after.length - (before.length - (endOffset - startOffset));
      expect(after.slice(startOffset + replacementLength)).toBe(before.slice(endOffset));
      if (fixture.text.includes('x-tail: keep')) expect(after).toContain('x-tail: keep');
      expect(parseDocument(after).errors).toEqual([]);
      if (fixture.text.includes('\r\n')) expect(after).not.toMatch(/(?<!\r)\n/);
    });
  }

  it('preserves unrelated bytes for deterministic generated scalar values', () => {
    const values = Array.from({ length: 128 }, (_, index) => `node ${index}: value # ${index % 7}`);
    const template = [
      '# fuzz fixture',
      'graph:',
      '  nodes:',
      '    - id: N1',
      '      name: "original" # stable',
      '      position: [0, 0]',
      'x-unknown: untouched',
      ''
    ].join('\n');

    for (const value of values) {
      const session = createStudioDocumentSession(project(template));
      const result = session.setValue('topology', ['graph', 'nodes', 0, 'name'], value);
      expect(result.status).toBe('applied');
      const after = session.snapshot().project.documents.topology.text;
      expect(after).toContain('# fuzz fixture');
      expect(after).toContain('# stable');
      expect(after).toContain('x-unknown: untouched');
      expect(parseDocument(after).errors).toEqual([]);
    }
  });

  it('contains parser failures without changing any committed source', () => {
    const session = createStudioDocumentSession(project('graph:\n  nodes: []\n'));
    const before = session.snapshot();
    const malformed = ['graph: [', 'graph:\n\tbad: true', 'graph: { nodes: [ }'];

    for (const text of malformed) {
      const result = session.replaceDraft('topology', text);
      expect(result.status).toBe('invalid');
      expect(session.snapshot().project).toBe(before.project);
      expect(session.snapshot().projection).toBe(before.projection);
    }
  });

  it('preserves compact, canonical, formatted, ordered, and future mapper constructs', () => {
    const mapper = fs.readFileSync(path.join(import.meta.dirname, '../fixtures/mapper-roundtrip.yaml'), 'utf8');
    const session = createStudioDocumentSession(project('graph:\n  nodes: []\n', 'stylesheet: []\n', mapper));
    const before = session.snapshot().project.documents.mapper?.text || '';
    const range = session.sourceRange('mapper', ['identity', 'sourceId']);
    const result = session.setValue('mapper', ['identity', 'sourceId'], 'branch-edge');

    expect(result.status).toBe('applied');
    const after = session.snapshot().project.documents.mapper?.text || '';
    expect(range).toBeDefined();
    expect(after).toContain('sourceId: branch-edge # preserve identity comment');
    expect(after).toContain('label: "{{ value | bps }}"');
    expect(after).toContain('as: health');
    expect(after).toContain('id: down-state');
    expect(after).toContain('priority: 20');
    expect(after).toContain('unresolved: warn');
    expect(after.indexOf('rules:')).toBeLessThan(after.indexOf('mappings:'));
    expect(after.slice(0, range?.startOffset)).toBe(before.slice(0, range?.startOffset));
    expect(parseDocument(after).errors).toEqual([]);
  });
});
