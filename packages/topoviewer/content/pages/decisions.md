# Maintainer Decision Log

This index records public-contract decisions that affect adopters. A decision
belongs here when it changes the authored YAML model, stylesheet language,
mapper contract, public TypeScript API, docs embed behavior, Grafana panel
options, release policy, or integration support boundary.

Use short entries. Link the implementation PR, OpenSpec change, issue, or docs
page when available. Keep deeper rationale in the linked artifact.

## Decision Index

| ID | Status | Decision | Contract area | Evidence |
|---|---|---|---|---|
| ADR-0001 | Accepted | TopoViewer canonical authoring keys are camelCase across TypeScript and YAML. | Stylesheet and schema authoring. | [Stylesheet](stylesheet.md), [Compatibility](compatibility.md) |
| ADR-0002 | Accepted | Default node shape is `rectangle`; `square` and `circle` require equal width and height. | Style defaults and validation. | [Stylesheet](stylesheet.md), [Debug rendering](debugging.md) |
| ADR-0003 | Accepted | `packages/topoviewer/content/**` is the canonical docs/examples source; generated docs are projections. | Docs and examples ownership. | [Documentation standard](docs-standard.md), [Production hardening](production.md) |
| ADR-0004 | Accepted | Grafana user workflow is mounted `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml` bundles, not fixture catalog edits. | Grafana integration. | [Grafana guide](grafana.md), [Grafana telemetry call flow](grafana-telemetry-call-flow.md) |
| ADR-0005 | Accepted | Public npm publication is manual and gated; normal push/PR workflows never publish packages. | Release and supply chain. | [Release checklist](release.md), [Compatibility](compatibility.md) |
| ADR-0006 | Accepted | Active OpenSpec changes are plans, not public support claims. | Roadmap and support status. | [Integration roadmap](integration-roadmap.md), [Documentation standard](docs-standard.md) |
| ADR-0007 | Accepted | Host documentation CSS may affect TopoViewer color variables, but not renderer geometry, spacing, or sizing. | Renderer surface parity. | [Debug rendering](debugging.md), [Production hardening](production.md) |
| ADR-0008 | Accepted | Runtime telemetry overlays must not mutate topology or stylesheet source YAML. | Grafana mapper and operational state. | [Grafana guide](grafana.md), [Browser harness](browser-harness.md) |

## New Decision Checklist

Before adding or changing a public contract:

1. State the supported surface and maturity label.
2. Update the relevant guide and reference page.
3. Update schemas, style metadata, mapper metadata, YAML assist, or API report
   when the contract has machine-readable ownership.
4. Add an example or compatibility fixture.
5. Add a migration note if existing users must change authored YAML, code, or
   dashboard JSON.
6. Add or update a row in this decision log.

## Next Steps

- [Compatibility](compatibility.md): version policy, API boundary, and compatibility matrix.
- [Documentation standard](docs-standard.md): documentation requirements for new public behavior.
- [Release checklist](release.md): publish gates and migration-note expectations.
