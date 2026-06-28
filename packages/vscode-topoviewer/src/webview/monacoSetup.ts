import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';

globalThis.MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  }
};

loader.config({ monaco });
