## ADDED Requirements

### Requirement: Phase 2 Uses Real Prometheus Flow

Phase 2 SHALL prove a real telemetry path from injector to Prometheus to Grafana
data frames to TopoViewer overlay state.

#### Scenario: Static Frames Are Not Sufficient

- **WHEN** Phase 2 validation is evaluated
- **THEN** static Grafana frame JSON fixtures MAY be used for unit tests
- **BUT** Phase 2 SHALL NOT be considered complete unless a running injector is
  scraped by Prometheus and queried by Grafana

#### Scenario: Running Versions Are Pinned

- **WHEN** the Phase 2 lab starts
- **THEN** Grafana SHALL use exact image tag `grafana/grafana:13.1.0`
- **AND** Prometheus SHALL use exact image tag `prom/prometheus:v3.5.0`
- **AND** every lab image SHALL reject `latest`, unversioned, and floating
  major/minor tags
- **AND** smoke validation SHALL verify running Grafana and Prometheus versions

### Requirement: Telemetry Injector Provides Deterministic Scenarios

The local lab SHALL include a deterministic telemetry injector for TopoViewer
weathermap scenarios.

#### Scenario: Injector Exposes Health And Metrics

- **WHEN** Prometheus scrapes the injector
- **THEN** the injector SHALL expose `/metrics`
- **AND** `/health` SHALL return a success response when the injector is ready

#### Scenario: Injector Changes Link State

- **WHEN** the `healthy`, `high-utilization`, or `link-failure` scenario is
  selected
- **THEN** the injector SHALL change metrics for stable TopoViewer link IDs
- **AND** Prometheus SHALL observe the changed metrics after scrape
- **AND** Grafana SHALL observe the changed metrics through the provisioned data
  source

### Requirement: Grafana Panel Maps Data Frames To TopoViewer Overlays

The Grafana panel SHALL translate Prometheus query results into runtime
TopoViewer visual overlays without mutating canonical topology or stylesheet
YAML.

#### Scenario: Link Metrics Match Topology Objects

- **WHEN** a Prometheus row contains `link_id`
- **THEN** the panel SHALL match telemetry to the TopoViewer link with the same
  ID
- **AND** source/target matching MAY be used as a fallback
- **AND** dragging a node SHALL NOT change metric matching

#### Scenario: Empty Telemetry Keeps Topology Visible

- **WHEN** telemetry is missing, empty, or does not match a fixture
- **THEN** the panel SHALL keep rendering the selected canonical fixture
- **AND** it SHALL show actionable diagnostics or empty-state information
- **AND** it SHALL NOT fail the base topology render

### Requirement: Weathermap Visual Rules Are Deterministic

The panel SHALL implement deterministic visual rules for link utilization and
link-down state.

#### Scenario: Link Utilization Drives Link Style

- **WHEN** link utilization is below `50`
- **THEN** the link SHALL render with success state styling
- **WHEN** utilization is between `50` and `79`
- **THEN** the link SHALL render with info state styling
- **WHEN** utilization is between `80` and `89`
- **THEN** the link SHALL render with warning state styling
- **WHEN** utilization is at least `90`
- **THEN** the link SHALL render with error state styling

#### Scenario: Link Down Overrides Utilization

- **WHEN** `topoviewer_link_up` is `0`
- **THEN** down-state styling SHALL override utilization styling
- **AND** the affected link SHALL render red, dashed, and visually stronger
- **AND** adjacent endpoints SHALL show a status marker

### Requirement: Phase 2 Keeps Harness Fixture Parity

Grafana Phase 2 SHALL preserve Phase 1 fixture parity while adding telemetry.

#### Scenario: All Harness Fixtures Still Load

- **WHEN** Phase 2 smoke runs
- **THEN** every canonical harness fixture SHALL remain selectable in the
  Grafana panel
- **AND** every fixture SHALL render without blocking diagnostics
- **AND** `layered-network` and `clos-2spine-4leaf` SHALL receive detailed
  telemetry visual assertions

### Requirement: Phase 2 Docs Explain The Operational Workflow

Phase 2 documentation SHALL make the telemetry workflow usable by an operator or
developer.

#### Scenario: Docs Cover Authoring To Telemetry

- **WHEN** Phase 2 docs are added
- **THEN** they SHALL explain authoring a topology in the browser harness,
  preserving stable link IDs, generating Grafana fixtures, starting the local
  lab, injecting telemetry scenarios, selecting a fixture, observing visual
  changes, and troubleshooting missing or stale metrics
- **AND** the docs SHALL continue to mark Grafana as exploratory
