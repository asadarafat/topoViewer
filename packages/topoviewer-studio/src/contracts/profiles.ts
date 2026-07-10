import type { StyleTargetKind } from 'topoviewer';
import type { AuthoringFieldLevel } from 'topoviewer/authoring';

export interface StudioFieldPreference {
  hidden?: boolean;
  level?: AuthoringFieldLevel;
  order?: number;
  path: string;
  targets?: StyleTargetKind[];
}

export interface StudioAuthoringProfileOverride {
  fields: StudioFieldPreference[];
  metadataVersion: number;
  profileId: string;
  updatedAt: string;
}

export interface StudioResolvedFieldPreference {
  hidden: boolean;
  level: AuthoringFieldLevel;
  order: number;
  path: string;
}

export interface StudioProfileMigrationResult {
  migrated: StudioAuthoringProfileOverride;
  removedPaths: string[];
  warnings: string[];
}
