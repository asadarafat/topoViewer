import type { StyleTargetKind } from 'topoviewer';
import type { AuthoringFieldLevel, AuthoringFieldMetadata } from 'topoviewer/authoring';
import type { StudioAuthoringProfileOverride, StudioFieldPreference, StudioProfileMigrationResult, StudioResolvedFieldPreference } from '../../contracts/profiles';

export const studioAuthoringProfileKey = 'topoviewer-studio:authoring-profile';
export const studioAuthoringProfileVersion = 1;

export function emptyStudioAuthoringProfile(): StudioAuthoringProfileOverride {
  return {
    fields: [],
    metadataVersion: studioAuthoringProfileVersion,
    profileId: 'default',
    updatedAt: new Date(0).toISOString()
  };
}

function preferenceFor(profile: StudioAuthoringProfileOverride, target: StyleTargetKind, path: string): StudioFieldPreference | undefined {
  return profile.fields.find((preference) => preference.path === path && (!preference.targets?.length || preference.targets.includes(target)));
}

export function resolveStudioFieldProfile(fields: readonly AuthoringFieldMetadata[], target: StyleTargetKind, profile: StudioAuthoringProfileOverride): StudioResolvedFieldPreference[] {
  return fields.map((field) => {
    const preference = preferenceFor(profile, target, field.path);
    return {
      hidden: preference?.hidden === true,
      level: preference?.level || field.level,
      order: preference?.order ?? field.order,
      path: field.path
    };
  });
}

export function updateStudioFieldPreference(profile: StudioAuthoringProfileOverride, target: StyleTargetKind, path: string, patch: Partial<Pick<StudioFieldPreference, 'hidden' | 'level' | 'order'>>): StudioAuthoringProfileOverride {
  const existing = profile.fields.find((preference) => preference.path === path && preference.targets?.length === 1 && preference.targets[0] === target);
  const fields = profile.fields.filter((preference) => !(preference.path === path && preference.targets?.length === 1 && preference.targets[0] === target));
  const next: StudioFieldPreference = {
    ...existing,
    path,
    targets: [target],
    ...patch
  };
  if (next.hidden !== undefined || next.level !== undefined || next.order !== undefined) fields.push(next);
  return {
    ...profile,
    fields,
    metadataVersion: studioAuthoringProfileVersion,
    updatedAt: new Date().toISOString()
  };
}

export function reorderStudioFieldPreference(profile: StudioAuthoringProfileOverride, target: StyleTargetKind, fields: readonly AuthoringFieldMetadata[], path: string, direction: -1 | 1): StudioAuthoringProfileOverride {
  const resolved = resolveStudioFieldProfile(fields, target, profile)
    .filter((field) => !field.hidden)
    .sort((left, right) => left.order - right.order || left.path.localeCompare(right.path));
  const index = resolved.findIndex((field) => field.path === path);
  const swapIndex = index + direction;
  if (index < 0 || swapIndex < 0 || swapIndex >= resolved.length) return profile;
  const current = resolved[index];
  const swap = resolved[swapIndex];
  const first = updateStudioFieldPreference(profile, target, current.path, {
    order: swap.order
  });
  return updateStudioFieldPreference(first, target, swap.path, {
    order: current.order
  });
}

export function migrateStudioAuthoringProfile(profile: StudioAuthoringProfileOverride, metadata: readonly AuthoringFieldMetadata[]): StudioProfileMigrationResult {
  const removedPaths: string[] = [];
  const fields = profile.fields.filter((preference) => {
    const targets = preference.targets || [];
    const valid = metadata.some((field) => field.path === preference.path && (!targets.length || targets.some((target) => field.targets.includes(target))));
    if (!valid) removedPaths.push(preference.path);
    return valid;
  });
  const warnings = profile.metadataVersion === studioAuthoringProfileVersion ? [] : [`Migrated authoring profile metadata ${profile.metadataVersion} to ${studioAuthoringProfileVersion}.`];
  if (removedPaths.length) warnings.push(`Removed ${removedPaths.length} incompatible field override${removedPaths.length === 1 ? '' : 's'}.`);
  return {
    migrated: {
      ...profile,
      fields,
      metadataVersion: studioAuthoringProfileVersion,
      updatedAt: new Date().toISOString()
    },
    removedPaths,
    warnings
  };
}

export function fieldLevelAfterToggle(level: AuthoringFieldLevel): AuthoringFieldLevel {
  return level === 'basic' ? 'advanced' : 'basic';
}
