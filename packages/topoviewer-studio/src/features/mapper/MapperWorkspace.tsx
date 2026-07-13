import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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
import { useDialogFocus } from '../../accessibility/focus';
import { MapperGeneratedFields } from './MapperGeneratedFields';
import { MapperStyleEditor } from './MapperStyleEditor';
import { MapperAnalysisPanel } from './MapperAnalysisPanel';
import {
  StudioButton,
  StudioButtonBase,
  StudioIconButton,
  StudioLabeledControl,
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
  const [fileActionsOpen, setFileActionsOpen] = useState(false);
  const [directionLabel, setDirectionLabel] = useState('direction');
  const [joinLabel, setJoinLabel] = useState('node_id');
  const [linkLabel, setLinkLabel] = useState('link_id');
  const [metric, setMetric] = useState('');
  const [selectedRuleKey, setSelectedRuleKey] = useState<string>();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>();
  const [stateExpression, setStateExpression] = useState('');
  const [stateName, setStateName] = useState('');
  const [value, setValue] = useState<MapperAuthoringValueSemantic | ''>('');
  const fileActionsId = `studio-mapper-actions-${useId().replaceAll(':', '')}`;
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
  const removeDialog = useDialogFocus<HTMLDivElement>({
    active: confirmRemove,
    onDismiss: () => setConfirmRemove(false)
  });

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
    <section aria-label="Telemetry mapper workspace" className={`studio-mapper-workspace studio-mapper-workspace--${variant}`}>
      <header className="studio-mapper-header">
        <div>
          <h2>Telemetry mapper</h2>
          <span>Optional runtime bindings for the same topology bundle</span>
        </div>
        {variant === 'panel'
          ? <StudioIconButton aria-label="Collapse workspace panel" onClick={onClose} title="Collapse workspace"><ChevronLeftIcon fontSize="small" /></StudioIconButton>
          : <StudioButton onClick={onClose}>Close</StudioButton>}
      </header>
      <div className="studio-mapper-content">
        <div className="studio-mapper-enabled">
          <div>
            <strong>{mapper ? 'Mapper ready' : 'No mapper yet'}</strong>
            <span>{mapper ? `${ruleEntries.length} rule${ruleEntries.length === 1 ? '' : 's'}` : 'The first rule creates mapper.yaml automatically.'}</span>
          </div>
          {mapper ? (
            <div
              className="studio-mapper-file-actions"
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setFileActionsOpen(false);
              }}
            >
              <StudioIconButton
                aria-controls={fileActionsOpen ? fileActionsId : undefined}
                aria-expanded={fileActionsOpen}
                aria-haspopup="menu"
                aria-label="Mapper actions"
                onClick={() => setFileActionsOpen((current) => !current)}
                title="Mapper actions"
              ><MoreVertIcon fontSize="small" /></StudioIconButton>
              {fileActionsOpen ? <div className="studio-field-action-menu" id={fileActionsId} role="menu">
                <StudioButton onClick={() => { onExport(); setFileActionsOpen(false); }} role="menuitem">Export mapper</StudioButton>
                <StudioButton color="error" onClick={() => { setConfirmRemove(true); setFileActionsOpen(false); }} role="menuitem">
                  <DeleteOutlineIcon fontSize="small" /> Remove mapper
                </StudioButton>
              </div> : null}
            </div>
          ) : null}
        </div>
        {confirmRemove ? (
          <div aria-label="Remove telemetry mapper" aria-modal="true" className="studio-mapper-remove-confirm" onKeyDown={removeDialog.onDialogKeyDown} ref={removeDialog.dialogRef} role="alertdialog" tabIndex={-1}>
            <span>Remove mapper.yaml? Topology and stylesheet are not changed.</span>
            <StudioButton onClick={() => setConfirmRemove(false)}>Cancel</StudioButton>
            <StudioButton className="studio-danger-button" onClick={() => {
              if (onRemove()) setConfirmRemove(false);
            }}>Remove</StudioButton>
          </div>
        ) : null}

        <div aria-label="Mapper context" className="studio-mapper-context" data-invalid={mapperContextUnavailable || undefined}>
          <strong>{mapperContextUnavailable
            ? 'Unsupported or mixed selection'
            : snapshot.selection.length > 1
              ? `${mapperTargetLabel(targetKind)} · ${snapshot.selection.length} selected`
              : mapperSelectionTarget && snapshot.selection[0]
                ? `${mapperTargetLabel(targetKind)} · ${snapshot.selection[0].id}`
                : 'Graph · whole topology'}</strong>
          <span>{mapperContextUnavailable
            ? 'Select one telemetry-compatible object type.'
            : 'The selected object determines the mapping target.'}</span>
        </div>

        <div className="studio-mapper-editor-stack">
          <form className="studio-mapper-basic-form" onSubmit={submitRule}>
            <h3>New rule</h3>
            <label>
              Metric
              <StudioTextField aria-label="Metric" onChange={(event) => setMetric(event.target.value)} placeholder="interface_up" required value={metric} />
            </label>
            {targetKind === 'linkDirection' ? (
              <>
                <label>Link label<StudioTextField aria-label="Link label" onChange={(event) => setLinkLabel(event.target.value)} required value={linkLabel} /></label>
                <label>Direction label<StudioTextField aria-label="Direction label" onChange={(event) => setDirectionLabel(event.target.value)} required value={directionLabel} /></label>
              </>
            ) : targetKind !== 'graph' ? (
              <label>Join label<StudioTextField aria-label="Join label" onChange={(event) => setJoinLabel(event.target.value)} required value={joinLabel} /></label>
            ) : null}
            <label>
              Value semantic
              <StudioSelect aria-label="Value semantic" onChange={(event) => setValue(event.target.value as MapperAuthoringValueSemantic | '')} value={value}>
                <option value="">Raw value</option>
                {mapperAuthoringValueSemantics.map((semantic) => <option key={semantic} value={semantic}>{semantic}</option>)}
              </StudioSelect>
            </label>
            <label>State name<StudioTextField aria-label="State name" onChange={(event) => setStateName(event.target.value)} placeholder="down" value={stateName} /></label>
            <label>State expression<StudioTextField aria-label="State expression" onChange={(event) => setStateExpression(event.target.value)} placeholder="==0" value={stateExpression} /></label>
            <StudioButton className="studio-primary-button" disabled={mapperContextUnavailable} type="submit">Create rule</StudioButton>
          </form>
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
        </div>

        <section className="studio-mapper-rule-list" aria-label="Mapper rules">
            <h3>Rules</h3>
            {ruleEntries.length ? ruleEntries.map((entry, index) => {
              const rule = isRecord(entry.rule) ? entry.rule : {};
              return (
                <StudioButtonBase
                  aria-pressed={selectedRule?.key === entry.key}
                  key={`${String(rule.id || 'rule')}-${index}`}
                  onClick={() => setSelectedRuleKey(entry.key)}
                >
                  <strong>{String(rule.id || `Rule ${index + 1}`)}</strong>
                  <span>{String(rule.metric || 'Missing metric')} · {mapperRuleTargetKind(rule) || 'invalid target'}</span>
                </StudioButtonBase>
              );
            }) : <span>No rules yet.</span>}
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
              <section className="studio-mapper-proposal" aria-label="Mapper rule proposal">
                <h3>Rule proposal</h3>
                <strong>{proposal.metric} → {proposal.targetKind} {proposal.targetId}</strong>
                <span>{proposal.sampleCount} matching metric sample{proposal.sampleCount === 1 ? '' : 's'} · {proposal.status}</span>
                {proposal.candidates.map((candidate) => (
                  <StudioLabeledControl key={candidate.id} control={<StudioRadio checked={selectedCandidateId === candidate.id} name="mapper-join-candidate" onChange={() => setSelectedCandidateId(candidate.id)} />} label={<span>
                      <strong>{candidate.telemetryLabel}{candidate.directionTelemetryLabel ? ` + ${candidate.directionTelemetryLabel}` : ''}</strong>
                      {candidate.mode} · {candidate.matchedSampleCount} samples · {candidate.matchedObjectIds.join(', ')}
                    </span>} />
                ))}
                {!proposal.candidates.length ? <span>No stable join candidate matched this object.</span> : null}
                <StudioButton
                  disabled={!selectedCandidateId || proposal.status === 'missing-join' || proposal.status === 'unsupported-target'}
                  onClick={() => onCommitProposal(selectedCandidateId)}
                >
                  Create proposed rule
                </StudioButton>
              </section>
            ) : null}
        </section>
      </div>
    </section>
  );
}
