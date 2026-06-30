## Why

Grafana is attractive for operational topology dashboards, but a Grafana panel is
a larger product surface than documentation embedding. The project should treat
Grafana as a separate roadmap item with its own feasibility constraints,
dashboard data model, plugin lifecycle, performance risks, and adoption
ergonomics.

The main priority is not merely "TopoViewer can render inside Grafana." The main
priority is that an early adopter can bring TopoViewer YAML to Grafana with a
clear, documented, low-friction workflow and understand every failure mode
without reading source code.

## What Changes

Define the Grafana integration roadmap as a phased standalone OpenSpec change:

- establish Grafana as feasible but later-stage;
- prefer a panel-plugin spike before any production plugin commitment;
- make Phase 1 only about panel package shape and canonical harness fixture
  parity;
- make Phase 2 the first telemetry vertical slice: Prometheus-driven network
  weathermap;
- defer interaction persistence, expanded operational dashboards, and full docs
  into later phases;
- make Phase 4 explicitly ergonomic as a mounted-bundle and mapper foundation:
  users mount topology bundles containing
  `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml` into the Grafana
  container instead of copying generic SVG-first panel workflows or editing repo
  fixtures;
- benchmark Phase 4 against generic SVG-first panel workflows and require a better
  topology-as-code workflow: no external SVG editor in the happy path, no manual
  graphics-layer element-ID mapping, and explicit TopoViewer mapper
  diagnostics;
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
- keep Codespaces out of the Grafana roadmap; Codespaces is a repo-wide
  development environment track that should cover docs, Zensical, harness,
  Grafana, and Containerlab Grafana together;
- document the mounted bundle/mapper workflow that connects authored topology
  YAML to Prometheus labels, and record dedicated operational dashboards as
  follow-up playbooks;
- make early-adopter ergonomics the primary success criterion across the
  authoring harness, published docs, Grafana panel, synthetic lab, and
  Containerlab lab;
- require production-grade documentation with happy-path, from-scratch,
  mounted-bundle, mapper-authoring, troubleshooting, screenshots, and
  fresh-checkout validation paths;
- record current adoption gaps bluntly so implementation phases do not confuse
  maintainer demos with user-ready workflows;
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
- Future ergonomic mounted-bundle and TopoViewer-mapper contract for turning
  TopoViewer YAML into Grafana panels without external SVG authoring, catalog
  edits, fixture sync, or plugin rebuilds.
- Future harness-fixture parity contract so Grafana, browser harness, docs, and
  renderer parity checks use the same topology and stylesheet sources.
- Future local lab definition for validating Grafana against Prometheus
  telemetry before any repo-wide cloud development environment claims Grafana
  support.
- Future early-adopter documentation contract for Grafana, harness mapper
  authoring, mounted bundles, telemetry mapping, troubleshooting, and
  fresh-checkout validation.
- No renderer, schema, MkDocs, or package implementation in this change.

## Non-Goals

- Building a Grafana panel.
- Building a Grafana app plugin.
- Building the Grafana/Prometheus/Containerlab lab.
- Claiming Grafana integration is supported.
- Turning Grafana into the primary TopoViewer authoring environment.
- Treating maintainer-only local lab scripts as a sufficient early-adopter
  onboarding workflow.
