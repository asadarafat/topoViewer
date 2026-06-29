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

#### Scenario: Local TopoViewer Grafana Lab Profile Remains Available

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

#### Scenario: Upstream Candidate Does Not Depend On The TopoViewer Monorepo

- **WHEN** the upstream-candidate lab patch is prepared
- **THEN** the patch SHALL NOT require repository-relative paths into the
  TopoViewer monorepo
- **AND** the patch SHALL NOT vendor the TopoViewer Grafana plugin `dist`
  directory
- **AND** the patch SHALL document a plugin installation contract that works
  from a fresh lab checkout
- **AND** any local plugin bind mount SHALL be isolated as an explicit
  development-only override

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

#### Scenario: Recording Rules Are Generated From Topology Bindings

- **WHEN** the lab needs mapper-compatible Prometheus metrics
- **THEN** raw exporter label bindings SHOULD be authored on the relevant
  TopoViewer topology objects
- **AND** a generator SHALL produce Prometheus recording rules from those
  topology bindings
- **AND** generated rules SHALL include stable TopoViewer labels such as
  `link_id` and `direction`
- **AND** the mapper SHALL consume those generated metric names rather than
  raw `source` and `interface_name` labels directly
- **AND** a check mode SHALL fail when generated rules drift from the topology
  telemetry bindings

#### Scenario: Live Telemetry Use Cases Are Generic Mapper Rules

- **WHEN** the Containerlab smoke validates the panel
- **THEN** link state SHALL be represented as mapper-driven runtime link style
  changes
- **AND** interface utilization SHALL be represented as mapper-driven runtime
  link label, color, width, badge, or tooltip changes
- **AND** these visual changes SHALL use style keys already accepted by the
  TopoViewer style metadata and mapper schema
- **AND** adjacency or node-health overlays SHALL be deferred unless the lab
  exposes stable metrics that do not make the first upstream-candidate patch
  brittle

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

### Requirement: Phase 5 Has A Production Readiness Gate

Phase 5 SHALL NOT be archived as production-ready until the upstream-candidate
workflow is repeatable by an engineer who has a fresh lab checkout and does not
know TopoViewer monorepo internals.

#### Scenario: Fresh Checkout Workflow Is Documented And Repeatable

- **WHEN** a user starts from a fresh lab checkout
- **THEN** the docs SHALL identify the required plugin installation mode
- **AND** the docs SHALL identify the mounted TopoViewer bundle location
- **AND** the docs SHALL identify the lab deploy command
- **AND** the docs SHALL identify the traffic-generation command
- **AND** the docs SHALL identify the Grafana dashboard URL
- **AND** the workflow SHALL NOT require manual fixture sync or generated
  catalog edits

#### Scenario: Smoke Command Proves The End-To-End Flow

- **WHEN** the production readiness smoke command runs against the
  upstream-candidate lab
- **THEN** it SHALL verify Grafana health
- **AND** it SHALL verify TopoViewer plugin availability
- **AND** it SHALL verify mounted bundle discovery
- **AND** it SHALL verify Prometheus target health
- **AND** it SHALL verify mapper-compatible recording-rule output
- **AND** it SHALL verify mapper coverage has no unresolved or ambiguous
  required samples
- **AND** it SHALL capture a dashboard screenshot
- **AND** it SHALL fail with actionable logs when any required service,
  recording rule, bundle, mapper, or rendered panel is not ready

#### Scenario: Plugin Install Contract Separates Release And Development Modes

- **WHEN** the lab is run in release mode
- **THEN** Grafana SHALL install or load a pinned TopoViewer panel artifact
  without using this monorepo's build output
- **WHEN** the lab is run in development mode
- **THEN** Grafana MAY bind-mount a local plugin `dist` directory
- **AND** that development mount SHALL be explicit, documented, and excluded
  from the upstream-candidate production path

#### Scenario: Upstream Patch Is Reviewable

- **WHEN** the upstream-candidate patch is generated
- **THEN** it SHALL keep the existing lab topology recognizable
- **AND** it SHALL keep the original `Network Telemetry` dashboard unchanged
- **AND** it SHALL add a `Network Telemetry - TopoViewer` B dashboard by
  copying the original dashboard and replacing only the `Network Telemetry`
  topology panel with TopoViewer
- **AND** it SHALL add only minimal Grafana, Prometheus, dashboard, and
  TopoViewer bundle wiring
- **AND** it SHALL avoid external project-internal assumptions
- **AND** it SHALL be removable without disrupting the existing telemetry lab
- **AND** it SHALL include operator-facing README guidance for the TopoViewer
  dashboard

### Requirement: Public Documentation Avoids External Lab Repository Links

The Phase 5 implementation SHALL describe TopoViewer's local and
upstream-candidate Containerlab workflows without publishing external lab
repository links in project docs or OpenSpec files.

#### Scenario: Docs Describe The Local Workflow

- **WHEN** docs or OpenSpec files explain the Containerlab lab
- **THEN** they SHALL describe the repo-local `topoviewer-grafana` workflow and
  the upstream-candidate mounted-bundle workflow
- **AND** they SHALL explain the topology/style/mapper mount contract
- **AND** they SHALL explain gNMIc, Prometheus, Grafana, and TopoViewer panel
  responsibilities
- **AND** they SHALL NOT include external lab repository URLs
