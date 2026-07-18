import { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { authoringFieldIsVisible, findAuthoringObject, resolveStyleProvenance, styleAuthoringMetadataByTarget, type AuthoringObjectSelection } from 'topoviewer/authoring';
import type { StyleTargetKind } from 'topoviewer';
import type { StudioSessionSnapshot } from '../../contracts/project';
import type { StudioStyleEditRequest, StudioStyleUnsetRequest } from '../../contracts/inspector';
import { candidateStyleField, type StudioStylesheetCandidateState, type StudioStylesheetTarget } from '../../session';
import { StudioSearchField } from '../../ui/controls';
import { StudioDisclosureButton } from '../../ui/StudioDisclosureButton';
import { StudioPropertyRow } from '../../ui/StudioPropertyRow';
import { StyleFieldEditor } from './Inspector';
import { studioSpace } from '../../ui/muiSpacing';

const styleTargets = new Set<StyleTargetKind>(['node', 'link', 'linkDirection', 'path', 'region', 'shape', 'callout', 'text']);

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
  const targets = snapshot.selection.flatMap((selection) => {
    const target = targetForSelection(selection);
    return target ? [target] : [];
  });
  const targetIdentity = targets.map((item) => `${item.kind}:${item.id}`).join('|');
  useEffect(() => {
    setShowAllFields(false);
  }, [targetIdentity]);
  const targetKinds = [...new Set(targets.map((target) => target.kind))];
  const target = targetKinds.length === 1 ? targetKinds[0] : undefined;
  useEffect(() => {
    setQuery('');
  }, [target]);
  const records = useMemo(
    () =>
      targets.flatMap((item) => {
        const selection = {
          id: item.id,
          kind: item.kind
        } as AuthoringObjectSelection;
        const object = findAuthoringObject(candidate.latestValid.projection.document, selection);
        if (!object) return [];
        const provenance = resolveStyleProvenance(item.kind, object as Parameters<typeof resolveStyleProvenance>[1], candidate.latestValid.projection.document);
        return [{ object, provenance, target: item }];
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
  const fields = normalizedQuery
    ? compatibleFields.filter((field) => [field.path, field.label, field.description, field.group, ...(field.aliases || [])].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)))
    : showAllFields
      ? compatibleFields
      : defaultFields;
  const iconDefinitions = candidate.latestValid.projection.document.icons || {};
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
      data-field-count={target ? styleAuthoringMetadataByTarget[target].filter((field) => field.level === 'basic').length : 0}
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
      <StudioSearchField aria-label="Search style attributes" clearLabel="Clear style search" onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery('')} placeholder="Search attributes" value={query} />
      <Box className="studio-basic-style-fields" id="studio-basic-style-fields" sx={{ minHeight: 0, overflowY: showSummary ? 'auto' : 'visible' }}>
        {fields.map((field) => {
          const provenance = records.map((record) => record.provenance.find((entry) => entry.key === field.path));
          const values = provenance.map((entry) => entry?.effectiveValue);
          const mixed = !sameValue(values);
          const exact = targets.map((item) => candidateStyleField(candidate.candidateText, item, [field.path]));
          const explicit = exact.some((entry) => entry.exists);
          const editor = (
            <StyleFieldEditor
              compact={field.control?.kind !== 'nested'}
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
            <Box className="studio-basic-style-field" data-field-path={field.path} key={field.path} sx={{ minWidth: 0 }}>
              {field.control?.kind === 'nested' ? (
                editor
              ) : (
                <StudioPropertyRow description={field.description} label={field.label}>
                  {editor}
                </StudioPropertyRow>
              )}
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
          onClick={() => setShowAllFields((value) => !value)}
        />
      ) : null}
    </Box>
  );
}
