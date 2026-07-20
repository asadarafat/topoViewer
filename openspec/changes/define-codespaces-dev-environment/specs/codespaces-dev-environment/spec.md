## ADDED Requirements

### Requirement: Codespaces Is Repo-Wide

TopoViewer SHALL define Codespaces as a repo-wide development environment that
covers docs, authoring, and labs together.

#### Scenario: Grafana Does Not Own Codespaces

- **GIVEN** a contributor reads the Grafana integration roadmap
- **WHEN** Codespaces is mentioned
- **THEN** the roadmap points to this repo-wide Codespaces change
- **AND** Grafana phases remain focused on plugin and telemetry behavior
- **AND** Codespaces covers MkDocs, Zensical, TopoViewer Studio, synthetic
  Grafana, and Containerlab Grafana together.

### Requirement: Node 24 Bootstrap

Codespaces SHALL bootstrap the repository with the same Node.js contract as
local development and CI.

#### Scenario: Workspace Starts With Supported Toolchain

- **WHEN** a Codespaces workspace is created
- **THEN** Node.js 24 LTS is available
- **AND** `npm ci` uses the checked-in lockfile
- **AND** setup does not require maintainer secrets.

### Requirement: Public Preview Surfaces Run

Codespaces SHALL support the public docs and authoring preview surfaces.

#### Scenario: Docs Preview Runs

- **WHEN** a user runs `npm run docs:preview`
- **THEN** MkDocs is reachable at `/topoviewer/docs/mkdocs`
- **AND** Zensical is reachable at `/topoviewer/docs/zensical`
- **AND** TopoViewer Studio is reachable at `/topoviewer/studio`.

#### Scenario: Studio Dev Server Runs

- **WHEN** a user runs `npm run studio:dev`
- **THEN** TopoViewer Studio opens through the forwarded Vite URL
- **AND** visual authoring, YAML editing, validation, and canvas rendering work.

### Requirement: Grafana Labs Are Tiered

Codespaces SHALL distinguish the deterministic synthetic Grafana lab from the
privileged Containerlab Grafana lab.

#### Scenario: Synthetic Grafana Lab Runs Without Containerlab

- **WHEN** a user runs `npm run grafana:lab:up`
- **THEN** the synthetic Grafana/Prometheus lab starts without requiring
  Containerlab
- **AND** the panel uses mounted TopoViewer bundles rather than generated
  fixture source as the production-shaped input.

#### Scenario: Containerlab Has Explicit Preflight

- **WHEN** a user runs the Containerlab Grafana command in Codespaces
- **THEN** the command checks required privileges and dependencies before
  starting the topology
- **AND** unsupported hosted runtimes fail with an actionable message
- **AND** users are directed to the synthetic Grafana lab as the fallback.

### Requirement: Port Forwarding Is Documented

Codespaces SHALL document how to open each development surface through
forwarded ports.

#### Scenario: User Needs A URL

- **GIVEN** a user starts a docs, Studio, Grafana, or Containerlab command
- **WHEN** they read the Codespaces setup docs
- **THEN** they can identify which local default port is used
- **AND** they understand that the Codespaces forwarded URL may differ from the
  local default URL.

### Requirement: Codespaces Does Not Publish

Codespaces SHALL not perform release or package-publishing actions
automatically.

#### Scenario: Workspace Starts

- **WHEN** a Codespaces workspace is created or rebuilt
- **THEN** it SHALL NOT publish npm packages
- **AND** it SHALL NOT require npm tokens
- **AND** it SHALL NOT expose forwarded ports publicly by default
- **AND** release publishing remains a deliberate manual workflow.
