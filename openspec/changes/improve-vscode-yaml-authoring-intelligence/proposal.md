## Why

TopoViewer authoring should keep a clear boundary:

- topology YAML describes objects, relationships, labels, data, layers,
  positions, regions, paths, and attention;
- stylesheet YAML describes visual presentation.

The Inspect panel is useful for object semantics, relationship editing, and
selection-driven operations. It is not a good place for broad visual styling:
style rows add UI complexity, duplicate what YAML already expresses well, and
make users wonder whether style belongs in topology YAML or stylesheet YAML.

The better workflow is to make the YAML editor smarter. Users should be able to
author topology and stylesheet YAML directly while receiving context-aware key,
value, selector, and snippet suggestions derived from TopoViewer's schema,
style metadata, and the currently loaded document.

The authoring experience should feel closer to a network CLI than a blank text
editor. Users should not need to memorize every style key before they can style
an object. When they are inside `style:`, the harness should make the valid
next keys and values discoverable through explicit help and completion
affordances, similar to CLI-style context help.

This change supersedes `openspec/changes/use-stylesheet-for-harness-style-edits`.
The harness no longer needs a form-based style editor that writes stylesheet
rules; stylesheet authoring should happen directly in YAML with editor
assistance.

## What Changes

- Remove primary visual style editing from the Inspect panel.
- Keep Inspect focused on object semantics: identity, display name, layers,
  labels, data, positions, relationships, path sequences, delete, and presets.
- Add Monaco YAML intelligence for topology and stylesheet editing:
  - key suggestions;
  - enum/value suggestions;
  - object ID, layer ID, label/data key, and selector suggestions;
  - snippets for common nodes, links, paths, regions, attention, and stylesheet
    rules;
  - hover/help text where metadata is available.
- Add a visible style authoring entry point:
  - from a selected object, offer `Create style rule` / `Style in YAML`;
  - insert a stylesheet rule with a selector derived from the selection;
  - move focus to the inserted `style:` block;
  - surface grouped style suggestions without requiring prior key knowledge.
- Add CLI-like discovery inside the YAML panel:
  - `Ctrl+Space` opens context suggestions;
  - `?` or an equivalent visible help action shows valid keys/values for the
    current cursor context;
  - grouped suggestions explain what each style key affects.
- Keep diagnostics and line markers tied to schema and semantic validation.

## Capabilities

### New Capabilities

- `vscode-yaml-authoring-intelligence`: schema-derived Monaco assistance for
  authoring TopoViewer topology and stylesheet YAML.
- `vscode-yaml-style-rule-discovery`: selected-object workflow and CLI-like
  help for creating stylesheet rules without memorizing style keys.
- `vscode-inspect-semantic-editor`: simplified Inspect panel focused on
  topology semantics instead of visual style authoring.

## Impact

- `packages/vscode-topoviewer/src/webview/WebviewApp.tsx` removes Inspect style
  rows and registers Monaco completion/hover providers.
- `packages/vscode-topoviewer/src/shared/*` may expose YAML intelligence helpers
  reusable by the future VS Code extension.
- `packages/vscode-topoviewer/tests/harness.spec.ts` covers suggestions,
  snippets, diagnostics, and simplified Inspect behavior.
- Style metadata should eventually come from TopoViewer core so docs, schema,
  harness, and VS Code share one source of truth.

## Non-Goals

- Adding cloud or external AI completion.
- Replacing Monaco with another editor.
- Removing stylesheet YAML.
- Removing renderer support for inline object `style`; legacy documents remain
  valid, but the harness no longer promotes inline style editing.
