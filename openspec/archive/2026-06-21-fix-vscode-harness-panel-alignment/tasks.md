## 1. Audit Reproduction

- [x] 1.1 Capture desktop, narrow, and stacked harness screenshots
- [x] 1.2 Identify clipped Inspect rows
- [x] 1.3 Identify hidden default-width mode tab
- [x] 1.4 Identify stacked-layout panel collapse
- [x] 1.5 Record Monaco overflow as intentional editor-internal scroll

## 2. Inspect Layout Fix

- [x] 2.1 Redesign label/data rows to keep key/value controls and actions on one row
- [x] 2.2 Redesign style rows with key/value/reset/remove on one row
- [x] 2.3 Ensure Reset/Remove controls remain visible
- [x] 2.4 Ensure controls truncate internally instead of overflowing the rail

## 3. Mode Tabs And Responsive Layout

- [x] 3.1 Tune default desktop tab sizing so all primary modes are visible
- [x] 3.2 Preserve tab scroll only for genuinely narrow rail widths
- [x] 3.3 Fix stacked workspace layout so active panel content is visible before the canvas
- [x] 3.4 Give YAML and Attention panels usable stacked heights

## 4. Editor And Diagnostic Regression

- [x] 4.1 Keep copy button pinned to the editor top-right corner
- [x] 4.2 Keep editor top padding so copy does not overlap first meaningful YAML line
- [x] 4.3 Keep Monaco markers and line highlights for diagnostics

## 5. Tests

- [x] 5.1 Add Playwright layout helper that ignores Monaco internal overflow
- [x] 5.2 Add desktop rail test for visible Build/Inspect/YAML/Attention/Layers tabs
- [x] 5.3 Add Inspect row no-clipping coverage at default rail width
- [x] 5.4 Add Inspect row no-clipping coverage at minimum rail width
- [x] 5.5 Add stacked viewport coverage for Inspect, YAML, and Attention active panels
- [x] 5.6 Preserve copy-button and diagnostic-marker regression tests

## 6. Validation

- [x] 6.1 Run `npm --workspace vscode-topoviewer run build`
- [x] 6.2 Run `npm --workspace vscode-topoviewer run test:vscode-harness`
- [x] 6.3 Run `git diff --check`
