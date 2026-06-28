## ADDED Requirements

### Requirement: Phase 5 Is Blocked Until Phase 4 Is Accepted

Containerlab SHALL NOT be implemented until the mounted bundle and mapper
foundation is accepted as the deterministic baseline.

#### Scenario: Entry Gate Blocks Containerlab Work

- **WHEN** Phase 5 Containerlab work is considered
- **THEN** `implement-grafana-panel-phase-4` SHALL have passed its production
  readiness gate
- **AND** live `npm run grafana:lab:smoke:phase4` SHALL pass on the final Phase
  4 patch set
- **AND** full `npm run ci` SHALL pass on the final Phase 4 patch set
- **AND** generated/build outputs SHALL be reviewed before commit
- **AND** `implement-grafana-panel-phase-4` SHALL already be archived
- **AND** Phase 5 SHALL remain a draft spec if any of those conditions are not
  true

### Requirement: Containerlab Lab Uses The Mapper Contract

The Grafana Containerlab lab SHALL drive TopoViewer overlays through mounted
TopoViewer bundles and mapper YAML.

#### Scenario: Real Lab Telemetry Drives Runtime Overlay

- **WHEN** the local Containerlab Grafana lab is running
- **AND** Prometheus scrapes live lab telemetry
- **AND** the Grafana panel loads a mounted TopoViewer bundle
- **THEN** a telemetry state change SHALL update TopoViewer runtime overlays
- **AND** the update SHALL be produced by `*.mapper.tv.yaml`
- **AND** the panel SHALL NOT use hard-coded Containerlab-specific mapping

#### Scenario: Synthetic Lab Remains Deterministic

- **WHEN** Containerlab is unavailable or disabled
- **THEN** the existing synthetic Grafana lab SHALL still run
- **AND** Phase 2 and Phase 4 smoke tests SHALL remain valid

#### Scenario: Mapper-Friendly Labels Are Preferred

- **WHEN** Prometheus metrics are produced from Containerlab telemetry
- **THEN** labels SHOULD include stable TopoViewer join keys such as `node_id`,
  `link_id`, `source`, `target`, and `protocol`
- **AND** exporter-native labels SHOULD be normalized with relabeling or
  recording rules before adding panel-specific code

#### Scenario: Artifacts Prove The Operational Flow

- **WHEN** the Containerlab smoke test runs
- **THEN** it SHALL capture before/after screenshots, Prometheus target status,
  mapper coverage status, and lab version details under
  `.artifacts/grafana-containerlab/`
