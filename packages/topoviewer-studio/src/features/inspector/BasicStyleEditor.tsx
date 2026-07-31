import { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { authoringFieldIsVisible, findAuthoringObject, resolveStyleProvenance, styleAuthoringMetadataByTarget, type AuthoringObjectSelection } from 'topoviewer/authoring';
import type { StyleTargetKind } from 'topoviewer';
import type { StudioSessionSnapshot } from '../../contracts/project';
import type { StudioStyleEditRequest, StudioStyleUnsetRequest } from '../../contracts/inspector';
import { candidateStyleFields, type StudioStylesheetCandidateState, type StudioStylesheetTarget } from '../../session';
import { StudioSearchField } from '../../ui/controls';
import { StudioDisclosureButton } from '../../ui/StudioDisclosureButton';
import { StudioPropertyField } from '../../ui/StudioPropertyRow';
import { StyleFieldEditor } from './Inspector';
import { studioSpace } from '../../ui/muiSpacing';
import { studioBuiltInIcons } from '../../templates/starterNodeTemplates';

const styleTargets = new Set<StyleTargetKind>(['node', 'link', 'linkDirection', 'path', 'region', 'shape', 'callout', 'text']);
const styleRecordCache = new WeakMap<object, Map<string, BasicStyleRecord | undefined>>();
const advancedFieldBatchSize = 6;

const targetLabels: Record<StyleTargetKind, string> = {
  callout: 'callout',
  link: 'link',
  linkDirection: 'link direction',
  node: 'node',
  path: 'path',
  region: 'region',
  shape: 'shape',
  text: 'text'
};

function targetForSelection(selection: { id: string; kind: string }): StudioStylesheetTarget | undefined {
  return styleTargets.has(selection.kind as StyleTargetKind) ? { id: selection.id, kind: selection.kind as StyleTargetKind } : undefined;
}

function sameValue(values: unknown[]): boolean {
  if (values.length < 2) return true;
  const first = JSON.stringify(values[0]);
  return values.every((value) => JSON.stringify(value) === first);
}

interface BasicStyleRecord {
  object: NonNullable<ReturnType<typeof findAuthoringObject>>;
  provenance: ReturnType<typeof resolveStyleProvenance>;
  target: StudioStylesheetTarget;
}

function cachedStyleRecord(
  document: StudioStylesheetCandidateState['latestValid']['projection']['document'],
  target: StudioStylesheetTarget
): BasicStyleRecord | undefined {
  let records = styleRecordCache.get(document);
  if (!records) {
    records = new Map();
    styleRecordCache.set(document, records);
  }
  const key = `${target.kind}:${target.id}`;
  if (records.has(key)) return records.get(key);
  const selection = { id: target.id, kind: target.kind } as AuthoringObjectSelection;
  const object = findAuthoringObject(document, selection);
  const record = object
    ? {
        object,
        provenance: resolveStyleProvenance(target.kind, object as Parameters<typeof resolveStyleProvenance>[1], document),
        target
      }
    : undefined;
  records.set(key, record);
  return record;
}

interface BasicStyleEditorProps {
  candidate: StudioStylesheetCandidateState;
  onCommit(request: StudioStyleEditRequest): boolean;
  onUnset(request: StudioStyleUnsetRequest): boolean;
  showSummary?: boolean;
  snapshot: StudioSessionSnapshot;
}

export function BasicStyleEditor({ candidate, onCommit, onUnset, showSummary = true, snapshot }: BasicStyleEditorProps) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  const [query, setQuery] = useState('');
  const [showAllFields, setShowAllFields] = useState(false);
  const [visibleAdditionalFieldCount, setVisibleAdditionalFieldCount] = useState(0);
  const targets = snapshot.selection.flatMap((selection) => {
    const target = targetForSelection(selection);
    return target ? [target] : [];
  });
  const targetIdentity = targets.map((item) => `${item.kind}:${item.id}`).join('|');
  useEffect(() => {
    setShowAllFields(false);
    setVisibleAdditionalFieldCount(0);
  }, [targetIdentity]);
  const targetKinds = [...new Set(targets.map((target) => target.kind))];
  const target = targetKinds.length === 1 ? targetKinds[0] : undefined;
  useEffect(() => {
    setQuery('');
  }, [target]);
  const records = useMemo(
    () => targets.flatMap((item) => {
      const record = cachedStyleRecord(candidate.latestValid.projection.document, item);
      return record ? [record] : [];
    }),
    [candidate.latestValid.projection.document, targetIdentity]
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const compatibleFields = target
    ? styleAuthoringMetadataByTarget[target].filter((field) =>
        records.every(({ provenance }) => {
          const values = Object.fromEntries(provenance.map((entry) => [entry.key, entry.effectiveValue]));
          return authoringFieldIsVisible(field, values);
        })
      )
    : [];
  const defaultFieldLimit = target === 'link' || target === 'linkDirection' || target === 'path' ? 12 : 8;
  const defaultFields = compatibleFields.filter((field) => field.level === 'basic' && field.control?.kind !== 'nested').slice(0, defaultFieldLimit);
  const additionalFields = compatibleFields
    .filter((field) => !defaultFields.includes(field))
    .sort((left, right) => Number(left.control?.kind === 'nested') - Number(right.control?.kind === 'nested'));
  useEffect(() => {
    if (!showAllFields || visibleAdditionalFieldCount >= additionalFields.length) return undefined;
    const revealNextBatch = () => {
      setVisibleAdditionalFieldCount((count) => Math.min(additionalFields.length, count + advancedFieldBatchSize));
    };
    const timer = setTimeout(
      revealNextBatch,
      visibleAdditionalFieldCount <= advancedFieldBatchSize ? 240 : 48
    );
    return () => clearTimeout(timer);
  }, [additionalFields.length, showAllFields, visibleAdditionalFieldCount]);
  const fields = normalizedQuery
    ? compatibleFields.filter((field) => [field.path, field.label, field.description, field.group, ...(field.aliases || [])].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)))
    : showAllFields
      ? [...defaultFields, ...additionalFields.slice(0, visibleAdditionalFieldCount)]
      : defaultFields;
  const fieldIdentity = fields.map((field) => field.path).join('|');
  const exactFields = useMemo(
    () => candidateStyleFields(
      candidate.candidateText,
      targets,
      fields.map((field) => [field.path])
    ),
    [candidate.candidateText, fieldIdentity, targetIdentity]
  );
  const iconDefinitions = useMemo(
    () => ({ ...studioBuiltInIcons, ...(candidate.latestValid.projection.document.icons || {}) }),
    [candidate.latestValid.projection.document.icons]
  );
  const styleScope = { kind: 'object' as const };

  if (snapshot.selection.length === 0) {
    return (
      <Box
        className="studio-basic-style-empty"
        sx={{
          display: 'grid',
          gap: studioSpace.space8,
          p: studioSpace.space16
        }}
      >
        <Typography component="h3" variant="subtitle2">
          Select an object to style
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Select a node, link, path, region, shape, callout, text, or link direction.
        </Typography>
      </Box>
    );
  }

  if (!target || records.length !== snapshot.selection.length) {
    return (
      <Box
        className="studio-basic-style-empty"
        sx={{
          display: 'grid',
          gap: studioSpace.space8,
          p: studioSpace.space16
        }}
      >
        <Typography component="h3" variant="subtitle2">
          Visual bulk editing unavailable
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Select objects of one compatible kind. Use Code for rules across target types.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      className="studio-basic-style-editor"
      data-field-count={compatibleFields.length}
      data-render-count={renderCount.current}
      data-rendered-field-count={fields.length}
      sx={{
        display: 'grid',
        gap: studioSpace.space8,
        minHeight: 0,
        p: showSummary ? studioSpace.space12 : 0
      }}
    >
      {showSummary ? (
        <Stack className="studio-basic-style-summary" spacing={studioSpace.space4}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography component="h3" variant="subtitle2">
              {targets.length === 1 ? targets[0].id : `${targets.length} ${targetLabels[target]}s`}
            </Typography>
            <Chip label={targetLabels[target]} size="small" variant="outlined" />
          </Stack>
          <Typography color="text.secondary" variant="caption">
            Changes create exact-ID rules in the candidate stylesheet.
          </Typography>
        </Stack>
      ) : null}
      <StudioPropertyField label="Search attributes">
        <StudioSearchField
          aria-label="Search style attributes"
          clearLabel="Clear style search"
          label="Search attributes"
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery('')}
          value={query}
        />
      </StudioPropertyField>
      <Box className="studio-basic-style-fields" id="studio-basic-style-fields" sx={{ minHeight: 0, overflowY: showSummary ? 'auto' : 'visible' }}>
        {fields.map((field, fieldIndex) => {
          const provenance = records.map((record) => record.provenance.find((entry) => entry.key === field.path));
          const values = provenance.map((entry) => entry?.effectiveValue);
          const mixed = !sameValue(values);
          const exact = exactFields.map((targetFields) => targetFields[fieldIndex]);
          const explicit = exact.some((entry) => entry.exists);
          const editor = (
            <StyleFieldEditor
              compact
              disabled={false}
              explicit={explicit}
              field={field}
              iconDefinitions={iconDefinitions}
              mixed={mixed}
              onCommit={(fieldPath, value) =>
                onCommit({
                  fieldPath,
                  scope: styleScope,
                  value
                })
              }
              onUnset={(fieldPath) => onUnset({ fieldPath, scope: styleScope })}
              value={mixed ? undefined : values[0]}
            />
          );
          return (
            <Box
              className="studio-basic-style-field"
              data-field-path={field.path}
              key={field.path}
              sx={{
                containIntrinsicSize: '52px',
                contentVisibility: 'auto',
                minWidth: 0,
                px: field.control?.kind === 'nested' ? 0 : studioSpace.space12,
                py: field.control?.kind === 'nested' ? 0 : studioSpace.space6
              }}
              title={field.description}
            >
              {editor}
              {mixed ? (
                <Typography color="text.secondary" sx={{ px: studioSpace.space12, textAlign: 'right' }} variant="caption">
                  Mixed values
                </Typography>
              ) : null}
            </Box>
          );
        })}
        {!fields.length ? (
          <Box sx={{ p: studioSpace.space16 }}>
            <Typography variant="body2">No matching style attributes.</Typography>
          </Box>
        ) : null}
      </Box>
      {!normalizedQuery && compatibleFields.length > defaultFields.length ? (
        <StudioDisclosureButton
          collapsedLabel={`View more (${compatibleFields.length - defaultFields.length})`}
          controls="studio-basic-style-fields"
          expanded={showAllFields}
          expandedLabel="View less"
          onClick={() => {
            setVisibleAdditionalFieldCount(showAllFields ? 0 : Math.min(additionalFields.length, advancedFieldBatchSize));
            setShowAllFields((value) => !value);
          }}
        />
      ) : null}
    </Box>
  );
}
