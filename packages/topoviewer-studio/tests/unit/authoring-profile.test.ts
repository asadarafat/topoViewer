import { describe, expect, it } from 'vitest';
import { styleAuthoringMetadataByTarget } from 'topoviewer/authoring';
import { emptyStudioAuthoringProfile, migrateStudioAuthoringProfile, reorderStudioFieldPreference, resolveStudioFieldProfile, updateStudioFieldPreference } from '../../src/features/inspector/profile';

describe('Studio authoring profiles', () => {
  it('layers sparse target-specific overrides over canonical metadata', () => {
    const base = emptyStudioAuthoringProfile();
    const promoted = updateStudioFieldPreference(base, 'node', 'outlineWidth', { level: 'basic' });
    const hidden = updateStudioFieldPreference(promoted, 'node', 'shape', { hidden: true });
    const resolved = resolveStudioFieldProfile(styleAuthoringMetadataByTarget.node, 'node', hidden);
    expect(resolved.find((field) => field.path === 'outlineWidth')?.level).toBe('basic');
    expect(resolved.find((field) => field.path === 'shape')?.hidden).toBe(true);
    expect(hidden.fields).toHaveLength(2);
    expect(hidden.fields.find((field) => field.path === 'outlineWidth')).toMatchObject({ level: 'basic' });
    const promotedAndHidden = updateStudioFieldPreference(promoted, 'node', 'outlineWidth', { hidden: true });
    expect(promotedAndHidden.fields.find((field) => field.path === 'outlineWidth')).toMatchObject({ hidden: true, level: 'basic' });
  });

  it('reorders fields without changing canonical metadata', () => {
    const fields = styleAuthoringMetadataByTarget.node;
    const reordered = reorderStudioFieldPreference(emptyStudioAuthoringProfile(), 'node', fields, 'width', -1);
    const resolved = resolveStudioFieldProfile(fields, 'node', reordered).sort((left, right) => left.order - right.order || left.path.localeCompare(right.path));
    expect(resolved.findIndex((field) => field.path === 'width')).toBeLessThan(resolved.findIndex((field) => field.path === 'shapePolygonPoints'));
    expect(resolved.findIndex((field) => field.path === 'width')).toBeGreaterThan(resolved.findIndex((field) => field.path === 'nodeLayout'));
    expect(fields.find((field) => field.path === 'width')?.order).toBeGreaterThan(fields.find((field) => field.path === 'nodeLayout')?.order || -1);
  });

  it('migrates valid overrides and reports removed paths', () => {
    const profile = {
      ...emptyStudioAuthoringProfile(),
      fields: [
        { path: 'shape', targets: ['node' as const], level: 'advanced' as const },
        { path: 'removedField', targets: ['node' as const], hidden: true }
      ],
      metadataVersion: 0
    };
    const result = migrateStudioAuthoringProfile(profile, styleAuthoringMetadataByTarget.node);
    expect(result.migrated.fields).toHaveLength(1);
    expect(result.removedPaths).toEqual(['removedField']);
    expect(result.warnings).toHaveLength(2);
  });
});
