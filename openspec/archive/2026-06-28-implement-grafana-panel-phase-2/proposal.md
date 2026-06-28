# Implement Grafana Panel Phase 2

## Why

Phase 1 proved that Grafana can load a TopoViewer panel and render every
canonical browser harness fixture without Grafana-owned topology YAML copies.
That is useful, but it is still static. The next proof point is whether real
Prometheus telemetry can programmatically change the rendered topology in
Grafana.

Phase 2 should prove one operational vertical slice:

```text
telemetry injector -> Prometheus -> Grafana data source -> Grafana data frames
  -> TopoViewer telemetry overlay -> rendered weathermap state
```

Static JSON frame fixtures are useful for unit tests, but they are not enough to
prove the integration.

## What Changes

Implement a local Prometheus weathermap phase:

- extend the local Grafana lab with pinned Prometheus and a deterministic
  telemetry injector;
- keep Grafana `13.1.0` pinned and add exact pins for Prometheus and injector
  runtime images;
- provision a Prometheus data source and dashboard queries;
- add panel telemetry options that map Prometheus frame fields to TopoViewer
  object IDs;
- add a telemetry overlay adapter that changes link color, width, line style,
  label, endpoint status, and attention/focus state without mutating topology
  YAML;
- keep all Grafana fixtures sourced from canonical harness examples;
- add smoke tests that drive healthy and degraded injector scenarios and verify
  rendered visual state changes in Grafana;
- add practical docs for authoring a topology, mapping TopoViewer objects to
  telemetry labels, running the lab, and troubleshooting the data path.

## Scope

In scope:

- Prometheus scrape path.
- Deterministic telemetry injector.
- Link utilization and link-down weathermap.
- Grafana data-frame to TopoViewer overlay mapping.
- All harness fixtures remain selectable.
- Detailed visual assertions for `layered-network` and `clos-2spine-4leaf`.

Out of scope:

- Grafana plugin signing and release packaging.
- Persistent node drag/viewport state across dashboard refresh.
- Node health, service path SLO, and routing adjacency dashboards beyond the
  minimal link telemetry used by the weathermap.
- Codespaces portability.
- Treating Grafana as a topology authoring surface.

## Public Status

Public docs must continue to call Grafana exploratory. Phase 2 can be described
as a local Prometheus weathermap proof after it passes, but not as supported
Grafana integration.
