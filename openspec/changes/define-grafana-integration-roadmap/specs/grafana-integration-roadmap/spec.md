## ADDED Requirements

### Requirement: Grafana Roadmap Is Phased

TopoViewer SHALL treat Grafana integration as a phased roadmap, not a single
large implementation.

#### Scenario: Public Status Is Accurate

- **WHEN** public docs mention Grafana
- **THEN** Grafana SHALL be marked exploratory until at least the local panel
  parity and Prometheus weathermap phases pass
- **AND** docs SHALL NOT claim supported Grafana integration before the panel,
  telemetry mapping, interaction state, docs, and validation are complete

#### Scenario: Implementation Order Is Enforced

- **WHEN** implementation begins
- **THEN** Phase 1 SHALL prove panel rendering and canonical harness fixture
  parity before Prometheus, interactivity persistence, Codespaces, or expanded
  use cases are treated as release work

### Requirement: Phase 1 Panel Parity

TopoViewer SHALL first prove a Grafana panel can render canonical TopoViewer
harness fixtures without fixture drift.

#### Scenario: Panel Package Wraps TopoViewer

- **WHEN** the Grafana panel package is implemented
- **THEN** it SHALL live in a dedicated package such as
  `packages/grafana-topoviewer-panel`
- **AND** it SHALL import and wrap the existing `topoviewer` runtime
- **AND** it SHALL NOT fork renderer behavior

#### Scenario: Grafana Uses Canonical Harness Fixtures

- **WHEN** Grafana panel demos or tests need topology fixtures
- **THEN** they SHALL discover fixtures from
  `packages/topoviewer/content/examples/catalog.yaml` entries with `harness`
  metadata
- **AND** discovery SHALL match browser harness semantics for fixture ID, display
  name, source file resolution, path safety, duplicate detection, and ordering
- **AND** Grafana SHALL NOT maintain checked-in Grafana-only topology or
  stylesheet YAML copies for those fixtures

#### Scenario: All Harness Fixtures Load

- **WHEN** Phase 1 smoke tests run
- **THEN** every canonical harness fixture SHALL load in the Grafana panel
- **AND** the initial required fixture set SHALL include `layered-network`,
  `clos-2spine-4leaf`, `insert-workflow`, `attention-workflow`,
  `inspector-workflow`, and `dense-links`
- **AND** compiled object counts and layer availability SHALL match TopoViewer
  compiled output for the same topology and stylesheet

### Requirement: Phase 2 Prometheus Weathermap

TopoViewer SHALL prove real telemetry flow with a narrow Prometheus-driven
weathermap before broader operational dashboards.

#### Scenario: Local Lab Versions Are Pinned

- **WHEN** the local lab is implemented
- **THEN** Grafana SHALL use an exact image tag such as
  `grafana/grafana:13.1.0`
- **AND** Prometheus SHALL use an exact image tag such as
  `prom/prometheus:v3.5.0`
- **AND** the lab SHALL reject `latest`, unversioned images, and floating
  major/minor tags
- **AND** smoke checks SHALL verify running versions

#### Scenario: Prometheus Injector Drives Grafana Data Frames

- **WHEN** telemetry behavior is validated
- **THEN** a deterministic injector SHALL mutate Prometheus metrics
- **AND** Prometheus SHALL scrape the injector
- **AND** Grafana SHALL query Prometheus through a provisioned data source
- **AND** the TopoViewer panel SHALL consume resulting Grafana data frames
- **AND** static Prometheus frame fixtures SHALL NOT be sufficient for Phase 2
  completion

#### Scenario: Network Weathermap Works

- **WHEN** the panel runs the first weathermap vertical slice
- **THEN** Prometheus link metrics SHALL drive TopoViewer link color, width,
  line style, label text, and endpoint status markers
- **AND** users SHALL be able to hover a link, click a link to focus it and its
  endpoints, filter by dashboard variables, and drag endpoint nodes without
  breaking metric matching
- **AND** the first detailed assertions SHOULD use `layered-network` and
  `clos-2spine-4leaf`
- **AND** all harness fixtures SHALL still load after telemetry support is
  enabled

### Requirement: Phase 3 Interaction State

TopoViewer SHALL support operational interaction inside Grafana without making
Grafana the source authoring environment.

#### Scenario: Runtime Interaction State Is Separate From YAML

- **WHEN** a user pans, zooms, selects, focuses, or drags a node in Grafana
- **THEN** the panel SHALL update runtime interaction state
- **AND** it SHALL NOT rewrite canonical topology YAML or stylesheet YAML

#### Scenario: Dragged Positions Survive Refresh When Enabled

- **WHEN** node position persistence is enabled
- **THEN** dragged positions SHALL survive dashboard refresh while the topology
  identity is unchanged
- **AND** position overrides SHALL take precedence over base topology positions
  and layout results
- **AND** reset SHALL clear local position overrides without clearing
  telemetry-derived visual state

#### Scenario: Telemetry And Interaction Do Not Race

- **WHEN** telemetry refreshes while the user has viewport, focus, selection, or
  drag state
- **THEN** telemetry SHALL update visual/attention state without clearing user
  interaction state

### Requirement: Phase 4 Operational Use Cases And Docs

TopoViewer SHALL expand from weathermap into documented operator workflows only
after the first telemetry slice is proven.

#### Scenario: Node Health Use Case

- **WHEN** node health metrics are implemented
- **THEN** node up/down, CPU, memory, or temperature metrics SHALL drive status
  markers, outlines, badges, and aggregate severity
- **AND** degraded node selection SHALL remain stable across telemetry refresh

#### Scenario: Service Path Use Case

- **WHEN** service SLO metrics breach thresholds
- **THEN** the affected TopoViewer path SHALL focus, endpoints and transit nodes
  SHALL highlight, and unrelated context SHALL dim
- **AND** clearing focus SHALL restore topology context while preserving
  telemetry warning styles

#### Scenario: Routing Adjacency Use Case

- **WHEN** protocol adjacency metrics indicate failure
- **THEN** affected nodes SHALL show protocol badges such as `BGP`, `ISIS`, or
  `OSPF`
- **AND** protocol overlays SHOULD be independently toggleable from weathermap
  utilization overlays

#### Scenario: Documentation Covers End-To-End Workflow

- **WHEN** Grafana docs are added
- **THEN** they SHALL cover authoring in the browser harness, promoting a
  canonical harness fixture, validating YAML, syncing Grafana projections,
  selecting the fixture in Grafana, mapping TopoViewer object IDs/labels to
  Prometheus labels, injecting telemetry, observing visual changes, interacting
  with the panel, and troubleshooting

### Requirement: Phase 5 Codespaces Portability

TopoViewer SHALL treat Codespaces as a separate feasibility phase after local
Grafana validation.

#### Scenario: Codespaces Is Not First Proof

- **WHEN** Codespaces work is proposed
- **THEN** local panel parity and Prometheus weathermap phases SHALL already
  pass
- **AND** Codespaces feasibility SHALL separately validate privileges, nested
  networking, image pulls, port forwarding, persisted workspace state, resource
  limits, and URL documentation
