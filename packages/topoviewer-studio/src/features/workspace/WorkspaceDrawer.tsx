import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode
} from 'react';
import type { StudioHistoryEntry } from '../../contracts/commands';
import type {
  StudioDiagnostic,
  StudioDocumentKind,
  StudioSessionSnapshot
} from '../../contracts/project';
import { handleRovingTabKey } from '../../accessibility/tabs';
import type { StudioNormalizationReview, StudioSourceRange } from '../../session';
import { createStudioYamlAssist } from './yamlAssist';

const MonacoYamlEditor = lazy(() => import('./MonacoYamlEditor'));

type WorkspaceView = 'yaml' | 'diagnostics' | 'diff' | 'history';

interface WorkspaceDrawerProps {
  forceEditorFailure?: boolean;
  history: StudioHistoryEntry[];
  height: number;
  initialDocument?: StudioDocumentKind;
  normalizationReview?: StudioNormalizationReview;
  onApply(document: StudioDocumentKind, text: string): boolean;
  onCancelNormalization(): void;
  onConfirmNormalization(): boolean;
  onCursorOffset(document: StudioDocumentKind, offset: number): void;
  onDiscardInvalid(document: StudioDocumentKind): void;
  onNavigateDiagnostic(diagnostic: StudioDiagnostic): void;
  onClose(): void;
  onResize(height: number): void;
  sourcePath?: Array<string | number>;
  sourceRange?: StudioSourceRange;
  snapshot: StudioSessionSnapshot;
}

interface EditorBoundaryProps {
  children: ReactNode;
  document: StudioDocumentKind;
  onChange(value: string): void;
  value: string;
}

interface EditorBoundaryState {
  failed: boolean;
}

class EditorBoundary extends Component<EditorBoundaryProps, EditorBoundaryState> {
  state = { failed: false };

  static getDerivedStateFromError(): EditorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {}

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="studio-editor-fallback" role="alert">
        <p>Enhanced YAML editing is unavailable. Raw source editing remains available.</p>
        <textarea
          aria-label={`${this.props.document} YAML editor`}
          onChange={(event) => this.props.onChange(event.target.value)}
          spellCheck={false}
          value={this.props.value}
        />
      </div>
    );
  }
}

const documents: Array<{ kind: StudioDocumentKind; label: string }> = [
  { kind: 'topology', label: 'topology.yaml' },
  { kind: 'stylesheet', label: 'stylesheet.yaml' },
  { kind: 'mapper', label: 'mapper.yaml' }
];

const views: Array<{ id: WorkspaceView; label: string }> = [
  { id: 'yaml', label: 'YAML' },
  { id: 'diagnostics', label: 'Diagnostics' },
  { id: 'diff', label: 'Diff' },
  { id: 'history', label: 'History' }
];

function sourceFor(snapshot: StudioSessionSnapshot, kind: StudioDocumentKind) {
  return snapshot.invalidDrafts[kind]?.text || snapshot.project.documents[kind]?.text || '';
}

function canonicalSource(snapshot: StudioSessionSnapshot, kind: StudioDocumentKind) {
  return snapshot.project.documents[kind]?.text || '';
}

function draftsFor(snapshot: StudioSessionSnapshot) {
  return Object.fromEntries(documents.map(({ kind }) => [kind, sourceFor(snapshot, kind)])) as Record<StudioDocumentKind, string>;
}

function lineDiff(before: string, after: string) {
  const beforeLines = before.split(/\r?\n/);
  const afterLines = after.split(/\r?\n/);
  let prefix = 0;
  while (prefix < beforeLines.length && prefix < afterLines.length && beforeLines[prefix] === afterLines[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < beforeLines.length - prefix
    && suffix < afterLines.length - prefix
    && beforeLines[beforeLines.length - 1 - suffix] === afterLines[afterLines.length - 1 - suffix]
  ) suffix += 1;
  return {
    added: afterLines.slice(prefix, afterLines.length - suffix),
    removed: beforeLines.slice(prefix, beforeLines.length - suffix),
    startLine: prefix + 1
  };
}

function diagnosticLabel(diagnostic: StudioDiagnostic) {
  return `${diagnostic.code.replace(/-/g, ' ')}: ${diagnostic.message}`;
}

function EditorFailureProbe(): never {
  throw new Error('Intentional Studio editor failure.');
}

export default function WorkspaceDrawer({
  forceEditorFailure = false,
  height,
  history,
  initialDocument = 'topology',
  normalizationReview,
  onApply,
  onCancelNormalization,
  onClose,
  onConfirmNormalization,
  onCursorOffset,
  onDiscardInvalid,
  onNavigateDiagnostic,
  onResize,
  snapshot,
  sourcePath,
  sourceRange
}: WorkspaceDrawerProps) {
  const [active, setActive] = useState<StudioDocumentKind>(initialDocument);
  const [view, setView] = useState<WorkspaceView>('yaml');
  const [drafts, setDrafts] = useState(() => draftsFor(snapshot));
  const [focusRange, setFocusRange] = useState(sourceRange);
  const [locationPath, setLocationPath] = useState(sourcePath);
  const previousSources = useRef(draftsFor(snapshot));
  const diagnostics = useMemo(() => [
    ...Object.values(snapshot.invalidDrafts).flatMap((draft) => draft?.diagnostics || []),
    ...snapshot.projection.diagnostics
  ], [snapshot.invalidDrafts, snapshot.projection.diagnostics]);
  const assist = useMemo(
    () => createStudioYamlAssist(snapshot.project, snapshot.projection.document),
    [snapshot.project, snapshot.projection.document]
  );
  const draft = drafts[active] || '';
  const source = canonicalSource(snapshot, active);
  const activeDiagnostics = diagnostics.filter((diagnostic) => diagnostic.document === active);
  const diff = lineDiff(source, draft);

  useEffect(() => {
    setActive(initialDocument);
  }, [initialDocument]);

  useEffect(() => {
    setFocusRange(sourceRange);
    setLocationPath(sourcePath);
    if (sourcePath || sourceRange) setView('yaml');
  }, [sourcePath, sourceRange]);

  useEffect(() => {
    if (normalizationReview) setView('diff');
  }, [normalizationReview]);

  useEffect(() => {
    const nextSources = draftsFor(snapshot);
    setDrafts((current) => {
      const next = { ...current };
      documents.forEach(({ kind }) => {
        if (current[kind] === previousSources.current[kind] || snapshot.invalidDrafts[kind]) {
          next[kind] = nextSources[kind];
        }
      });
      return next;
    });
    previousSources.current = nextSources;
  }, [snapshot]);

  function activateDocument(kind: StudioDocumentKind) {
    setActive(kind);
    setFocusRange(undefined);
    setLocationPath(undefined);
  }

  function revert() {
    if (snapshot.invalidDrafts[active]) onDiscardInvalid(active);
    setDrafts((current) => ({ ...current, [active]: source }));
  }

  function navigateDiagnostic(diagnostic: StudioDiagnostic) {
    activateDocument(diagnostic.document);
    setLocationPath(diagnostic.path);
    setFocusRange({
      column: diagnostic.column || 1,
      endColumn: diagnostic.endColumn || (diagnostic.column || 1) + 1,
      endLine: diagnostic.endLine || diagnostic.line || 1,
      endOffset: 0,
      line: diagnostic.line || 1,
      startOffset: 0
    });
    setView('yaml');
    onNavigateDiagnostic(diagnostic);
  }

  function beginResize(event: React.PointerEvent<HTMLDivElement>) {
    const view = event.currentTarget.ownerDocument.defaultView;
    if (!view) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const move = (pointer: PointerEvent) => {
      const maximum = Math.max(220, view.innerHeight - 240);
      onResize(Math.max(180, Math.min(maximum, view.innerHeight - pointer.clientY)));
    };
    const stop = () => {
      view.removeEventListener('pointermove', move);
      view.removeEventListener('pointerup', stop);
    };
    view.addEventListener('pointermove', move);
    view.addEventListener('pointerup', stop);
  }

  function resizeWithKeyboard(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const current = event.currentTarget.parentElement?.getBoundingClientRect().height || 260;
    onResize(Math.max(180, current + (event.key === 'ArrowUp' ? 24 : -24)));
  }

  return (
    <section className="studio-workspace-drawer" aria-label="Workspace drawer">
      <div
        aria-label="Resize workspace drawer"
        aria-valuemax={Math.max(220, globalThis.innerHeight - 240)}
        aria-valuemin={180}
        aria-valuenow={Math.round(height)}
        aria-valuetext={`${Math.round(height)} pixels high`}
        aria-orientation="horizontal"
        className="studio-workspace-resizer"
        onKeyDown={resizeWithKeyboard}
        onPointerDown={beginResize}
        role="separator"
        tabIndex={0}
      />
      <div className="studio-workspace-view-tabs">
        <div aria-label="Workspace views" className="studio-workspace-view-tablist" role="tablist">
          {views.map((tab) => (
            <button
              aria-selected={view === tab.id}
              key={tab.id}
              onClick={() => setView(tab.id)}
              onKeyDown={handleRovingTabKey}
              role="tab"
              tabIndex={view === tab.id ? 0 : -1}
              type="button"
            >
              {tab.label}{tab.id === 'diagnostics' && diagnostics.length ? ` (${diagnostics.length})` : ''}
            </button>
          ))}
        </div>
        <button className="studio-workspace-close" onClick={onClose} type="button">Close</button>
      </div>

      {view === 'yaml' ? (
        <>
          <div className="studio-workspace-tabs" role="tablist" aria-label="Project documents">
            {documents.map((tab) => (
              <button
                aria-selected={active === tab.kind}
                disabled={!snapshot.project.documents[tab.kind]}
                key={tab.kind}
                onClick={() => activateDocument(tab.kind)}
                onKeyDown={handleRovingTabKey}
                role="tab"
                tabIndex={active === tab.kind ? 0 : -1}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="studio-source-location">
            <code>{locationPath?.join('.') || snapshot.project.documents[active]?.path || `${active}.yaml`}</code>
            {focusRange ? <span>Line {focusRange.line}, column {focusRange.column}</span> : null}
          </div>
          <div className="studio-source-editor-toolbar">
            <span>{draft === source ? 'No source changes' : 'Source modified'}</span>
            <button
              aria-label={snapshot.invalidDrafts[active] ? 'Revert invalid draft' : 'Revert'}
              disabled={draft === source && !snapshot.invalidDrafts[active]}
              onClick={revert}
              type="button"
            >Revert</button>
            <button disabled={draft === source && !snapshot.invalidDrafts[active]} onClick={() => onApply(active, draft)} type="button">Apply</button>
          </div>
          <EditorBoundary document={active} key={active} onChange={(value) => setDrafts((current) => ({ ...current, [active]: value }))} value={draft}>
            {forceEditorFailure ? <EditorFailureProbe /> : (
              <Suspense fallback={<div className="studio-editor-loading" aria-busy="true">Loading YAML editor...</div>}>
                <MonacoYamlEditor
                  assist={assist}
                  diagnostics={activeDiagnostics}
                  document={active}
                  focusRange={focusRange}
                  onChange={(value) => setDrafts((current) => ({ ...current, [active]: value }))}
                  onCursorOffset={(offset) => onCursorOffset(active, offset)}
                  value={draft}
                />
              </Suspense>
            )}
          </EditorBoundary>
        </>
      ) : null}

      {view === 'diagnostics' ? (
        <div className="studio-workspace-panel studio-diagnostics-panel">
          <h2>Diagnostics</h2>
          {diagnostics.length ? (
            <ul>
              {diagnostics.map((diagnostic, index) => (
                <li key={`${diagnostic.document}-${diagnostic.code}-${index}`}>
                  <button data-severity={diagnostic.severity} onClick={() => navigateDiagnostic(diagnostic)} type="button">
                    <strong>{diagnostic.document}.yaml</strong>
                    <span>{diagnosticLabel(diagnostic)}</span>
                    <small>Line {diagnostic.line || 1}, column {diagnostic.column || 1}</small>
                  </button>
                </li>
              ))}
            </ul>
          ) : <p>No diagnostics. The current projection is valid.</p>}
        </div>
      ) : null}

      {view === 'diff' ? (
        <div className="studio-workspace-panel studio-diff-panel">
          <h2>{normalizationReview ? `${normalizationReview.document}.yaml normalization review` : `Unapplied ${active}.yaml changes`}</h2>
          {normalizationReview ? (
            <>
              <p>{normalizationReview.reason}</p>
              <div className="studio-diff-lines" aria-label="Normalization diff">
                {normalizationReview.diff.beforeLines.map((line, index) => <code className="removed" key={`removed-${index}`}>-{line}</code>)}
                {normalizationReview.diff.afterLines.map((line, index) => <code className="added" key={`added-${index}`}>+{line}</code>)}
              </div>
              <div className="studio-diff-actions">
                <button onClick={onCancelNormalization} type="button">Cancel</button>
                <button onClick={onConfirmNormalization} type="button">Confirm normalization</button>
              </div>
            </>
          ) : draft !== source ? (
            <div className="studio-diff-lines" aria-label="Unapplied source diff">
              <span>Starting at line {diff.startLine}</span>
              {diff.removed.map((line, index) => <code className="removed" key={`removed-${index}`}>-{line}</code>)}
              {diff.added.map((line, index) => <code className="added" key={`added-${index}`}>+{line}</code>)}
            </div>
          ) : <p>No unapplied source changes.</p>}
        </div>
      ) : null}

      {view === 'history' ? (
        <div className="studio-workspace-panel studio-history-panel">
          <h2>History</h2>
          {history.length ? (
            <ol>
              {history.map((entry) => (
                <li data-state={entry.state} key={`${entry.state}-${entry.id}`}>
                  <strong>{entry.summary}</strong>
                  <span>{entry.documents.map((document) => `${document}.yaml`).join(', ') || 'Selection only'}</span>
                  <time dateTime={entry.committedAt}>{entry.state === 'undo' ? 'Applied' : 'Undone'}</time>
                </li>
              ))}
            </ol>
          ) : <p>No committed changes yet.</p>}
        </div>
      ) : null}
    </section>
  );
}
