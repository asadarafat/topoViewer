import { memo, useState, type ChangeEvent } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { MapperMetricDiscovery } from 'topoviewer/authoring';
import { StudioAlert, StudioButton, StudioButtonBase, StudioFileButton, StudioTextarea } from '../../ui/controls';
import {
  maximumMapperSampleBytes,
  type StudioMapperIngestionSummary
} from './mapperAnalysisProjection';

interface MapperSampleWorkspaceProps {
  onIngest(input: string): void;
  onPropose(metric: string): boolean;
  metrics?: MapperMetricDiscovery[];
  result?: StudioMapperIngestionSummary;
}

export function MapperSampleWorkspace({ metrics, onIngest, onPropose, result }: MapperSampleWorkspaceProps) {
  return (
    <Box className="studio-mapper-samples" aria-label="Local telemetry samples" component="section">
      <Typography component="h3" variant="subtitle2">Local samples</Typography>
      <Typography color="text.secondary" variant="body2">Paste JSON or choose a local file. Studio does not fetch telemetry.</Typography>
      <MapperSampleInput onIngest={onIngest} />
      {result ? (
        <Paper className="studio-mapper-sample-summary" aria-live="polite" variant="outlined">
          <Typography component="strong" variant="subtitle2">{result.sampleCount} samples</Typography>
          <Typography color="text.secondary" component="span" variant="caption">{result.format}{result.truncated ? ' · truncated' : ''}</Typography>
          {result.diagnostics.map((diagnostic, index) => (
            <Typography component="span" data-severity={diagnostic.severity} key={`${diagnostic.code}-${index}`} variant="caption">{diagnostic.message}</Typography>
          ))}
        </Paper>
      ) : null}
      {metrics?.length ? (
        <Stack className="studio-mapper-metrics" aria-label="Discovered metrics" spacing={0.75}>
          {metrics.map((metric) => (
            <StudioButtonBase
              draggable
              key={metric.metric}
              onClick={() => onPropose(metric.metric)}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'copy';
                event.dataTransfer.setData('application/x-topoviewer-metric', metric.metric);
              }}
            >
              <Typography component="strong" variant="subtitle2">{metric.metric}</Typography>
              <Typography color="text.secondary" component="span" variant="caption">{metric.sampleCount} sample{metric.sampleCount === 1 ? '' : 's'} · {metric.labelKeys.join(', ') || 'no labels'}</Typography>
            </StudioButtonBase>
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}

const MapperSampleInput = memo(function MapperSampleInput({ onIngest }: { onIngest(input: string): void }) {
  const [draft, setDraft] = useState('');
  const [fileError, setFileError] = useState<string>();

  function ingest(text: string) {
    setFileError(undefined);
    onIngest(text);
  }

  async function loadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > maximumMapperSampleBytes) {
      setFileError(`Sample file exceeds the ${maximumMapperSampleBytes} byte limit.`);
      return;
    }
    const text = await file.text();
    setDraft(text);
    ingest(text);
  }

  return (
    <>
      <StudioTextarea
        aria-label="Sample JSON"
        onChange={(event) => setDraft(event.target.value)}
        placeholder='[{"metric":"node_health","value":1,"labels":{"node_id":"leaf1"}}]'
        rows={5}
        value={draft}
      />
      <Stack direction="row" spacing={1}>
        <StudioButton disabled={!draft.trim()} onClick={() => ingest(draft)}>Analyze samples</StudioButton>
        <StudioFileButton accept=".json,application/json" ariaLabel="Choose sample JSON" onChange={(event) => void loadFile(event)}>Choose JSON</StudioFileButton>
      </Stack>
      {fileError ? <StudioAlert severity="error">{fileError}</StudioAlert> : null}
    </>
  );
});
