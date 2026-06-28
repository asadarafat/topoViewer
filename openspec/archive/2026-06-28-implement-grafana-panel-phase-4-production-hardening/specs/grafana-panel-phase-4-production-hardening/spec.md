## ADDED Requirements

### Requirement: Mounted Bundles Are The Production Grafana Source

The Grafana panel SHALL treat mounted TopoViewer bundles as the primary
production source model.

#### Scenario: New Panels Default To Mounted Bundles

- **WHEN** a new TopoViewer Grafana panel is created
- **THEN** its default source mode SHALL be mounted topology bundle
- **AND** the default bundle root SHALL be `/etc/topoviewer/bundles`
- **AND** the user SHALL be able to select a discovered topology bundle without
  editing repository catalogs or regenerating fixtures

#### Scenario: Fixture Source Is Compatibility Only

- **WHEN** an existing dashboard uses fixture source mode
- **THEN** the panel SHALL continue to render it
- **BUT** fixture source SHALL be labeled and documented as bundled
  example/demo/CI compatibility
- **AND** fixture source SHALL NOT be presented as the production workflow

### Requirement: Production Lab Startup Does Not Depend On Fixture Projection

The default Grafana lab startup SHALL not require generated harness fixture
projection checks.

#### Scenario: Default Lab Starts From Mounted Bundles

- **WHEN** a user runs `npm run grafana:lab:up`
- **THEN** the command SHALL check versions, check ports, build the local panel
  plugin, start the Grafana stack, and mount topology bundles
- **AND** it SHALL NOT run fixture sync or fixture check as a prerequisite
- **AND** it SHALL print the Phase 4 topology bundle dashboard as the primary
  URL

#### Scenario: Fixture Parity Remains Explicit

- **WHEN** fixture parity needs validation
- **THEN** the repo SHALL provide explicit dev/CI commands for fixture checks
- **AND** those commands SHALL not be required for production mounted-bundle
  startup

#### Scenario: Provisioned Lab Dashboards Are UI Editable

- **WHEN** a user edits a local lab dashboard in the Grafana UI
- **THEN** Grafana SHALL allow the edited dashboard to be saved
- **AND** the saved edit SHALL be stored in the running Grafana database
- **AND** the checked-in provisioning JSON SHALL remain the seed source unless
  explicitly updated by a developer

#### Scenario: Mounted YAML Reloads On Dashboard Refresh

- **WHEN** a user edits a mounted `*.topo.tv.yaml`, `*.style.tv.yaml`, or
  `*.mapper.tv.yaml` file on disk
- **AND** the user refreshes the Grafana dashboard data or reloads the browser
  page
- **THEN** the panel SHALL refetch the selected mounted bundle
- **AND** the rendered TopoViewer panel SHALL reflect the updated YAML without
  restarting Grafana

### Requirement: Dynamic Topology Identity Is Visible In The Panel

The visible selected topology identity SHALL come from the selected runtime
source, not from static Grafana dashboard titles.

#### Scenario: Bundle Selection Updates In-Panel Identity

- **WHEN** a user selects a different mounted topology bundle
- **THEN** the TopoViewer panel header SHALL show the selected bundle name
- **AND** topology, stylesheet, mapper, diagnostics, telemetry overlays, and
  interaction identity SHALL reload for that selected bundle
- **AND** static Grafana panel titles SHALL remain generic
- **AND** the plugin body SHALL NOT repeat the static Grafana panel title as a
  second product heading

### Requirement: Phase 5 Builds On Mounted Bundles Only

Containerlab telemetry work SHALL use the mounted bundle workflow proven in
Phase 4.

#### Scenario: Containerlab Does Not Reintroduce Fixture Dependency

- **WHEN** Phase 5 Containerlab telemetry is implemented
- **THEN** Grafana SHALL read topology/style/mapper YAML from mounted bundles
- **AND** Containerlab smoke tests SHALL NOT depend on generated harness
  fixtures as production topology input
