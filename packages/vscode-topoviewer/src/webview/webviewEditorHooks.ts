import { useCallback, useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { TopoDocument } from 'topoviewer';
import type { TopoViewerWebviewHost, ValidationResult, WebviewDiagnostic, WebviewState } from '../shared/types';
import { clampLine, editorDocumentForTab, type HarnessMode } from './webviewAppSupport';
import { styleMetadataForYamlIntelligence } from './webviewStyleMetadata';
import {
  monacoSuggestionKind,
  shouldOpenYamlHelp,
  yamlAuthoringHover,
  yamlAuthoringSuggestions,
  type PendingYamlFocus,
  type YamlAuthoringRequest
} from './webviewYamlAuthoring';

interface DraftValidationOptions {
  draftDirty: boolean;
  draftStylesheetText: string;
  draftTopologyText: string;
  host: TopoViewerWebviewHost;
  setDraftValidation: Dispatch<SetStateAction<ValidationResult>>;
  state?: WebviewState;
  validation: ValidationResult;
}

interface MonacoDiagnosticsOptions {
  activeDiagnostics: WebviewDiagnostic[];
  diagnosticDecorationsRef: MutableRefObject<any>;
  editorRef: MutableRefObject<any>;
  editorValue: string;
  monacoRef: MutableRefObject<any>;
  tab: number;
}

interface PendingYamlFocusOptions {
  editorReady: boolean;
  editorRef: MutableRefObject<any>;
  editorValue: string;
  mode: HarnessMode;
  pendingYamlFocus?: PendingYamlFocus;
  setPendingYamlFocus: Dispatch<SetStateAction<PendingYamlFocus | undefined>>;
  tab: number;
}

interface YamlIntelligenceOptions {
  hostKind: TopoViewerWebviewHost['kind'];
  validationLayers: ValidationResult['layers'];
  visibleDocument?: TopoDocument;
}

interface MonacoProviderOptions {
  editorReady: boolean;
  monacoRef: MutableRefObject<any>;
  tab: number;
  validationLayers: ValidationResult['layers'];
  visibleDocument?: TopoDocument;
}

interface YamlEditorMountOptions {
  diagnosticDecorationsRef: MutableRefObject<any>;
  editorContextRef: MutableRefObject<{
    layers: ValidationResult['layers'];
    tab: number;
    visibleDocument?: TopoDocument;
  }>;
  editorHelpDisposableRef: MutableRefObject<any>;
  editorRef: MutableRefObject<any>;
  flash: (message: string) => void;
  hostKind: TopoViewerWebviewHost['kind'];
  monacoRef: MutableRefObject<any>;
  setEditorReady: Dispatch<SetStateAction<boolean>>;
  setMode: Dispatch<SetStateAction<HarnessMode>>;
  setYamlAssistEmptyMessage: Dispatch<SetStateAction<string | undefined>>;
  updateEditorDiagnostics: () => void;
}

interface BrowserHarnessEditorBridge {
  focusAt(lineNumber: number, column: number): void;
  getValue(): string;
  setValue(text: string): void;
  suggestionVisible(): boolean;
  typeText(text: string): void;
}

interface BrowserHarnessWindow {
  monaco?: unknown;
  __topoviewerHarnessEditor?: BrowserHarnessEditorBridge;
}

export function useDraftValidation({
  draftDirty,
  draftStylesheetText,
  draftTopologyText,
  host,
  setDraftValidation,
  state,
  validation
}: DraftValidationOptions) {
  useEffect(() => {
    let mounted = true;
    async function validateDraft() {
      if (!state) {
        setDraftValidation({ diagnostics: [], layers: [] });
        return;
      }
      if (!draftDirty) {
        setDraftValidation(validation);
        return;
      }
      try {
        const result = await host.validate({
          ...state,
          topologyText: draftTopologyText,
          stylesheetText: draftStylesheetText
        });
        if (mounted) setDraftValidation(result);
      } catch (error) {
        if (!mounted) return;
        setDraftValidation({
          diagnostics: [{
            severity: 'error',
            source: 'host',
            code: 'draft-validation-failed',
            message: error instanceof Error ? error.message : String(error)
          }],
          layers: []
        });
      }
    }
    validateDraft();
    return () => {
      mounted = false;
    };
  }, [draftDirty, draftStylesheetText, draftTopologyText, host, setDraftValidation, state, validation]);
}

export function useMonacoDiagnostics({
  activeDiagnostics,
  diagnosticDecorationsRef,
  editorRef,
  editorValue,
  monacoRef,
  tab
}: MonacoDiagnosticsOptions) {
  const updateEditorDiagnostics = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor?.getModel?.();
    if (!editor || !monaco || !model) return;

    const targetDocument = editorDocumentForTab(tab);
    const diagnostics = activeDiagnostics.filter((diagnostic) => (
      diagnostic.document ? diagnostic.document === targetDocument : targetDocument === 'topology'
    ));
    const lineCount = Math.max(1, model.getLineCount?.() || 1);
    const markers = diagnostics.map((diagnostic) => {
      const lineNumber = clampLine(diagnostic.line, lineCount);
      const maxColumn = Math.max(2, model.getLineMaxColumn?.(lineNumber) || 2);
      const startColumn = Math.min(maxColumn - 1, Math.max(1, Math.round(diagnostic.column || 1)));
      return {
        severity: diagnostic.severity === 'error'
          ? monaco.MarkerSeverity.Error
          : monaco.MarkerSeverity.Warning,
        message: diagnostic.message,
        source: 'TopoViewer',
        startLineNumber: lineNumber,
        startColumn,
        endLineNumber: lineNumber,
        endColumn: maxColumn
      };
    });

    monaco.editor.setModelMarkers(model, 'topoviewer', markers);
    const decorations = diagnostics.map((diagnostic) => {
      const lineNumber = clampLine(diagnostic.line, lineCount);
      return {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          className: diagnostic.severity === 'error'
            ? 'topoviewer-vscode-diagnostic-line topoviewer-vscode-diagnostic-line--error'
            : 'topoviewer-vscode-diagnostic-line topoviewer-vscode-diagnostic-line--warning',
          glyphMarginClassName: diagnostic.severity === 'error'
            ? 'topoviewer-vscode-diagnostic-glyph topoviewer-vscode-diagnostic-glyph--error'
            : 'topoviewer-vscode-diagnostic-glyph topoviewer-vscode-diagnostic-glyph--warning',
          isWholeLine: true,
          overviewRuler: {
            color: diagnostic.severity === 'error' ? '#d32f2f' : '#ed6c02',
            position: monaco.editor.OverviewRulerLane.Right
          }
        }
      };
    });
    if (diagnosticDecorationsRef.current?.set) {
      diagnosticDecorationsRef.current.set(decorations);
    } else if (editor.createDecorationsCollection) {
      diagnosticDecorationsRef.current = editor.createDecorationsCollection(decorations);
    }
  }, [activeDiagnostics, diagnosticDecorationsRef, editorRef, monacoRef, tab]);

  useEffect(() => {
    updateEditorDiagnostics();
  }, [editorValue, updateEditorDiagnostics]);

  return updateEditorDiagnostics;
}

export function usePendingYamlFocus({
  editorReady,
  editorRef,
  editorValue,
  mode,
  pendingYamlFocus,
  setPendingYamlFocus,
  tab
}: PendingYamlFocusOptions) {
  useEffect(() => {
    const editor = editorRef.current;
    if (!pendingYamlFocus || !editorReady || !editor || mode !== 'yaml' || pendingYamlFocus.document !== editorDocumentForTab(tab)) return;
    const frame = window.requestAnimationFrame(() => {
      editor.focus();
      editor.setPosition({ lineNumber: pendingYamlFocus.lineNumber, column: pendingYamlFocus.column });
      editor.revealLineInCenterIfOutsideViewport?.(pendingYamlFocus.lineNumber);
      if (pendingYamlFocus.showSuggestions) {
        editor.trigger('topoviewer', 'editor.action.triggerSuggest', {});
      }
      setPendingYamlFocus(undefined);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [editorReady, editorRef, editorValue, mode, pendingYamlFocus, setPendingYamlFocus, tab]);
}

export function useBrowserYamlIntelligence({ hostKind, validationLayers, visibleDocument }: YamlIntelligenceOptions) {
  useEffect(() => {
    if (hostKind !== 'browser') return undefined;
    const helper = {
      completions: (request: Omit<YamlAuthoringRequest, 'layers' | 'topoDocument'>) => yamlAuthoringSuggestions({
        ...request,
        layers: validationLayers,
        topoDocument: visibleDocument
      }),
      hover: (request: Omit<YamlAuthoringRequest, 'layers' | 'topoDocument'>) => yamlAuthoringHover({
        ...request,
        layers: validationLayers,
        topoDocument: visibleDocument
      }),
      shouldOpenHelp: (request: Omit<YamlAuthoringRequest, 'layers' | 'topoDocument'>) => shouldOpenYamlHelp({
        ...request,
        layers: validationLayers,
        topoDocument: visibleDocument
      }),
      styleMetadata: styleMetadataForYamlIntelligence
    };
    (window as unknown as { __topoviewerYamlIntelligence?: typeof helper }).__topoviewerYamlIntelligence = helper;
    return () => {
      delete (window as unknown as { __topoviewerYamlIntelligence?: typeof helper }).__topoviewerYamlIntelligence;
    };
  }, [hostKind, validationLayers, visibleDocument]);
}

export function useYamlMonacoProviders({ editorReady, monacoRef, tab, validationLayers, visibleDocument }: MonacoProviderOptions) {
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!editorReady || !monaco) return undefined;
    const completionProvider = monaco.languages.registerCompletionItemProvider('yaml', {
      triggerCharacters: [':', '-', '"', "'"],
      provideCompletionItems(model: any, position: any) {
        const word = model.getWordUntilPosition(position);
        const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);
        const suggestions = yamlAuthoringSuggestions({
          column: position.column,
          document: editorDocumentForTab(tab),
          layers: validationLayers,
          lineNumber: position.lineNumber,
          text: model.getValue(),
          topoDocument: visibleDocument
        }).map((suggestion) => ({
          detail: suggestion.detail,
          documentation: suggestion.documentation,
          insertText: suggestion.insertText || suggestion.label,
          insertTextRules: suggestion.isSnippet
            ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
            : undefined,
          kind: monacoSuggestionKind(monaco, suggestion),
          label: suggestion.label,
          range
        }));
        return { suggestions };
      }
    });
    const hoverProvider = monaco.languages.registerHoverProvider('yaml', {
      provideHover(model: any, position: any) {
        const hover = yamlAuthoringHover({
          column: position.column,
          document: editorDocumentForTab(tab),
          layers: validationLayers,
          lineNumber: position.lineNumber,
          text: model.getValue(),
          topoDocument: visibleDocument
        });
        if (!hover) return undefined;
        const word = model.getWordAtPosition(position);
        const range = word
          ? new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn)
          : undefined;
        return {
          contents: [{ value: hover.contents }],
          range
        };
      }
    });
    return () => {
      completionProvider.dispose();
      hoverProvider.dispose();
    };
  }, [editorReady, monacoRef, tab, validationLayers, visibleDocument]);
}

export function useYamlEditorMount({
  diagnosticDecorationsRef,
  editorContextRef,
  editorHelpDisposableRef,
  editorRef,
  flash,
  hostKind,
  monacoRef,
  setEditorReady,
  setMode,
  setYamlAssistEmptyMessage,
  updateEditorDiagnostics
}: YamlEditorMountOptions) {
  const triggerYamlAssist = useCallback((editor: any) => {
    const position = editor.getPosition?.();
    const model = editor.getModel?.();
    const context = editorContextRef.current;
    const suggestions = yamlAuthoringSuggestions({
      column: position?.column || 1,
      document: editorDocumentForTab(context.tab),
      layers: context.layers,
      lineNumber: position?.lineNumber || 1,
      text: model?.getValue?.() || '',
      topoDocument: context.visibleDocument
    });
    if (!suggestions.length) {
      setYamlAssistEmptyMessage('No YAML suggestions are valid at the current cursor.');
      flash('No YAML suggestions for this cursor');
      return;
    }
    setYamlAssistEmptyMessage(undefined);
    editor.focus();
    editor.trigger('topoviewer', 'editor.action.triggerSuggest', {});
  }, [editorContextRef, flash, setYamlAssistEmptyMessage]);

  const showYamlSuggestions = useCallback(() => {
    setMode('yaml');
    window.requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      triggerYamlAssist(editor);
    });
  }, [editorRef, setMode, triggerYamlAssist]);

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    if (hostKind === 'browser') {
      const harnessWindow = window as unknown as BrowserHarnessWindow;
      harnessWindow.monaco = monaco;
      harnessWindow.__topoviewerHarnessEditor = {
        focusAt(lineNumber: number, column: number) {
          editor.focus();
          editor.setPosition({ lineNumber, column });
          editor.revealLineInCenterIfOutsideViewport?.(lineNumber);
        },
        getValue() {
          return editor.getValue();
        },
        setValue(text: string) {
          editor.setValue(text);
        },
        suggestionVisible() {
          return !!document.querySelector('.suggest-widget.visible');
        },
        typeText(text: string) {
          editor.focus();
          editor.trigger('topoviewer-test', 'type', { text });
        }
      };
    }
    diagnosticDecorationsRef.current = editor.createDecorationsCollection?.([]);
    editorHelpDisposableRef.current?.dispose?.();
    editorHelpDisposableRef.current = editor.onKeyDown((event: any) => {
      if ((event.ctrlKey || event.metaKey) && event.browserEvent?.code === 'Space') {
        event.preventDefault();
        event.stopPropagation();
        window.requestAnimationFrame(() => triggerYamlAssist(editor));
        return;
      }
      if (event.browserEvent?.key !== '?') return;
      const position = editor.getPosition?.();
      const model = editor.getModel?.();
      const context = editorContextRef.current;
      if (!shouldOpenYamlHelp({
        column: position?.column || 1,
        document: editorDocumentForTab(context.tab),
        layers: context.layers,
        lineNumber: position?.lineNumber || 1,
        text: model?.getValue?.() || '',
        topoDocument: context.visibleDocument
      })) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      window.requestAnimationFrame(() => triggerYamlAssist(editor));
    });
    setEditorReady(true);
    updateEditorDiagnostics();
  }, [
    diagnosticDecorationsRef,
    editorContextRef,
    editorHelpDisposableRef,
    editorRef,
    hostKind,
    monacoRef,
    setEditorReady,
    setYamlAssistEmptyMessage,
    triggerYamlAssist,
    updateEditorDiagnostics
  ]);

  return {
    handleEditorMount,
    showYamlSuggestions
  };
}
