## Why

TopoViewer Studio renders the full `attention` contract but currently offers no
discoverable visual workflow for authoring it. Authors must know the YAML shape
and edit it directly, which leaves focus, aggregation, and parallel-link
grouping behind a source-only path while comparable topology concepts are
available through guarded Studio controls.

## What Changes

- Add one explicit, collapsible Attention manager under Project Source's
  Topology Outline.
- Add common visual workflows for focus-by-ID from canvas selection,
  presentation and click modes, region or parent aggregation, and parallel-link
  grouping.
- Add a pure core authoring contract that applies bounded attention actions
  while preserving unrelated and advanced attention clauses.
- Keep `topology.yaml` authoritative, expose direct source navigation, and
  commit each visual action as one undoable Studio command.
- Disable source-mutating attention actions while topology source is invalid,
  without disabling disclosure, inspection, or source navigation.
- Add browser, accessibility, bundle, documentation, and core regression
  evidence for browser and Wails-hosted Studio parity.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `core-topology-experience`: Add a pure, additive attention-authoring reducer
  and summary contract owned by the core package.
- `studio-yaml-first-workbench`: Make Attention a discoverable visual
  authoring surface while retaining the shared YAML workspace for complete and
  advanced editing.
- `studio-direct-manipulation`: Require attention actions to use the canonical
  command/session boundary with deterministic undo, invalid-draft protection,
  and selection-aware behavior.

## Impact

- `packages/topoviewer`: additive authoring exports and focused unit tests; no
  topology schema or renderer behavior change.
- `packages/topoviewer-studio`: one lazy MUI attention feature, controller
  capability, Project Source integration, and Playwright coverage.
- `packages/topoviewer/content`: canonical Studio authoring and accessibility
  guidance, synchronized to generated documentation.
- Browser and Wails hosts continue to consume the same Studio application and
  typed host contract; no host-specific attention implementation is added.
- No external dependency, persistence migration, runtime service, or external
  repository assumption is introduced.
