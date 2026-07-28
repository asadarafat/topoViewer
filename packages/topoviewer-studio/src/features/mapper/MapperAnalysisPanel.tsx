import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { TopoDocument } from 'topoviewer';
import { MapperSampleWorkspace } from './MapperSampleWorkspace';
import { useMapperAnalysis } from './useMapperAnalysis';
import { StudioAlert, StudioButton } from '../../ui/controls';
import { studioSpace } from '../../ui/muiSpacing';

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

export function MapperAnalysisPanel({ document, mapper, onIngestSamples, onProposeMetric, onSelectCoverageObject, onSelectRule, sampleInput }: MapperAnalysisPanelProps) {
  const [coverageDetailsExpanded, setCoverageDetailsExpanded] = useState(false);
  const analysis = useMapperAnalysis(document, mapper);
  const analyze = analysis.analyze;
  const coverage = analysis.coverage;
  const invalidIngestionCount = analysis.ingestion?.diagnostics.filter((diagnostic) => diagnostic.code === 'sample-record-invalid').length || 0;

  useEffect(() => {
    setCoverageDetailsExpanded(false);
  }, [coverage]);

  useEffect(() => {
    analyze(sampleInput);
  }, [analyze, sampleInput]);

  const ingestSamples = useCallback(
    (input: string) => {
      onIngestSamples(input);
      analyze(input);
    },
    [analyze, onIngestSamples]
  );

  return (
    <>
      {analysis.mode !== 'idle' ? (
        <Typography color="text.secondary" component="span" data-analysis-mode={analysis.mode} role="status" variant="caption">
          {analysis.pending ? 'Analyzing samples…' : `Analyzed ${analysis.mode === 'worker' ? 'off the main thread' : 'locally'}`}
        </Typography>
      ) : null}
      {analysis.error ? <StudioAlert severity="error">{analysis.error}</StudioAlert> : null}
      <MapperSampleWorkspace metrics={analysis.metrics} onIngest={ingestSamples} onPropose={onProposeMetric} result={analysis.ingestion} />
      {coverage ? (
        <Box
          className="studio-mapper-coverage"
          aria-label="Mapper coverage"
          component="section"
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            display: 'grid',
            gap: studioSpace.space8,
            pt: studioSpace.space12
          }}
        >
          <Typography component="h3" variant="subtitle2">
            Coverage
          </Typography>
          <Stack className="studio-mapper-coverage-summary" direction="row" sx={{ flexWrap: 'wrap', gap: studioSpace.space6 }}>
            {(['resolved', 'unresolved', 'ambiguous', 'duplicate', 'ignored', 'invalid'] as const).map((status) => (
              <Typography
                component="span"
                data-status={status}
                key={status}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  px: studioSpace.space8,
                  py: studioSpace.space4
                }}
                variant="caption"
              >
                <Typography component="strong" variant="subtitle2">
                  {coverage.summary[status] + (status === 'invalid' ? invalidIngestionCount : 0)}
                </Typography>{' '}
                {status}
              </Typography>
            ))}
          </Stack>
          {analysis.coverageTotalItems && analysis.coverageTotalItems > coverage.items.length ? (
            <Typography color="text.secondary" component="span" variant="caption">
              {coverageDetailsExpanded ? `Showing ${coverage.items.length} of ${analysis.coverageTotalItems} findings.` : `${analysis.coverageTotalItems} findings summarized.`} Aggregate counts include every sample.
            </Typography>
          ) : null}
          <Stack spacing={studioSpace.space6}>
            {coverage.items.slice(0, coverage.items.length <= inlineCoverageDetailLimit || coverageDetailsExpanded ? coverage.items.length : 0).map((item, index) => (
              <Paper
                data-status={item.status}
                key={`${item.sampleIndex}-${item.ruleId || 'none'}-${index}`}
                sx={{
                  display: 'grid',
                  gap: studioSpace.space4,
                  p: studioSpace.space10
                }}
                variant="outlined"
              >
                <Typography component="strong" variant="subtitle2">
                  {item.status} · {item.metric || 'invalid sample'}
                </Typography>
                <Typography color="text.secondary" component="span" variant="body2">
                  {item.message}
                </Typography>
                {item.ruleId ? <StudioButton onClick={() => onSelectRule(item.ruleId || '')}>Rule {item.ruleId}</StudioButton> : null}
                {item.objectIds.map((id) => (
                  <StudioButton key={id} onClick={() => onSelectCoverageObject(item.targetKind || 'node', id)}>
                    Object {id}
                  </StudioButton>
                ))}
              </Paper>
            ))}
          </Stack>
          {!coverageDetailsExpanded && coverage.items.length > inlineCoverageDetailLimit ? <StudioButton onClick={() => setCoverageDetailsExpanded(true)}>Show {coverage.items.length} detailed findings</StudioButton> : null}
        </Box>
      ) : null}
    </>
  );
}
