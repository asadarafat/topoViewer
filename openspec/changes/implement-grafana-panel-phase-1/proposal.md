## Why

The Grafana roadmap is now phased. The first executable slice should prove that
TopoViewer can run as a Grafana panel and render the same canonical harness
topologies as the browser harness. Prometheus, Containerlab, drag persistence,
and expanded operator dashboards stay out of Phase 1.

## What Changes

Implement Phase 1 of the Grafana integration:

- add a dedicated Grafana panel package;
- wrap the existing `topoviewer` runtime instead of forking renderer behavior;
- discover canonical harness fixtures from
  `packages/topoviewer/content/examples/catalog.yaml`;
- generate panel-consumable fixture assets from the canonical harness topology
  and stylesheet YAML;
- add a fixture selector inside the Grafana panel;
- add local Grafana lab smoke validation using pinned Grafana;
- smoke-load every harness fixture;
- add detailed parity screenshots/assertions for `layered-network` and
  `clos-2spine-4leaf`.

## Capabilities

### New Capabilities

- `grafana-panel-phase-1`: Grafana panel package, canonical harness fixture
  parity, generated fixture projection, fixture selector, pinned local Grafana
  smoke environment, and Phase 1 validation.

## Impact

- Adds `packages/grafana-topoviewer-panel`.
- Adds local-only `labs/grafana-topoviewer` Phase 1 Grafana lab files.
- Adds root scripts for Grafana panel build, fixture sync/check, and local
  Grafana smoke.
- Does not add Prometheus or Containerlab yet.
- Does not claim supported Grafana integration in public docs.

## Non-Goals

- Prometheus telemetry mapping.
- Containerlab topology correlation.
- Node drag persistence.
- Service path, node health, routing adjacency, or full weathermap dashboards.
- Grafana app plugin.
- Plugin signing or publication.
- Codespaces support.
