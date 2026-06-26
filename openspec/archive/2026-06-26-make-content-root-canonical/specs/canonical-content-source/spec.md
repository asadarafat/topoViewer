## ADDED Requirements

### Requirement: Single editable content root

TopoViewer SHALL use `packages/topoviewer/content/**` as the only manually
edited source for product docs, reference prose, runnable examples, example
catalog metadata, and example test expectation metadata.

#### Scenario: Contributor edits documentation

- **WHEN** a contributor needs to change a TopoViewer documentation page
- **THEN** they SHALL edit `packages/topoviewer/content/pages/**`
- **AND** they SHALL NOT manually edit generated `packages/topoviewer/docs/**`
  or `docs/topoviewer/**` as the source of truth

#### Scenario: Contributor edits examples

- **WHEN** a contributor needs to change a TopoViewer example
- **THEN** they SHALL edit `packages/topoviewer/content/examples/**`
- **AND** generated package examples, MkDocs examples, and Zensical examples
  SHALL be regenerated from that source

### Requirement: Product positioning is canonical

TopoViewer SHALL define its public product message once under the content root
and compose public entry points from that source.

#### Scenario: Product positioning source exists

- **WHEN** content source is migrated
- **THEN** `packages/topoviewer/content/pages/_fragments/product-positioning.md`
  SHALL define the canonical product message
- **AND** root `README.md`, root `docs/index.md`, `why-topoviewer.md`, and
  related product pages SHALL reuse or be generated from that message

#### Scenario: Topology as Code is defined

- **WHEN** public product pages describe TopoViewer
- **THEN** they SHALL position TopoViewer as "Topology as Code"
- **AND** they SHALL define topology as declarative diagrams or graphs for
  network, infrastructure, service, or similarly connected systems
- **AND** they SHALL explain that topology facts, stylesheets, layers, paths,
  regions, labels, data, and attention behavior are authored as code

#### Scenario: Mermaid.js distinction is explicit

- **WHEN** public product pages compare TopoViewer to existing diagram-as-code
  tools
- **THEN** they SHALL explain that TopoViewer is not a generic Mermaid.js
  replacement
- **AND** they SHALL distinguish TopoViewer as a semantic, data-driven topology
  renderer and TypeScript library for inspectable, embeddable topology views
- **AND** they SHOULD call out topology YAML, selector stylesheets, layers,
  regions, paths, attention/focus, and runtime APIs as differentiators

#### Scenario: Integration surface wording is consistent

- **WHEN** public product pages discuss integration surfaces
- **THEN** they SHALL identify `topoviewer` as the npm/TypeScript library
  surface for embedding in end products
- **AND** they SHALL identify MkDocs and Zensical as documentation embed
  surfaces according to their current support status
- **AND** they SHALL identify the browser harness and VS Code extension as
  authoring/preview surfaces
- **AND** the VS Code roadmap wording SHALL include automatic TopoViewer YAML
  detection from the VS Code Explorer, preview, validation, and authoring
  workflows
- **AND** NetBox and OpsMill/Infrahub SHALL be described as roadmap plugin
  visualizers that derive topology from platform data
- **AND** roadmap surfaces SHALL NOT be marked as supported until implemented

#### Scenario: Product message drift is checked

- **WHEN** `npm run check:content` or `npm run ci` runs
- **THEN** generated `README.md` and `docs/index.md` SHALL be checked for
  staleness against the canonical product-positioning source
- **AND** CI SHALL fail if those entry points drift from generated content

### Requirement: Generated compatibility projections

TopoViewer SHALL keep existing public and package paths available as generated
projections until a separate release decision removes or changes them.

#### Scenario: Package docs are generated

- **WHEN** content sync runs
- **THEN** `packages/topoviewer/docs/**` SHALL be generated from
  `packages/topoviewer/content/pages/**`
- **AND** CI SHALL detect stale generated package docs

#### Scenario: Package examples are generated

- **WHEN** content sync runs
- **THEN** `packages/topoviewer/examples/**` SHALL be generated from
  `packages/topoviewer/content/examples/**`
- **AND** CI SHALL detect stale generated package examples

#### Scenario: Public docs are generated

- **WHEN** docs sync or docs build runs
- **THEN** `docs/topoviewer/**` and Zensical mirrored content SHALL derive from
  `packages/topoviewer/content/**`
- **AND** existing public MkDocs and Zensical URL shapes SHALL remain stable

### Requirement: Canonical example catalog

TopoViewer SHALL keep one canonical example catalog under the content root.

#### Scenario: Example pages are generated

- **WHEN** reference pages or public example pages are generated
- **THEN** generation SHALL read catalog metadata from
  `packages/topoviewer/content/examples/catalog.yaml`
- **AND** the generated pages SHALL keep live viewport, topology YAML,
  stylesheet YAML, and relevant attention YAML aligned with the same example
  source files

#### Scenario: Expected metadata remains internal

- **WHEN** public documentation pages are generated
- **THEN** `expected.yaml` SHALL NOT be surfaced as a public docs tab
- **AND** `expected.yaml` SHALL remain available for CI, schema validation,
  semantic validation, generated catalog metadata, and Playwright tests

### Requirement: Duplicate canonical example YAML is eliminated

TopoViewer SHALL avoid multiple canonical copies of identical authored topology
or stylesheet YAML.

#### Scenario: Two public pages use the same full example

- **WHEN** two public examples need the same topology, stylesheet, and expected
  metadata
- **THEN** the catalog SHALL represent one canonical fixture and one or more
  page aliases
- **AND** generated projections MAY materialize separate files for
  compatibility
- **AND** contributors SHALL NOT maintain two identical canonical fixture
  directories

#### Scenario: Two examples share only stylesheet source

- **WHEN** two examples have different topology YAML but identical stylesheet
  YAML
- **THEN** the content root SHOULD represent the stylesheet as a shared source
  or an explicit catalog-level reuse
- **AND** generated projections MAY copy that stylesheet into each public
  example folder

#### Scenario: Expected metadata is identical

- **WHEN** two examples have identical `expected.yaml`
- **THEN** that duplication MAY remain if the metadata is small, internal, and
  semantically correct for both examples
- **AND** it SHALL NOT force public example deduplication by itself

### Requirement: Content sync is deterministic

TopoViewer SHALL provide deterministic content sync and check commands.

#### Scenario: Sync command runs

- **WHEN** `npm run sync:content` runs
- **THEN** generated docs/examples projections SHALL be updated from
  `packages/topoviewer/content/**`
- **AND** running the command twice without source changes SHALL produce no
  additional git diff

#### Scenario: Check command runs

- **WHEN** `npm run check:content` or `npm run ci` runs
- **THEN** stale generated projections SHALL fail the command
- **AND** the failure message SHALL identify which generated output is stale

### Requirement: Contributor workflow is explicit

TopoViewer SHALL document the new edit boundary.

#### Scenario: Developer reads contribution docs

- **WHEN** a developer wants to change docs or examples
- **THEN** the docs SHALL state that edits start in
  `packages/topoviewer/content/**`
- **AND** the docs SHALL list the sync and validation commands required before
  committing
