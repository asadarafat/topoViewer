## ADDED Requirements

### Requirement: Visual README first impression

TopoViewer SHALL make the first 30 seconds of the README visual and
product-facing before it explains repository architecture.

#### Scenario: README opens with product proof

- **WHEN** a reader opens `README.md`
- **THEN** the first substantive section SHALL describe what TopoViewer does for
  network, infrastructure, or service-topology diagrams
- **AND** it SHALL show or link directly to a rendered TopoViewer network visual
- **AND** package architecture details SHALL appear after the product proof

#### Scenario: README pairs YAML with output

- **WHEN** the README introduces TopoViewer authoring
- **THEN** it SHALL include a compact YAML snippet or link to the canonical
  example source
- **AND** it SHALL pair that source with a rendered visual or live demo link

#### Scenario: README keeps engineering entry points

- **WHEN** the README is reorganized
- **THEN** existing development, package, documentation, and quality-gate entry
  points SHALL remain available
- **AND** they SHALL NOT dominate the opening screen

### Requirement: Before/after YAML-to-diagram example

TopoViewer SHALL publish one polished before/after example that shows authored
YAML becoming a rendered network diagram.

#### Scenario: Before/after example is inspectable

- **WHEN** a user opens the before/after example page
- **THEN** the page SHALL include a rendered TopoViewer viewport
- **AND** it SHALL include the topology YAML and stylesheet YAML used to render
  the diagram
- **AND** the diagram SHALL use a small realistic network scenario rather than a
  generic graph

#### Scenario: Before/after visual is reproducible

- **WHEN** the README or docs use a static screenshot from the before/after
  example
- **THEN** the screenshot SHALL be derived from a first-party example
- **AND** the repo SHALL document how to refresh or validate it

### Requirement: Why TopoViewer section

TopoViewer SHALL provide a clear public "Why TopoViewer?" section.

#### Scenario: Why section explains supported value

- **WHEN** a user reads "Why TopoViewer?"
- **THEN** the section SHALL explain topology-as-data, selector stylesheets,
  embedded docs, attention controls, exportability, and TypeScript/MkDocs
  surfaces
- **AND** each claim SHALL map to existing supported behavior or be explicitly
  marked as roadmap

#### Scenario: Why section is network-specific

- **WHEN** the section describes the target use case
- **THEN** it SHALL use network, infrastructure, and service-topology language
- **AND** it SHALL NOT read like a generic graph visualization framework pitch

### Requirement: Integration roadmap composition

TopoViewer SHALL publish integration roadmap content by composing the standalone
integration roadmap OpenSpec changes, not by making unsupported product claims
in the visual-product page.

#### Scenario: Roadmap derives from integration specs

- **WHEN** the integration roadmap is written
- **THEN** NetBox wording SHALL follow
  `openspec/changes/define-netbox-integration-roadmap/`
- **AND** OpsMill/Infrahub wording SHALL follow
  `openspec/changes/define-opsmill-infrahub-integration-roadmap/`
- **AND** Grafana wording SHALL follow
  `openspec/changes/define-grafana-integration-roadmap/`
- **AND** VS Code wording SHALL follow
  `openspec/changes/define-vscode-integration-roadmap/`

#### Scenario: Supported integrations remain distinct

- **WHEN** the roadmap distinguishes current support from future direction
- **THEN** MkDocs and React/TypeScript support SHALL be marked as supported
- **AND** NetBox, OpsMill/Infrahub, Grafana, and VS Code SHALL NOT be marked as
  supported unless implementation work exists outside this product-story change

### Requirement: Real network demo page

TopoViewer SHALL publish one coherent public demo page with real network
examples.

#### Scenario: Demo covers the required network views

- **WHEN** the demo page is opened
- **THEN** it SHALL include underlay, BGP, service path, and failure view
  scenarios
- **AND** each scenario SHALL expose a live viewport, topology YAML, stylesheet
  YAML, and expected assertions when following the existing example pattern

#### Scenario: Demo uses realistic topology cues

- **WHEN** the demo renders
- **THEN** nodes, links, labels, regions, paths, styles, and attention behavior
  SHALL communicate network intent
- **AND** the demo SHALL avoid overly crowded first-screen visuals

#### Scenario: Demo is covered by tests

- **WHEN** CI or focused validation runs
- **THEN** Playwright or equivalent docs/example tests SHALL verify that the
  demo page renders the expected live viewport and tab content
- **AND** semantic validation SHALL cover the authored YAML examples

### Requirement: Shared documentation surfaces

TopoViewer SHALL keep MkDocs and Zensical documentation aligned for the selected
product-story pages.

#### Scenario: MkDocs and Zensical receive shared pages

- **WHEN** the product-story docs are synced
- **THEN** the selected pages SHALL appear in MkDocs
- **AND** the Zensical sync SHALL include equivalent content or explicitly
  document why a page is MkDocs-only

#### Scenario: Navigation exposes the story

- **WHEN** the generated docs navigation is rendered
- **THEN** "Why TopoViewer?", the integration roadmap, and the real network demo
  SHALL be discoverable without requiring users to know example folder names

## MODIFIED Requirements

### Requirement: Public product documentation

TopoViewer SHALL prioritize visual, user-facing proof before architecture in
public entry points.

#### Scenario: Existing docs remain available

- **WHEN** product-story pages are added
- **THEN** existing reference, examples, integration, production, and release
  docs SHALL remain reachable
- **AND** existing example-generation workflows SHALL continue to use canonical
  `camelCase` YAML and stylesheet keys
