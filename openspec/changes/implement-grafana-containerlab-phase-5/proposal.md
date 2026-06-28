## Why

The Grafana panel now has a deterministic Prometheus injector path and a
mounted TopoViewer mapper workflow. The next risk is whether real lab telemetry
can drive the same mapper contract without hard-coded panel behavior or
Grafana-owned topology copies.

Containerlab should be introduced as a separate phase so failures in lab
startup, image pulls, privileges, scrape targets, or metric labels do not hide
panel/mapper regressions.

## Status

Draft and blocked.

This change documents the intended Phase 5 shape, but it SHALL NOT move to
implementation until `implement-grafana-panel-phase-4` has passed its production
readiness gate and has been archived. Phase 4 still owns the mounted bundle,
mapper, diagnostics, and synthetic telemetry contract. Phase 5 must consume that
contract, not finish it.

## What Changes

- Add a local Containerlab Grafana lab command/profile.
- Keep the existing synthetic Grafana lab as the deterministic CI/debug path.
- Mount TopoViewer bundles into Grafana using `*.topo.tv.yaml`,
  `*.style.tv.yaml`, and `*.mapper.tv.yaml`.
- Scrape live lab telemetry into Prometheus.
- Prove at least one live telemetry mutation updates TopoViewer runtime
  overlays through mapper YAML.
- Capture artifacts under `.artifacts/grafana-containerlab/`.

## Out Of Scope

- Codespaces support.
- Large topology stress testing.
- Plugin signing or release packaging.
- Making Grafana the YAML authoring environment.
- Replacing the synthetic injector lab.
