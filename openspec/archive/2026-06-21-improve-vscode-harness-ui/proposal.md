## Why

The VS Code browser harness is now functional, but it still feels like a
generic split preview. A useful TopoViewer authoring surface should make the
diagram canvas dominant, keep YAML editing close by, and let users insert
topology objects without remembering YAML structure from scratch.

The next improvement should make the harness feel closer to a real diagram
authoring tool while preserving TopoViewer's declarative YAML model.

## What Changes

Improve the VS Code browser harness UI:

- make the canvas the primary surface with a default one-third authoring column
  and two-thirds canvas split;
- add an accessible vertical divider so users can resize the authoring column
  and canvas dynamically;
- add a left-column `Insert` panel with a PowerPoint-like object palette, using
  TopoViewer "objects" rather than "shapes";
- support inserting common TopoViewer objects into the topology YAML and the
  rendered canvas;
- add a compact Attention editor for declaratively configuring focus,
  interaction, aggregation, and link-grouping behavior;
- add a clear canvas selection model that can drive Insert, Inspector, and
  Attention workflows;
- add a compact Inspector for editing selected object properties;
- add undo/redo around topology and attention mutations so authoring is safe;
- improve screen real estate through compact panel behavior, collapsible
  sections, lower-noise diagnostics, and focused canvas controls;
- add Playwright coverage for layout, resizing, object insertion, attention
  editing, persistence, and responsive behavior.

## Accepted Implementation Shape

The completed first pass intentionally favors a compact utility-panel feel over
an IDE-like all-tools-open surface:

- the browser harness uses a one-third/two-thirds resizable authoring/canvas
  split with a narrow-viewport fallback;
- the left rail uses grouped Material UI tabs for Build, Inspect, YAML,
  Attention, and Layers;
- Diagnostics stays visible between the tabs and active pane instead of being a
  separate tab;
- Fixture, Inspect, and Attention controls use compact Material UI sizing;
- Build defaults to generic TopoViewer primitives plus topology-oriented
  presets;
- Inspect edits selected object properties, applicable inline style keys, and
  reusable presets;
- Attention uses progressive disclosure with Object focus, Match by metadata,
  Click behavior, and Dense summaries sections;
- UI-driven authoring writes back to Topology YAML through structured mutation
  and undo/redo transactions.

## Capabilities

### New Capabilities

- `vscode-harness-ui`: resizable workspace layout, object insertion palette,
  Attention editor, selection, inspector, undo/redo, compact authoring panels,
  and browser-harness UX acceptance criteria.

## Impact

- `packages/vscode-topoviewer/src/webview/WebviewApp.tsx` will gain resizable
  layout state, object insertion controls, Attention controls, and revised panel
  structure.
- `packages/vscode-topoviewer/src/webview/webview.css` will define a denser
  authoring/canvas workspace with splitter behavior and responsive fallbacks.
- `packages/vscode-topoviewer/src/shared` may gain YAML mutation helpers for
  inserting objects, updating attention, editing selected object properties, and
  maintaining undoable structured document updates.
- `packages/vscode-topoviewer/tests/harness.spec.ts` will expand coverage for
  the new UX contract.

## Non-Goals

- Replacing Monaco as the source editor.
- Building a full visual editor with freeform drag-to-rewire semantics.
- Creating a second attention state model that diverges from Topology YAML.
- Implementing a full schema-aware language server.
- Publishing the VS Code extension or changing Marketplace release status.
- Changing the canonical TopoViewer YAML language.
- Finishing a polished icon-only Build gallery, drag-to-canvas insertion, or a
  full visual style form builder in this pass.
