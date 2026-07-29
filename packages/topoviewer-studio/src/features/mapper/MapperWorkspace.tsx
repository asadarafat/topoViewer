import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  mapperAuthoringTargetKinds,
  mapperAuthoringValueSemantics,
  mapperRuleTargetKind,
  type CreateBasicMapperRuleOptions,
  type MapperAuthoringTargetKind,
  type MapperAuthoringValueSemantic,
  type MapperRuleProposal
} from 'topoviewer/authoring';
import { parse } from 'yaml';
import type { StudioMapperFieldEditRequest, StudioMapperFieldUnsetRequest, StudioMapperRuleReference, StudioMapperStyleEditRequest, StudioMapperStyleUnsetRequest } from '../../contracts/mapper';
import type { StudioAuthoringProfileOverride } from '../../contracts/profiles';
import type { StudioSessionSnapshot } from '../../contracts/project';
import type { StudioSourceRange } from '../../session';
import { StudioPropertyRow } from '../../ui/StudioPropertyRow';
import { EmbeddedProjectYamlEditor } from '../inspector/EmbeddedTopologyYamlEditor';
import type { MonacoYamlNavigationRequest } from '../workspace/MonacoYamlEditor';
import { MapperGeneratedFields } from './MapperGeneratedFields';
import { MapperStyleEditor } from './MapperStyleEditor';
import { MapperAnalysisPanel } from './MapperAnalysisPanel';
import {
  StudioButton,
  StudioButtonBase,
  StudioAccordion,
  StudioAccordionDetails,
  StudioAccordionSummary,
  StudioDialog,
  StudioDialogActions,
  StudioDialogContent,
  StudioDialogTitle,
  StudioFormControl,
  StudioIconButton,
  StudioLabeledControl,
  StudioMenu,
  StudioMenuItem,
  StudioMenuItemIcon,
  StudioMenuItemText,
  StudioOption,
  StudioRadio,
  StudioSelect,
  StudioTab,
  StudioTabs,
  StudioTextField,
  StudioToggleButton,
  StudioToggleButtonGroup
} from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';
import { studioGeometry } from '../../ui/studioTokens';

interface MapperWorkspaceProps {
  forceEditorFailure?: boolean;
  onApplySource(text: string): boolean;
  onClose(): void;
  onCommitField(request: StudioMapperFieldEditRequest): boolean;
  onCommitProposal(candidateId?: string): boolean;
  onCreateRule(options: CreateBasicMapperRuleOptions): boolean;
  onDiscardInvalid(): void;
  onExport(): void;
  onIngestSamples(input: string): void;
  onRemove(): boolean;
  onProposeMetric(metric: string): boolean;
  onSelectCoverageObject(kind: string, id: string): void;
  onSelectSourceOffset(offset: number): Array<string | number> | undefined;
  onCommitStyle(request: StudioMapperStyleEditRequest): boolean;
  onUnsetStyle(request: StudioMapperStyleUnsetRequest): boolean;
  onUnsetField(request: StudioMapperFieldUnsetRequest): boolean;
  profile: StudioAuthoringProfileOverride;
  proposal?: MapperRuleProposal;
  snapshot: StudioSessionSnapshot;
  sourceRange(path: Array<string | number>): StudioSourceRange | undefined;
  variant?: 'drawer' | 'panel';
}

interface MapperRuleEntry {
  key: string;
  ref: StudioMapperRuleReference;
  rule: unknown;
}

type MapperVisualSection = 'advanced' | 'coverage' | 'rules';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function selectedTarget(snapshot: StudioSessionSnapshot): MapperAuthoringTargetKind | undefined {
  const candidates = snapshot.selection.map(({ kind }) => (mapperAuthoringTargetKinds.includes(kind as MapperAuthoringTargetKind) ? (kind as MapperAuthoringTargetKind) : undefined));
  if (candidates.some((candidate) => !candidate)) return undefined;
  const targets = [...new Set(candidates.filter((candidate): candidate is MapperAuthoringTargetKind => Boolean(candidate)))];
  return targets.length === 1 ? targets[0] : undefined;
}

function mapperTargetLabel(target: MapperAuthoringTargetKind) {
  if (target === 'linkDirection') return 'Link direction';
  return `${target.charAt(0).toUpperCase()}${target.slice(1)}`;
}

export default function MapperWorkspace({
  forceEditorFailure = false,
  onApplySource,
  onClose,
  onCommitField,
  onCommitProposal,
  onCommitStyle,
  onCreateRule,
  onDiscardInvalid,
  onExport,
  onIngestSamples,
  onRemove,
  onProposeMetric,
  onSelectCoverageObject,
  onSelectSourceOffset,
  onUnsetField,
  onUnsetStyle,
  profile,
  proposal,
  snapshot,
  sourceRange,
  variant = 'drawer'
}: MapperWorkspaceProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [fileActionsAnchor, setFileActionsAnchor] = useState<HTMLElement | null>(null);
  const [directionLabel, setDirectionLabel] = useState('direction');
  const [joinLabel, setJoinLabel] = useState('node_id');
  const [linkLabel, setLinkLabel] = useState('link_id');
  const [metric, setMetric] = useState('');
  const [mapperDraft, setMapperDraft] = useState<string>();
  const [codeNavigation, setCodeNavigation] = useState<MonacoYamlNavigationRequest>();
  const codeNavigationSequence = useRef(0);
  const [representation, setRepresentation] = useState<'code' | 'visual'>('visual');
  const [visualSection, setVisualSection] = useState<MapperVisualSection>('rules');
  const [newRuleOpen, setNewRuleOpen] = useState(!snapshot.project.documents.mapper);
  const [selectedRuleKey, setSelectedRuleKey] = useState<string>();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>();
  const sampleInputRef = useRef<string>();
  const [stateExpression, setStateExpression] = useState('');
  const [stateName, setStateName] = useState('');
  const [value, setValue] = useState<MapperAuthoringValueSemantic | ''>('');
  const fileActionsOpen = Boolean(fileActionsAnchor);
  const mapper = snapshot.project.documents.mapper;
  const mapperSelectionTarget = selectedTarget(snapshot);
  const mapperContextUnavailable = snapshot.selection.length > 0 && !mapperSelectionTarget;
  const targetKind = mapperSelectionTarget || 'graph';
  const mapperValue = useMemo(() => {
    if (!mapper) return undefined;
    try {
      const parsed = parse(mapper.text);
      return isRecord(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }, [mapper]);
  const ruleEntries = useMemo<MapperRuleEntry[]>(
    () =>
      (['rules', 'mappings'] as const).flatMap((collection) =>
        Array.isArray(mapperValue?.[collection])
          ? (mapperValue[collection] as unknown[]).map((rule, index) => ({
              key: `${collection}:${index}`,
              ref: { collection, index },
              rule
            }))
          : []
      ),
    [mapperValue]
  );
  const selectedRule = ruleEntries.find((entry) => entry.key === selectedRuleKey) || ruleEntries[0];
  const selectedRulePath: Array<string | number> = selectedRule ? [selectedRule.ref.collection, selectedRule.ref.index] : ['rules'];
  const selectedRuleRange = sourceRange(selectedRulePath);

  useEffect(() => {
    const labels: Partial<Record<MapperAuthoringTargetKind, string>> = {
      link: 'link_id',
      node: 'node_id',
      path: 'path_id',
      region: 'region_id'
    };
    if (labels[targetKind]) setJoinLabel(labels[targetKind] || 'object_id');
  }, [targetKind]);

  useEffect(() => {
    if (!selectedRuleKey && ruleEntries[0]) setSelectedRuleKey(ruleEntries[0].key);
    if (selectedRuleKey && !ruleEntries.some((entry) => entry.key === selectedRuleKey)) {
      setSelectedRuleKey(ruleEntries[0]?.key);
    }
  }, [ruleEntries, selectedRuleKey]);

  useEffect(() => {
    setSelectedCandidateId(proposal?.candidates.length === 1 ? proposal.candidates[0].id : undefined);
    if (proposal) setVisualSection('coverage');
  }, [proposal]);

  useEffect(() => {
    if (!mapper) {
      if (representation === 'code') setRepresentation('visual');
      setNewRuleOpen(true);
      setVisualSection('rules');
    }
  }, [mapper, representation]);

  function rememberMapperDraft(text: string) {
    setMapperDraft(text === mapper?.text ? undefined : text);
  }

  function applyMapperDocument(text: string) {
    const applied = onApplySource(text);
    if (applied) setMapperDraft(undefined);
    return applied;
  }

  function selectMapperSourceOffset(offset: number) {
    const path = onSelectSourceOffset(offset);
    const collection = path?.[0];
    const index = path?.[1];
    if ((collection === 'rules' || collection === 'mappings') && typeof index === 'number') {
      setSelectedRuleKey(`${collection}:${index}`);
    }
  }

  function openMapperCode(path: Array<string | number>) {
    const range = sourceRange(path);
    if (range) {
      setCodeNavigation({
        focus: true,
        id: `mapper-code:${++codeNavigationSequence.current}`,
        range
      });
    }
    setRepresentation('code');
  }

  function submitRule(event: FormEvent) {
    event.preventDefault();
    const created = onCreateRule({
      directionLabel,
      joinLabel,
      linkLabel,
      metric,
      stateExpression: stateExpression || undefined,
      stateName: stateName || undefined,
      targetKind,
      value: value || undefined
    });
    if (created) {
      setMetric('');
      setStateName('');
      setStateExpression('');
      setNewRuleOpen(false);
    }
  }

  function commitProposal() {
    if (!onCommitProposal(selectedCandidateId)) return;
    setVisualSection('rules');
  }

  return (
    <Paper
      aria-label="Telemetry mapper workspace"
      className={`studio-mapper-workspace studio-mapper-workspace--${variant}`}
      component="section"
      data-mode={representation}
      elevation={0}
      square
      sx={{
        containerName: 'studio-workspace',
        containerType: 'inline-size',
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr)',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden'
      }}
    >
      <Box
        className="studio-mapper-toolbar"
        sx={{
          alignItems: 'center',
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          minHeight: studioGeometry.commandBarHeight,
          px: studioSpace.space12
        }}
      >
        <Typography component="h2" noWrap sx={{ minWidth: 0 }} variant="subtitle2">
          Mapper
        </Typography>
        <Stack direction="row" spacing={studioSpace.space6} sx={{ alignItems: 'center' }}>
          <StudioToggleButtonGroup
            aria-label="Mapper representation"
            className="studio-edit-representation studio-mapper-representation"
            onChange={(_event, value: 'code' | 'visual' | null) => {
              if (value) setRepresentation(value);
            }}
            value={representation}
          >
            <StudioToggleButton sx={{ px: studioSpace.space10 }} value="visual">
              Visual
            </StudioToggleButton>
            <StudioToggleButton disabled={!mapper} sx={{ px: studioSpace.space10 }} value="code">
              Code
            </StudioToggleButton>
          </StudioToggleButtonGroup>
          {variant === 'panel' ? (
            <StudioIconButton aria-label="Collapse workspace panel" onClick={onClose} title="Collapse workspace panel">
              <CloseIcon fontSize="small" />
            </StudioIconButton>
          ) : (
            <StudioButton onClick={onClose}>Close</StudioButton>
          )}
        </Stack>
      </Box>
      {representation === 'visual' ? (
        <Box
          className="studio-mapper-content"
          sx={{
            display: 'grid',
            gridTemplateRows: 'auto auto minmax(0, 1fr)',
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
          <Stack
            aria-label="Mapper context"
            className="studio-mapper-context studio-mapper-summary"
            data-invalid={mapperContextUnavailable || undefined}
            direction="row"
            sx={{
              alignItems: 'center',
              borderBottom: 1,
              borderColor: 'divider',
              justifyContent: 'space-between',
              p: studioSpace.space12
            }}
          >
            <Stack spacing={studioSpace.space2}>
              <Typography component="strong" variant="subtitle2">
                {mapperContextUnavailable
                  ? 'Unsupported or mixed selection'
                  : snapshot.selection.length > 1
                    ? `${mapperTargetLabel(targetKind)} · ${snapshot.selection.length} selected`
                    : mapperSelectionTarget && snapshot.selection[0]
                      ? `${mapperTargetLabel(targetKind)} · ${snapshot.selection[0].id}`
                      : 'Graph · whole topology'}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {mapperContextUnavailable ? (
                  'Select one telemetry-compatible object type.'
                ) : mapper ? (
                  <>
                    <Box component="span">Mapper ready</Box>
                    <Box aria-hidden="true" component="span">
                      {' '}
                      ·{' '}
                    </Box>
                    <Box component="span">
                      {ruleEntries.length} rule
                      {ruleEntries.length === 1 ? '' : 's'}
                    </Box>
                  </>
                ) : (
                  'No mapper yet'
                )}
              </Typography>
            </Stack>
            {mapper ? (
              <Box className="studio-mapper-file-actions">
                <StudioIconButton
                  aria-controls={fileActionsOpen ? 'studio-mapper-actions' : undefined}
                  aria-expanded={fileActionsOpen}
                  aria-haspopup="menu"
                  aria-label="Mapper actions"
                  onClick={(event) => setFileActionsAnchor(event.currentTarget)}
                  title="Mapper actions"
                >
                  <MoreVertIcon fontSize="small" />
                </StudioIconButton>
                <StudioMenu anchorEl={fileActionsAnchor} id="studio-mapper-actions" onClose={() => setFileActionsAnchor(null)} open={fileActionsOpen}>
                  <StudioMenuItem
                    onClick={() => {
                      onExport();
                      setFileActionsAnchor(null);
                    }}
                  >
                    <StudioMenuItemIcon>
                      <DownloadIcon fontSize="small" />
                    </StudioMenuItemIcon>
                    <StudioMenuItemText>Export mapper</StudioMenuItemText>
                  </StudioMenuItem>
                  <StudioMenuItem
                    onClick={() => {
                      setConfirmRemove(true);
                      setFileActionsAnchor(null);
                    }}
                    sx={{ color: 'error.main' }}
                  >
                    <StudioMenuItemIcon sx={{ color: 'inherit' }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </StudioMenuItemIcon>
                    <StudioMenuItemText>Remove mapper</StudioMenuItemText>
                  </StudioMenuItem>
                </StudioMenu>
              </Box>
            ) : null}
          </Stack>
          <StudioTabs aria-label="Mapper visual sections" onChange={(_event, value: MapperVisualSection) => setVisualSection(value)} value={visualSection} variant="fullWidth">
            <StudioTab label={`Rules (${ruleEntries.length})`} value="rules" />
            <StudioTab label="Coverage" value="coverage" />
            <StudioTab label="Advanced" value="advanced" />
          </StudioTabs>
          <StudioDialog aria-labelledby="studio-remove-mapper-title" onClose={() => setConfirmRemove(false)} open={confirmRemove} slotProps={{ paper: { role: 'alertdialog' } }}>
            <StudioDialogTitle id="studio-remove-mapper-title">Remove telemetry mapper</StudioDialogTitle>
            <StudioDialogContent>
              <Typography variant="body2">Remove mapper.yaml? Topology and stylesheet are not changed.</Typography>
            </StudioDialogContent>
            <StudioDialogActions>
              <StudioButton onClick={() => setConfirmRemove(false)}>Cancel</StudioButton>
              <StudioButton
                color="error"
                onClick={() => {
                  if (onRemove()) setConfirmRemove(false);
                }}
                variant="outlined"
              >
                Remove
              </StudioButton>
            </StudioDialogActions>
          </StudioDialog>
          <Box className="studio-mapper-visual-stage" sx={{ minHeight: 0, minWidth: 0, overflowY: 'auto' }}>
            {visualSection === 'rules' ? (
              <Box
                className="studio-mapper-rule-list"
                aria-label="Mapper rules"
                component="section"
                sx={{
                  display: 'grid',
                  gap: studioSpace.space10,
                  p: studioSpace.space12
                }}
              >
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography component="h3" variant="subtitle2">
                    Rules
                  </Typography>
                  <StudioButton onClick={() => setNewRuleOpen((open) => !open)} size="small" variant={newRuleOpen ? 'text' : 'outlined'}>
                    {newRuleOpen ? 'Cancel new rule' : 'New rule'}
                  </StudioButton>
                </Stack>
                {ruleEntries.length ? (
                  ruleEntries.map((entry, index) => {
                    const rule = isRecord(entry.rule) ? entry.rule : {};
                    return (
                      <StudioButtonBase
                        aria-pressed={selectedRule?.key === entry.key}
                        key={`${String(rule.id || 'rule')}-${index}`}
                        onClick={() => setSelectedRuleKey(entry.key)}
                        sx={{
                          alignItems: 'start',
                          borderRadius: 1,
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1fr)',
                          justifyContent: 'stretch',
                          justifyItems: 'start',
                          p: studioSpace.space8,
                          textAlign: 'left',
                          width: '100%',
                          '&[aria-pressed="true"]': {
                            bgcolor: 'action.selected'
                          }
                        }}
                      >
                        <Typography component="strong" variant="body2">
                          {String(rule.id || `Rule ${index + 1}`)}
                        </Typography>
                        <Typography color="text.secondary" variant="caption">
                          {String(rule.metric || 'Missing metric')} · {mapperRuleTargetKind(rule) || 'invalid target'}
                        </Typography>
                      </StudioButtonBase>
                    );
                  })
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    No rules yet.
                  </Typography>
                )}
                <StudioAccordion expanded={newRuleOpen} onChange={(_event, expanded) => setNewRuleOpen(expanded)}>
                  <StudioAccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
                    <Typography component="h3" variant="subtitle2">
                      Create a mapper rule
                    </Typography>
                  </StudioAccordionSummary>
                  <StudioAccordionDetails sx={{ p: 0 }}>
                    <Box
                      className="studio-mapper-basic-form"
                      component="form"
                      onSubmit={submitRule}
                      sx={{
                        display: 'grid',
                        gap: studioSpace.space8,
                        pb: studioSpace.space12
                      }}
                    >
                      <StudioPropertyRow label="Metric">
                        <StudioTextField aria-label="Metric" onChange={(event) => setMetric(event.target.value)} placeholder="interface_up" required value={metric} />
                      </StudioPropertyRow>
                      {targetKind === 'linkDirection' ? (
                        <StudioPropertyRow label="Join labels">
                          <Box
                            className="studio-mapper-field-pair"
                            sx={{
                              display: 'grid',
                              gap: studioSpace.space8,
                              gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))'
                            }}
                          >
                            <StudioTextField aria-label="Link label" onChange={(event) => setLinkLabel(event.target.value)} placeholder="Link" required value={linkLabel} />
                            <StudioTextField aria-label="Direction label" onChange={(event) => setDirectionLabel(event.target.value)} placeholder="Direction" required value={directionLabel} />
                          </Box>
                        </StudioPropertyRow>
                      ) : targetKind !== 'graph' ? (
                        <StudioPropertyRow label="Join label">
                          <StudioTextField aria-label="Join label" onChange={(event) => setJoinLabel(event.target.value)} required value={joinLabel} />
                        </StudioPropertyRow>
                      ) : null}
                      <StudioPropertyRow label="Value">
                        <StudioFormControl>
                          <StudioSelect aria-label="Value semantic" onChange={(event) => setValue(event.target.value as MapperAuthoringValueSemantic | '')} value={value}>
                            <StudioOption value="">Raw value</StudioOption>
                            {mapperAuthoringValueSemantics.map((semantic) => (
                              <StudioOption key={semantic} value={semantic}>
                                {semantic}
                              </StudioOption>
                            ))}
                          </StudioSelect>
                        </StudioFormControl>
                      </StudioPropertyRow>
                      <StudioPropertyRow label="State">
                        <Box
                          className="studio-mapper-field-pair"
                          sx={{
                            display: 'grid',
                            gap: studioSpace.space8,
                            gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))'
                          }}
                        >
                          <StudioTextField aria-label="State name" onChange={(event) => setStateName(event.target.value)} placeholder="Name" value={stateName} />
                          <StudioTextField aria-label="State expression" onChange={(event) => setStateExpression(event.target.value)} placeholder="Expression" value={stateExpression} />
                        </Box>
                      </StudioPropertyRow>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          px: studioSpace.space12
                        }}
                      >
                        <StudioButton disabled={mapperContextUnavailable} type="submit" variant="contained">
                          Create rule
                        </StudioButton>
                      </Box>
                    </Box>
                  </StudioAccordionDetails>
                </StudioAccordion>
                {mapperValue && selectedRule ? (
                  <MapperStyleEditor
                    compact={variant === 'panel'}
                    iconDefinitions={snapshot.projection.document.icons || {}}
                    mapper={mapperValue}
                    onCommit={onCommitStyle}
                    onUnset={onUnsetStyle}
                    profile={profile}
                    reference={selectedRule.ref}
                    rule={selectedRule.rule}
                  />
                ) : null}
              </Box>
            ) : null}
            {visualSection === 'coverage' ? (
              <Box
                aria-label="Mapper coverage workspace"
                component="section"
                sx={{
                  display: 'grid',
                  gap: studioSpace.space12,
                  p: studioSpace.space12
                }}
              >
                {mapperValue ? (
                  <MapperAnalysisPanel
                    document={snapshot.projection.document}
                    mapper={mapperValue}
                    onIngestSamples={(input) => {
                      sampleInputRef.current = input;
                      onIngestSamples(input);
                    }}
                    onProposeMetric={onProposeMetric}
                    onSelectCoverageObject={onSelectCoverageObject}
                    onSelectRule={(ruleId) => {
                      const entry = ruleEntries.find((candidate) => isRecord(candidate.rule) && candidate.rule.id === ruleId);
                      if (!entry) return;
                      setSelectedRuleKey(entry.key);
                      setVisualSection('rules');
                    }}
                    sampleInput={sampleInputRef.current}
                  />
                ) : (
                  <Typography color="text.secondary" variant="body2">
                    Create a rule before analyzing telemetry samples.
                  </Typography>
                )}
                {proposal ? (
                  <Box className="studio-mapper-proposal" aria-label="Mapper rule proposal" component="section" sx={{ display: 'grid', gap: studioSpace.space8 }}>
                    <Typography component="h3" variant="subtitle2">
                      Rule proposal
                    </Typography>
                    <Typography component="strong" variant="body2">
                      {proposal.metric} → {proposal.targetKind} {proposal.targetId}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      {proposal.sampleCount} matching metric sample
                      {proposal.sampleCount === 1 ? '' : 's'} · {proposal.status}
                    </Typography>
                    {proposal.candidates.map((candidate) => (
                      <StudioLabeledControl
                        key={candidate.id}
                        control={<StudioRadio checked={selectedCandidateId === candidate.id} name="mapper-join-candidate" onChange={() => setSelectedCandidateId(candidate.id)} />}
                        label={
                          <Stack component="span" spacing={studioSpace.space2}>
                            <Typography component="strong" variant="body2">
                              {candidate.telemetryLabel}
                              {candidate.directionTelemetryLabel ? ` + ${candidate.directionTelemetryLabel}` : ''}
                            </Typography>
                            <Typography color="text.secondary" component="span" variant="caption">
                              {candidate.mode} · {candidate.matchedSampleCount} samples · {candidate.matchedObjectIds.join(', ')}
                            </Typography>
                          </Stack>
                        }
                      />
                    ))}
                    {!proposal.candidates.length ? (
                      <Typography color="text.secondary" variant="body2">
                        No stable join candidate matched this object.
                      </Typography>
                    ) : null}
                    <StudioButton disabled={!selectedCandidateId || proposal.status === 'missing-join' || proposal.status === 'unsupported-target'} onClick={commitProposal}>
                      Create proposed rule
                    </StudioButton>
                  </Box>
                ) : null}
              </Box>
            ) : null}
            {visualSection === 'advanced' ? (
              mapperValue ? (
                <MapperGeneratedFields mapper={mapperValue} onCommit={onCommitField} onOpenCode={openMapperCode} onUnset={onUnsetField} rule={selectedRule?.ref} />
              ) : (
                <Typography color="text.secondary" sx={{ p: studioSpace.space16 }} variant="body2">
                  Create a mapper rule to configure advanced fields.
                </Typography>
              )
            ) : null}
          </Box>
        </Box>
      ) : (
        <Box
          className="studio-mapper-code"
          component="section"
          sx={{
            display: 'grid',
            gridTemplateRows: 'minmax(0, 1fr)',
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden'
          }}
        >
          <EmbeddedProjectYamlEditor
            document="mapper"
            forceEditorFailure={forceEditorFailure}
            initialDraft={mapperDraft}
            key="mapper"
            navigation={
              codeNavigation ||
              (selectedRuleRange
                ? {
                    id: `mapper:${selectedRule?.key || 'rules'}`,
                    range: selectedRuleRange
                  }
                : undefined)
            }
            onApply={applyMapperDocument}
            onCursorOffset={selectMapperSourceOffset}
            onDiscardInvalid={onDiscardInvalid}
            onDraftChange={rememberMapperDraft}
            snapshot={snapshot}
          />
        </Box>
      )}
    </Paper>
  );
}
