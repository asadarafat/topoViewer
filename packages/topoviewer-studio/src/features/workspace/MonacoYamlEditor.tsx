import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { OnMount } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import Box from '@mui/material/Box';
import type { StudioDiagnostic, StudioDocumentKind } from '../../contracts/project';
import type { StudioSourceRange } from '../../session';
import { useStudioColorScheme } from '../../ui/StudioThemeProvider';
import { studioMonacoSpacing } from './monacoSpacing';
import { studioMonacoTypography } from './monacoTypography';
import type { StudioYamlAssist } from './yamlAssist';
import './monacoSetup';

interface MonacoYamlEditorProps {
  assist: StudioYamlAssist;
  diagnostics: StudioDiagnostic[];
  document: StudioDocumentKind;
  navigation?: MonacoYamlNavigationRequest;
  onChange(value: string): void;
  modelPath?: string;
  onCursorOffset?(offset: number): void;
  value: string;
}

export interface MonacoYamlNavigationRequest {
  focus?: boolean;
  id: string | number;
  range: StudioSourceRange;
  selectRange?: boolean;
}

export interface MonacoYamlEditorHandle {
  find(): void;
  focus(): void;
  showContextHelp(): void;
}

type MonacoApi = Parameters<OnMount>[1];
type MonacoEditor = Parameters<OnMount>[0];

function markerSeverity(monaco: MonacoApi, severity: StudioDiagnostic['severity']) {
  if (severity === 'error') return monaco.MarkerSeverity.Error;
  if (severity === 'warning') return monaco.MarkerSeverity.Warning;
  return monaco.MarkerSeverity.Info;
}

const MonacoYamlEditor = forwardRef<MonacoYamlEditorHandle, MonacoYamlEditorProps>(function MonacoYamlEditor({ assist, diagnostics, document, navigation, modelPath, onChange, onCursorOffset = () => {}, value }, ref) {
  const { effectiveMode } = useStudioColorScheme();
  const editorRef = useRef<MonacoEditor>();
  const monacoRef = useRef<MonacoApi>();
  const assistRef = useRef(assist);
  const cursorRef = useRef(onCursorOffset);
  const disposablesRef = useRef<Array<{ dispose(): void }>>([]);
  const lastNavigationIdRef = useRef<string | number>();
  const programmaticNavigationRef = useRef(false);
  assistRef.current = assist;
  cursorRef.current = onCursorOffset;

  useImperativeHandle(
    ref,
    () => ({
      find() {
        editorRef.current?.focus();
        editorRef.current?.trigger('topoviewer-studio', 'actions.find', undefined);
      },
      focus() {
        editorRef.current?.focus();
      },
      showContextHelp() {
        const editor = editorRef.current;
        const model = editor?.getModel();
        const position = editor?.getPosition();
        if (!editor || !model || !position) return;
        editor.focus();
        const word = model.getWordAtPosition(position);
        const documented =
          word &&
          assistRef.current.hover(document, word.word, {
            offset: model.getOffsetAt(position),
            text: model.getValue()
          });
        editor.trigger('topoviewer-studio-context-help', documented ? 'editor.action.showHover' : 'editor.action.triggerSuggest', undefined);
      }
    }),
    [document]
  );

  function applyNavigation(editor: MonacoEditor, request?: MonacoYamlNavigationRequest) {
    if (!request || lastNavigationIdRef.current === request.id) return;
    lastNavigationIdRef.current = request.id;
    programmaticNavigationRef.current = true;
    if (request.focus) editor.focus();
    if (request.selectRange) {
      editor.setSelection({
        endColumn: request.range.endColumn,
        endLineNumber: request.range.endLine,
        startColumn: request.range.column,
        startLineNumber: request.range.line
      });
    } else {
      editor.setPosition({
        column: request.range.column,
        lineNumber: request.range.line
      });
    }
    editor.revealLineInCenterIfOutsideViewport(request.range.line);
    queueMicrotask(() => {
      programmaticNavigationRef.current = false;
    });
  }

  function updateMarkers() {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel();
    if (!editor || !monaco || !model) return;
    const lineCount = Math.max(1, model.getLineCount());
    monaco.editor.setModelMarkers(
      model,
      'topoviewer-studio',
      diagnostics.map((diagnostic) => {
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
      })
    );
  }

  useEffect(updateMarkers, [diagnostics, value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    applyNavigation(editor, navigation);
  }, [navigation]);

  useEffect(
    () => () => {
      disposablesRef.current.forEach((disposable) => disposable.dispose());
      disposablesRef.current = [];
    },
    []
  );

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    applyNavigation(editor, navigation);
    const completion = monaco.languages.registerCompletionItemProvider('yaml', {
      triggerCharacters: [':', '-', '"', "'"],
      provideCompletionItems(model, position) {
        if (model !== editor.getModel()) return { suggestions: [] };
        const word = model.getWordUntilPosition(position);
        const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
        return {
          suggestions: assistRef.current
            .completions(document, {
              offset: model.getOffsetAt(position),
              text: model.getValue()
            })
            .map((entry) => ({
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
        if (model !== editor.getModel()) return undefined;
        const word = model.getWordAtPosition(position);
        if (!word) return undefined;
        const result = assistRef.current.hover(document, word.word, {
          offset: model.getOffsetAt(position),
          text: model.getValue()
        });
        return result
          ? {
              contents: [{ value: result.contents }],
              range: new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn)
            }
          : undefined;
      }
    });
    const cursor = editor.onDidChangeCursorPosition(({ position }) => {
      if (programmaticNavigationRef.current) return;
      cursorRef.current(editor.getModel()?.getOffsetAt(position) || 0);
    });
    let applyingQuestionMark = false;
    const questionMark = editor.onDidChangeModelContent(() => {
      if (applyingQuestionMark) return;
      const model = editor.getModel();
      const position = editor.getPosition();
      if (!model || !position) return;
      const cursorOffset = model.getOffsetAt(position);
      const range = assistRef.current.questionMark(document, {
        offset: cursorOffset,
        text: model.getValue()
      });
      if (!range) return;
      applyingQuestionMark = true;
      editor.executeEdits('topoviewer-studio-question-mark', [
        {
          range: new monaco.Range(model.getPositionAt(range.startOffset).lineNumber, model.getPositionAt(range.startOffset).column, model.getPositionAt(range.endOffset).lineNumber, model.getPositionAt(range.endOffset).column),
          text: ''
        }
      ]);
      applyingQuestionMark = false;
      editor.trigger('topoviewer-studio-question-mark', 'editor.action.triggerSuggest', undefined);
    });
    disposablesRef.current.push(completion, hover, cursor, questionMark);
    updateMarkers();
  };

  return (
    <Box className="studio-monaco-editor" data-testid="studio-yaml-editor">
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
          ...studioMonacoTypography,
          glyphMargin: true,
          minimap: { enabled: false },
          padding: { top: studioMonacoSpacing.paddingTop },
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: 'off'
        }}
        path={modelPath || `inmemory://topoviewer-studio/${document}.yaml`}
        saveViewState
        theme={`topoviewer-studio-${effectiveMode}`}
        value={value}
      />
    </Box>
  );
});

export default MonacoYamlEditor;
