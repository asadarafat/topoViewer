import { describe, expect, it } from 'vitest';
import {
  candidateStyleFieldForSelector,
  ensureCandidateIconDefinition,
  removeCandidateStyleRulesForDeletedObjects,
  setCandidateStyleField,
  setCandidateStyleFieldForSelector,
  setCandidateStyleFieldForTargets,
  unsetCandidateStyleField,
  unsetCandidateStyleFieldForSelector
} from '../../src/session/stylesheetCandidateMutation';

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

  it('removes every deleted object rule without changing reusable policy or formatting', () => {
    const before = [
      '# stylesheet header',
      'stylesheet:',
      '  - selector: node',
      '    style: { width: 64 }',
      '',
      '  - selector: \'node[id = "router-1"]\' # remove object override',
      '    style: { width: 96 }',
      '  - selector: \'node[id = "router-1"][labels.role = "router"]\'',
      '    style: { borderWidth: 4 }',
      '  - selector: node[labels.role = "router"]',
      '    style: { shape: rectangle }',
      '  - selector: \'node[id = "router-2"]\'',
      '    style: { width: 80 }',
      ''
    ].join('\n');

    const result = removeCandidateStyleRulesForDeletedObjects(before, [{ id: 'router-1', kind: 'node' }]);

    expect(result.status).toBe('applied');
    if (result.status !== 'applied') return;
    expect(result.text).toContain('# stylesheet header');
    expect(result.text).not.toContain('node[id = "router-1"]');
    expect(result.text).toContain('node[labels.role = "router"]');
    expect(result.text).toContain('node[id = "router-2"]');
    expect(result.text).toContain('\n\n  - selector:');
  });

  it('collapses a candidate containing only deleted object rules to an empty sequence', () => {
    const result = removeCandidateStyleRulesForDeletedObjects(
      ['stylesheet:', '  - selector: \'node[id = "router-1"]\'', '    style: { width: 96 }', ''].join('\n'),
      [{ id: 'router-1', kind: 'node' }]
    );

    expect(result).toMatchObject({ status: 'applied', text: 'stylesheet: []\n' });
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

  it('adds a built-in icon declaration without rewriting existing stylesheet rules', () => {
    const before = '# keep header\nstylesheet:\n  - selector: node\n    style: { width: 64 }\n';
    const result = ensureCandidateIconDefinition(before, 'nokia.cloud', {
      alt: 'Nokia cloud',
      fill: '#546e7a',
      stroke: '#ffffff',
      svg: '<svg><rect fill="${fillColor}"/></svg>'
    });

    expect(result.status).toBe('applied');
    if (result.status !== 'applied') return;
    expect(result.text).toContain('# keep header');
    expect(result.text).toContain('nokia.cloud:');
    expect(result.text).toContain('${fillColor}');
    expect(result.text).toContain('selector: node');
  });

  it('preserves a project-owned icon with the same catalog key', () => {
    const before = 'icons:\n  nokia.cloud:\n    glyph: CUSTOM\nstylesheet: []\n';
    const result = ensureCandidateIconDefinition(before, 'nokia.cloud', { glyph: 'CLD' });

    expect(result).toEqual({ status: 'unchanged', text: before, updatedSelectors: [] });
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

});
