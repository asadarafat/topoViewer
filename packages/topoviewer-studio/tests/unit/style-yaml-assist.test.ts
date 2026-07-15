import { describe, expect, it } from 'vitest';
import { createStarterProject } from '../../src/hosts/starterProject';
import { createStudioDocumentSession } from '../../src/session';
import {
  createStudioYamlAssist,
  stylesheetCursorContext,
  stylesheetQuestionMarkRange
} from '../../src/features/workspace/yamlAssist';

function marked(value: string) {
  const offset = value.lastIndexOf('|');
  return { offset, text: value.slice(0, offset) + value.slice(offset + 1) };
}

describe('stylesheet YAML cursor context', () => {
  it.each([
    ['root', '|stylesheet: []\n', 'root'],
    ['sequence', 'stylesheet:\n  |\n', 'stylesheet-sequence'],
    ['selector', 'stylesheet:\n  - selector: |node\n    style: {}\n', 'selector'],
    ['style key', 'stylesheet:\n  - selector: node\n    style:\n      back|groundColor: red\n', 'style-key'],
    ['style value', 'stylesheet:\n  - selector: node\n    style:\n      shape: rou|ndRectangle\n', 'style-value'],
    ['comment', 'stylesheet:\n  # question |? remains\n', 'comment'],
    ['quoted string', 'stylesheet:\n  - selector: node\n    style:\n      label: "what |?"\n', 'quoted-string'],
    ['block scalar', 'stylesheet:\n  - selector: node\n    style:\n      label: |\n        what |?\n', 'block-scalar'],
    ['URL', 'stylesheet:\n  - selector: node\n    style:\n      icon: https://example.test/a|?b\n', 'url']
  ])('classifies %s context', (_name, source, expected) => {
    const cursor = marked(source);
    expect(stylesheetCursorContext(cursor.text, cursor.offset).kind).toBe(expected);
  });

  it('infers the nearest rule target, field, and existing keys', () => {
    const cursor = marked([
      'stylesheet:',
      '  - selector: node',
      '    style:',
      '      shape: rectangle',
      '      background|Color: "#123456"',
      ''
    ].join('\n'));
    expect(stylesheetCursorContext(cursor.text, cursor.offset)).toMatchObject({
      existingKeys: ['shape', 'backgroundColor'],
      field: 'backgroundColor',
      kind: 'style-key',
      ruleIndex: 0,
      target: 'node'
    });
  });

  it('recovers the rule target while a style key is incomplete YAML', () => {
    const cursor = marked([
      'stylesheet:',
      '  - selector: node',
      '    style:',
      '      shape: rectangle',
      '      back|',
      ''
    ].join('\n'));
    expect(stylesheetCursorContext(cursor.text, cursor.offset)).toMatchObject({
      existingKeys: ['shape'],
      kind: 'style-key',
      ruleIndex: 0,
      target: 'node'
    });
  });
});

describe('stylesheet YAML assistance', () => {
  const project = createStarterProject({ template: 'backbone' });
  const document = createStudioDocumentSession(project).snapshot().projection.document;
  const assist = createStudioYamlAssist(project, document);

  it('suggests only compatible missing properties for a rule target', () => {
    const cursor = marked([
      'stylesheet:',
      '  - selector: region',
      '    style:',
      '      backgroundColor: "#123456"',
      '      |',
      ''
    ].join('\n'));
    const labels = assist.completions('stylesheet', cursor).map((entry) => entry.label);
    expect(labels).toContain('borderColor');
    expect(labels).not.toContain('backgroundColor');
    expect(labels).not.toContain('curveStyle');
  });

  it('suggests target-compatible properties while the key is partially typed', () => {
    const cursor = marked([
      'stylesheet:',
      '  - selector: node',
      '    style:',
      '      back|',
      ''
    ].join('\n'));
    const labels = assist.completions('stylesheet', cursor).map((entry) => entry.label);
    expect(labels).toContain('backgroundColor');
    expect(labels).not.toContain('curveStyle');
  });

  it('suggests constrained values, project icons, and existing selector facts', () => {
    const shape = marked('stylesheet:\n  - selector: node\n    style:\n      shape: |\n');
    expect(assist.completions('stylesheet', shape).map((entry) => entry.label)).toContain('roundRectangle');

    const icon = marked('stylesheet:\n  - selector: node\n    style:\n      icon: |\n');
    expect(assist.completions('stylesheet', icon).map((entry) => entry.label)).toContain('topoviewer.router');

    const selector = marked('stylesheet:\n  - selector: |\n    style: {}\n');
    expect(assist.completions('stylesheet', selector).map((entry) => entry.label))
      .toContain('node[id = "edge-01"]');
  });

  it('provides metadata hover documentation in target context', () => {
    const cursor = marked('stylesheet:\n  - selector: link\n    style:\n      curve|Style: bezier\n');
    expect(assist.hover('stylesheet', 'curveStyle', cursor)?.contents).toContain('Curve style');
  });
});

describe('question-mark discovery safety', () => {
  it('activates only for standalone style keys and values', () => {
    const key = 'stylesheet:\n  - selector: node\n    style:\n      ?\n';
    expect(stylesheetQuestionMarkRange(key, key.indexOf('?') + 1)).toEqual({
      endOffset: key.indexOf('?') + 1,
      startOffset: key.indexOf('?')
    });
    const value = 'stylesheet:\n  - selector: node\n    style:\n      shape: ?\n';
    expect(stylesheetQuestionMarkRange(value, value.indexOf('?') + 1)).toBeDefined();
  });

  it.each([
    'stylesheet:\n  # ? stays\n',
    'stylesheet:\n  - selector: node\n    style:\n      label: "?"\n',
    'stylesheet:\n  - selector: node\n    style:\n      label: |\n        ?\n',
    'stylesheet:\n  - selector: node\n    style:\n      icon: https://example.test/a?b\n'
  ])('does not modify protected source context', (text) => {
    const offset = text.indexOf('?') + 1;
    expect(stylesheetQuestionMarkRange(text, offset)).toBeUndefined();
  });
});
