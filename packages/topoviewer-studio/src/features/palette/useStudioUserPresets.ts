import { useEffect, useState } from 'react';
import type { TopoDocument } from 'topoviewer';
import type { AuthoringObjectSelection } from 'topoviewer/authoring';
import type { StudioHost } from '../../contracts/host';
import type { StudioUserPreset } from './types';
import { canSaveSelectionAsPreset, createStudioUserPreset, loadStudioUserPresets, renamedStudioUserPreset, studioUserPresetCollection, studioUserPresetsPreferenceKey } from './userPresets';

interface UseStudioUserPresetsOptions {
  host: StudioHost;
  onAnnouncement(message: string): void;
  onError(message: string | undefined): void;
}

export function useStudioUserPresets({ host, onAnnouncement, onError }: UseStudioUserPresetsOptions) {
  const [presets, setPresets] = useState<StudioUserPreset[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void host.readPreference<unknown>(studioUserPresetsPreferenceKey).then((result) => {
      if (!active) return;
      if (result.ok && result.value !== undefined) {
        const loaded = loadStudioUserPresets(result.value);
        setPresets(loaded.presets);
        if (loaded.warnings.length > 0) onAnnouncement(loaded.warnings.join(' '));
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [host, onAnnouncement]);

  function persist(next: StudioUserPreset[], summary: string) {
    let collection: ReturnType<typeof studioUserPresetCollection>;
    try {
      collection = studioUserPresetCollection(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onError(message);
      onAnnouncement(`Object Palette update failed: ${message}`);
      return false;
    }
    setPresets(next);
    onError(undefined);
    onAnnouncement(summary);
    void host.writePreference(studioUserPresetsPreferenceKey, collection).then((result) => {
      if (result.ok) return;
      const message = `Object Palette persistence failed: ${result.error.message}`;
      onError(message);
      onAnnouncement(message);
    });
    return true;
  }

  function save(document: TopoDocument, selection: AuthoringObjectSelection[]) {
    if (!ready) {
      onAnnouncement('Object Palette items are still loading.');
      return false;
    }
    const preset = createStudioUserPreset(document, selection, presets);
    if (!preset) {
      onAnnouncement('Select one node, link, or annotation to save it to the Object Palette.');
      return false;
    }
    return persist([...presets, preset], `${preset.name} saved to the Object Palette`);
  }

  function rename(id: string, name: string) {
    try {
      const next = renamedStudioUserPreset(presets, id, name);
      const renamed = next.find((preset) => preset.id === id);
      return persist(next, `${renamed?.name || 'Object Palette item'} renamed`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onError(message);
      onAnnouncement(`Object Palette update failed: ${message}`);
      return false;
    }
  }

  function remove(id: string) {
    const preset = presets.find((candidate) => candidate.id === id);
    if (!preset) return false;
    return persist(
      presets.filter((candidate) => candidate.id !== id),
      `${preset.name} removed from the Object Palette`
    );
  }

  return {
    canSave: (selection: AuthoringObjectSelection[]) => ready && canSaveSelectionAsPreset(selection),
    presets,
    remove,
    rename,
    save
  };
}
