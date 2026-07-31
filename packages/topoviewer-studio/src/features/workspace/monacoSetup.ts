import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import 'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution';
import 'monaco-editor/esm/vs/editor/contrib/hover/browser/hoverContribution';
import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController';
import 'monaco-editor/esm/vs/editor/contrib/suggest/browser/suggestController';
import { studioColors, type StudioColorScheme } from '../../ui/colorContract';

(
  globalThis as unknown as {
    MonacoEnvironment: { getWorker(): Worker };
  }
).MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  }
};

loader.config({ monaco });

function monacoTokenColor(value: string): string {
  return value.replace(/^#/, '');
}

function monacoUiColor(value: string): string {
  const rgba = value.match(
    /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d*\.?\d+)\s*\)$/
  );
  if (!rgba) return value;
  return `#${rgba
    .slice(1, 4)
    .map((channel) => Number(channel).toString(16).padStart(2, '0'))
    .join('')}${Math.round(Number(rgba[4]) * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

function studioMonacoColors(scheme: StudioColorScheme) {
  return {
    'editor.background': scheme.background.paper,
    'editor.foreground': scheme.text.primary,
    'editor.selectionBackground': monacoUiColor(scheme.action.selected),
    'editor.inactiveSelectionBackground': monacoUiColor(scheme.action.hover),
    'editor.lineHighlightBackground': scheme.background.default,
    'editor.lineHighlightBorder': scheme.background.default,
    'editorCursor.foreground': scheme.primary.main,
    'editorError.foreground': scheme.error.main,
    'editorGutter.background': scheme.background.paper,
    'editorHoverWidget.background': scheme.background.paper,
    'editorHoverWidget.border': scheme.divider,
    'editorIndentGuide.activeBackground1': scheme.text.secondary,
    'editorIndentGuide.background1': scheme.divider,
    'editorInfo.foreground': scheme.info.main,
    'editorLineNumber.activeForeground': scheme.text.secondary,
    'editorLineNumber.foreground': scheme.text.disabled,
    'editorStickyScroll.background': scheme.background.paper,
    'editorSuggestWidget.background': scheme.background.paper,
    'editorSuggestWidget.border': scheme.divider,
    'editorWarning.foreground': scheme.warning.main,
    'editorWhitespace.foreground': scheme.divider,
    'editorWidget.background': scheme.background.paper,
    'editorWidget.border': scheme.divider
  };
}

function yamlTokenRules(
  token: string,
  foreground: string,
  fontStyle?: string
): monaco.editor.ITokenThemeRule[] {
  const style = {
    foreground: monacoTokenColor(foreground),
    ...(fontStyle ? { fontStyle } : {})
  };
  return [
    { token, ...style },
    { token: `${token}.yaml`, ...style }
  ];
}

function studioMonacoRules(
  scheme: StudioColorScheme,
  strongAccent: string
): monaco.editor.ITokenThemeRule[] {
  return [
    { token: '', foreground: monacoTokenColor(scheme.text.primary) },
    ...yamlTokenRules('comment', scheme.text.secondary, 'italic'),
    ...yamlTokenRules('delimiter', scheme.text.secondary),
    ...yamlTokenRules('delimiter.bracket', scheme.text.secondary),
    ...yamlTokenRules('delimiter.comma', scheme.text.secondary),
    ...yamlTokenRules('delimiter.square', scheme.text.secondary),
    ...yamlTokenRules('keyword', strongAccent),
    ...yamlTokenRules('meta.directive', strongAccent),
    ...yamlTokenRules('metatag', strongAccent),
    ...yamlTokenRules('namespace', scheme.warning.main),
    ...yamlTokenRules('number', scheme.warning.main),
    ...yamlTokenRules('number.date', scheme.warning.main),
    ...yamlTokenRules('number.float', scheme.warning.main),
    ...yamlTokenRules('number.hex', scheme.warning.main),
    ...yamlTokenRules('number.infinity', scheme.warning.main),
    ...yamlTokenRules('number.nan', scheme.warning.main),
    ...yamlTokenRules('number.octal', scheme.warning.main),
    ...yamlTokenRules('operators', scheme.text.secondary),
    ...yamlTokenRules('operators.directivesEnd', scheme.text.secondary),
    ...yamlTokenRules('operators.documentEnd', scheme.text.secondary),
    ...yamlTokenRules('string', scheme.success.main),
    ...yamlTokenRules('string.escape', scheme.primary.main),
    ...yamlTokenRules('string.escape.invalid', scheme.error.main),
    ...yamlTokenRules('string.invalid', scheme.error.main),
    ...yamlTokenRules('tag', strongAccent),
    ...yamlTokenRules('type', scheme.primary.main),
    ...yamlTokenRules('white', scheme.text.primary)
  ];
}

monaco.editor.defineTheme('topoviewer-studio-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: studioMonacoRules(studioColors.dark, studioColors.dark.primary.light),
  colors: studioMonacoColors(studioColors.dark)
});

monaco.editor.defineTheme('topoviewer-studio-light', {
  base: 'vs',
  inherit: true,
  rules: studioMonacoRules(studioColors.light, studioColors.light.primary.dark),
  colors: studioMonacoColors(studioColors.light)
});
