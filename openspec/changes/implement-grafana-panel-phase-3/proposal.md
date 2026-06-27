# Implement Grafana Panel Phase 3

## Why

Phase 2 proves Grafana can render TopoViewer with Prometheus-driven visual
state. The next product gap is interaction continuity: operators need pan,
zoom, selection, and local drag state to survive Grafana refreshes without
rewriting topology YAML.

## What Changes

- Add interaction-state options to the Grafana panel.
- Persist viewport, selection/focus, and local node position overrides in
  session or browser storage.
- Apply local node position overrides as a runtime TopoViewer extension.
- Add a reset action for local node position overrides.
- Add TopoViewer runtime props for initial viewport restore and drag policy.
- Keep telemetry-derived styles transient and separate from persisted
  interaction state.

## Non-Goals

- No dashboard-level persistence yet.
- No canonical topology or stylesheet YAML mutation.
- No Containerlab integration.
- No multi-user shared operational state.
