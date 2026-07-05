## Why

TopoViewer already supports draggable nodes, draggable regions, runtime
position overrides in Grafana, and manual authoring in the browser harness.
What it does not have is a professional alignment aid while objects are being
dragged.

The current drag experience is freeform. That is tolerable for rough authoring,
but it is not good enough for polished topology diagrams where node rows,
columns, card nodes, regions, and operational layouts need to stay visually
intentional. Users currently have to eyeball alignment or manually edit
coordinates in YAML. That is slow and error-prone.

React Flow's helper-lines example defines the desired behavior: while dragging
nodes, alignment guides appear automatically and snapping keeps positions
precise even under viewport pan and zoom. TopoViewer should implement this from
its own interaction model: pure alignment geometry, measured node dimensions,
visible-node filtering, viewport-transformed SVG overlays,
`requestAnimationFrame` state updates, and drag-stop cleanup.

TopoViewer should add the same class of interaction, but with TopoViewer's own
contracts:

- topology YAML remains the source model;
- helper lines are runtime/editor UI, not topology/style YAML;
- snapping must not corrupt generated layouts or telemetry overlays;
- region dragging and member translation must stay coherent;
- Grafana runtime position overrides must remain runtime-only;
- large graphs must not become sluggish during drag.

## What Changes

Add an opt-in helper-lines interaction feature to the core `topoviewer`
package.

The public React API should expose a runtime-only prop:

```ts
type TopoViewerHelperLinesOptions = {
  enabled?: boolean;
  snap?: boolean;
  threshold?: number;
  showMidpoints?: boolean;
  candidateLimit?: number;
};

<TopoViewer
  document={document}
  nodesDraggable
  helperLines={{ enabled: true, snap: true }}
/>
```

The browser harness may enable helper lines by default for manual authoring.
Grafana may expose a panel option for local drag sessions, but the default must
remain non-destructive and compatible with current dashboards.

The feature must render temporary guide lines while a draggable object moves.
When snapping is enabled, the dragged object position must visibly snap during
the drag and the final `onNodePositionChange` event must report the snapped
position. When snapping is disabled, guide lines may render without changing
the drag position.

## Capabilities

### New Capabilities

- `helper-lines`: runtime alignment guides and optional snap behavior for
  draggable TopoViewer objects.

### Modified Capabilities

- `topoviewer-react-api`: adds a runtime-only helper-lines prop.
- `topoviewer-renderer`: renders viewport-correct helper-line overlays inside
  the React Flow surface.
- `topoviewer-interaction`: applies optional live snapping without breaking
  drag, selection, region translation, or position persistence.
- `topoviewer-harness`: exposes the authoring UX if enabled by default or
  through a user setting.
- `grafana-topoviewer-panel`: may expose helper lines for local runtime node
  drag without mutating mounted bundle YAML.
- `topoviewer-docs`: documents the feature as runtime/editor interaction, not a
  topology or stylesheet primitive.

## Backward Compatibility

This feature must be opt-in at the core API boundary. Existing diagrams,
dashboards, docs, screenshots, and exported renderings must not change unless a
host enables helper lines.

No existing YAML schema changes are required for topology or stylesheet files.
The feature is not stored in `topology.yaml`, `stylesheet.yaml`, or
`mapper.yaml`.

If helper lines are enabled but a surface disables dragging, no guide lines
should render and no diagnostics should be emitted.

## Non-Goals

- Adding helper-line configuration to topology or stylesheet YAML.
- Replacing layout engines such as `manual`, `force`, or `clos`.
- Persisting helper-line state.
- Changing authored coordinates unless the host already persists node drag
  positions.
- Making helper lines part of PNG/SVG export output.
- Supporting arbitrary magnetic constraints, smart distribution, or full
  auto-layout in the first implementation.
- Depending on example code as a runtime dependency.

## Implementation Discipline

Tasks are sequential and evidence-gated. Do not start a later phase until the
prior phase has its required evidence file checked in and reviewed.

Implementation must be test-first where feasible. The geometry engine must be
covered before renderer wiring. Visual evidence must be captured before the
feature is marked complete.
