## Why

Grafana is attractive for operational topology dashboards, but a Grafana panel is
a larger product surface than documentation embedding. The project should treat
Grafana as a separate roadmap item with its own feasibility constraints,
dashboard data model, plugin lifecycle, and performance risks.

## What Changes

Define the Grafana integration roadmap as a standalone OpenSpec change:

- establish Grafana as feasible but later-stage;
- prefer a panel-plugin spike before any production plugin commitment;
- document operational dashboard use cases;
- document risks around data frames, panel UX, plugin signing, CSP, and dense
  topology performance.

## Capabilities

### New Capabilities

- `grafana-integration-roadmap`: feasibility, use cases, first integration
  shape, risks, and public roadmap wording constraints for Grafana.

## Impact

- Public integration roadmap wording for Grafana.
- Future spike definition for a Grafana panel wrapping TopoViewer.
- No renderer, schema, MkDocs, or package implementation in this change.

## Non-Goals

- Building a Grafana panel.
- Building a Grafana app plugin.
- Claiming Grafana integration is supported.
- Turning Grafana into the primary TopoViewer authoring environment.
