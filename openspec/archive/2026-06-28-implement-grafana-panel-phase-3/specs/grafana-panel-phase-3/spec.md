## ADDED Requirements

### Requirement: Runtime Interaction State Persistence

The Grafana panel SHALL persist runtime-only interaction state without mutating
canonical topology YAML or stylesheet YAML.

#### Scenario: viewport restore

- **WHEN** a user pans or zooms the TopoViewer panel
- **AND** viewport persistence is set to `session` or `browser`
- **THEN** the panel SHALL restore that viewport after a dashboard refresh

#### Scenario: node position override restore

- **WHEN** a user drags a node
- **AND** node position persistence is enabled
- **THEN** the panel SHALL restore the local node position override after a
  dashboard refresh
- **AND** Prometheus telemetry matching SHALL continue to use stable topology
  IDs, not screen positions

#### Scenario: position reset

- **WHEN** a user selects reset positions
- **THEN** local node position overrides SHALL be cleared
- **AND** telemetry-derived style overlays SHALL remain unaffected

### Requirement: Interaction Persistence Options

The Grafana panel SHALL expose interaction options for enabling interaction,
drag policy, viewport persistence, selection persistence, node position
persistence, and topology-identity reset behavior.

#### Scenario: interaction disabled

- **WHEN** interaction is disabled
- **THEN** persisted selection, viewport, and node position state SHALL not be
  applied to the TopoViewer render

#### Scenario: separate topology identities

- **WHEN** the selected fixture or graph identity changes
- **THEN** persisted state from the previous topology SHALL NOT be applied to
  the new topology
