## Why

The VS Code harness can already insert generic `Connection` and `Path`
objects, but the current workflow depends too much on implicit selection. If
the user does not preselect the right nodes in the right order, insertion either
fails or creates a default relationship that cannot be shaped through the UI.

A diagram authoring tool needs relationship authoring to be explicit:

- connections need clear source and target node controls;
- paths need clear source, target, and transit-node ordering controls;
- existing connections and paths need editable endpoints;
- moving nodes on the canvas should persist their positions into Topology YAML
  instead of remaining a transient preview change.
- Inspect needs to stay fully synchronized with YAML and canvas state, including
  inherited stylesheet values, inline overrides, labels, and data.

## What Changes

Improve the VS Code harness authoring UX for relationships and node placement:

- add a relationship authoring flow for `Connection` / `graph.links`;
- add a path authoring flow for `Path` / `graph.paths`;
- let users select source, target, and transit nodes through compact UI controls;
- let current canvas selection prefill relationship controls without being the
  only way to author a relationship;
- add Inspector controls for editing existing link endpoints and path sequences;
- persist node position changes from canvas drag into canonical Topology YAML;
- make relationship and position mutations undoable and redoable;
- hydrate Labels and Data as editable Inspect rows instead of add-only fields;
- show style provenance so users know whether a value comes from inline YAML or
  a stylesheet rule;
- apply only changed style rows so inherited stylesheet values are not
  materialized into topology YAML unnecessarily;
- support resetting inline style overrides back to stylesheet/default behavior;
- group style keys by purpose to make the Inspect style picker easier to scan;
- add Playwright coverage for source/target selection, path transit ordering,
  editing existing relationships, node drag persistence, and Inspect sync.

## Capabilities

### New Capabilities

- `vscode-harness-relationship-authoring`: explicit link/path endpoint editing,
  path transit-node ordering, and node-position persistence for the VS Code
  browser harness.

## Impact

- `packages/vscode-topoviewer/src/webview/WebviewApp.tsx` will gain compact
  relationship controls in Build and Inspector modes and handle canvas
  node-position changes, hydrated labels/data rows, style provenance chips, and
  changed-only style application.
- `packages/vscode-topoviewer/src/shared/topologyMutations.ts` will gain
  structured mutations for creating/editing links, creating/editing paths, and
  updating node positions plus replace semantics for labels/data/style editor
  state.
- `packages/vscode-topoviewer/tests/harness.spec.ts` will add workflow coverage
  for explicit relationship authoring and node drag persistence.
- `packages/vscode-topoviewer/fixtures/**` may gain a small fixture focused on
  relationship editing if existing fixtures are too crowded.

## Non-Goals

- Implementing drag-to-draw links directly on canvas in this pass.
- Adding freeform edge routing handles or manual bezier control points.
- Replacing Topology YAML as the source of truth for graph relationships.
- Persisting viewport pan/zoom as topology state.
- Creating a full visual diff/merge model for simultaneous YAML and canvas
  edits.
- Implementing bulk multi-select style editing in this pass.
- Promoting harness style metadata into a public renderer metadata registry in
  this pass.
