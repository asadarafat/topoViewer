import { useEffect, useState } from 'react';
import type { StyleTargetKind } from 'topoviewer';
import { styleAuthoringMetadata, styleAuthoringMetadataByTarget } from 'topoviewer/authoring';
import type { StudioHost } from '../../contracts/host';
import type { StudioFieldPreference } from '../../contracts/profiles';
import {
  emptyStudioAuthoringProfile,
  migrateStudioAuthoringProfile,
  reorderStudioFieldPreference,
  studioAuthoringProfileKey,
  updateStudioFieldPreference
} from './profile';

interface StudioAuthoringProfileOptions {
  announce(message: string): void;
  host: StudioHost;
  setError(message?: string): void;
}

export function useStudioAuthoringProfile({ announce, host, setError }: StudioAuthoringProfileOptions) {
  const [authoringProfile, setAuthoringProfile] = useState(emptyStudioAuthoringProfile);

  useEffect(() => {
    let active = true;
    void host.readPreference<ReturnType<typeof emptyStudioAuthoringProfile>>(studioAuthoringProfileKey).then((result) => {
      if (!active || !result.ok || !result.value) return;
      const migration = migrateStudioAuthoringProfile(result.value, styleAuthoringMetadata);
      setAuthoringProfile(migration.migrated);
      if (migration.warnings.length) announce(migration.warnings.join(' '));
    });
    return () => {
      active = false;
    };
  }, [announce, host]);

  function persist(next: ReturnType<typeof emptyStudioAuthoringProfile>, summary: string) {
    setAuthoringProfile(next);
    announce(summary);
    void host.writePreference(studioAuthoringProfileKey, next).then((result) => {
      if (result.ok) return;
      const message = `Profile update failed: ${result.error.message}`;
      setError(message);
      announce(message);
    });
  }

  return {
    authoringProfile,
    reorderFieldProfile(target: StyleTargetKind, path: string, direction: -1 | 1) {
      persist(
        reorderStudioFieldPreference(authoringProfile, target, styleAuthoringMetadataByTarget[target], path, direction),
        `Reordered ${path}`
      );
    },
    resetAuthoringProfile() {
      persist(emptyStudioAuthoringProfile(), 'Reset authoring field profile');
    },
    updateFieldProfile(
      target: StyleTargetKind,
      path: string,
      patch: Partial<Pick<StudioFieldPreference, 'hidden' | 'level' | 'order'>>
    ) {
      persist(updateStudioFieldPreference(authoringProfile, target, path, patch), `Updated ${path} authoring preference`);
    }
  };
}
