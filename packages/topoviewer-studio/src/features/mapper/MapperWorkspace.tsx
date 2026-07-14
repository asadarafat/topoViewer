import { useEffect, useMemo, useState, type FormEvent } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import DownloadIcon from '@mui/icons-material/Download';
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
import type {
  StudioMapperFieldEditRequest,
  StudioMapperFieldUnsetRequest,
  StudioMapperRuleReference,
  StudioMapperStyleEditRequest,
  StudioMapperStyleUnsetRequest
} from '../../contracts/mapper';
import type { StudioAuthoringProfileOverride } from '../../contracts/profiles';
import type { StudioSessionSnapshot } from '../../contracts/project';
import { MapperGeneratedFields } from './MapperGeneratedFields';
import { MapperStyleEditor } from './MapperStyleEditor';
import { MapperAnalysisPanel } from './MapperAnalysisPanel';
import {
  StudioButton,
  StudioButtonBase,
  StudioDialog,
  StudioDialogActions,
  StudioDialogContent,
  StudioDialogTitle,
  StudioFormControl,
  StudioFormLabel,
  StudioIconButton,
  StudioLabeledControl,
  StudioMenu,
  StudioMenuItem,
  StudioMenuItemIcon,
  StudioMenuItemText,
  StudioOption,
  StudioRadio,
  StudioSelect,
  StudioTextField
} from '../../ui/controls';

interface MapperWorkspaceProps {
  onClose(): void;
  onCommitField(request: StudioMapperFieldEditRequest): boolean;
  onCommitProposal(candidateId?: string): boolean;
  onCreateRule(options: CreateBasicMapperRuleOptions): boolean;
  onExport(): void;
  onIngestSamples(input: string): void;
  onOpenSource(path: Array<string | number>): void;
  onRemove(): boolean;
  onProposeMetric(metric: string): boolean;
  onSelectCoverageObject(kind: string, id: string): void;
  onCommitStyle(request: StudioMapperStyleEditRequest): boolean;
  onUnsetStyle(request: StudioMapperStyleUnsetRequest): boolean;
  onUnsetField(request: StudioMapperFieldUnsetRequest): boolean;
  profile: StudioAuthoringProfileOverride;
  proposal?: MapperRuleProposal;
  sampleInput?: string;
  snapshot: StudioSessionSnapshot;
  variant?: 'drawer' | 'panel';
}

interface MapperRuleEntry {
  key: string;
  ref: StudioMapperRuleReference;
  rule: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function selectedTarget(snapshot: StudioSessionSnapshot): MapperAuthoringTargetKind | undefined {
  const candidates = snapshot.selection.map(({ kind }) => (
    mapperAuthoringTargetKinds.includes(kind as MapperAuthoringTargetKind)
      ? kind as MapperAuthoringTargetKind
      : undefined
  ));
  if (candidates.some((candidate) => !candidate)) return undefined;
  const targets = [...new Set(candidates.filter((candidate): candidate is MapperAuthoringTargetKind => Boolean(candidate)))];
  return targets.length === 1 ? targets[0] : undefined;
}

function mapperTargetLabel(target: MapperAuthoringTargetKind) {
  if (target === 'linkDirection') return 'Link direction';
  return `${target.charAt(0).toUpperCase()}${target.slice(1)}`;
}

export default function MapperWorkspace({
  onClose,
  onCommitField,
  onCommitProposal,
  onCommitStyle,
  onCreateRule,
  onExport,
  onIngestSamples,
  onOpenSource,
  onRemove,
  onProposeMetric,
  onSelectCoverageObject,
  onUnsetField,
  onUnsetStyle,
  profile,
  proposal,
  sampleInput,
  snapshot,
  variant = 'drawer'
}: MapperWorkspaceProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [fileActionsAnchor, setFileActionsAnchor] = useState<HTMLElement | null>(null);
  const [directionLabel, setDirectionLabel] = useState('direction');
  const [joinLabel, setJoinLabel] = useState('node_id');
  const [linkLabel, setLinkLabel] = useState('link_id');
  const [metric, setMetric] = useState('');
  const [selectedRuleKey, setSelectedRuleKey] = useState<string>();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>();
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
  const ruleEntries = useMemo<MapperRuleEntry[]>(() => (['rules', 'mappings'] as const).flatMap((collection) => (
    Array.isArray(mapperValue?.[collection])
      ? (mapperValue[collection] as unknown[]).map((rule, index) => ({
          key: `${collection}:${index}`,
          ref: { collection, index },
          rule
        }))
      : []
  )), [mapperValue]);
  const selectedRule = ruleEntries.find((entry) => entry.key === selectedRuleKey) || ruleEntries[0];

  useEffect(() => {
    const labels: Partial<Record<MapperAuthoringTargetKind, string>> = {
      link: 'link_id', node: 'node_id', path: 'path_id', region: 'region_id'
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
  }, [proposal]);

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
    }
  }

  return (
    <Paper aria-label="Telemetry mapper workspace" className={`studio-mapper-workspace studio-mapper-workspace--${variant}`} component="section" elevation={0} square>
      <Stack className="studio-mapper-header" component="header" direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack spacing={0.25}>
          <Typography component="h2" variant="subtitle2">Telemetry mapper</Typography>
          <Typography color="text.secondary" variant="caption">Optional runtime bindings for the same topology bundle</Typography>
        </Stack>
        {variant === 'panel'
          ? <StudioIconButton aria-label="Collapse workspace panel" onClick={onClose} title="Collapse workspace"><ChevronLeftIcon fontSize="small" /></StudioIconButton>
          : <StudioButton onClick={onClose}>Close</StudioButton>}
      </Stack>
      <Box className="studio-mapper-content">
        <Stack className="studio-mapper-enabled" direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack spacing={0.25}>
            <Typography component="strong" variant="subtitle2">{mapper ? 'Mapper ready' : 'No mapper yet'}</Typography>
            <Typography color="text.secondary" variant="caption">{mapper ? `${ruleEntries.length} rule${ruleEntries.length === 1 ? '' : 's'}` : 'The first rule creates mapper.yaml automatically.'}</Typography>
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
              ><MoreVertIcon fontSize="small" /></StudioIconButton>
              <StudioMenu
                anchorEl={fileActionsAnchor}
                id="studio-mapper-actions"
                onClose={() => setFileActionsAnchor(null)}
                open={fileActionsOpen}
              >
                <StudioMenuItem onClick={() => { onExport(); setFileActionsAnchor(null); }}>
                  <StudioMenuItemIcon><DownloadIcon fontSize="small" /></StudioMenuItemIcon>
                  <StudioMenuItemText>Export mapper</StudioMenuItemText>
                </StudioMenuItem>
                <StudioMenuItem onClick={() => { setConfirmRemove(true); setFileActionsAnchor(null); }} sx={{ color: 'error.main' }}>
                  <StudioMenuItemIcon sx={{ color: 'inherit' }}><DeleteOutlineIcon fontSize="small" /></StudioMenuItemIcon>
                  <StudioMenuItemText>Remove mapper</StudioMenuItemText>
                </StudioMenuItem>
              </StudioMenu>
            </Box>
          ) : null}
        </Stack>
        <StudioDialog
          aria-labelledby="studio-remove-mapper-title"
          onClose={() => setConfirmRemove(false)}
          open={confirmRemove}
          slotProps={{ paper: { role: 'alertdialog' } }}
        >
          <StudioDialogTitle id="studio-remove-mapper-title">Remove telemetry mapper</StudioDialogTitle>
          <StudioDialogContent>
            <Typography variant="body2">Remove mapper.yaml? Topology and stylesheet are not changed.</Typography>
          </StudioDialogContent>
          <StudioDialogActions>
            <StudioButton onClick={() => setConfirmRemove(false)}>Cancel</StudioButton>
            <StudioButton color="error" onClick={() => {
              if (onRemove()) setConfirmRemove(false);
            }} variant="contained">Remove</StudioButton>
          </StudioDialogActions>
        </StudioDialog>

        <Stack aria-label="Mapper context" className="studio-mapper-context" data-invalid={mapperContextUnavailable || undefined} spacing={0.25}>
          <Typography component="strong" variant="subtitle2">{mapperContextUnavailable
            ? 'Unsupported or mixed selection'
            : snapshot.selection.length > 1
              ? `${mapperTargetLabel(targetKind)} · ${snapshot.selection.length} selected`
              : mapperSelectionTarget && snapshot.selection[0]
                ? `${mapperTargetLabel(targetKind)} · ${snapshot.selection[0].id}`
                : 'Graph · whole topology'}</Typography>
          <Typography color="text.secondary" variant="caption">{mapperContextUnavailable
            ? 'Select one telemetry-compatible object type.'
            : 'The selected object determines the mapping target.'}</Typography>
        </Stack>

        <Stack className="studio-mapper-editor-stack" spacing={1.5}>
          <Box className="studio-mapper-basic-form" component="form" onSubmit={submitRule}>
            <Typography component="h3" variant="subtitle2">New rule</Typography>
            <StudioTextField aria-label="Metric" label="Metric" onChange={(event) => setMetric(event.target.value)} placeholder="interface_up" required value={metric} />
            {targetKind === 'linkDirection' ? (
              <>
                <StudioTextField aria-label="Link label" label="Link label" onChange={(event) => setLinkLabel(event.target.value)} required value={linkLabel} />
                <StudioTextField aria-label="Direction label" label="Direction label" onChange={(event) => setDirectionLabel(event.target.value)} required value={directionLabel} />
              </>
            ) : targetKind !== 'graph' ? (
              <StudioTextField aria-label="Join label" label="Join label" onChange={(event) => setJoinLabel(event.target.value)} required value={joinLabel} />
            ) : null}
            <StudioFormControl>
              <StudioFormLabel>Value semantic</StudioFormLabel>
              <StudioSelect aria-label="Value semantic" onChange={(event) => setValue(event.target.value as MapperAuthoringValueSemantic | '')} value={value}>
                <StudioOption value="">Raw value</StudioOption>
                {mapperAuthoringValueSemantics.map((semantic) => <StudioOption key={semantic} value={semantic}>{semantic}</StudioOption>)}
              </StudioSelect>
            </StudioFormControl>
            <StudioTextField aria-label="State name" label="State name" onChange={(event) => setStateName(event.target.value)} placeholder="down" value={stateName} />
            <StudioTextField aria-label="State expression" label="State expression" onChange={(event) => setStateExpression(event.target.value)} placeholder="==0" value={stateExpression} />
            <StudioButton className="studio-primary-button" disabled={mapperContextUnavailable} type="submit">Create rule</StudioButton>
          </Box>
          {mapperValue ? (
            <MapperGeneratedFields
              mapper={mapperValue}
              onCommit={onCommitField}
              onOpenSource={onOpenSource}
              onUnset={onUnsetField}
              rule={selectedRule?.ref}
            />
          ) : null}
          {mapperValue && selectedRule ? (
            <MapperStyleEditor
              assetOptions={Object.keys(snapshot.projection.document.icons || {}).sort()}
              compact={variant === 'panel'}
              mapper={mapperValue}
              onCommit={onCommitStyle}
              onUnset={onUnsetStyle}
              profile={profile}
              reference={selectedRule.ref}
              rule={selectedRule.rule}
            />
          ) : null}
        </Stack>

        <Box className="studio-mapper-rule-list" aria-label="Mapper rules" component="section">
            <Typography component="h3" variant="subtitle2">Rules</Typography>
            {ruleEntries.length ? ruleEntries.map((entry, index) => {
              const rule = isRecord(entry.rule) ? entry.rule : {};
              return (
                <StudioButtonBase
                  aria-pressed={selectedRule?.key === entry.key}
                  key={`${String(rule.id || 'rule')}-${index}`}
                  onClick={() => setSelectedRuleKey(entry.key)}
                >
                  <Typography component="strong" variant="body2">{String(rule.id || `Rule ${index + 1}`)}</Typography>
                  <Typography color="text.secondary" variant="caption">{String(rule.metric || 'Missing metric')} · {mapperRuleTargetKind(rule) || 'invalid target'}</Typography>
                </StudioButtonBase>
              );
            }) : <Typography color="text.secondary" variant="body2">No rules yet.</Typography>}
            {mapperValue ? (
              <MapperAnalysisPanel
                document={snapshot.projection.document}
                mapper={mapperValue}
                onIngestSamples={onIngestSamples}
                onProposeMetric={onProposeMetric}
                onSelectCoverageObject={onSelectCoverageObject}
                onSelectRule={(ruleId) => {
                  const entry = ruleEntries.find((candidate) => isRecord(candidate.rule) && candidate.rule.id === ruleId);
                  if (entry) setSelectedRuleKey(entry.key);
                }}
                sampleInput={sampleInput}
              />
            ) : null}
            {proposal ? (
              <Box className="studio-mapper-proposal" aria-label="Mapper rule proposal" component="section">
                <Typography component="h3" variant="subtitle2">Rule proposal</Typography>
                <Typography component="strong" variant="body2">{proposal.metric} → {proposal.targetKind} {proposal.targetId}</Typography>
                <Typography color="text.secondary" variant="caption">{proposal.sampleCount} matching metric sample{proposal.sampleCount === 1 ? '' : 's'} · {proposal.status}</Typography>
                {proposal.candidates.map((candidate) => (
                  <StudioLabeledControl key={candidate.id} control={<StudioRadio checked={selectedCandidateId === candidate.id} name="mapper-join-candidate" onChange={() => setSelectedCandidateId(candidate.id)} />} label={<Stack component="span" spacing={0.25}>
                      <Typography component="strong" variant="body2">{candidate.telemetryLabel}{candidate.directionTelemetryLabel ? ` + ${candidate.directionTelemetryLabel}` : ''}</Typography>
                      <Typography color="text.secondary" component="span" variant="caption">{candidate.mode} · {candidate.matchedSampleCount} samples · {candidate.matchedObjectIds.join(', ')}</Typography>
                    </Stack>} />
                ))}
                {!proposal.candidates.length ? <Typography color="text.secondary" variant="body2">No stable join candidate matched this object.</Typography> : null}
                <StudioButton
                  disabled={!selectedCandidateId || proposal.status === 'missing-join' || proposal.status === 'unsupported-target'}
                  onClick={() => onCommitProposal(selectedCandidateId)}
                >
                  Create proposed rule
                </StudioButton>
              </Box>
            ) : null}
        </Box>
      </Box>
    </Paper>
  );
}
