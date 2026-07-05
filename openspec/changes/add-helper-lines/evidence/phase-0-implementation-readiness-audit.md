# Phase 0 Implementation Readiness Audit

Status: complete for spec hardening. No helper-lines implementation has
started.

## Weaknesses Found

### Live snap was underspecified

The original plan said snap must visibly apply during drag, but it did not say
where the snap should be applied. That was risky because an implementation could
draw guide lines while ignoring the snapped position.

Fix: the design now requires transforming pending React Flow `NodeChange`
position changes before they are passed into `applyTopoNodeChanges`.

### Drag-stop callbacks could report stale positions

`TopoViewer` currently reports drag-stop position from the event node. If snap
is applied through state transformation, the event node may not be the safest
source of truth.

Fix: the design now requires tracking snapped drag-session positions and
reporting the final position from current snapped state rather than blindly
from the drag-stop event node.

### Parent-relative coordinates were not addressed

React Flow can represent child or contained nodes with positions relative to a
parent. Helper-line geometry must not compare those coordinates directly
against absolute nodes.

Fix: the design and spec now require absolute flow-coordinate boxes, preferably
from React Flow internals, with safe fallbacks only when the node is not
parented.

### Candidate eligibility was too blunt

The original spec excluded non-draggable objects as candidates. That would make
it impossible to align a draggable node against a fixed visible object.

Fix: the spec now separates drag initiation from candidate eligibility.
Dragged objects must be draggable, but visible fixed objects can be alignment
candidates.

### Midpoint performance defaults were vague

The original plan mentioned midpoint caps but did not define defaults.

Fix: the runtime contract now defines `candidateLimit`, `midpointCandidateLimit`,
and default midpoint behavior.

### Grafana baseline could block core work

The original baseline phase could be interpreted as requiring Grafana before
core helper-line implementation.

Fix: Grafana baseline is now explicitly non-blocking unless the lab is already
available. Grafana integration remains a later surface phase.

## Implementability Verdict

After this hardening, the change is implementable as a core TopoViewer feature
without YAML schema churn:

1. collect absolute rendered boxes;
2. compute pure guide and snap geometry;
3. transform pending position changes;
4. render a viewport-correct overlay;
5. report snapped final positions to hosts;
6. optionally expose harness and Grafana toggles.

The riskiest part remains React Flow drag-state integration. That is now called
out directly and covered by required contract tests before renderer work.
