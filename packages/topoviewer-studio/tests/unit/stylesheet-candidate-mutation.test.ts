import { describe, expect, it } from 'vitest';
import { resolveStyleProvenance } from 'topoviewer/authoring';
import type { GraphNode } from 'topoviewer';
import {
  candidateStyleFieldForSelector,
  inlineStyleWinner,
  migrateInlineStylesToCandidate,
  setCandidateStyleField,
  setCandidateStyleFieldForSelector,
  setCandidateStyleFieldForTargets,
  unsetCandidateStyleField,
  unsetCandidateStyleFieldForSelector
} from '../../src/session/stylesheetCandidateMutation';
import { evaluateStylesheetCandidate } from '../../src/session/stylesheetCandidate';

describe('stylesheet candidate mutations', () => {
  it('surgically updates an existing scalar while preserving style and CRLF', () => {
    const before = [
      '# stylesheet header',
      'futureRoot: keep-me',
      'stylesheet:',
      '  - selector: node',
      '    style: { borderWidth: 1 }',
      '',
      '  - selector: \'node[id = "router-1"]\' # exact object rule',
      '    futureRule: keep-me-too',
      '    style:',
      "      backgroundColor: '#111111' # preserve field comment",
      '      futureGlow: enabled',
      ''
    ].join('\r\n');

    const result = setCandidateStyleField(before, { id: 'router-1', kind: 'node' }, ['backgroundColor'], '#123456');

    expect(result.status).toBe('applied');
    if (result.status !== 'applied') return;
    expect(result.text).toContain("backgroundColor: '#123456' # preserve field comment");
    expect(result.text).toContain('futureRoot: keep-me');
    expect(result.text).toContain('futureRule: keep-me-too');
    expect(result.text).toContain('futureGlow: enabled');
    expect(result.text).toContain('\r\n');
    expect(result.text.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('inserts a field without dropping aliases, comments, blank lines, unknown keys, or rule order', () => {
    const before = [
      'palette: &palette "#334155" # shared value',
      'futureRoot: true',
      '',
      'stylesheet:',
      '  - selector: node',
      '    style:',
      '      backgroundColor: *palette',
      '',
      '  - selector: \'node[id = "router-1"]\'',
      '    style:',
      '      shape: rectangle',
      '    futureRule: retained',
      '',
      '  - selector: link',
      '    style: { lineWidth: 2 }',
      ''
    ].join('\n');

    const result = setCandidateStyleField(before, { id: 'router-1', kind: 'node' }, ['borderWidth'], 3);

    expect(result.status).toBe('applied');
    if (result.status !== 'applied') return;
    expect(result.text).toContain('palette: &palette "#334155" # shared value');
    expect(result.text).toContain('futureRoot: true\n\nstylesheet:');
    expect(result.text).toContain('backgroundColor: *palette');
    expect(result.text).toContain('futureRule: retained');
    expect(result.text).toContain('borderWidth: 3');
    expect(result.text.indexOf('selector: node')).toBeLessThan(result.text.indexOf('node[id = "router-1"]'));
    expect(result.text.indexOf('node[id = "router-1"]')).toBeLessThan(result.text.indexOf('selector: link'));
  });

  it('updates the last exact-ID rule and appends a new exact-ID rule after reusable rules', () => {
    const before = [
      'stylesheet:',
      '  - selector: \'node[id = "router-1"]\'',
      '    style: { borderWidth: 1 }',
      '  - selector: node[labels.role = "router"]',
      '    style: { shape: rectangle }',
      '  - selector: \'node[id = "router-1"]\'',
      '    style: { borderWidth: 2 }',
      ''
    ].join('\n');
    const updated = setCandidateStyleField(before, { id: 'router-1', kind: 'node' }, ['borderWidth'], 5);
    expect(updated.status).toBe('applied');
    if (updated.status !== 'applied') return;
    expect(updated.text.match(/borderWidth: 1/g)).toHaveLength(1);
    expect(updated.text.match(/borderWidth: 5/g)).toHaveLength(1);

    const appended = setCandidateStyleField(updated.text, { id: 'router-2', kind: 'node' }, ['backgroundColor'], '#abcdef');
    expect(appended.status).toBe('applied');
    if (appended.status !== 'applied') return;
    expect(appended.text.trimEnd().endsWith('backgroundColor: "#abcdef"')).toBe(true);
  });

  it('unsets a field and removes an exact-ID rule when its style becomes empty', () => {
    const before = ['stylesheet:', '  - selector: node', '    style: { shape: rectangle }', '  - selector: \'node[id = "router-1"]\'', '    style:', '      borderWidth: 3', ''].join('\n');

    const result = unsetCandidateStyleField(before, { id: 'router-1', kind: 'node' }, ['borderWidth']);

    expect(result.status).toBe('applied');
    if (result.status !== 'applied') return;
    expect(result.text).not.toContain('router-1');
    expect(result.text).toContain('selector: node');
  });

  it('cleans empty nested mappings before removing an empty exact-ID rule', () => {
    const before = ['stylesheet:', '  - selector: \'node[id = "router-1"]\'', '    style:', '      nodeLayout:', '        content:', '          align: left', ''].join('\n');

    const result = unsetCandidateStyleField(before, { id: 'router-1', kind: 'node' }, ['nodeLayout', 'content', 'align']);

    expect(result.status).toBe('applied');
    if (result.status !== 'applied') return;
    expect(result.text).toBe('stylesheet: []\n');
  });

  it('creates deterministic per-object rules for one same-kind bulk transaction', () => {
    const result = setCandidateStyleFieldForTargets(
      'stylesheet: []\n',
      [
        { id: 'router-1', kind: 'node' },
        { id: 'router-2', kind: 'node' }
      ],
      ['backgroundColor'],
      '#2563eb'
    );

    expect(result.status).toBe('applied');
    if (result.status !== 'applied') return;
    expect(result.text).toContain('node[id = "router-1"]');
    expect(result.text).toContain('node[id = "router-2"]');
    expect(result.text).not.toContain('labels.role');
    expect(result.updatedSelectors).toHaveLength(2);
  });

  it('creates, reuses, and removes one reusable attribute selector rule', () => {
    const selector = 'node[labels.role = "router"]';
    const created = setCandidateStyleFieldForSelector('stylesheet: []\n', selector, ['backgroundColor'], '#2563eb');
    expect(created.status).toBe('applied');
    if (created.status !== 'applied') return;
    expect(created.text.match(/selector:/g)).toHaveLength(1);
    expect(candidateStyleFieldForSelector(created.text, selector, ['backgroundColor'])).toMatchObject({
      exists: true,
      value: '#2563eb'
    });

    const updated = setCandidateStyleFieldForSelector(created.text, selector, ['borderWidth'], 3);
    expect(updated.status).toBe('applied');
    if (updated.status !== 'applied') return;
    expect(updated.text.match(/selector:/g)).toHaveLength(1);
    expect(updated.text).toContain('borderWidth: 3');

    const withoutBackground = unsetCandidateStyleFieldForSelector(updated.text, selector, ['backgroundColor']);
    expect(withoutBackground.status).toBe('applied');
    if (withoutBackground.status !== 'applied') return;
    expect(withoutBackground.text).not.toContain('backgroundColor');
    expect(withoutBackground.text).toContain('borderWidth: 3');
  });

  it('returns normalization-required instead of silently rewriting an unsupported root', () => {
    const before = '# no stylesheet sequence yet\nlayout: { mode: manual }\n';
    const result = setCandidateStyleField(before, { id: 'router-1', kind: 'node' }, ['width'], 100);

    expect(result.status).toBe('normalization-required');
    if (result.status !== 'normalization-required') return;
    expect(result.before).toBe(before);
    expect(result.after).toContain('stylesheet:');
    expect(result.reason).toContain('stylesheet sequence');
  });

  it('detects inline winners and migrates selected fields atomically', () => {
    const topology = [
      'graph:',
      '  layers: [{ id: physical, name: Physical }]',
      '  nodes:',
      '    - id: router-1',
      '      name: Router 1',
      '      layers: [physical]',
      '      position: [10, 20]',
      '      style:',
      '        backgroundColor: "#111111" # inline winner',
      '        borderWidth: 4',
      '  links: []',
      ''
    ].join('\n');
    const target = { id: 'router-1', kind: 'node' } as const;

    expect(inlineStyleWinner(topology, target, ['backgroundColor'])).toMatchObject({
      exists: true,
      value: '#111111'
    });
    const result = migrateInlineStylesToCandidate({
      fieldPaths: [['backgroundColor'], ['borderWidth']],
      stylesheetText: 'stylesheet: []\n',
      target,
      topologyText: topology
    });

    expect(result.status).toBe('applied');
    if (result.status !== 'applied') return;
    expect(result.topologyText).not.toContain('style:');
    expect(result.topologyText).toContain('position: [10, 20]');
    expect(result.stylesheetText).toContain('backgroundColor: "#111111"');
    expect(result.stylesheetText).toContain('borderWidth: 4');

    const beforeProjection = evaluateStylesheetCandidate({ topologyText: topology }, 'stylesheet: []\n');
    const afterProjection = evaluateStylesheetCandidate({ topologyText: result.topologyText }, result.stylesheetText);
    expect(beforeProjection.ok).toBe(true);
    expect(afterProjection.ok).toBe(true);
    if (!beforeProjection.ok || !afterProjection.ok) return;
    const beforeNode = beforeProjection.preview.projection.document.graph?.nodes?.[0] as GraphNode;
    const afterNode = afterProjection.preview.projection.document.graph?.nodes?.[0] as GraphNode;
    const beforeStyle = resolveStyleProvenance('node', beforeNode, beforeProjection.preview.projection.document);
    const afterStyle = resolveStyleProvenance('node', afterNode, afterProjection.preview.projection.document);
    for (const key of ['backgroundColor', 'borderWidth']) {
      expect(afterStyle.find((field) => field.key === key)?.effectiveValue).toEqual(beforeStyle.find((field) => field.key === key)?.effectiveValue);
    }
  });
});
