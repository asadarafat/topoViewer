## Why

Browser harness node dragging can feel uneven when helper lines are enabled.
During a headless harness probe on a simple two-node manual-layout fixture, a
smooth 48-step pointer movement produced discontinuous node motion:

- maximum observed node step: 9 px while the pointer moved about 4.4 px;
- six sampled frames differed materially from the pointer delta;
- several consecutive samples held the node at the same screen position while
  the pointer kept moving, then jumped forward.

This matches the reported "jittery" or "jump around" drag experience. The
problem is not final position persistence; it is live drag feedback. The current
implementation computes helper-line guides and rewrites React Flow position
changes inside the high-frequency `onNodesChange` path. In the harness, helper
lines are enabled with snapping and midpoint guides:

```tsx
helperLines={{ enabled: true, snap: true, showMidpoints: true }}
```

That means small pointer movements can repeatedly enter, exit, or switch snap
candidates while the same state path also re-renders nodes, labels, helper
lines, and region-derived nodes. The result is visible drag discontinuity even
when the final YAML update is correct.

## What Changes

Stabilize live drag feedback for the browser harness and shared TopoViewer drag
path:

- add a reproducible drag-smoothness regression probe that samples node motion
  during pointer movement;
- separate guide rendering from live position snapping so pointer-following
  remains continuous by default;
- keep final committed positions stable and intentional, with optional snap at
  drag stop or a hysteresis-based live snap mode;
- throttle helper-line overlay updates with `requestAnimationFrame`;
- avoid broad React state churn while dragging by keeping transient helper-line
  state and drag-session data outside the main node array where possible;
- preserve region dragging, parented nodes, Grafana runtime positions, and
  existing YAML persistence behavior.

## Capabilities

### Modified Capabilities

- `helper-lines`: guide rendering remains available while dragging, but live
  snapping must not introduce visible jitter.
- `topoviewer-harness`: default authoring drag behavior must be smooth and
  measured by a drag-smoothness regression test.
- `topoviewer-interaction`: drag-stop persistence must report the same final
  position the user sees without fighting React Flow's internal drag state.
- `topoviewer-react-performance-surface`: drag interaction must avoid
  avoidable high-frequency React state churn.

## Backward Compatibility

No topology, stylesheet, mapper, or schema changes are required.

Existing hosts that enable `helperLines` must remain source-compatible. If a new
runtime option is needed, it should be additive and default to the smoother
behavior for the browser harness without changing public YAML semantics.

Existing tests that assert helper lines appear during drag and clear on drag
stop should continue to pass, but they must be supplemented with motion-quality
checks.

## Non-Goals

- Replacing React Flow's drag implementation.
- Adding helper-line configuration to YAML.
- Removing helper lines from the harness.
- Changing layout engines or automatic layout behavior.
- Solving every dense-graph performance problem outside drag feedback.

## Implementation Discipline

Tasks are sequential and evidence-gated. Do not implement a later phase until
the prior phase has measurable evidence in command output, generated reports, or
local artifacts.

Use browser-level evidence for this change. Unit tests can prove geometry
contracts, but the bug is visible in live drag feedback and must be covered by a
Playwright or equivalent browser probe.

Transient traces, videos, screenshots, and raw probe outputs belong under
ignored local artifact directories and must not be committed under this
OpenSpec change.
