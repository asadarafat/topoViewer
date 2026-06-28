## ADDED Requirements

### Requirement: Grafana Panel Package

TopoViewer SHALL add a dedicated Grafana panel package for Phase 1.

#### Scenario: Package Wraps TopoViewer Runtime

- **WHEN** the Grafana panel package is implemented
- **THEN** it SHALL import and render the existing `topoviewer` React runtime
- **AND** it SHALL NOT fork renderer components or style logic
- **AND** Grafana-specific plugin code SHALL stay inside
  `packages/grafana-topoviewer-panel`

#### Scenario: Package Builds Independently

- **WHEN** `npm run grafana:panel:build` is run
- **THEN** the Grafana panel bundle SHALL build without requiring Grafana,
  Docker, Prometheus, or Containerlab to be running

### Requirement: Canonical Harness Fixture Parity

The Grafana panel SHALL consume canonical browser harness fixtures.

#### Scenario: Fixture Discovery Matches Browser Harness

- **WHEN** Grafana fixtures are generated
- **THEN** fixture discovery SHALL read
  `packages/topoviewer/content/examples/catalog.yaml`
- **AND** it SHALL include only entries with `harness:` metadata
- **AND** it SHALL match browser harness source-file resolution, ordering,
  duplicate detection, and path safety semantics

#### Scenario: No Grafana-Owned YAML Copies

- **WHEN** Phase 1 fixture assets are generated
- **THEN** generated fixture assets SHALL be derived from canonical
  `packages/topoviewer/content/examples/**` files
- **AND** checked-in Grafana-only topology or stylesheet YAML copies SHALL NOT
  be used as source fixtures

#### Scenario: All Harness Fixtures Are Selectable

- **WHEN** the Grafana panel is opened
- **THEN** the panel SHALL expose every canonical harness fixture in a selector
- **AND** the initial required IDs SHALL include `layered-network`,
  `clos-2spine-4leaf`, `insert-workflow`, `attention-workflow`,
  `inspector-workflow`, and `dense-links`

### Requirement: Phase 1 Local Grafana Smoke

TopoViewer SHALL provide a local-only smoke path for proving Phase 1 in Grafana.

#### Scenario: Grafana Version Is Pinned

- **WHEN** the local Grafana lab starts
- **THEN** it SHALL use an exact Grafana image tag such as
  `grafana/grafana:13.1.0`
- **AND** it SHALL reject `latest`, unversioned images, and floating tags

#### Scenario: Smoke Iterates Harness Fixtures

- **WHEN** the Phase 1 Grafana smoke test runs
- **THEN** it SHALL iterate every canonical harness fixture
- **AND** each fixture SHALL render without blocking diagnostics
- **AND** detailed screenshots SHALL be captured for `layered-network` and
  `clos-2spine-4leaf`

### Requirement: Phase 1 Boundaries

Phase 1 SHALL stay narrow.

#### Scenario: Telemetry Is Excluded

- **WHEN** Phase 1 is implemented
- **THEN** it SHALL NOT add Prometheus, telemetry injector, Containerlab,
  telemetry rules, or operational use-case dashboards
- **AND** those SHALL remain Phase 2 or later work

#### Scenario: Public Status Remains Exploratory

- **WHEN** Phase 1 documentation is updated
- **THEN** Grafana SHALL remain marked exploratory
- **AND** docs SHALL NOT claim supported Grafana integration
