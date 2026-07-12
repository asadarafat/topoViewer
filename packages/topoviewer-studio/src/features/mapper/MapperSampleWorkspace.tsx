import { memo, useState, type ChangeEvent } from 'react';
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
    <section className="studio-mapper-samples" aria-label="Local telemetry samples">
      <h3>Local samples</h3>
      <span>Paste JSON or choose a local file. Studio does not fetch telemetry.</span>
      <MapperSampleInput onIngest={onIngest} />
      {result ? (
        <div className="studio-mapper-sample-summary" aria-live="polite">
          <strong>{result.sampleCount} samples</strong>
          <span>{result.format}{result.truncated ? ' · truncated' : ''}</span>
          {result.diagnostics.map((diagnostic, index) => (
            <span data-severity={diagnostic.severity} key={`${diagnostic.code}-${index}`}>{diagnostic.message}</span>
          ))}
        </div>
      ) : null}
      {metrics?.length ? (
        <div className="studio-mapper-metrics" aria-label="Discovered metrics">
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
              <strong>{metric.metric}</strong>
              <span>{metric.sampleCount} sample{metric.sampleCount === 1 ? '' : 's'} · {metric.labelKeys.join(', ') || 'no labels'}</span>
            </StudioButtonBase>
          ))}
        </div>
      ) : null}
    </section>
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
      <div>
        <StudioButton disabled={!draft.trim()} onClick={() => ingest(draft)}>Analyze samples</StudioButton>
        <StudioFileButton accept=".json,application/json" ariaLabel="Choose sample JSON" onChange={(event) => void loadFile(event)}>Choose JSON</StudioFileButton>
      </div>
      {fileError ? <StudioAlert severity="error">{fileError}</StudioAlert> : null}
    </>
  );
});
