## ADDED Requirements

### Requirement: Public Entry Point Clarity

The repository SHALL make the stable TopoViewer core understandable from the
README and docs home without requiring users to understand the monorepo,
OpenSpec history, labs, or experimental integrations.

#### Scenario: First screen explains the product

- **GIVEN** a new user opens the README or published docs home
- **WHEN** they read the first screen
- **THEN** they can identify TopoViewer as Topology as Code for semantic,
  interactive diagrams
- **AND** they can see a visual result
- **AND** they can reach a first working topology path.

#### Scenario: Stable path is separated from roadmap

- **GIVEN** a user is evaluating adoption
- **WHEN** they browse docs navigation
- **THEN** supported install, authoring, embedding, and reference material is
  visually separated from roadmap, lab, and maintainer content.

### Requirement: Support Status Taxonomy

The public docs SHALL classify major surfaces as Supported, Experimental, Lab,
Roadmap, or Maintainer.

#### Scenario: Integration status is visible

- **GIVEN** a user reads about React, MkDocs, Zensical, Grafana, VS Code,
  NetBox, or OpsMill/Infrahub
- **WHEN** the integration is mentioned in README, docs home, integration
  roadmap, or package README
- **THEN** the status is explicit and consistent.

#### Scenario: Roadmap does not imply support

- **GIVEN** a feature is only planned or in OpenSpec
- **WHEN** it is described in public docs
- **THEN** it is labeled Roadmap and does not use wording that implies a
  supported package or stable user workflow.

### Requirement: Curated Example Path

The docs SHALL provide a small curated example path separate from the generated
test catalog.

#### Scenario: User wants a copyable network example

- **GIVEN** a user wants to learn by copying YAML
- **WHEN** they open Examples
- **THEN** they see curated examples for basic graph, CLOS fabric, real network,
  node styling, edge styling, and attention before the exhaustive generated
  catalog.

#### Scenario: Generated catalog remains available

- **GIVEN** a user needs full feature coverage
- **WHEN** they open the reference/test catalog
- **THEN** they can still access every generated live viewport, topology YAML,
  stylesheet YAML, and relevant attention YAML.

### Requirement: Promotional Walkthrough Video

The README SHALL include a playable promotional walkthrough video or a
GitHub-compatible video fallback that demonstrates YAML becoming an interactive
TopoViewer graph across the main public surfaces.

#### Scenario: Video is generated repeatably

- **GIVEN** the local docs preview and Grafana lab surfaces are running
- **WHEN** the promotional recording command runs
- **THEN** Playwright records a deterministic walkthrough artifact
- **AND** the artifact is written under `.artifacts/promo/`
- **AND** the artifact includes a poster image.

#### Scenario: Video tells the YAML-to-graph story

- **GIVEN** a user watches the README video
- **WHEN** the video plays
- **THEN** it shows topology/style YAML
- **AND** it shows the rendered graph in the browser harness
- **AND** it shows the same live viewport in MkDocs
- **AND** it shows the same live viewport in Zensical
- **AND** it shows Grafana rendering a mounted-bundle topology with telemetry
  overlay behavior.

#### Scenario: README uses durable hosted asset

- **GIVEN** the final video has been reviewed
- **WHEN** it is added to the README
- **THEN** the README uses a GitHub-hosted uploaded media asset or an equivalent
  durable hosted URL
- **AND** a poster image or linked demo page exists as fallback
- **AND** local-only `.artifacts` paths are not referenced by public docs.

### Requirement: Stable Contract Visibility

The docs SHALL clearly show which YAML, stylesheet, and TypeScript API surfaces
are stable enough for users to depend on.

#### Scenario: User checks a YAML field

- **GIVEN** a user reads the model reference or schema page
- **WHEN** a field is stable, experimental, or internal
- **THEN** its status and accepted values are clear.

#### Scenario: User checks an exported API

- **GIVEN** a user reads the React or TypeScript API docs
- **WHEN** an export is documented
- **THEN** the docs show intended use and stability status.

### Requirement: Differentiation Without Hype

The docs SHALL explain how TopoViewer differs from broad text-to-diagram tools,
raw graph/canvas libraries, and static image workflows.

#### Scenario: User compares TopoViewer with Mermaid.js

- **GIVEN** a user asks why not Mermaid.js
- **WHEN** they read the comparison
- **THEN** they understand that TopoViewer is narrower and more semantic:
  topology facts, reusable stylesheets, interaction, validation, embeds, and
  runtime APIs.

#### Scenario: User compares TopoViewer with React Flow directly

- **GIVEN** a user asks why not build directly with React Flow
- **WHEN** they read the comparison
- **THEN** they understand that TopoViewer provides a topology schema,
  stylesheet compiler, examples, docs embeds, validation, and authoring path on
  top of React Flow.

### Requirement: Public Docs Quality Gates

CI SHALL protect public docs from structural drift.

#### Scenario: Public nav regresses

- **GIVEN** a change edits nav, generated docs, README, or content pages
- **WHEN** docs lint runs
- **THEN** it detects unexpected public nav drift, missing status labels,
  broken public links, or generated projection drift.

#### Scenario: Representative examples regress visually

- **GIVEN** a change affects renderer CSS, examples, docs embeds, or the harness
- **WHEN** representative visual checks run
- **THEN** they verify at least one curated example across harness, MkDocs, and
  Zensical.
