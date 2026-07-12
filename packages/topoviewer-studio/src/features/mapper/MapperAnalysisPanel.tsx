import { startTransition, useCallback, useEffect, useState } from 'react';
import type { TopoDocument } from 'topoviewer';
import { MapperSampleWorkspace } from './MapperSampleWorkspace';
import { useMapperAnalysis } from './useMapperAnalysis';
import { StudioAlert, StudioButton } from '../../ui/controls';

interface MapperAnalysisPanelProps {
  document: TopoDocument;
  mapper: Record<string, unknown>;
  onIngestSamples(input: string): void;
  onProposeMetric(metric: string): boolean;
  onSelectCoverageObject(kind: string, id: string): void;
  onSelectRule(ruleId: string): void;
  sampleInput?: string;
}

const inlineCoverageDetailLimit = 10;

export function MapperAnalysisPanel({
  document,
  mapper,
  onIngestSamples,
  onProposeMetric,
  onSelectCoverageObject,
  onSelectRule,
  sampleInput
}: MapperAnalysisPanelProps) {
  const [coverageDetailsExpanded, setCoverageDetailsExpanded] = useState(false);
  const [localSampleInput, setLocalSampleInput] = useState(sampleInput);
  const analysis = useMapperAnalysis(document, mapper, localSampleInput);
  const coverage = analysis.coverage;
  const invalidIngestionCount = analysis.ingestion?.diagnostics
    .filter((diagnostic) => diagnostic.code === 'sample-record-invalid').length || 0;

  useEffect(() => {
    setCoverageDetailsExpanded(false);
  }, [coverage]);

  const ingestSamples = useCallback((input: string) => {
    startTransition(() => setLocalSampleInput(input));
    onIngestSamples(input);
  }, [onIngestSamples]);

  return (
    <>
      {analysis.mode !== 'idle' ? (
        <span className="studio-mapper-analysis-status" data-analysis-mode={analysis.mode} role="status">
          {analysis.pending ? 'Analyzing samples…' : `Analyzed ${analysis.mode === 'worker' ? 'off the main thread' : 'locally'}`}
        </span>
      ) : null}
      {analysis.error ? <StudioAlert className="studio-field-error" severity="error">{analysis.error}</StudioAlert> : null}
      <MapperSampleWorkspace
        metrics={analysis.metrics}
        onIngest={ingestSamples}
        onPropose={onProposeMetric}
        result={analysis.ingestion}
      />
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
          {analysis.coverageTotalItems && analysis.coverageTotalItems > coverage.items.length ? (
            <span className="studio-mapper-coverage-limit">
              {coverageDetailsExpanded
                ? `Showing ${coverage.items.length} of ${analysis.coverageTotalItems} findings.`
                : `${analysis.coverageTotalItems} findings summarized.`}
              {' '}Aggregate counts include every sample.
            </span>
          ) : null}
          <div className="studio-mapper-coverage-items">
            {coverage.items
              .slice(0, coverage.items.length <= inlineCoverageDetailLimit || coverageDetailsExpanded ? coverage.items.length : 0)
              .map((item, index) => (
                <div data-status={item.status} key={`${item.sampleIndex}-${item.ruleId || 'none'}-${index}`}>
                  <strong>{item.status} · {item.metric || 'invalid sample'}</strong>
                  <span>{item.message}</span>
                  {item.ruleId ? <StudioButton onClick={() => onSelectRule(item.ruleId || '')}>Rule {item.ruleId}</StudioButton> : null}
                  {item.objectIds.map((id) => (
                    <StudioButton key={id} onClick={() => onSelectCoverageObject(item.targetKind || 'node', id)}>Object {id}</StudioButton>
                  ))}
                </div>
              ))}
          </div>
          {!coverageDetailsExpanded && coverage.items.length > inlineCoverageDetailLimit ? (
            <StudioButton onClick={() => setCoverageDetailsExpanded(true)}>
              Show {coverage.items.length} detailed findings
            </StudioButton>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
