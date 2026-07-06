## Current-State Findings

The browser harness passes `helperLines={{ enabled: true, snap: true,
showMidpoints: true }}` into `TopoViewer`.

`TopoViewer.tsx` handles every React Flow node change through one synchronous
path:

1. find position changes in `onNodesChange`;
2. run `applyHelperLineSnapToChanges`;
3. synchronously update helper-line React state;
4. rewrite the active `NodeChange.position` when snap is active;
5. call `setNodes` with `applyTopoNodeChanges`;
6. rebuild region nodes and labels from the updated node array.

The helper-line geometry itself is deterministic, but live snapping creates
discontinuous screen motion. The harness probe showed that while the pointer
moved about 4.4 px per sample, the node sometimes moved 8-9 px, and sometimes
did not move at all for one or more samples before jumping forward.

Likely contributors:

- Snap threshold crossings cause the rendered node to jump from pointer-follow
  position to candidate-aligned position.
- Candidate switching can happen while the pointer moves through dense alignment
  zones, especially with midpoint guides enabled.
- Helper-line overlay state updates are synchronous, not `requestAnimationFrame`
  scheduled as the original helper-lines plan intended.
- The same drag path updates nodes, labels, helper lines, and region hulls on
  every pointer movement, increasing the chance that React Flow receives
  controlled positions one frame behind pointer state.
- Current tests assert final position and helper-line visibility, but do not
  assert frame-to-frame motion continuity.

## Target Interaction Model

Dragging should have two separate responsibilities:

- visual drag feedback follows the pointer smoothly;
- alignment helpers communicate possible snap targets and commit a stable final
  position.

The default harness interaction should favor smooth pointer-following. Snapping
may be applied at drag stop or through a hysteresis model that does not switch
snap candidates rapidly.

## Proposed Runtime Shape

Keep `helperLines` source-compatible. If an option is needed, add it as an
internal/runtime-only extension:

```ts
type TopoViewerHelperLinesOptions = {
  enabled?: boolean;
  snap?: boolean;
  snapMode?: 'live' | 'commit';
  snapHysteresis?: number;
  threshold?: number;
  showMidpoints?: boolean;
  candidateLimit?: number;
  midpointCandidateLimit?: number;
};
```

Recommended defaults:

- core `true` remains compatible with current behavior unless changing it is
  explicitly accepted;
- browser harness uses `{ enabled: true, snap: true, snapMode: 'commit',
  showMidpoints: true }`;
- if live snap is retained anywhere, it must use candidate hysteresis and avoid
  switching snap targets until the pointer exits a larger release threshold.

## Implementation Approach

### 1. Add Motion Probe First

Add a focused Playwright probe that creates a small manual-layout fixture,
drags a node toward a peer in many small steps, samples node bounding boxes
between steps, and fails on discontinuity.

The probe should record:

- pointer delta per step;
- node screen delta per step;
- max absolute error between pointer delta and node delta;
- count of zero-motion frames while pointer motion continues;
- helper-line visibility during the same drag.

The first version should reproduce the current jitter before code changes.

### 2. Throttle Helper-Line State

Change `useHelperLineState` so visual overlay updates are scheduled with
`requestAnimationFrame`, cancel pending frames on cleanup, and avoid setting the
same line state repeatedly.

This should reduce overlay-render churn without changing drag semantics.

### 3. Split Live Position From Snap Candidate

For smooth mode, do not rewrite `NodeChange.position` during drag. Instead:

- compute helper lines from the current proposed pointer-follow position;
- store the best snap candidate in a drag-session ref;
- render helper lines from the candidate state;
- on drag stop, choose the final persisted position from the latest stable snap
  candidate if it is still valid, otherwise use current React Flow position.

This keeps the node under the pointer while still producing aligned committed
YAML.

### 4. Stabilize Optional Live Snap

If live snap remains supported:

- retain the active snap candidate while the pointer stays within a release
  threshold larger than the acquire threshold;
- do not switch candidates within one axis unless the new candidate is
  materially better;
- prefer edge/center candidates over midpoint candidates when distances tie;
- make midpoint live snap opt-in or commit-only in the harness.

### 5. Preserve Existing Contracts

The fix must preserve:

- helper-line visibility and cleanup;
- final `onNodePositionChange` callback;
- region drag member translation;
- parented node absolute-coordinate handling;
- Grafana runtime interaction state;
- docs and static embed behavior.

## Trade-Offs

Commit-time snapping is smoother but means the node may visibly settle into
alignment on mouse-up. That is preferable to visible jitter during movement for
authoring. If this settle is too surprising, use a small animated final settle
or live snap with hysteresis.

Disabling midpoint live snap in the harness reduces magnetic behavior but keeps
the most common left/center/right/top/middle/bottom guides stable.

More browser tests add runtime, but this should be a focused fixture and can be
run in the existing harness Playwright suite.

## Open Questions

- Should `snapMode` be public API or an internal harness-specific normalization
  behavior?
- Should final commit snapping update the YAML to the snap target even if the
  node did not visibly sit on that exact target during movement?
- What threshold should define an unacceptable discontinuity across CI runners?
  Initial local probe suggests using a tolerance relative to pointer step size
  rather than a fixed pixel-only limit.
