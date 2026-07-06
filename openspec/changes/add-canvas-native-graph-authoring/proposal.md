# Add Canvas-Native Graph Authoring

## Why

The browser Harness authoring workflow is now stable enough to trust for
button-driven CRUD, Inspector edits, YAML apply/revert, drag persistence, helper
lines, and undo/redo. That is necessary, but it is not yet the authoring
experience users expect from a serious graph editor.

The current workflow still asks users to think in panels:

- click an insert button;
- inspect generated YAML;
- select objects;
- fill Inspector fields;
- create links through comboboxes;
- use YAML for anything beyond the structured controls.

That is usable for engineering validation, but it is not a full graph authoring
surface. A new adopter comparing the Harness to draw.io, PowerPoint, or a
modern diagram editor will expect direct manipulation:

- choose a tool;
- click the canvas to place an object;
- drag from one node to another to create a link;
- resize and move objects with handles;
- marquee-select multiple objects;
- align, distribute, duplicate, copy, paste, and delete;
- use keyboard shortcuts without guessing;
- keep the generated model clean and reviewable.

TopoViewer should not become a generic whiteboard. The goal is a topology-aware
diagram editor whose canvas interactions write valid `topology.yaml`,
`stylesheet.yaml`, and optional `mapper.yaml`.

## What Changes

Add a canvas-native graph authoring mode to the browser Harness and VS Code
webview:

- a compact tool palette for select, pan, node placement, link drawing, path
  authoring, region creation, callout creation, shape/text creation, and
  connector/annotation modes;
- pointer-first creation for topology objects at the canvas location the user
  clicks or drags;
- drag-to-connect link creation using node handles/endpoints with a live preview;
- direct geometry editing for nodes, shapes, callouts, and regions where the
  underlying object supports position and size;
- marquee selection, multi-select transforms, align/distribute, nudge,
  duplicate, copy/paste, delete, undo, and redo;
- snap grid, helper lines, and collision-aware label feedback as authoring
  aids;
- keyboard and context-menu contracts that make common editing paths discoverable;
- a CRUD permutation test matrix that proves create/read/update/delete works
  for every supported object family and input path;
- docs that teach the authoring loop as a UI workflow first, then explain the
  YAML that is produced.

## Capabilities

### New Capabilities

- `canvas-native-authoring`: direct manipulation graph authoring in the Harness
  and VS Code webview.
- `authoring-tool-palette`: explicit canvas tools with predictable cursor,
  keyboard, and pointer behavior.
- `authoring-drag-connect`: drag-to-connect topology links with handle-aware
  endpoint selection.
- `authoring-transform-handles`: direct resize/move editing for supported
  topology and diagram objects.
- `authoring-clipboard`: copy, paste, duplicate, delete, and undo/redo for
  selected topology objects.
- `authoring-alignment-actions`: align, distribute, nudge, and snap operations
  that mutate YAML deterministically.
- `authoring-crud-matrix`: regression coverage for object/action/input
  permutations.

### Modified Capabilities

- `topoviewer-harness`: the Harness becomes a canvas-first authoring surface,
  while preserving YAML as an editable source of truth.
- `topoviewer-yaml-authoring`: direct UI edits and YAML draft/apply must not
  corrupt each other.
- `topoviewer-interaction`: pointer behavior must distinguish pan, select,
  drag, resize, connect, and create modes without jitter.
- `topoviewer-docs`: public Harness docs must explain the UI authoring loop,
  not only the YAML editor and Inspector.

## Backward Compatibility

Existing YAML, examples, renderer behavior, and button/Inspector workflows must
remain valid.

The current structured Build/Inspect/YAML/Attention/Layers rail can be
reorganized, but its supported behavior must not disappear until equivalent
canvas-native behavior and tests exist.

No hidden diagram state is allowed. Every canvas action must produce durable,
reviewable YAML changes or a draft that can be applied/reverted.

## Non-Goals

- Do not clone every draw.io or PowerPoint feature.
- Do not introduce arbitrary freehand drawing, arbitrary HTML widgets, or
  non-topology canvas objects as first-class production primitives.
- Do not make the renderer depend on the Harness.
- Do not bypass schema validation to make the UI feel easier.
- Do not store positions, links, selections, or styles in local-only state that
  cannot be reconstructed from YAML.
- Do not make Graph CRUD depend on generated screenshots or binary artifacts.
- Do not remove direct YAML editing.

## Implementation Discipline

This is a staged product feature. Tasks are intentionally sequential and
evidence-gated.

Before each phase is checked:

- the relevant UI behavior must be exercised by Playwright or unit tests;
- the resulting YAML must be asserted, not only the rendered canvas;
- undo/redo and reload persistence must be covered for mutation phases;
- failing or flaky behavior must be fixed before moving to the next phase;
- transient screenshots, videos, traces, and timing probes must stay under
  ignored local artifact directories, not inside this OpenSpec change.

