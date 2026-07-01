import { useState, type Dispatch, type SetStateAction } from 'react';
import type { TopoDocument } from 'topoviewer';
import type { WebviewState } from '../shared/types';
import { mapperPresetDocument } from './mapperPresets';
import {
  appendMapperRule,
  defaultMapperRuleBuilderState,
  type MapperTopologyPickers
} from './mapperRuleBuilder';
import type { HarnessMode } from './webviewAppSupport';

interface UseMapperRuleAuthoringOptions {
  draftMapperText: string;
  flash: (message: string) => void;
  mapperPickers: MapperTopologyPickers;
  setDraftMapperText: Dispatch<SetStateAction<string>>;
  setMode: Dispatch<SetStateAction<HarnessMode>>;
  setTab: Dispatch<SetStateAction<number>>;
  state?: WebviewState;
  visibleDocument?: TopoDocument;
}

export function useMapperRuleAuthoring({
  draftMapperText,
  flash,
  mapperPickers,
  setDraftMapperText,
  setMode,
  setTab,
  state,
  visibleDocument
}: UseMapperRuleAuthoringOptions) {
  const [mapperRuleBuilder, setMapperRuleBuilder] = useState(defaultMapperRuleBuilderState);

  function insertMapperPreset(presetId: string) {
    const preset = mapperPresetDocument(presetId, visibleDocument?.graph?.id || state?.fixtureId || 'topoviewer');
    if (!preset) {
      flash('Mapper preset is not available');
      return;
    }
    setMode('yaml');
    setTab(2);
    setDraftMapperText(preset);
    flash('Inserted mapper preset');
  }

  function updateMapperRuleBuilder(patch: Partial<typeof mapperRuleBuilder>) {
    setMapperRuleBuilder((current) => ({ ...current, ...patch }));
  }

  function insertMapperRuleFromBuilder() {
    try {
      const graphId = visibleDocument?.graph?.id || state?.fixtureId || 'topoviewer';
      const nextMapper = appendMapperRule(
        draftMapperText || 'version: 1\nmappings: []\n',
        mapperRuleBuilder,
        mapperPickers,
        graphId
      );
      setMode('yaml');
      setTab(2);
      setDraftMapperText(nextMapper);
      flash('Inserted mapper rule draft');
    } catch (error) {
      flash(error instanceof Error ? error.message : String(error));
    }
  }

  return {
    insertMapperPreset,
    insertMapperRuleFromBuilder,
    mapperRuleBuilder,
    updateMapperRuleBuilder
  };
}
