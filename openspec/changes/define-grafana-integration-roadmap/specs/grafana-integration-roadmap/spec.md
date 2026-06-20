## ADDED Requirements

### Requirement: Grafana feasibility baseline

TopoViewer SHALL treat Grafana as a feasible but later-stage operational
dashboard integration, not as a currently supported integration.

Research anchors:

- [Grafana plugin tools](https://grafana.com/developers/plugin-tools/)
- [Panel plugin tutorial](https://grafana.com/developers/plugin-tools/tutorials/build-a-panel-plugin)
- [Data frames in panel plugins](https://grafana.com/developers/plugin-tools/how-to-guides/panel-plugins/read-data-from-a-data-source)
- [Plugin signing](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin)

#### Scenario: Grafana roadmap status is accurate

- **WHEN** the public integration roadmap mentions Grafana
- **THEN** it SHALL mark Grafana as exploratory or planned only after a panel
  spike proves the data mapping
- **AND** it SHALL NOT claim Grafana integration is supported

#### Scenario: Grafana feasibility is tied to plugin surface

- **WHEN** the roadmap explains why Grafana integration is feasible
- **THEN** it SHALL identify panel plugin or app plugin development as the likely
  integration surface
- **AND** it SHALL identify data-frame mapping as an open design question

### Requirement: Grafana first integration shape

TopoViewer SHALL prefer a small panel-plugin spike before a production Grafana
plugin.

#### Scenario: First Grafana spike uses static or simple data

- **WHEN** Grafana integration work is planned
- **THEN** the first shape SHALL be:

```text
Grafana data frames / JSON model -> TopoViewer props -> operational topology panel
```

- **AND** the spike SHALL answer data shape, panel option, refresh, and state
  overlay questions before broader plugin work

#### Scenario: Grafana panel stays operational

- **WHEN** a Grafana panel is designed
- **THEN** it SHALL focus on dashboard consumption and operational state
- **AND** it SHALL NOT become the primary TopoViewer topology authoring
  environment

### Requirement: Grafana use cases

TopoViewer SHALL document realistic Grafana use cases before implementation.

#### Scenario: Operational dashboard views

- **WHEN** Grafana use cases are documented
- **THEN** they SHALL include service topology panels, failure views, alert or
  metric overlays, and customer or service path visualization
- **AND** they MAY include NOC views that focus affected nodes and dim healthy
  context

#### Scenario: Dashboard data requirements are explicit

- **WHEN** Grafana use cases mention live status or time range behavior
- **THEN** the roadmap SHALL identify required data-frame shape, dashboard
  variables, refresh behavior, and topology state inputs as unresolved until the
  spike exists

### Requirement: Grafana risks and non-goals

TopoViewer SHALL make Grafana integration risks explicit in the roadmap or
implementation plan.

#### Scenario: Grafana release overhead is acknowledged

- **WHEN** Grafana integration is described
- **THEN** plugin signing, distribution, dashboard lifecycle, security, and CSP
  constraints SHALL be listed as risks

#### Scenario: Dense topology performance is a gate

- **WHEN** Grafana panel work is planned
- **THEN** large topology rendering inside dashboard panels SHALL require
  performance validation before the roadmap can call the integration planned
