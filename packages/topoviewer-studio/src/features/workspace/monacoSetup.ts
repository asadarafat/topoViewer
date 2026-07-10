import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
import 'monaco-editor/esm/vs/editor/contrib/hover/browser/hoverContribution';
import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController';

(globalThis as unknown as {
  MonacoEnvironment: { getWorker(): Worker };
}).MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  }
};

loader.config({ monaco });

monaco.editor.defineTheme('topoviewer-studio-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [],
  colors: {
    'editor.selectionBackground': '#000000',
    'editor.inactiveSelectionBackground': '#111820',
    'editor.selectionHighlightBackground': '#111820'
  }
});
