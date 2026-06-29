## ADDED Requirements

### Requirement: Phase 5 Consumes The Accepted Phase 4 Contract

Containerlab SHALL consume the mounted bundle and mapper foundation accepted in
Phase 4. It SHALL NOT redefine the Grafana panel source model or mapper runtime
contract.

#### Scenario: Entry Gate Is Satisfied Before Containerlab Work

- **WHEN** Phase 5 Containerlab work is considered
- **THEN** `implement-grafana-panel-phase-4` SHALL have passed its production
  readiness gate
- **AND** live `npm run grafana:lab:smoke:phase4` SHALL pass on the final Phase
  4 patch set
- **AND** full `npm run ci` SHALL pass on the final Phase 4 patch set
- **AND** generated/build outputs SHALL be reviewed before commit
- **AND** `implement-grafana-panel-phase-4` SHALL already be archived

#### Scenario: Phase 4 Semantics Are Not Reopened

- **WHEN** real Containerlab telemetry reveals a mapper or mounted-bundle gap
- **THEN** the fix SHALL preserve the Phase 4 production workflow of mounted
  `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml` bundles
- **AND** the fix SHALL be validated against the synthetic Phase 2 and Phase 4
  labs as well as the Containerlab lab

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

#### Scenario: TopoViewer Grafana Lab Profile Is Local

- **WHEN** the Containerlab lab is implemented
- **THEN** it SHALL provide a repo-local `topoviewer-grafana` lab profile under
  `labs/grafana-topoviewer/containerlab/`
- **AND** the lab SHALL include pinned SR Linux, gNMIc, Prometheus, and Grafana
  images
- **AND** Grafana SHALL load the local TopoViewer panel plugin build
- **AND** Grafana SHALL mount TopoViewer bundles from
  `/etc/topoviewer/bundles`
- **AND** the implementation SHALL NOT require cloning an external lab
  repository at runtime

#### Scenario: First Lab Uses A Small CLOS-Like Fabric

- **WHEN** the first Containerlab topology is started
- **THEN** it SHALL include two spine SR Linux nodes
- **AND** it SHALL include at least two leaf SR Linux nodes
- **AND** it SHALL include client or traffic endpoints when needed for
  deterministic utilization changes
- **AND** it SHALL expose enough fabric and client-facing links to validate
  link-state and utilization overlays

#### Scenario: Synthetic Lab Remains Deterministic

- **WHEN** Containerlab is unavailable or disabled
- **THEN** the existing synthetic Grafana lab SHALL still run
- **AND** Phase 2 and Phase 4 smoke tests SHALL remain valid

#### Scenario: Mapper-Friendly Labels Are Preferred

- **WHEN** Prometheus metrics are produced from Containerlab telemetry
- **THEN** labels SHOULD include stable TopoViewer join keys such as `node_id`,
  `link_id`, `source`, `target`, `protocol`, `interface`, and `direction`
- **AND** exporter-native labels SHOULD be normalized with relabeling or
  recording rules before adding panel-specific code

#### Scenario: Live Telemetry Use Cases Are Generic Mapper Rules

- **WHEN** the Containerlab smoke validates the panel
- **THEN** link state SHALL be represented as mapper-driven runtime link style
  changes
- **AND** interface utilization SHALL be represented as mapper-driven runtime
  link label, color, width, badge, or tooltip changes
- **AND** adjacency or node health SHALL be represented as mapper-driven runtime
  node, link, layer, or graph overlay changes
- **AND** these visual changes SHALL use style keys already accepted by the
  TopoViewer style metadata and mapper schema

#### Scenario: Mounted Bundle Edits Are Observable Without Plugin Rebuild

- **WHEN** a user edits the mounted topology, stylesheet, or mapper YAML files
- **AND** Grafana refreshes the panel or dashboard
- **THEN** the panel SHALL reload the changed mounted bundle
- **AND** the user SHALL NOT need to rebuild the Grafana plugin to observe YAML
  changes

#### Scenario: Artifacts Prove The Operational Flow

- **WHEN** the Containerlab smoke test runs
- **THEN** it SHALL capture before/after screenshots, Prometheus target status,
  gNMIc target/subscription status, mapper coverage status, panel source
  diagnostics, query details, and lab version details under
  `.artifacts/grafana-containerlab/`

### Requirement: Public Documentation Avoids External Lab Repository Links

The Phase 5 implementation SHALL describe TopoViewer's local Containerlab
workflow without publishing external lab repository links in project docs or
OpenSpec files.

#### Scenario: Docs Describe The Local Workflow

- **WHEN** docs or OpenSpec files explain the Containerlab lab
- **THEN** they SHALL describe the repo-local `topoviewer-grafana` workflow
- **AND** they SHALL explain the topology/style/mapper mount contract
- **AND** they SHALL explain gNMIc, Prometheus, Grafana, and TopoViewer panel
  responsibilities
- **AND** they SHALL NOT include external lab repository URLs
