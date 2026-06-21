## Why

The VS Code browser harness has accumulated useful authoring controls, but the
left rail is starting to show layout debt. The audit found that the UI can look
misaligned or incomplete even though the underlying workflows work:

- Inspect style rows are too dense on desktop and can clip horizontally because
  `Style key`, `Style value`, provenance, reset, and remove actions compete on
  one row.
- The default desktop rail can hide the `Layers` tab behind tab scroll buttons,
  making the mode switcher feel unstable.
- In the stacked responsive layout, the tab strip can render without the active
  panel content before the canvas, so Inspect appears selected while the
  properties panel is not visible.
- Attention controls mostly render correctly, but Material UI fieldset/legend
  sizing should be covered by explicit no-clipping tests.
- Monaco has expected internal horizontal scrolling for YAML, so alignment tests
  should distinguish intentional editor scroll from panel overflow.

These are polish problems, but they matter because the harness is becoming the
authoring proof point for the future VS Code extension.

## What Changes

- Redesign Inspect row layout so dense rows wrap or stack predictably inside the
  rail.
- Ensure mode tabs fit or scroll consistently without hiding common modes at the
  default one-third rail width.
- Fix the responsive stacked layout so the active mode panel is visible before
  the canvas.
- Add panel overflow and clipping regression tests across desktop, minimum rail,
  and stacked viewports.
- Keep Monaco horizontal scrolling allowed while preventing outer panel overflow.
- Keep the copy button and diagnostic line marker behavior from regressing.

## Capabilities

### New Capabilities

- `vscode-harness-panel-alignment`: robust rail, panel, tab, and editor layout
  behavior for the VS Code browser harness across desktop and stacked
  responsive viewports.

## Impact

- `packages/vscode-topoviewer/src/webview/WebviewApp.tsx` may need small
  structural changes for Inspect rows and tab panels.
- `packages/vscode-topoviewer/src/webview/webview.css` will own the main layout
  fixes.
- `packages/vscode-topoviewer/tests/harness.spec.ts` will add layout regression
  coverage for the audited cases.

## Non-Goals

- Redesigning the whole harness visual language.
- Changing the canvas renderer.
- Replacing Monaco or changing YAML editing semantics.
- Implementing multi-select style editing.
