import { useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import type { StudioHost } from '../../contracts/host';
import type { StudioSessionSnapshot } from '../../contracts/project';
import { createDocumentationSnippet, type DocumentationSnippetKind } from '../../export/documentationSnippets';
import { createStudioExportSnapshot } from '../../export/exportSnapshot';
import { encodeGrafanaBundle } from '../../export/grafanaBundle';
import { exportStudioImage } from '../../export/imageExport';

interface ExportPanelProps {
  canvasElement: HTMLElement | null;
  host: StudioHost;
  onAnnouncement(message: string): void;
  onClose(): void;
  snapshot: StudioSessionSnapshot;
}

type ImageKind = 'png' | 'svg';
type ExportStage = 'validate' | 'fonts' | 'render' | 'encode' | 'package';
type ExportAction = 'grafana' | 'image' | 'snippet';

export default function ExportPanel({ canvasElement, host, onAnnouncement, onClose, snapshot }: ExportPanelProps) {
  const box = canvasElement?.getBoundingClientRect();
  const [kind, setKind] = useState<ImageKind>('png');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [width, setWidth] = useState(Math.max(1, Math.round(box?.width || 1280)));
  const [height, setHeight] = useState(Math.max(1, Math.round(box?.height || 720)));
  const [stage, setStage] = useState<ExportStage>();
  const [error, setError] = useState<string>();
  const [failedAction, setFailedAction] = useState<ExportAction>();
  const abortRef = useRef<AbortController>();

  async function runImageExport() {
    if (!canvasElement) {
      setError('The canvas is not ready for export.');
      return;
    }
    const abort = new AbortController();
    abortRef.current = abort;
    setError(undefined);
    setFailedAction(undefined);
    try {
      const artifact = await exportStudioImage({
        element: canvasElement,
        onProgress: setStage,
        options: {
          background: theme === 'dark' ? '#0b1118' : '#f8fafc',
          height,
          kind,
          theme,
          width
        },
        signal: abort.signal,
        snapshot: createStudioExportSnapshot(snapshot.project, snapshot.projection.sourceRevision)
      });
      const exported = await host.exportArtifact({ artifact, kind, suggestedName: artifact.name });
      if (!exported.ok) throw new Error(exported.error.message);
      onAnnouncement(`${kind.toUpperCase()} exported`);
      setStage(undefined);
    } catch (exportError) {
      setFailedAction('image');
      if (exportError instanceof DOMException && exportError.name === 'AbortError') {
        setError('Export cancelled.');
      } else setError(exportError instanceof Error ? exportError.message : String(exportError));
      setStage(undefined);
    } finally {
      abortRef.current = undefined;
    }
  }

  async function copySnippet(snippetKind: DocumentationSnippetKind) {
    setError(undefined);
    setFailedAction(undefined);
    const source = createStudioExportSnapshot(snapshot.project, snapshot.projection.sourceRevision);
    const copied = await host.copyText(createDocumentationSnippet(source, snippetKind));
    if (!copied.ok) {
      setError(copied.error.message);
      setFailedAction('snippet');
    }
    else onAnnouncement(`${snippetKind === 'mkdocs' ? 'MkDocs' : 'Static HTML'} snippet copied`);
  }

  async function runGrafanaExport() {
    const abort = new AbortController();
    abortRef.current = abort;
    setError(undefined);
    setFailedAction(undefined);
    setStage('validate');
    try {
      const source = createStudioExportSnapshot(snapshot.project, snapshot.projection.sourceRevision);
      const assets = await host.readProjectAssets({ id: snapshot.project.id });
      if (!assets.ok) throw new Error(assets.error.message);
      if (abort.signal.aborted) throw new DOMException('Grafana export was cancelled.', 'AbortError');
      setStage('package');
      const artifact = encodeGrafanaBundle(source, assets.value);
      const exported = await host.exportArtifact({ artifact, kind: 'grafana-bundle', suggestedName: artifact.name });
      if (!exported.ok) throw new Error(exported.error.message);
      onAnnouncement('Grafana bundle exported');
      setStage(undefined);
    } catch (exportError) {
      setFailedAction('grafana');
      if (exportError instanceof DOMException && exportError.name === 'AbortError') setError('Export cancelled.');
      else setError(exportError instanceof Error ? exportError.message : String(exportError));
      setStage(undefined);
    } finally {
      abortRef.current = undefined;
    }
  }

  return (
    <div className="studio-export-backdrop">
      <section aria-label="Export project" className="studio-export-panel" role="dialog">
        <header>
          <div><strong>Export</strong><span>Current source revision</span></div>
          <button aria-label="Close export panel" disabled={Boolean(stage)} onClick={onClose} title="Close" type="button"><CloseIcon fontSize="small" /></button>
        </header>
        <div aria-label="Image format" className="studio-export-segments" role="group">
          {(['png', 'svg'] as const).map((value) => (
            <button aria-pressed={kind === value} key={value} onClick={() => setKind(value)} type="button">{value.toUpperCase()}</button>
          ))}
        </div>
        <div className="studio-export-fields">
          <label>Width <input aria-label="Export width" min="1" max="8192" onChange={(event) => setWidth(Number(event.target.value))} type="number" value={width} /></label>
          <label>Height <input aria-label="Export height" min="1" max="8192" onChange={(event) => setHeight(Number(event.target.value))} type="number" value={height} /></label>
          <label>Theme
            <select aria-label="Export theme" onChange={(event) => setTheme(event.target.value as 'light' | 'dark')} value={theme}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>
        <section className="studio-export-snippets">
          <strong>Documentation snippets</strong>
          <div>
            <button disabled={Boolean(stage)} onClick={() => void copySnippet('mkdocs')} type="button">Copy MkDocs snippet</button>
            <button disabled={Boolean(stage)} onClick={() => void copySnippet('static')} type="button">Copy static HTML snippet</button>
          </div>
        </section>
        <section className="studio-export-snippets">
          <strong>Operational package</strong>
          <button disabled={Boolean(stage)} onClick={() => void runGrafanaExport()} type="button">{failedAction === 'grafana' ? 'Retry Grafana bundle' : 'Export Grafana bundle'}</button>
        </section>
        {stage ? <p aria-live="polite" className="studio-export-progress">Exporting: {stage}</p> : null}
        {error ? <p className="studio-export-error" role="alert">{error}</p> : null}
        <footer>
          {stage ? <button onClick={() => abortRef.current?.abort()} type="button">Cancel</button> : null}
          <button disabled={Boolean(stage)} onClick={() => void runImageExport()} type="button">{failedAction === 'image' ? `Retry ${kind.toUpperCase()} export` : `Export ${kind.toUpperCase()}`}</button>
        </footer>
      </section>
    </div>
  );
}
