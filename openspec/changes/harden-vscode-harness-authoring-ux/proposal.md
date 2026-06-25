# Harden VS Code Harness Authoring UX

## Why

The browser harness has become the practical authoring surface for TopoViewer
YAML, but several controls currently behave more like wiring placeholders than
production authoring features:

- `Export viewport` is visible in the canvas controls, but the browser harness
  only emits a mock event and the VS Code extension only shows an informational
  message.
- `Suggestions` opens Monaco completion at the current cursor, but it does not
  explain what it is trying to help with and often shows generic completions
  that do not match the YAML indentation or structural context.
- YAML completions are based on line heuristics rather than a schema-backed
  YAML context model, so nested contexts such as `labels`, `position`, and
  malformed indentation can receive unrelated suggestions.
- The editor intercepts `?` globally and uses `Space` as a completion trigger,
  making normal text entry brittle.
- YAML edits are applied to the preview as the user types, which makes the
  harness feel less like a controlled authoring workflow and more like a live
  parser that can enter unstable intermediate states.

The intended direction is a network-operator authoring experience inspired by
SR Linux CLI behavior:

- `?` shows context help for the current location;
- completion is explicit and indentation-aware;
- editing happens in a candidate/draft state;
- `Apply` validates and updates the rendered topology;
- feedback is durable and explains what happened.

## What Changes

Create a production-grade authoring contract for the VS Code webview and browser
harness:

- define the export button as a real viewport export action with browser and VS
  Code behavior;
- replace the generic `Suggestions` button with a context-aware YAML assist
  command;
- implement a schema-backed YAML context engine that understands indentation,
  list entries, mappings, scalar values, and document type;
- make keyboard behavior predictable: `Space` inserts a space, `?` opens help
  only in command/help contexts, and literal text remains typeable;
- introduce a candidate/apply model for YAML editing so the canvas changes only
  after explicit apply;
- make diagnostics and authoring feedback durable, clickable, and line-aware;
- add regression coverage for all current failure modes and representative
  schema locations.

## Capabilities

### New Capabilities

- `harness-export-contract`: real PNG/SVG export behavior for browser harness
  and VS Code webview.
- `harness-yaml-assist`: context-aware YAML help and completion inspired by
  network CLI `?` and completion behavior.
- `harness-yaml-context-engine`: shared context analysis for topology and
  stylesheet YAML based on schema, indentation, and parsed YAML structure.
- `harness-keyboard-contract`: predictable editor keyboard behavior for Space,
  `?`, Tab, Enter, Escape, and Ctrl/Cmd+Space.
- `harness-candidate-apply`: explicit YAML draft/apply workflow that prevents
  half-written YAML from destabilizing the live viewport.
- `harness-authoring-diagnostics`: durable status and diagnostics UI with
  click-to-line behavior.

## Impact

- `packages/vscode-topoviewer/src/webview/WebviewApp.tsx`
- `packages/vscode-topoviewer/src/webview/AuthoringRail.tsx`
- `packages/vscode-topoviewer/src/webview/WebviewChrome.tsx`
- `packages/vscode-topoviewer/src/webview/host.ts`
- `packages/vscode-topoviewer/src/webview/webviewYamlAuthoring.ts`
- `packages/vscode-topoviewer/src/webview/webview.css`
- `packages/vscode-topoviewer/src/extension/extension.ts`
- `packages/vscode-topoviewer/tests/harness.spec.ts`
- `packages/vscode-topoviewer/tests/harness-helpers.ts`
- `packages/topoviewer/schemas/*.schema.json`
- `packages/topoviewer/src/core/export.ts`

## Non-Goals

- Do not replace Monaco with a different editor.
- Do not turn the harness into a full IDE.
- Do not remove direct YAML editing.
- Do not make the renderer depend on VS Code APIs.
- Do not implement a full SR Linux CLI clone; use its help/completion pattern as
  an interaction reference only.

