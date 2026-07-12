import { useEffect, useMemo, useState, type FormEvent } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
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
  StudioLabeledControl,
  StudioRadio,
  StudioSelect,
  StudioTab,
  StudioTabs,
  StudioTextField
} from '../../ui/controls';

interface MapperWorkspaceProps {
  onClose(): void;
  onCommitField(request: StudioMapperFieldEditRequest): boolean;
  onCommitProposal(candidateId?: string): boolean;
  onCreateRule(options: CreateBasicMapperRuleOptions): boolean;
  onEnable(): boolean;
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
}

interface MapperRuleEntry {
  key: string;
  ref: StudioMapperRuleReference;
  rule: unknown;
}

type MapperView = 'basic' | 'advanced' | 'all';
function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function selectedTarget(snapshot: StudioSessionSnapshot): MapperAuthoringTargetKind | undefined {
  const kind = snapshot.selection[0]?.kind;
  return mapperAuthoringTargetKinds.find((candidate) => candidate === kind);
}

export default function MapperWorkspace({
  onClose,
  onCommitField,
  onCommitProposal,
  onCommitStyle,
  onCreateRule,
  onEnable,
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
  snapshot
}: MapperWorkspaceProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [directionLabel, setDirectionLabel] = useState('direction');
  const [joinLabel, setJoinLabel] = useState('node_id');
  const [linkLabel, setLinkLabel] = useState('link_id');
  const [metric, setMetric] = useState('');
  const [selectedRuleKey, setSelectedRuleKey] = useState<string>();
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>();
  const [stateExpression, setStateExpression] = useState('');
  const [stateName, setStateName] = useState('');
  const [targetKind, setTargetKind] = useState<MapperAuthoringTargetKind>(() => selectedTarget(snapshot) || 'node');
  const [value, setValue] = useState<MapperAuthoringValueSemantic | ''>('');
  const [view, setView] = useState<MapperView>('basic');
  const mapper = snapshot.project.documents.mapper;
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
    const selected = selectedTarget(snapshot);
    if (selected) setTargetKind(selected);
  }, [snapshot.selection]);

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
    <section aria-label="Telemetry mapper workspace" className="studio-mapper-workspace">
      <header className="studio-mapper-header">
        <div>
          <strong>Telemetry mapper</strong>
          <span>Optional runtime bindings for the same topology bundle</span>
        </div>
        <StudioButton onClick={onClose}>Close</StudioButton>
      </header>
      {!mapper ? (
        <div className="studio-mapper-empty">
          <strong>No mapper in this project</strong>
          <span>The topology and stylesheet remain complete without telemetry.</span>
          <StudioButton className="studio-primary-button" onClick={onEnable}>Enable telemetry mapper</StudioButton>
        </div>
      ) : (
        <div className="studio-mapper-content">
          <div className="studio-mapper-enabled">
            <div>
              <strong>mapper.yaml enabled</strong>
              <span>Rules: {ruleEntries.length}</span>
            </div>
            {!confirmRemove ? (
              <div className="studio-mapper-enabled-actions">
                <StudioButton onClick={onExport}>Export mapper</StudioButton>
                <StudioButton className="studio-danger-outline" onClick={() => setConfirmRemove(true)}>
                  <DeleteOutlineIcon fontSize="small" /> Remove mapper
                </StudioButton>
              </div>
            ) : (
              <div aria-label="Remove telemetry mapper" aria-modal="true" className="studio-mapper-remove-confirm" onKeyDown={removeDialog.onDialogKeyDown} ref={removeDialog.dialogRef} role="alertdialog" tabIndex={-1}>
                <span>Remove mapper.yaml? Topology and stylesheet are not changed.</span>
                <StudioButton onClick={() => setConfirmRemove(false)}>Cancel</StudioButton>
                <StudioButton className="studio-danger-button" onClick={() => {
                  if (onRemove()) setConfirmRemove(false);
                }}>Remove</StudioButton>
              </div>
            )}
          </div>

          <StudioTabs aria-label="Mapper authoring views" className="studio-mapper-view-tabs" onChange={(_event, value: MapperView) => setView(value)} value={view}>
            {(['basic', 'advanced', 'all'] as const).map((candidate) => (
              <StudioTab
                key={candidate}
                label={candidate[0].toUpperCase() + candidate.slice(1)}
                value={candidate}
              />
            ))}
          </StudioTabs>

          <div className="studio-mapper-editor-stack">
            {view === 'basic' ? (
              <form className="studio-mapper-basic-form" onSubmit={submitRule}>
              <h3>Basic rule</h3>
              <label>
                Metric
                <StudioTextField aria-label="Metric" onChange={(event) => setMetric(event.target.value)} placeholder="interface_up" required value={metric} />
              </label>
              <label>
                Target
                <StudioSelect aria-label="Target" onChange={(event) => setTargetKind(event.target.value as MapperAuthoringTargetKind)} value={targetKind}>
                  {mapperAuthoringTargetKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
                </StudioSelect>
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
              <StudioButton className="studio-primary-button" type="submit">Create rule</StudioButton>
              </form>
            ) : mapperValue ? (
              <MapperGeneratedFields
                mapper={mapperValue}
                onCommit={onCommitField}
                onOpenSource={onOpenSource}
                onUnset={onUnsetField}
                rule={selectedRule?.ref}
                view={view}
              />
            ) : null}
            {mapperValue && selectedRule ? (
              <MapperStyleEditor
                assetOptions={Object.keys(snapshot.projection.document.icons || {}).sort()}
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
      )}
    </section>
  );
}
