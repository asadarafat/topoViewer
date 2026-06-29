## Why

`add-link-direction-lanes` delivers the first usable directional-link primitive: one physical link with optional straight shared-corridor direction strokes, selectors, mapper overlays, docs, and focused validation.

That is enough for the first Graph/Grafana examples, but it is not the full production hardening story. Dense operational diagrams need stronger guarantees around geometry, interaction, attention, mapper coverage, and cross-surface parity.

This follow-up change captures that hardening work without inflating the Phase 1 scope.

## What Changes

Harden link direction lanes across the renderer, attention engine, mapper, docs, and test suite:

- add committed renderer geometry tests for the `---> <---` visual contract;
- preserve physical parallel-link separation when parent links also have direction lanes;
- support curved-edge-following for bezier, segment, taxi, smoothstep, and related routed edges;
- add direction-specific hit targets and `kind: linkDirection` events;
- add attention focus behavior for one direction lane while preserving parent-link context;
- add mapper coverage states for missing, ambiguous, stale, and duplicate direction samples;
- add PromQL starter examples and mounted-bundle mapper examples;
- verify harness, MkDocs, Zensical, and Grafana render the same directional-lane geometry.

## Capabilities

### Modified Capabilities

- `link-direction-lanes`: hardens geometry, event, attention, mapper, and parity behavior.
- `topoviewer-renderer`: supports direction lanes across straight, curved, and parallel physical-link cases.
- `topoviewer-attention-engine`: supports focusing a parent link or a single directional lane.
- `topoviewer-mapper`: reports coverage diagnostics for direction telemetry.
- `topoviewer-docs`: documents production usage, PromQL starters, mounted bundles, and caveats.

## Non-Goals

- Adding more than the two canonical direction keys.
- Modeling physical interfaces as first-class graph objects.
- Replacing normal links or explicit parallel physical links.
- Animated traffic particles or flow animation.
