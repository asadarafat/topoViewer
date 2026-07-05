# Phase 0 Source Study

Status: complete for planning. No helper-lines implementation has started.

## Sources Inspected

- React Flow helper-lines example:
  https://reactflow.dev/examples/interaction/helper-lines
- Local TopoViewer drag integration audit:
  `packages/topoviewer/src/components/TopoViewer.tsx`
- Local TopoViewer region drag audit:
  `packages/topoviewer/src/components/regionDrag.ts`
- Local Grafana panel drag usage audit:
  `packages/grafana-topoviewer-panel/src/TopoViewerPanel.tsx`

## React Flow Behavior Contract

The official React Flow example describes alignment helper lines that appear
automatically while dragging nodes. It also calls out snapping and viewport
transform correctness during pan and zoom.

The page is a Pro example, so full source is not public from that page. It is
still useful as the official behavior reference.

## Implementation Planning Findings

The TopoViewer implementation should own the reusable geometry and state
pattern:

- Use a small default threshold, likely `5`.
- Compute node top, center, bottom, left, center, and right from measured React
  Flow dimensions, falling back to compiled TopoViewer dimensions.
- Exclude the dragged object and hidden objects from alignment candidates.
- Calculate horizontal and vertical guide lines.
- Optionally calculate midpoint guide lines between candidate object centers.
- Return both line positions and an optional snapped position.
- Throttle visual state updates through `requestAnimationFrame`.
- Clear line state on drag stop, cancelled drag, or unmount.

The overlay should be an absolute SVG inside the React Flow surface:

- read React Flow `transform`, width, and height from the active viewport;
- convert flow coordinates to screen coordinates using viewport transform;
- use `pointer-events: none`;
- draw normal and midpoint lines with distinct theme-safe styles.

The drag wrapper should wire helper lines into `onNodesChange` or the nearest
safe React Flow drag boundary:

- guide lines update during drag;
- guide lines clear on drag stop;
- snap mode must consume and apply the snapped position;
- guide-only mode must not mutate the dragged position.

## TopoViewer Current-State Findings

Relevant TopoViewer integration points:

- `packages/topoviewer/src/components/TopoViewer.tsx`
  - owns React Flow `nodes`, `edges`, `onNodesChange`, `onNodeDragStop`, and
    `nodesDraggable`;
  - reports committed drag positions through `onNodePositionChange`.
- `packages/topoviewer/src/components/regionDrag.ts`
  - detects region position deltas;
  - moves region member nodes;
  - rebuilds region hulls.
- `packages/grafana-topoviewer-panel/src/TopoViewerPanel.tsx`
  - passes `nodesDraggable` and `onNodePositionChange` to core `TopoViewer`;
  - persists dragged positions as Grafana runtime interaction state.

## Planning Decisions

- Helper lines belong in runtime interaction state, not topology/style/mapper
  YAML.
- The geometry engine should be pure and tested before React wiring.
- Snapping must be an explicit option.
- If snapping is enabled, TopoViewer must apply the snapped position during
  drag and commit the snapped position at drag stop.
- Midpoint guides need caps because pairwise midpoint scans can become
  expensive on dense graphs.
- Browser harness is the primary authoring surface.
- Grafana integration must remain runtime-only.
