import { useState, type ChangeEvent } from 'react';
import {
  ingestMapperSamples,
  type MapperMetricDiscovery,
  type MapperSampleIngestionResult
} from 'topoviewer/authoring';

const maximumSampleBytes = 2 * 1024 * 1024;

interface MapperSampleWorkspaceProps {
  onIngest(result: MapperSampleIngestionResult): void;
  onPropose(metric: string): boolean;
  metrics?: MapperMetricDiscovery[];
  result?: MapperSampleIngestionResult;
}

export function MapperSampleWorkspace({ metrics, onIngest, onPropose, result }: MapperSampleWorkspaceProps) {
  const [draft, setDraft] = useState('');
  const [fileError, setFileError] = useState<string>();

  function ingest(text: string) {
    setFileError(undefined);
    onIngest(ingestMapperSamples(text, { maximumBytes: maximumSampleBytes }));
  }

  async function loadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > maximumSampleBytes) {
      setFileError(`Sample file exceeds the ${maximumSampleBytes} byte limit.`);
      return;
    }
    const text = await file.text();
    setDraft(text);
    ingest(text);
  }

  return (
    <section className="studio-mapper-samples" aria-label="Local telemetry samples">
      <h3>Local samples</h3>
      <span>Paste JSON or choose a local file. Studio does not fetch telemetry.</span>
      <textarea
        aria-label="Sample JSON"
        onChange={(event) => setDraft(event.target.value)}
        placeholder='[{"metric":"node_health","value":1,"labels":{"node_id":"leaf1"}}]'
        value={draft}
      />
      <div>
        <button disabled={!draft.trim()} onClick={() => ingest(draft)} type="button">Analyze samples</button>
        <label className="studio-file-button">
          Choose JSON
          <input accept=".json,application/json" aria-label="Choose sample JSON" onChange={(event) => void loadFile(event)} type="file" />
        </label>
      </div>
      {fileError ? <strong role="alert">{fileError}</strong> : null}
      {result ? (
        <div className="studio-mapper-sample-summary" aria-live="polite">
          <strong>{result.samples.length} samples</strong>
          <span>{result.format}{result.truncated ? ' · truncated' : ''}</span>
          {result.diagnostics.map((diagnostic, index) => (
            <span data-severity={diagnostic.severity} key={`${diagnostic.code}-${index}`}>{diagnostic.message}</span>
          ))}
        </div>
      ) : null}
      {metrics?.length ? (
        <div className="studio-mapper-metrics" aria-label="Discovered metrics">
          {metrics.map((metric) => (
            <button
              draggable
              key={metric.metric}
              onClick={() => onPropose(metric.metric)}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'copy';
                event.dataTransfer.setData('application/x-topoviewer-metric', metric.metric);
              }}
              type="button"
            >
              <strong>{metric.metric}</strong>
              <span>{metric.sampleCount} sample{metric.sampleCount === 1 ? '' : 's'} · {metric.labelKeys.join(', ') || 'no labels'}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
