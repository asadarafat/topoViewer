import { describe, expect, it } from 'vitest';
import stylesheetSchema from '../../../topoviewer/schemas/topoviewer-stylesheet.schema.json';
import topoviewerSchema from '../../../topoviewer/schemas/topoviewer.schema.json';
import { createStarterProject } from '../../src/hosts/starterProject';
import { createStudioDocumentSession } from '../../src/session';
import { createStudioYamlAssist, stylesheetCursorContext, stylesheetQuestionMarkRange } from '../../src/features/workspace/yamlAssist';

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
    ['root value', 'version: |"1"\n', 'root-value'],
    ['layout key', 'layout:\n  wid|\n', 'structure-key'],
    ['layout value', 'layout:\n  mode: |manual\n', 'structure-value'],
    ['CLOS key', 'layout:\n  mode: clos\n  clos:\n    dire|\n', 'structure-key'],
    ['CLOS value', 'layout:\n  mode: clos\n  clos:\n    direction: |topToBottom\n', 'structure-value'],
    ['limits key', 'limits:\n  max|\n', 'structure-key'],
    ['toggle key', 'toggles:\n  - id: showRegions\n    def|\n', 'structure-key'],
    ['toggle value', 'toggles:\n  - id: showRegions\n    default: |true\n', 'structure-value'],
    ['label field value', 'labelFields:\n  - |name\n', 'label-field-value'],
    ['icon field', 'icons:\n  spur:\n    gly|\n', 'icon-field'],
    ['icon value', 'icons:\n  spur:\n    glyph: |\n', 'icon-value'],
    ['comment', 'stylesheet:\n  # question |? remains\n', 'comment'],
    ['quoted string', 'stylesheet:\n  - selector: node\n    style:\n      label: "what |?"\n', 'quoted-string'],
    ['block scalar', 'stylesheet:\n  - selector: node\n    style:\n      label: |\n        what |?\n', 'block-scalar'],
    ['URL', 'stylesheet:\n  - selector: node\n    style:\n      icon: https://example.test/a|?b\n', 'url']
  ])('classifies %s context', (_name, source, expected) => {
    const cursor = marked(source);
    expect(stylesheetCursorContext(cursor.text, cursor.offset).kind).toBe(expected);
  });

  it('infers the nearest rule target, field, and existing keys', () => {
    const cursor = marked(['stylesheet:', '  - selector: node', '    style:', '      shape: rectangle', '      background|Color: "#123456"', ''].join('\n'));
    expect(stylesheetCursorContext(cursor.text, cursor.offset)).toMatchObject({
      existingKeys: ['shape', 'backgroundColor'],
      field: 'backgroundColor',
      kind: 'style-key',
      ruleIndex: 0,
      target: 'node'
    });
  });

  it('recovers the rule target while a style key is incomplete YAML', () => {
    const cursor = marked(['stylesheet:', '  - selector: node', '    style:', '      shape: rectangle', '      back|', ''].join('\n'));
    expect(stylesheetCursorContext(cursor.text, cursor.offset)).toMatchObject({
      existingKeys: ['shape'],
      kind: 'style-key',
      ruleIndex: 0,
      target: 'node'
    });
  });

  it('classifies nested nodeLayout keys and values', () => {
    const key = marked(['stylesheet:', '  - selector: node', '    style:', '      nodeLayout:', '        icon:', '          pla|', ''].join('\n'));
    expect(stylesheetCursorContext(key.text, key.offset)).toMatchObject({
      kind: 'style-key',
      styleNestedPrefix: 'icon',
      styleNestedRoot: 'nodeLayout',
      target: 'node'
    });

    const value = marked(['stylesheet:', '  - selector: node', '    style:', '      nodeLayout:', '        content:', '          align: |left', ''].join('\n'));
    expect(stylesheetCursorContext(value.text, value.offset)).toMatchObject({
      field: 'nodeLayout.content.align',
      kind: 'style-value',
      styleNestedPrefix: 'content',
      styleNestedRoot: 'nodeLayout'
    });
  });
});

describe('stylesheet YAML assistance', () => {
  const project = createStarterProject({ template: 'backbone' });
  const document = createStudioDocumentSession(project).snapshot().projection.document;
  const assist = createStudioYamlAssist(project, document);

  it('covers every schema-defined stylesheet root field and excludes existing fields', () => {
    const cursor = marked('layout:\n  mode: manual\n|');
    const labels = assist
      .completions('stylesheet', cursor)
      .map((entry) => entry.label)
      .sort();
    const expected = Object.keys(stylesheetSchema.properties)
      .filter((key) => key !== 'layout')
      .sort();
    expect(labels).toEqual(expected);
  });

  it('covers every fixed schema field in structural stylesheet sections', () => {
    const cases = [
      ['layout:\n  |\n', 'layout'],
      ['layout:\n  clos:\n    |\n', 'closLayout'],
      ['limits:\n  |\n', 'limits'],
      ['toggles:\n  - |\n', 'toggle'],
      ['icons:\n  custom:\n    |\n', 'icon']
    ] as const;
    cases.forEach(([source, definition]) => {
      const cursor = marked(source);
      const actual = assist
        .completions('stylesheet', cursor)
        .map((entry) => entry.label)
        .sort();
      const expected = Object.keys(topoviewerSchema.definitions[definition].properties || {}).sort();
      expect(actual, definition).toEqual(expected);
    });
  });

  it('suggests structural fields and constrained values by section', () => {
    const layout = marked('layout:\n  width: 900\n  |\n');
    const layoutLabels = assist.completions('stylesheet', layout).map((entry) => entry.label);
    expect(layoutLabels).toContain('mode');
    expect(layoutLabels).toContain('clos');
    expect(layoutLabels).not.toContain('width');

    const layoutMode = marked('layout:\n  mode: |\n');
    expect(assist.completions('stylesheet', layoutMode).map((entry) => entry.label)).toEqual(expect.arrayContaining(['manual', 'force', 'clos']));

    const closDirection = marked('layout:\n  clos:\n    direction: |\n');
    expect(assist.completions('stylesheet', closDirection).map((entry) => entry.label)).toContain('leftToRight');

    const limits = marked('limits:\n  maxNodes: 1200\n  |\n');
    const limitLabels = assist.completions('stylesheet', limits).map((entry) => entry.label);
    expect(limitLabels).toContain('maxEdges');
    expect(limitLabels).not.toContain('maxNodes');

    const toggle = marked('toggles:\n  - id: showRegions\n    |\n');
    expect(assist.completions('stylesheet', toggle).map((entry) => entry.label)).toEqual(expect.arrayContaining(['labels', 'default']));
    const toggleDefault = marked('toggles:\n  - id: showRegions\n    default: |\n');
    expect(assist.completions('stylesheet', toggleDefault).map((entry) => entry.label)).toEqual(expect.arrayContaining(['false', 'true']));

    const labelField = marked('labelFields:\n  - |\n');
    expect(assist.completions('stylesheet', labelField).map((entry) => entry.label)).toEqual(expect.arrayContaining(['labels.name', 'id']));
  });

  it('suggests only compatible missing properties for a rule target', () => {
    const cursor = marked(['stylesheet:', '  - selector: region', '    style:', '      backgroundColor: "#123456"', '      |', ''].join('\n'));
    const labels = assist.completions('stylesheet', cursor).map((entry) => entry.label);
    expect(labels).toContain('borderColor');
    expect(labels).not.toContain('backgroundColor');
    expect(labels).not.toContain('curveStyle');
  });

  it('suggests target-compatible properties while the key is partially typed', () => {
    const cursor = marked(['stylesheet:', '  - selector: node', '    style:', '      back|', ''].join('\n'));
    const labels = assist.completions('stylesheet', cursor).map((entry) => entry.label);
    expect(labels).toContain('backgroundColor');
    expect(labels).not.toContain('curveStyle');
  });

  it('suggests constrained values, project icons, and existing selector facts', () => {
    const shape = marked('stylesheet:\n  - selector: node\n    style:\n      shape: |\n');
    expect(assist.completions('stylesheet', shape).map((entry) => entry.label)).toContain('roundRectangle');

    const icon = marked('stylesheet:\n  - selector: node\n    style:\n      icon: |\n');
    expect(assist.completions('stylesheet', icon).map((entry) => entry.label)).toContain('nokia.router');

    const selector = marked('stylesheet:\n  - selector: |\n    style: {}\n');
    expect(assist.completions('stylesheet', selector).map((entry) => entry.label)).toContain('node[id = "edge-01"]');
  });

  it('suggests missing fields inside a user-defined icon', () => {
    const cursor = marked('icons:\n  spur:\n    glyph: "SP"\n    |\nstylesheet: []\n');
    const labels = assist.completions('stylesheet', cursor).map((entry) => entry.label);
    expect(labels).toContain('svg');
    expect(labels).toContain('fill');
    expect(labels).not.toContain('glyph');
  });

  it('resumes icon field suggestions after an inline SVG block', () => {
    const cursor = marked(['icons:', '  spur:', '    svg: |', '      <svg viewBox="0 0 24 24">', '        <path d="M2 12h20" />', '      </svg>', '    |', 'stylesheet: []', ''].join('\n'));
    const labels = assist.completions('stylesheet', cursor).map((entry) => entry.label);
    expect(labels).toContain('glyph');
    expect(labels).toContain('stroke');
    expect(labels).not.toContain('svg');
  });

  it('suggests nested nodeLayout fields and values without duplicates', () => {
    const root = marked(['stylesheet:', '  - selector: node', '    style:', '      nodeLayout:', '        type: card', '        |', ''].join('\n'));
    const rootLabels = assist.completions('stylesheet', root).map((entry) => entry.label);
    expect(rootLabels).toEqual(expect.arrayContaining(['direction', 'icon', 'content']));
    expect(rootLabels).not.toContain('type');

    const icon = marked(['stylesheet:', '  - selector: node', '    style:', '      nodeLayout:', '        icon:', '          width: 44', '          |', ''].join('\n'));
    const iconLabels = assist.completions('stylesheet', icon).map((entry) => entry.label);
    expect(iconLabels).toEqual(expect.arrayContaining(['placement', 'height']));
    expect(iconLabels).not.toContain('width');

    const align = marked(['stylesheet:', '  - selector: node', '    style:', '      nodeLayout:', '        content:', '          align: |', ''].join('\n'));
    expect(assist.completions('stylesheet', align).map((entry) => entry.label)).toEqual(['center', 'left', 'right']);
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
    const icon = 'icons:\n  spur:\n    ?\n';
    expect(stylesheetQuestionMarkRange(icon, icon.indexOf('?') + 1)).toBeDefined();
    const root = '?\nstylesheet: []\n';
    expect(stylesheetQuestionMarkRange(root, 1)).toBeDefined();
    const layout = 'layout:\n  ?\n';
    expect(stylesheetQuestionMarkRange(layout, layout.indexOf('?') + 1)).toBeDefined();
    const toggle = 'toggles:\n  - ?\n';
    expect(stylesheetQuestionMarkRange(toggle, toggle.indexOf('?') + 1)).toBeDefined();
    const labelField = 'labelFields:\n  - ?\n';
    expect(stylesheetQuestionMarkRange(labelField, labelField.indexOf('?') + 1)).toBeDefined();
    const nested = 'stylesheet:\n  - selector: node\n    style:\n      nodeLayout:\n        ?\n';
    expect(stylesheetQuestionMarkRange(nested, nested.indexOf('?') + 1)).toBeDefined();
  });

  it.each([
    'stylesheet:\n  # ? stays\n',
    'stylesheet:\n  - selector: node\n    style:\n      label: "?"\n',
    'stylesheet:\n  - selector: node\n    style:\n      label: |\n        ?\n',
    'stylesheet:\n  - selector: node\n    style:\n      icon: https://example.test/a?b\n',
    'icons:\n  spur:\n    svg: |\n      <svg>?</svg>\n'
  ])('does not modify protected source context', (text) => {
    const offset = text.indexOf('?') + 1;
    expect(stylesheetQuestionMarkRange(text, offset)).toBeUndefined();
  });
});
