## 1. Layout

- [x] 1.1 Replace fixed grid sizing with a resizable split workspace
- [x] 1.2 Default the split to one-third left column and two-thirds canvas
- [x] 1.3 Add pointer drag support for the vertical divider
- [x] 1.4 Add keyboard support and accessible labeling for the divider
- [x] 1.5 Add reset-to-default behavior for the divider
- [x] 1.6 Persist and restore split width in local storage
- [x] 1.7 Add responsive fallback for narrow viewports

## 2. Authoring Modes And Selection

- [x] 2.1 Add compact grouped tabs for Build, Inspect, YAML, Attention, and Layers
- [x] 2.2 Make active mode visually clear and keyboard reachable
- [x] 2.3 Add single-select from canvas objects
- [x] 2.4 Add modifier-assisted multi-select
- [x] 2.5 Add blank-canvas selection reset
- [x] 2.6 Add selected object count/kind summary in the left rail
- [x] 2.7 Repair or clear stale selection after YAML changes
- [x] 2.8 Keep selection as UI state until an explicit YAML mutation occurs
- [x] 2.9 Keep Diagnostics as an always-visible status strip between mode tabs and the active pane

## 3. Build Panel

- [x] 3.1 Add a `Build` section in the left authoring column
- [x] 3.2 Model palette groups for Primitives and Presets
- [x] 3.3 Add compact object buttons with labels and tooltips; defer icon-forward palette polish
- [x] 3.4 Implement click-to-insert for Node, Router, Service, Controller, External, Link, Path, Region, and Callout objects
- [x] 3.5 Generate stable unique IDs for inserted objects
- [x] 3.6 Assign inserted objects to a valid visible layer
- [x] 3.7 Use selected nodes for link/path endpoints where possible
- [x] 3.8 Use selected nodes as inserted region members where possible
- [x] 3.9 Use selected objects as callout targets where possible
- [x] 3.10 Update Topology YAML through structured document mutation
- [x] 3.11 Revalidate and rerender after insertion
- [x] 3.12 Let users save inspected objects as reusable Presets
- [x] 3.13 Insert user-saved Presets through structured Topology YAML mutation

## 4. Inspector

- [x] 4.1 Add a compact Inspector section for selected objects
- [x] 4.2 Show selected object kind and ID
- [x] 4.3 Add editable controls for name, layers, labels, data, and supported position fields
- [x] 4.4 Add object-aware style selection with applicable style keys per object kind
- [x] 4.5 Keep empty selection compact and leave deeper mixed-selection property editing as future polish
- [x] 4.6 Update Topology YAML through structured document mutation
- [x] 4.7 Add delete selected object action
- [x] 4.8 Revalidate and rerender after Inspector edits
- [x] 4.9 Save the configured inspected object as a reusable Preset

## 5. Attention Editor

- [x] 5.1 Add a compact Attention editor section in the left authoring column
- [x] 5.2 Add Attention summary state for focus, interaction, aggregation, and link grouping
- [x] 5.3 Add Focus controls for node IDs, link IDs, path IDs, region IDs, labels, data, and presentation mode
- [x] 5.4 Add "Use selection" behavior for node/link/path/region focus fields
- [x] 5.5 Add Interaction controls for `attention.interactive` and `attention.clickMode`
- [x] 5.6 Add Aggregation controls for region groups and `expandOnClick`
- [x] 5.7 Add Link grouping controls for threshold-based grouping
- [x] 5.8 Update `attention` through structured Topology YAML mutation
- [x] 5.9 Disable Attention mutation controls when the document cannot be validated
- [x] 5.10 Revalidate and rerender after Attention edits

## 6. YAML Mutation And Undo

- [x] 6.1 Add shared structured YAML mutation helpers
- [x] 6.2 Reject structured mutations when current Topology YAML cannot be parsed
- [x] 6.3 Serialize deterministic YAML after UI-driven mutations
- [x] 6.4 Preserve current Monaco content when mutation fails
- [x] 6.5 Preserve Monaco content on failed structured mutations; leave precise scroll/cursor restoration as future polish
- [x] 6.6 Add undo transactions for Insert, Inspector, Attention, deletion, and layer assignment changes
- [x] 6.7 Add redo support for UI-driven YAML mutations
- [x] 6.8 Keep left/canvas split reset separate from YAML undo/redo

## 7. Harness Fixtures

- [x] 7.1 Add an Insert workflow fixture
- [x] 7.2 Add an Attention workflow fixture with path focus, region aggregation, and link grouping
- [x] 7.3 Add an Inspector workflow fixture with labels, data, layers, and positions
- [x] 7.4 Add a dense links fixture for grouping controls
- [x] 7.5 Ensure each fixture layer has at least one object
- [x] 7.6 Keep workflow fixtures small enough for default viewport review

## 8. Screen Real Estate

- [x] 8.1 Convert left-column panels to compact sections without nested card styling
- [x] 8.2 Make the active Build, Inspect, YAML, Attention, or Layers pane use the available rail height
- [x] 8.3 Show successful diagnostics as a compact always-visible status row
- [x] 8.4 Keep layers compact, scrollable, and count-backed
- [x] 8.5 Keep Attention summarized by default with progressive disclosure for details
- [x] 8.6 Keep Inspector hidden or summarized when nothing is selected
- [x] 8.7 Keep preview actions compact in the canvas top-left
- [x] 8.8 Verify no text/control overlap at desktop and narrow widths
- [x] 8.9 Keep the fixture selector visually separated from the mode tabs
- [x] 8.10 Remove redundant active-pane headings when the selected tab already names the mode
- [x] 8.11 Show selection status only when there is an active canvas selection
- [x] 8.12 Keep first controls in scrollable panes from clipping their floating labels
- [x] 8.13 Add concise what/how/impact helper text to Attention inputs

## 9. Tests And Validation

- [x] 9.1 Add Playwright coverage for default split ratio
- [x] 9.2 Add Playwright coverage for pointer resize and reset
- [x] 9.3 Add Playwright coverage for keyboard resize
- [x] 9.4 Add Playwright coverage for split persistence on reload
- [x] 9.5 Add Playwright coverage for authoring mode switching
- [x] 9.6 Add Playwright coverage for canvas single-select, multi-select, and clear selection
- [x] 9.7 Add Playwright coverage for Build panel primitive and preset groups
- [x] 9.8 Add Playwright coverage for inserting a node and seeing it in YAML plus canvas
- [x] 9.9 Add Playwright coverage that inserted objects receive valid layers
- [x] 9.10 Add Playwright coverage for Inspector edits updating YAML and canvas
- [x] 9.11 Add Playwright coverage for delete plus undo/redo
- [x] 9.12 Add Playwright coverage for mutation failure preserving invalid YAML text
- [x] 9.13 Add Playwright coverage for Attention YAML updates; leave deeper path-focus visual assertions as future polish
- [x] 9.14 Add Playwright coverage for Attention use-selection behavior
- [x] 9.15 Add Playwright coverage for Attention interactive YAML mutation; leave click-reset visual assertion as future polish
- [x] 9.16 Add Playwright coverage for Attention aggregation and link grouping controls
- [x] 9.17 Add Playwright coverage for workflow fixtures and non-empty fixture layers
- [x] 9.18 Run `npm --workspace vscode-topoviewer run build`
- [x] 9.19 Run `npm run test:vscode-harness`
- [x] 9.20 Capture desktop and narrow screenshots for visual review
- [x] 9.21 Add Playwright coverage for grouped mode tabs and persistent Diagnostics status
- [x] 9.22 Add Playwright coverage for Attention helper text and progressive sections
- [x] 9.23 Add Playwright coverage for compact Fixture and Attention field sizing consistency
