import { describe, expect, it } from 'vitest';
import {
  authoringFieldDefaultValue,
  authoringFieldIsVisible,
  coerceAuthoringFieldValue,
  mapperAuthoringCapabilities,
  mapperAuthoringMetadata,
  searchMapperAuthoringMetadata,
  searchStyleAuthoringMetadata,
  styleAuthoringFieldForKey,
  styleAuthoringMetadata,
  styleAuthoringMetadataByTarget,
  validateAuthoringMetadata
} from '../../src/authoring';
import { styleDefinitions } from '../../src/core/styleDefaults';

describe('canonical authoring metadata', () => {
  it('covers every public style target and key disposition', () => {
    expect(styleAuthoringMetadata).toHaveLength(styleDefinitions.length);
    const expected = new Set(styleDefinitions.flatMap((definition) => {
      const targets = definition.targets.includes('link')
        ? [...definition.targets, 'linkDirection']
        : definition.targets;
      return targets.map((target) => `${target}:${definition.key}`);
    }));
    const actual = new Set(styleAuthoringMetadata.flatMap((field) => (
      field.targets.map((target) => `${target}:${field.path}`)
    )));
    expect(actual).toEqual(expected);
    expect(validateAuthoringMetadata()).toEqual([]);
  });

  it('expands compatible link fields to link-direction authoring', () => {
    expect(styleAuthoringFieldForKey('linkDirection', 'lineColor')?.group).toBe('Stroke');
    expect(styleAuthoringMetadataByTarget.linkDirection.length).toBeGreaterThan(0);
  });

  it('supports task-oriented and searchable style facts', () => {
    expect(styleAuthoringFieldForKey('node', 'shape')?.level).toBe('basic');
    expect(styleAuthoringFieldForKey('node', 'outlineWidth')?.level).toBe('advanced');
    expect(searchStyleAuthoringMetadata('link', 'endpoint').some((field) => field.path === 'endpointLabelDistance')).toBe(true);
    expect(searchStyleAuthoringMetadata('node', 'card layout').map((field) => field.path)).toContain('nodeLayout');
  });

  it('describes nested and conditional style authoring without UI guesses', () => {
    const layout = styleAuthoringFieldForKey('node', 'nodeLayout');
    expect(layout?.visibleWhen).toEqual({ equals: 'roundRectangle', path: 'shape' });
    expect(layout?.control?.specializedEditor).toBe('node-layout');
    expect(layout?.nestedFields?.map((field) => field.path)).toEqual([
      'type', 'direction', 'icon.placement', 'icon.width', 'icon.height',
      'content.align', 'content.titleField', 'content.subtitleField'
    ]);
    expect(styleAuthoringFieldForKey('node', 'shapePolygonPoints')?.visibleWhen)
      .toEqual({ equals: 'polygon', path: 'shape' });
    expect(styleAuthoringFieldForKey('link', 'directionCenterGap')?.visibleWhen)
      .toEqual({ equals: true, path: 'directionalStrokes' });
    expect(styleAuthoringFieldForKey('link', 'lineDashPattern')?.control?.specializedEditor)
      .toBe('dash-pattern');
    expect(styleAuthoringFieldForKey('link', 'controlPointDistance')).toMatchObject({
      control: { kind: 'number', minimum: 0, step: 1 },
      level: 'basic',
      visibleWhen: { equals: 'bezier', path: 'curveStyle' }
    });
    expect(styleAuthoringFieldForKey('link', 'controlPointWeight')?.control)
      .toMatchObject({ kind: 'number', maximum: 1, minimum: 0, step: 0.05 });
    expect(searchStyleAuthoringMetadata('link', 'curve radius').map((field) => field.path))
      .toContain('controlPointDistance');
  });

  it('derives complete mapper metadata from the mapper schema', () => {
    const paths = new Set(mapperAuthoringMetadata.map((field) => field.path));
    expect(paths.has('version')).toBe(true);
    expect(paths.has('identity.sourceId')).toBe(true);
    expect(paths.has('rules[].metric')).toBe(true);
    expect(paths.has('rules[].style.*')).toBe(true);
    expect(paths.has('mappings[].target.resolve.by')).toBe(true);
    expect(paths.has('mappings[].conditions[].when.value.gte')).toBe(true);
    expect(paths.size).toBe(mapperAuthoringMetadata.length);
    expect(searchMapperAuthoringMetadata('severity').length).toBeGreaterThan(0);
    expect(mapperAuthoringMetadata.find((field) => field.path === 'rules[].style')?.targetKinds)
      .toEqual(['node', 'link', 'linkDirection', 'path', 'region']);
  });

  it('disposes every mapper authoring capability without inventing YAML keys', () => {
    expect(mapperAuthoringCapabilities.map((capability) => capability.id)).toEqual([
      'compact-rules', 'canonical-mappings', 'identity', 'transforms', 'states',
      'formatting', 'priority', 'diagnostics', 'unknown-extensions'
    ]);
    const fieldPaths = new Set(mapperAuthoringMetadata.map((field) => field.path));
    for (const capability of mapperAuthoringCapabilities) {
      expect(capability.description).not.toBe('');
      for (const path of capability.fieldPaths) expect(fieldPaths.has(path), `${capability.id}: ${path}`).toBe(true);
    }
    expect(mapperAuthoringCapabilities.find(({ id }) => id === 'priority')?.disposition).toBe('ordered-sequence');
    expect(mapperAuthoringCapabilities.find(({ id }) => id === 'diagnostics')?.fieldPaths).toEqual([]);
    expect(mapperAuthoringCapabilities.find(({ id }) => id === 'unknown-extensions')?.disposition).toBe('raw-yaml-fallback');
  });

  it('defines a tested editor disposition for every style value type and target', () => {
    const expectedTypes = new Set(['boolean', 'color', 'enum', 'integer', 'number', 'numberList', 'object', 'text']);
    expect(new Set(styleAuthoringMetadata.map((field) => field.valueType))).toEqual(expectedTypes);
    styleAuthoringMetadata.forEach((field) => {
      expect(field.targets.length).toBeGreaterThan(0);
      expect(field.control).toBeDefined();
      if (field.control?.kind === 'nested' || field.control?.kind === 'asset' || field.control?.kind === 'selector') {
        expect(field.control.specializedEditor).toBeTruthy();
      }
    });
  });

  it('resolves defaults and parent conditions without React-specific behavior', () => {
    const width = styleAuthoringFieldForKey('node', 'width')!;
    const background = styleAuthoringFieldForKey('node', 'backgroundColor')!;
    const layout = styleAuthoringFieldForKey('node', 'nodeLayout')!;
    expect(authoringFieldDefaultValue(width)).toBe(82);
    expect(authoringFieldDefaultValue(background)).toBe('#6ea8fe');
    expect(authoringFieldIsVisible(layout, { shape: 'rectangle' })).toBe(false);
    expect(authoringFieldIsVisible(layout, { shape: 'roundRectangle' })).toBe(true);
  });

  it('coerces every generic control type and rejects invalid values', () => {
    expect(coerceAuthoringFieldValue(styleAuthoringFieldForKey('node', 'draggable')!, 'false'))
      .toEqual({ ok: true, value: false });
    expect(coerceAuthoringFieldValue(styleAuthoringFieldForKey('node', 'width')!, '96'))
      .toEqual({ ok: true, value: 96 });
    expect(coerceAuthoringFieldValue(styleAuthoringFieldForKey('node', 'labelOpacity')!, '0.75'))
      .toEqual({ ok: true, value: 0.75 });
    expect(coerceAuthoringFieldValue(styleAuthoringFieldForKey('link', 'lineDashPattern')!, '8, 4'))
      .toEqual({ ok: true, value: [8, 4] });
    expect(coerceAuthoringFieldValue(styleAuthoringFieldForKey('node', 'shape')!, 'not-a-shape').ok).toBe(false);
    expect(coerceAuthoringFieldValue(styleAuthoringFieldForKey('node', 'width')!, '3.5').ok).toBe(false);
  });
});
