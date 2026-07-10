import { useEffect, useMemo, useState, type FormEvent } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import {
  mapperAuthoringTargetKinds,
  mapperAuthoringValueSemantics,
  mapperRuleTargetKind,
  type CreateBasicMapperRuleOptions,
  type MapperAuthoringTargetKind,
  type MapperAuthoringValueSemantic,
  type MapperRuleProposal,
  type MapperSampleIngestionResult
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
import { MapperSampleWorkspace } from './MapperSampleWorkspace';
import { useMapperAnalysis } from './useMapperAnalysis';

interface MapperWorkspaceProps {
  onClose(): void;
  onCommitField(request: StudioMapperFieldEditRequest): boolean;
  onCommitProposal(candidateId?: string): boolean;
  onCreateRule(options: CreateBasicMapperRuleOptions): boolean;
  onEnable(): boolean;
  onExport(): void;
  onIngestSamples(result: MapperSampleIngestionResult): void;
  onOpenSource(path: Array<string | number>): void;
  onRemove(): boolean;
  onProposeMetric(metric: string): boolean;
  onSelectCoverageObject(kind: string, id: string): void;
  onCommitStyle(request: StudioMapperStyleEditRequest): boolean;
  onUnsetStyle(request: StudioMapperStyleUnsetRequest): boolean;
  onUnsetField(request: StudioMapperFieldUnsetRequest): boolean;
  profile: StudioAuthoringProfileOverride;
  proposal?: MapperRuleProposal;
  sampleResult?: MapperSampleIngestionResult;
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
  sampleResult,
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
  const analysis = useMapperAnalysis(snapshot.projection.document, mapperValue, sampleResult?.samples);
  const coverage = analysis.coverage;
  const invalidIngestionCount = sampleResult?.diagnostics.filter((diagnostic) => diagnostic.code === 'sample-record-invalid').length || 0;

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
        <button onClick={onClose} type="button">Close</button>
      </header>
      {!mapper ? (
        <div className="studio-mapper-empty">
          <strong>No mapper in this project</strong>
          <span>The topology and stylesheet remain complete without telemetry.</span>
          <button onClick={onEnable} type="button">Enable telemetry mapper</button>
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
                <button onClick={onExport} type="button">Export mapper</button>
                <button className="studio-danger-outline" onClick={() => setConfirmRemove(true)} type="button">
                  <DeleteOutlineIcon fontSize="small" /> Remove mapper
                </button>
              </div>
            ) : (
              <div className="studio-mapper-remove-confirm" role="alertdialog" aria-label="Remove telemetry mapper">
                <span>Remove mapper.yaml? Topology and stylesheet are not changed.</span>
                <button onClick={() => setConfirmRemove(false)} type="button">Cancel</button>
                <button className="studio-danger-button" onClick={() => {
                  if (onRemove()) setConfirmRemove(false);
                }} type="button">Remove</button>
              </div>
            )}
          </div>

          <nav aria-label="Mapper authoring views" className="studio-mapper-view-tabs">
            {(['basic', 'advanced', 'all'] as const).map((candidate) => (
              <button
                aria-current={view === candidate ? 'page' : undefined}
                key={candidate}
                onClick={() => setView(candidate)}
                type="button"
              >
                {candidate[0].toUpperCase() + candidate.slice(1)}
              </button>
            ))}
          </nav>

          <div className="studio-mapper-editor-stack">
            {view === 'basic' ? (
              <form className="studio-mapper-basic-form" onSubmit={submitRule}>
              <h3>Basic rule</h3>
              <label>
                Metric
                <input aria-label="Metric" onChange={(event) => setMetric(event.target.value)} placeholder="interface_up" required value={metric} />
              </label>
              <label>
                Target
                <select aria-label="Target" onChange={(event) => setTargetKind(event.target.value as MapperAuthoringTargetKind)} value={targetKind}>
                  {mapperAuthoringTargetKinds.map((kind) => <option key={kind} value={kind}>{kind}</option>)}
                </select>
              </label>
              {targetKind === 'linkDirection' ? (
                <>
                  <label>Link label<input aria-label="Link label" onChange={(event) => setLinkLabel(event.target.value)} required value={linkLabel} /></label>
                  <label>Direction label<input aria-label="Direction label" onChange={(event) => setDirectionLabel(event.target.value)} required value={directionLabel} /></label>
                </>
              ) : targetKind !== 'graph' ? (
                <label>Join label<input aria-label="Join label" onChange={(event) => setJoinLabel(event.target.value)} required value={joinLabel} /></label>
              ) : null}
              <label>
                Value semantic
                <select aria-label="Value semantic" onChange={(event) => setValue(event.target.value as MapperAuthoringValueSemantic | '')} value={value}>
                  <option value="">Raw value</option>
                  {mapperAuthoringValueSemantics.map((semantic) => <option key={semantic} value={semantic}>{semantic}</option>)}
                </select>
              </label>
              <label>State name<input aria-label="State name" onChange={(event) => setStateName(event.target.value)} placeholder="down" value={stateName} /></label>
              <label>State expression<input aria-label="State expression" onChange={(event) => setStateExpression(event.target.value)} placeholder="==0" value={stateExpression} /></label>
              <button className="studio-primary-button" type="submit">Create rule</button>
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
                <button
                  aria-pressed={selectedRule?.key === entry.key}
                  key={`${String(rule.id || 'rule')}-${index}`}
                  onClick={() => setSelectedRuleKey(entry.key)}
                  type="button"
                >
                  <strong>{String(rule.id || `Rule ${index + 1}`)}</strong>
                  <span>{String(rule.metric || 'Missing metric')} · {mapperRuleTargetKind(rule) || 'invalid target'}</span>
                </button>
              );
            }) : <span>No rules yet.</span>}
            {analysis.mode !== 'idle' ? (
              <span className="studio-mapper-analysis-status" data-analysis-mode={analysis.mode} role="status">
                {analysis.pending ? 'Analyzing samples…' : `Analyzed ${analysis.mode === 'worker' ? 'off the main thread' : 'locally'}`}
              </span>
            ) : null}
            {analysis.error ? <strong className="studio-field-error" role="alert">{analysis.error}</strong> : null}
            <MapperSampleWorkspace metrics={analysis.metrics} onIngest={onIngestSamples} onPropose={onProposeMetric} result={sampleResult} />
            {proposal ? (
              <section className="studio-mapper-proposal" aria-label="Mapper rule proposal">
                <h3>Rule proposal</h3>
                <strong>{proposal.metric} → {proposal.targetKind} {proposal.targetId}</strong>
                <span>{proposal.sampleCount} matching metric sample{proposal.sampleCount === 1 ? '' : 's'} · {proposal.status}</span>
                {proposal.candidates.map((candidate) => (
                  <label key={candidate.id}>
                    <input
                      checked={selectedCandidateId === candidate.id}
                      name="mapper-join-candidate"
                      onChange={() => setSelectedCandidateId(candidate.id)}
                      type="radio"
                    />
                    <span>
                      <strong>{candidate.telemetryLabel}{candidate.directionTelemetryLabel ? ` + ${candidate.directionTelemetryLabel}` : ''}</strong>
                      {candidate.mode} · {candidate.matchedSampleCount} samples · {candidate.matchedObjectIds.join(', ')}
                    </span>
                  </label>
                ))}
                {!proposal.candidates.length ? <span>No stable join candidate matched this object.</span> : null}
                <button
                  disabled={!selectedCandidateId || proposal.status === 'missing-join' || proposal.status === 'unsupported-target'}
                  onClick={() => onCommitProposal(selectedCandidateId)}
                  type="button"
                >
                  Create proposed rule
                </button>
              </section>
            ) : null}
            {coverage ? (
              <section className="studio-mapper-coverage" aria-label="Mapper coverage">
                <h3>Coverage</h3>
                <div className="studio-mapper-coverage-summary">
                  {(['resolved', 'unresolved', 'ambiguous', 'duplicate', 'ignored', 'invalid'] as const).map((status) => (
                    <span data-status={status} key={status}>
                      <strong>{coverage.summary[status] + (status === 'invalid' ? invalidIngestionCount : 0)}</strong> {status}
                    </span>
                  ))}
                </div>
                <div className="studio-mapper-coverage-items">
                  {coverage.items.slice(0, 100).map((item, index) => (
                    <div data-status={item.status} key={`${item.sampleIndex}-${item.ruleId || 'none'}-${index}`}>
                      <strong>{item.status} · {item.metric || 'invalid sample'}</strong>
                      <span>{item.message}</span>
                      {item.ruleId ? (
                        <button onClick={() => {
                          const entry = ruleEntries.find((candidate) => isRecord(candidate.rule) && candidate.rule.id === item.ruleId);
                          if (entry) setSelectedRuleKey(entry.key);
                        }} type="button">Rule {item.ruleId}</button>
                      ) : null}
                      {item.objectIds.map((id) => (
                        <button key={id} onClick={() => onSelectCoverageObject(item.targetKind || 'node', id)} type="button">Object {id}</button>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </section>
        </div>
      )}
    </section>
  );
}
