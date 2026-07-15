import { useMemo, useRef, useState } from 'react';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CodeIcon from '@mui/icons-material/Code';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  authoringFieldIsVisible,
  authoringObjectSourcePath,
  findAuthoringObject,
  resolveStyleProvenance,
  styleAuthoringMetadataByTarget,
  type AuthoringFieldMetadata,
  type AuthoringObjectSelection
} from 'topoviewer/authoring';
import type { StyleTargetKind } from 'topoviewer';
import type { StudioSessionSnapshot } from '../../contracts/project';
import type { StudioStyleEditRequest, StudioStyleUnsetRequest } from '../../contracts/inspector';
import {
  candidateStyleField,
  type StudioStylesheetCandidateState,
  type StudioStylesheetTarget
} from '../../session';
import {
  StudioAccordion,
  StudioAccordionDetails,
  StudioAccordionSummary,
  StudioButton,
  StudioSearchField
} from '../../ui/controls';
import { StyleFieldEditor } from './Inspector';

const styleTargets = new Set<StyleTargetKind>([
  'node', 'link', 'linkDirection', 'path', 'region', 'shape', 'callout', 'text'
]);

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
  return styleTargets.has(selection.kind as StyleTargetKind)
    ? { id: selection.id, kind: selection.kind as StyleTargetKind }
    : undefined;
}

function sameValue(values: unknown[]): boolean {
  if (values.length < 2) return true;
  const first = JSON.stringify(values[0]);
  return values.every((value) => JSON.stringify(value) === first);
}

function winnerLabel(winners: Array<ReturnType<typeof resolveStyleProvenance>[number]['winner']>) {
  if (winners.some((winner) => winner?.kind === 'runtime')) return 'Runtime override';
  if (winners.some((winner) => winner?.kind === 'inline')) return 'Inline topology override';
  const selectors = [...new Set(winners.flatMap((winner) => winner?.selector ? [winner.selector] : []))];
  if (selectors.length === 1) return selectors[0];
  if (selectors.length > 1) return 'Multiple stylesheet rules';
  return 'Inherited default';
}

interface BasicStyleEditorProps {
  candidate: StudioStylesheetCandidateState;
  onCommit(request: StudioStyleEditRequest): boolean;
  onMigrateInline(fieldPaths: Array<Array<string | number>>): boolean;
  onOpenInlineSource(path: Array<string | number>): void;
  onOpenYaml(path?: Array<string | number>): void;
  onUnset(request: StudioStyleUnsetRequest): boolean;
  snapshot: StudioSessionSnapshot;
}

export function BasicStyleEditor({
  candidate,
  onCommit,
  onMigrateInline,
  onOpenInlineSource,
  onOpenYaml,
  onUnset,
  snapshot
}: BasicStyleEditorProps) {
  const renderCount = useRef(0);
  renderCount.current += 1;
  const [query, setQuery] = useState('');
  const [groupExpansion, setGroupExpansion] = useState<Record<string, boolean>>({});
  const targets = snapshot.selection.flatMap((selection) => {
    const target = targetForSelection(selection);
    return target ? [target] : [];
  });
  const targetKinds = [...new Set(targets.map((target) => target.kind))];
  const target = targetKinds.length === 1 ? targetKinds[0] : undefined;
  const records = useMemo(() => targets.flatMap((item) => {
    const selection = { id: item.id, kind: item.kind } as AuthoringObjectSelection;
    const object = findAuthoringObject(candidate.latestValid.projection.document, selection);
    const objectPath = authoringObjectSourcePath(candidate.latestValid.projection.document, selection);
    if (!object || !objectPath) return [];
    const provenance = resolveStyleProvenance(
      item.kind,
      object as Parameters<typeof resolveStyleProvenance>[1],
      candidate.latestValid.projection.document,
      {
      inlineSourcePath: objectPath
      }
    );
    return [{ object, objectPath, provenance, target: item }];
  }), [candidate.latestValid.projection.document, targets.map((item) => `${item.kind}:${item.id}`).join('|')]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const fields = target ? styleAuthoringMetadataByTarget[target]
    .filter((field) => field.level === 'basic')
    .filter((field) => !normalizedQuery || [
      field.path,
      field.label,
      field.description,
      field.group,
      ...(field.aliases || [])
    ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery)))
    .filter((field) => records.every(({ provenance }) => {
      const values = Object.fromEntries(provenance.map((entry) => [entry.key, entry.effectiveValue]));
      return authoringFieldIsVisible(field, values);
    }))
    : [];
  const groups = fields.reduce<Map<string, AuthoringFieldMetadata[]>>((result, field) => {
    const current = result.get(field.group) || [];
    current.push(field);
    result.set(field.group, current);
    return result;
  }, new Map());
  const assetOptions = Object.keys(candidate.latestValid.projection.document.icons || {}).sort();

  if (snapshot.selection.length === 0) {
    return (
      <Box className="studio-basic-style-empty">
        <Typography component="h3" variant="subtitle2">Select an object to style</Typography>
        <Typography color="text.secondary" variant="body2">
          Select a node, link, path, region, shape, callout, text, or link direction. YAML remains available without a selection.
        </Typography>
        <StudioButton onClick={() => onOpenYaml()}><CodeIcon fontSize="small" />Open YAML</StudioButton>
      </Box>
    );
  }

  if (!target || records.length !== snapshot.selection.length) {
    return (
      <Box className="studio-basic-style-empty">
        <Typography component="h3" variant="subtitle2">Basic bulk editing unavailable</Typography>
        <Typography color="text.secondary" variant="body2">
          Select objects of one compatible kind, or use YAML to author rules across target types.
        </Typography>
        <StudioButton onClick={() => onOpenYaml()}><CodeIcon fontSize="small" />Open YAML</StudioButton>
      </Box>
    );
  }

  return (
    <Box
      className="studio-basic-style-editor"
      data-field-count={target ? styleAuthoringMetadataByTarget[target].filter((field) => field.level === 'basic').length : 0}
      data-render-count={renderCount.current}
      data-rendered-field-count={fields.length}
    >
      <Stack className="studio-basic-style-summary" spacing={0.5}>
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
      <StudioSearchField
        aria-label="Search Basic style fields"
        clearLabel="Clear Basic style search"
        onChange={(event) => setQuery(event.target.value)}
        onClear={() => setQuery('')}
        placeholder="Search Basic fields"
        value={query}
      />
      <Box className="studio-basic-style-groups">
        {[...groups.entries()].map(([group, groupFields], groupIndex) => (
          <StudioAccordion
            expanded={Boolean(normalizedQuery) || (groupExpansion[group] ?? groupIndex < 2)}
            key={group}
            onChange={(_event, expanded) => setGroupExpansion((current) => ({ ...current, [group]: expanded }))}
          >
            <StudioAccordionSummary
              aria-controls={`studio-basic-${target}-${groupIndex}-content`}
              id={`studio-basic-${target}-${groupIndex}-summary`}
            >{group}</StudioAccordionSummary>
            <StudioAccordionDetails id={`studio-basic-${target}-${groupIndex}-content`}>
              {groupFields.map((field) => {
                const provenance = records.map((record) => (
                  record.provenance.find((entry) => entry.key === field.path)
                ));
                const values = provenance.map((entry) => entry?.effectiveValue);
                const mixed = !sameValue(values);
                const exact = targets.map((item) => candidateStyleField(
                  candidate.candidateText,
                  item,
                  [field.path]
                ));
                const inline = provenance.map((entry) => entry?.winner).some((winner) => winner?.kind === 'inline');
                const sourcePath = provenance.map((entry) => entry?.winner?.path).find(Boolean);
                return (
                  <Box className="studio-basic-style-field" data-field-path={field.path} key={field.path}>
                    <StyleFieldEditor
                      assetOptions={assetOptions}
                      disabled={inline}
                      explicit={exact.some((entry) => entry.exists)}
                      field={field}
                      mixed={mixed}
                      onCommit={(fieldPath, value) => onCommit({
                        fieldPath,
                        scope: { kind: 'object' },
                        value
                      })}
                      onUnset={(fieldPath) => onUnset({ fieldPath, scope: { kind: 'object' } })}
                      value={mixed ? undefined : values[0]}
                    />
                    <Stack className="studio-basic-style-provenance" direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography color={inline ? 'warning.main' : 'text.secondary'} variant="caption">
                        {mixed ? 'Mixed' : winnerLabel(provenance.map((entry) => entry?.winner))}
                      </Typography>
                      <Stack direction="row" spacing={0.5}>
                        {inline && sourcePath ? (
                          <StudioButton onClick={() => onOpenInlineSource(sourcePath)}>Source</StudioButton>
                        ) : null}
                        {inline && targets.length === 1 ? (
                          <StudioButton onClick={() => onMigrateInline([[field.path]])}>
                            Move to stylesheet<ArrowForwardIcon fontSize="small" />
                          </StudioButton>
                        ) : null}
                        {!inline && exact.some((entry) => entry.exists) ? (
                          <StudioButton onClick={() => onOpenYaml(exact.find((entry) => entry.exists)?.path)}>YAML</StudioButton>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </StudioAccordionDetails>
          </StudioAccordion>
        ))}
        {!fields.length ? (
          <Box className="studio-basic-style-empty"><Typography variant="body2">No matching Basic fields.</Typography></Box>
        ) : null}
      </Box>
    </Box>
  );
}
