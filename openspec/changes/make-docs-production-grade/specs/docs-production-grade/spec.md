# docs-production-grade Specification

## ADDED Requirements

### Requirement: Documentation Must Provide Guided Adoption Paths

TopoViewer documentation SHALL provide task-oriented adoption paths for the
main supported user workflows.

#### Scenario: New user creates first topology

- **GIVEN** a user has cloned the repository or installed the package
- **WHEN** they open the public docs
- **THEN** they can find a first-topology guide that includes topology YAML,
  stylesheet YAML, local preview instructions, validation instructions, and the
  expected rendered result.

#### Scenario: User chooses an integration surface

- **GIVEN** a user wants to use TopoViewer in documentation or an application
- **WHEN** they read integration docs
- **THEN** supported, experimental, and roadmap integrations are clearly
  separated.

### Requirement: Public YAML Fields Must Be Documented

TopoViewer documentation SHALL include reference coverage for public YAML fields
that authors can declare.

#### Scenario: User looks up a graph node field

- **GIVEN** a user wants to know how to author `graph.nodes[]`
- **WHEN** they open the topology YAML reference
- **THEN** every public node field is listed with type, required/optional state,
  default behavior, validation rules, interactions, and an example when useful.

#### Scenario: User looks up CLOS layout options

- **GIVEN** a user wants automatic CLOS layout
- **WHEN** they open the layout reference
- **THEN** CLOS options, inference rules, diagnostics, and override mechanisms
  are documented without assuming a data-center-specific vocabulary.

### Requirement: Public Style Keys Must Be Documented

TopoViewer documentation SHALL describe every public style key accepted by the
canonical style metadata/defaults registry.

#### Scenario: Style key exists in registry

- **GIVEN** a style key is present in the canonical registry
- **WHEN** docs lint runs
- **THEN** the stylesheet reference must include the key, target kind, accepted
  values or data type, default behavior, and practical use.

### Requirement: Public TypeScript Exports Must Be Classified

TopoViewer documentation SHALL classify exported TypeScript APIs by stability
and document public stable or experimental exports.

#### Scenario: Export is public stable

- **GIVEN** an API is exported from `topoviewer`
- **WHEN** it is classified as public stable
- **THEN** docs include its purpose, input contract, output contract, example
  usage, and error behavior where applicable.

#### Scenario: Export is not supported public API

- **GIVEN** an API is exported for current package needs but is not intended as a
  stable public API
- **WHEN** docs are generated or checked
- **THEN** the API is classified as internal/experimental or removed from the
  public export surface in a separate change.

### Requirement: Examples Must Explain Expected Behavior

Public example pages SHALL teach the behavior they demonstrate, not only render
the YAML.

#### Scenario: User opens an example page

- **GIVEN** a generated public example page
- **WHEN** the page is rendered in MkDocs or Zensical
- **THEN** it includes a live viewport, topology YAML, stylesheet YAML, and prose
  that explains what the viewport should show and which YAML fields matter.

#### Scenario: Example uses attention interaction

- **GIVEN** an example demonstrates focus, collapse, grouping, or drill-down
- **WHEN** the user reads the example
- **THEN** it explains what to click, what visual change to expect, and how to
  reset or reverse the interaction when supported.

### Requirement: Documentation Build Must Detect Drift

Docs checks SHALL fail when public documentation drifts from source-of-truth
metadata, generated content, or navigation expectations.

#### Scenario: Generated docs are stale

- **GIVEN** canonical content changes
- **WHEN** CI runs
- **THEN** generated package docs, MkDocs docs, Zensical docs, and README
  projections must be checked for drift.

#### Scenario: Unexpected orphan page exists

- **GIVEN** MkDocs reports a Markdown page not included in nav
- **WHEN** that page is not in the generated-page allowlist
- **THEN** docs validation fails.

#### Scenario: Public link is broken

- **GIVEN** a local Markdown link or anchor points to a missing target
- **WHEN** docs lint runs
- **THEN** docs validation fails with the source file and broken target.

### Requirement: README, Docs Home, And Why Page Must Have Distinct Jobs

The README, documentation home, and Why TopoViewer page SHALL avoid uncontrolled
product-message duplication.

#### Scenario: User opens repository README

- **GIVEN** a user opens `README.md`
- **WHEN** they scan it
- **THEN** it focuses on repository orientation, fast local result, package
  layout, and links to public docs.

#### Scenario: User opens public docs home

- **GIVEN** a user opens the published docs home
- **WHEN** they scan it
- **THEN** it routes them to the right adoption path and highlights the most
  important live demo.

#### Scenario: User opens Why TopoViewer

- **GIVEN** a user wants to understand product fit
- **WHEN** they open Why TopoViewer
- **THEN** it explains the product argument, fit/non-fit guidance, and
  differentiation from Mermaid-style text diagrams.
