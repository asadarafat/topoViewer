import { useEffect, useRef } from 'react';
import type { OnMount } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import type { StudioDiagnostic, StudioDocumentKind } from '../../contracts/project';
import type { StudioSourceRange } from '../../session';
import type { StudioYamlAssist } from './yamlAssist';
import './monacoSetup';

interface MonacoYamlEditorProps {
  assist: StudioYamlAssist;
  diagnostics: StudioDiagnostic[];
  document: StudioDocumentKind;
  focusRange?: StudioSourceRange;
  onChange(value: string): void;
  onCursorOffset(offset: number): void;
  value: string;
}

type MonacoApi = Parameters<OnMount>[1];
type MonacoEditor = Parameters<OnMount>[0];

function markerSeverity(monaco: MonacoApi, severity: StudioDiagnostic['severity']) {
  if (severity === 'error') return monaco.MarkerSeverity.Error;
  if (severity === 'warning') return monaco.MarkerSeverity.Warning;
  return monaco.MarkerSeverity.Info;
}

export default function MonacoYamlEditor({
  assist,
  diagnostics,
  document,
  focusRange,
  onChange,
  onCursorOffset,
  value
}: MonacoYamlEditorProps) {
  const editorRef = useRef<MonacoEditor>();
  const monacoRef = useRef<MonacoApi>();
  const assistRef = useRef(assist);
  const cursorRef = useRef(onCursorOffset);
  const disposablesRef = useRef<Array<{ dispose(): void }>>([]);
  assistRef.current = assist;
  cursorRef.current = onCursorOffset;

  function revealRange(editor: MonacoEditor, range: StudioSourceRange) {
    editor.focus();
    editor.setSelection({
      endColumn: range.endColumn,
      endLineNumber: range.endLine,
      startColumn: range.column,
      startLineNumber: range.line
    });
    editor.revealLineInCenterIfOutsideViewport(range.line);
  }

  function updateMarkers() {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!editor || !monaco || !model) return;
    const lineCount = Math.max(1, model.getLineCount());
    monaco.editor.setModelMarkers(model, 'topoviewer-studio', diagnostics.map((diagnostic) => {
      const line = Math.max(1, Math.min(lineCount, diagnostic.line || 1));
      const maxColumn = Math.max(2, model.getLineMaxColumn(line));
      const column = Math.max(1, Math.min(maxColumn - 1, diagnostic.column || 1));
      return {
        endColumn: Math.max(column + 1, Math.min(maxColumn, diagnostic.endColumn || maxColumn)),
        endLineNumber: Math.max(line, Math.min(lineCount, diagnostic.endLine || line)),
        message: diagnostic.message,
        severity: markerSeverity(monaco, diagnostic.severity),
        source: 'TopoViewer Studio',
        startColumn: column,
        startLineNumber: line
      };
    }));
  }

  useEffect(updateMarkers, [diagnostics, value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !focusRange) return;
    revealRange(editor, focusRange);
  }, [focusRange]);

  useEffect(() => () => {
    disposablesRef.current.forEach((disposable) => disposable.dispose());
    disposablesRef.current = [];
  }, []);

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    if (focusRange) revealRange(editor, focusRange);
    const completion = monaco.languages.registerCompletionItemProvider('yaml', {
      triggerCharacters: [':', '-', '"', "'"],
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position);
        const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
        return {
          suggestions: assistRef.current.completions(document).map((entry) => ({
            detail: entry.detail,
            documentation: entry.documentation,
            insertText: entry.insertText,
            kind: monaco.languages.CompletionItemKind.Property,
            label: entry.label,
            range
          }))
        };
      }
    });
    const hover = monaco.languages.registerHoverProvider('yaml', {
      provideHover(model, position) {
        const word = model.getWordAtPosition(position);
        if (!word) return undefined;
        const result = assistRef.current.hover(document, word.word);
        return result ? {
          contents: [{ value: result.contents }],
          range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn)
        } : undefined;
      }
    });
    const cursor = editor.onDidChangeCursorPosition(({ position }) => {
      cursorRef.current(editor.getModel()?.getOffsetAt(position) || 0);
    });
    disposablesRef.current.push(completion, hover, cursor);
    updateMarkers();
  };

  return (
    <div className="studio-monaco-editor" data-testid="studio-yaml-editor">
      <Editor
        height="100%"
        language="yaml"
        onChange={(next) => onChange(next || '')}
        onMount={onMount}
        options={{
          ariaLabel: `${document} YAML editor`,
          automaticLayout: true,
          editContext: false,
          fixedOverflowWidgets: true,
          fontSize: 12,
          glyphMargin: true,
          minimap: { enabled: false },
          padding: { top: 8 },
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: 'off'
        }}
        path={`inmemory://topoviewer-studio/${document}.yaml`}
        saveViewState
        theme="topoviewer-studio-dark"
        value={value}
      />
    </div>
  );
}
