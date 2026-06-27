## Why

Grafana is attractive for operational topology dashboards, but a Grafana panel is
a larger product surface than documentation embedding. The project should treat
Grafana as a separate roadmap item with its own feasibility constraints,
dashboard data model, plugin lifecycle, and performance risks.

## What Changes

Define the Grafana integration roadmap as a phased standalone OpenSpec change:

- establish Grafana as feasible but later-stage;
- prefer a panel-plugin spike before any production plugin commitment;
- make Phase 1 only about panel package shape and canonical harness fixture
  parity;
- make Phase 2 the first telemetry vertical slice: Prometheus-driven network
  weathermap;
- defer interaction persistence, expanded operational dashboards, full docs, and
  Codespaces into later phases;
- define TopoViewer as an embedded Grafana panel runtime that can be
  programmatically manipulated by Grafana data frames;
- define Prometheus telemetry as a primary data source for changing node, link,
  path, and region visual state such as color, badge, status, opacity, and
  attention focus;
- define Grafana panel interactivity so users can pan, zoom, select, focus, and
  drag topology objects without treating Grafana as the main authoring
  environment;
- require Grafana panel demos and tests to consume every canonical browser
  harness topology from `packages/topoviewer/content/examples/catalog.yaml`
  entries with `harness` metadata, preserving DRY fixture ownership and render
  parity;
- require a runnable local Grafana/Prometheus lab before claiming telemetry
  behavior is technically satisfying;
- treat GitHub Codespaces Containerlab/Grafana as a second-stage portability
  target after the local lab is proven;
- document operational dashboard use cases;
- document risks around data frames, panel UX, plugin signing, CSP, and dense
  topology performance.

## Capabilities

### New Capabilities

- `grafana-integration-roadmap`: feasibility, use cases, first integration
  shape, phased delivery, telemetry-driven runtime manipulation, risks, and
  public roadmap wording constraints for Grafana.

## Impact

- Public integration roadmap wording for Grafana.
- Future Phase 1 spike definition for a Grafana panel wrapping TopoViewer and
  rendering canonical harness fixtures.
- Future telemetry mapping contract for Prometheus/Grafana data frames to
  TopoViewer runtime state overlays.
- Future panel interaction-state contract for viewport state, selected objects,
  focus state, and dragged node position overrides.
- Future harness-fixture parity contract so Grafana, browser harness, docs, and
  renderer parity checks use the same topology and stylesheet sources.
- Future local lab definition for validating Grafana against Prometheus telemetry
  before a cloud-hosted developer environment is promised.
- No renderer, schema, MkDocs, or package implementation in this change.

## Non-Goals

- Building a Grafana panel.
- Building a Grafana app plugin.
- Building the Grafana/Prometheus/Containerlab lab.
- Claiming Codespaces support before the local lab is repeatable.
- Claiming Grafana integration is supported.
- Turning Grafana into the primary TopoViewer authoring environment.
