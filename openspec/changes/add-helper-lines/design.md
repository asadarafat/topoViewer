## Source Study Summary

The official React Flow helper-lines example describes the target behavior:
visual alignment guides appear while dragging nodes, snapping helps precise
positioning, and the guides remain accurate when the viewport is zoomed or
panned.

The checked-in plan should stay product-owned. The implementation pattern is:

- compute top, center, bottom, left, center, and right positions from measured
  React Flow node dimensions;
- compare the dragged object against visible peer nodes;
- expose horizontal and vertical guide positions plus optional midpoint guide
  positions;
- return a candidate snapped position from the geometry function;
- store helper-line state in a hook and throttle visual updates with
  `requestAnimationFrame`;
- render helper lines as an absolutely positioned SVG overlay transformed from
  flow coordinates into screen coordinates using React Flow viewport state;
- clear guide state on drag stop.

Important design constraint: do not create a half-contract where geometry
returns a snapped position but the drag integration ignores it. If `snap` is
enabled, snapping must be visibly applied during drag and reflected in final
position persistence.

## Current TopoViewer State

TopoViewer already has the integration points needed for helper lines:

- `TopoViewer` owns `nodes`, `edges`, `onNodesChange`, `onNodeDragStop`, and
  `nodesDraggable`;
- `onNodePositionChange` reports committed runtime node positions to hosts;
- `applyTopoNodeChanges` already handles region drag deltas and rebuilds region
  hulls;
- Grafana passes `nodesDraggable` and `onNodePositionChange` through the core
  `TopoViewer` component;
- labels and endpoint labels already have their own collision workstream, so
  helper lines should not become a label layout feature.

The feature should therefore live near the React Flow interaction layer, not in
the compiler, YAML model, or stylesheet compiler.

## Runtime Contract

Add a core API prop:

```ts
export interface TopoViewerHelperLinesOptions {
  enabled?: boolean;
  snap?: boolean;
  threshold?: number;
  showMidpoints?: boolean;
  candidateLimit?: number;
}
```

Add this optional prop to `TopoViewerProps`:

```ts
helperLines?: boolean | TopoViewerHelperLinesOptions;
```

Normalization:

- `false` or omitted means disabled;
- `true` means `{ enabled: true, snap: true }`;
- object form defaults `enabled` to true when the object is present;
- default `threshold` should be small, likely 5 flow-coordinate pixels;
- `candidateLimit` should prevent large-graph drag stalls.

This prop is runtime-only. It must not be added to `TopoDocument`, topology
schema, stylesheet schema, mapper schema, generated fixture YAML, or mounted
bundle discovery.

## Geometry Model

Implement a pure helper-line geometry module before renderer integration.

Inputs:

- dragged object id;
- dragged object position;
- dragged object measured or compiled width and height;
- visible candidate object boxes;
- threshold;
- midpoint setting;
- candidate limit.

Candidate boxes should come from current React Flow nodes after layer,
attention, collapsed-group, and show-region visibility has already been
resolved. Hidden nodes and the dragged object must be excluded.

Initial alignment candidates:

- left edge;
- horizontal center;
- right edge;
- top edge;
- vertical center;
- bottom edge.

Optional midpoint candidates:

- midpoint between two candidate object centers on the x-axis;
- midpoint between two candidate object centers on the y-axis.

Midpoint search is potentially `O(n^2)`, so it must be disabled above the
candidate limit or implemented with an explicit cap. Edge/center alignment
should remain `O(n)`.

## Snapping Model

The implementation must distinguish guide rendering from snapping.

Guide rendering:

- computes line positions from current drag geometry;
- renders visual guides only;
- never persists anything by itself.

Snapping:

- is controlled by the helper-lines option;
- applies candidate snapped position during drag so the object visibly lands on
  the guide;
- ensures `onNodePositionChange` receives the snapped position when the host
  listens for drag commits;
- must not fight React Flow's internal drag state or cause position jitter.

The implementation should prefer transforming pending `NodeChange` position
changes before they are applied, rather than performing unrelated state writes
from an overlay component.

## Object Scope

The feature should align visible draggable React Flow nodes that represent
TopoViewer objects:

- graph nodes;
- aggregate nodes;
- regions when regions are shown and draggable;
- diagram shapes;
- callouts.

The feature should exclude:

- pin nodes;
- hidden nodes;
- collapsed child nodes that are not rendered;
- non-draggable objects;
- nodes outside the current rendered React Flow surface.

Region dragging is a special case because moving a region also moves its
members. Snapping a region must apply to the region hull position and let the
existing region-drag translation path move members coherently.

## Overlay Rendering

Render helper lines inside the React Flow surface as an overlay that:

- uses flow coordinates transformed by current viewport `x`, `y`, and `zoom`;
- remains correct after pan and zoom;
- has `pointer-events: none`;
- clears immediately when drag ends or dragging is cancelled;
- uses CSS variables or internal theme defaults rather than hard-coded colors;
- stays visually above the canvas content but below menus, dialogs, and control
  buttons.

The overlay should not be included in SVG/PNG exports unless an explicit future
export option is added.

## Surface Defaults

Core React API:

- disabled unless the host opts in.

Browser harness:

- recommended enabled by default for manual authoring if it does not degrade
  large fixtures;
- must expose an obvious toggle if default-on creates noise.

Grafana:

- recommended optional panel setting;
- default can remain off to avoid surprising operators;
- if enabled, it applies only to runtime drag overrides and never writes mounted
  bundle YAML.

Docs examples:

- show helper lines in the browser harness or a focused interaction example;
- document that helper lines are runtime/editor interaction, not topology
  syntax.

## Risks

- Applying snapped positions during drag can fight React Flow's internal drag
  loop if implemented through unrelated `setNodes` calls.
- Region drag snapping can create member movement errors if snapping bypasses
  `applyTopoNodeChanges`.
- Large graphs can become sluggish if midpoint alignment scans too many pairs.
- Helper lines can become visually noisy if enabled in read-only examples or
  Grafana dashboards by default.
- Tests can miss viewport errors unless Playwright captures both normal zoom
  and zoomed/panned states.

## Design Decisions

- Helper lines are runtime interaction state, not YAML.
- Geometry is implemented as a pure, unit-tested module first.
- Snapping is a real contract, not just a returned value ignored by the drag
  wrapper.
- Midpoint guides are optional and capped.
- The first implementation should not attempt smart distribution, magnetic
  spacing grids, or full alignment panels.
