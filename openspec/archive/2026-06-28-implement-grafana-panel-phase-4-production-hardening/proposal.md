# Implement Grafana Panel Phase 4 Production Hardening

## Why

Phase 4 introduced mounted TopoViewer bundles and mapper-driven telemetry
overlays, but the local lab and panel still carry Phase 1 fixture-parity
assumptions. That creates the wrong production signal:

```text
production Grafana workflow depends on generated harness fixtures
```

The production contract should be:

```text
mounted *.topo.tv.yaml + *.style.tv.yaml + *.mapper.tv.yaml bundles
  -> Grafana panel plugin
  -> Prometheus/Grafana data frames
  -> TopoViewer runtime overlays
```

Generated harness fixtures remain valuable for tests, demos, and regression
parity, but they should not be part of the default production-shaped lab startup
path.

## What Changes

- Make mounted topology bundles the default and primary Grafana source mode.
- Deprecate fixture source mode in user-facing UI and docs while preserving it
  for backwards compatibility, demos, and CI.
- Remove generated fixture sync/check requirements from `npm run grafana:lab:up`.
- Keep fixture checks under explicit fixture/dev commands and CI lanes.
- Make Phase 4 dashboards and docs production-shaped: topology bundles first,
  fixtures legacy/internal.
- Ensure source labels, panel options, smoke tests, and troubleshooting do not
  imply users must edit repo catalogs or regenerate fixtures.
- Feed this decision back into the long-lived Grafana roadmap so Phase 5
  Containerlab builds on mounted bundles only.

## Non-Goals

- Do not delete fixture source mode in this phase.
- Do not break existing Phase 1/2 dashboards that still use fixtures.
- Do not remove harness fixture parity tests from CI.
- Do not implement Containerlab telemetry here.
- Do not add Grafana authoring of topology/style YAML.
