import { useEffect, useMemo, useState } from 'react';
import type { StyleTargetKind } from 'topoviewer';
import { styleAuthoringMetadataByTarget } from 'topoviewer/authoring';
import type {
  StudioMapperStyleEditRequest,
  StudioMapperStyleUnsetRequest,
  StudioMapperRuleReference
} from '../../contracts/mapper';
import type { StudioAuthoringProfileOverride } from '../../contracts/profiles';
import { StyleFieldEditor } from '../inspector/Inspector';
import { resolveStudioFieldProfile } from '../inspector/profile';
import { mapperStyleSlots, mapperStyleTarget } from './mapperFieldModel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  StudioAccordion,
  StudioAccordionDetails,
  StudioAccordionSummary,
  StudioSelect,
  StudioTab,
  StudioTabs
} from '../../ui/controls';

interface MapperStyleEditorProps {
  assetOptions: string[];
  mapper: Record<string, unknown>;
  onCommit(request: StudioMapperStyleEditRequest): boolean;
  onUnset(request: StudioMapperStyleUnsetRequest): boolean;
  profile: StudioAuthoringProfileOverride;
  reference: StudioMapperRuleReference;
  rule: unknown;
}

type StyleView = 'basic' | 'advanced' | 'all';

function fieldsForView(target: StyleTargetKind, profile: StudioAuthoringProfileOverride, view: StyleView) {
  const fields = styleAuthoringMetadataByTarget[target];
  const resolved = resolveStudioFieldProfile(fields, target, profile);
  const profileByPath = new Map(resolved.map((field) => [field.path, field]));
  return fields
    .filter((field) => {
      const fieldProfile = profileByPath.get(field.path);
      if (fieldProfile?.hidden) return false;
      if (view === 'all') return true;
      return (fieldProfile?.level || field.level) === view;
    })
    .sort((left, right) => (
      (profileByPath.get(left.path)?.order ?? left.order) - (profileByPath.get(right.path)?.order ?? right.order)
    ));
}

export function MapperStyleEditor({
  assetOptions,
  mapper,
  onCommit,
  onUnset,
  profile,
  reference,
  rule
}: MapperStyleEditorProps) {
  const target = mapperStyleTarget(rule);
  const slots = useMemo(() => mapperStyleSlots(mapper, reference), [mapper, reference]);
  const [slotKey, setSlotKey] = useState('default');
  const [view, setView] = useState<StyleView>('basic');
  const slot = slots.find((candidate) => candidate.key === slotKey) || slots[0];
  const fields = useMemo(() => target ? fieldsForView(target, profile, view) : [], [profile, target, view]);

  useEffect(() => {
    if (!slots.some((candidate) => candidate.key === slotKey)) setSlotKey(slots[0]?.key || 'default');
  }, [slotKey, slots]);

  if (!target || !slot) {
    return (
      <section className="studio-mapper-style-editor" aria-label="Mapper state style">
        <h3>Rule style</h3>
        <span>This target does not accept object style fields.</span>
      </section>
    );
  }

  return (
    <StudioAccordion className="studio-mapper-style-editor" defaultExpanded>
      <StudioAccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>Rule style · {target}</StudioAccordionSummary>
      <StudioAccordionDetails><div className="studio-mapper-style-toolbar">
        <label>State
          <StudioSelect aria-label="Mapper style state" onChange={(event) => setSlotKey(event.target.value)} value={slot.key}>
            {slots.map((candidate) => <option key={candidate.key} value={candidate.key}>{candidate.label}</option>)}
          </StudioSelect>
        </label>
        <StudioTabs aria-label="Mapper style field view" className="studio-mapper-style-view" onChange={(_event, value: StyleView) => setView(value)} value={view}>
          {(['basic', 'advanced', 'all'] as const).map((candidate) => (
            <StudioTab key={candidate} label={candidate[0].toUpperCase() + candidate.slice(1)} value={candidate} />
          ))}
        </StudioTabs>
      </div>
      <div className="studio-mapper-style-fields" data-target={target}>
        {fields.map((field) => (
          <StyleFieldEditor
            assetOptions={assetOptions}
            explicit={slot.style[field.path] !== undefined}
            field={field}
            key={field.path}
            onCommit={(fieldPath, value) => onCommit({
              fieldPath,
              path: [...slot.path, ...fieldPath],
              scopePath: slot.scopePath,
              target,
              value
            })}
            onUnset={(fieldPath) => onUnset({
              path: [...slot.path, ...fieldPath],
              scopePath: slot.scopePath
            })}
            value={slot.style[field.path]}
          />
        ))}
      </div></StudioAccordionDetails>
    </StudioAccordion>
  );
}
