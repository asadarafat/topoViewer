## 1. Audit Reproduction

- [x] 1.1 Capture desktop, narrow, and stacked harness screenshots
- [x] 1.2 Identify clipped Inspect rows
- [x] 1.3 Identify hidden default-width mode tab
- [x] 1.4 Identify stacked-layout panel collapse
- [x] 1.5 Record Monaco overflow as intentional editor-internal scroll

## 2. Inspect Layout Fix

- [ ] 2.1 Redesign label/data rows to fit key/value controls and actions
- [ ] 2.2 Redesign style rows with primary key/value row and secondary action row
- [ ] 2.3 Ensure provenance chips and Reset/Remove controls remain visible
- [ ] 2.4 Ensure controls truncate internally instead of overflowing the rail

## 3. Mode Tabs And Responsive Layout

- [ ] 3.1 Tune default desktop tab sizing so all primary modes are visible
- [ ] 3.2 Preserve tab scroll only for genuinely narrow rail widths
- [ ] 3.3 Fix stacked workspace layout so active panel content is visible before the canvas
- [ ] 3.4 Give YAML and Attention panels usable stacked heights

## 4. Editor And Diagnostic Regression

- [ ] 4.1 Keep copy button pinned to the editor top-right corner
- [ ] 4.2 Keep editor top padding so copy does not overlap first meaningful YAML line
- [ ] 4.3 Keep Monaco markers and line highlights for diagnostics

## 5. Tests

- [ ] 5.1 Add Playwright layout helper that ignores Monaco internal overflow
- [ ] 5.2 Add desktop rail test for visible Build/Inspect/YAML/Attention/Layers tabs
- [ ] 5.3 Add Inspect row no-clipping coverage at default rail width
- [ ] 5.4 Add Inspect row no-clipping coverage at minimum rail width
- [ ] 5.5 Add stacked viewport coverage for Inspect, YAML, and Attention active panels
- [ ] 5.6 Preserve copy-button and diagnostic-marker regression tests

## 6. Validation

- [ ] 6.1 Run `npm --workspace vscode-topoviewer run build`
- [ ] 6.2 Run `npm --workspace vscode-topoviewer run test:vscode-harness`
- [ ] 6.3 Run `git diff --check`
