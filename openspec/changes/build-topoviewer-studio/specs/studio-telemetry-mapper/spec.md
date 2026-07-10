## ADDED Requirements

### Requirement: Mapper authoring in the shared workspace

Studio SHALL author the optional telemetry mapper in the same project and
selection-driven workspace as topology and style, without creating a Grafana-
specific topology mode.

#### Scenario: Add telemetry to an existing project

- **WHEN** a user enables mapper authoring for a project without `mapper.yaml`
- **THEN** Studio creates a minimal valid mapper document
- **AND** keeps topology identity and visual policy in their existing documents
- **AND** the project remains usable by consumers that ignore mapper data

#### Scenario: Select an object while inspecting telemetry

- **WHEN** a user selects a topology object in telemetry view
- **THEN** Studio shows mapper rules and coverage relevant to that object
- **AND** the same canvas selection remains active in topology and style views

### Requirement: Complete mapper contract coverage

Studio SHALL derive mapper controls from the canonical mapper schema and
authoring metadata, and SHALL account explicitly for every public mapper field.

#### Scenario: Add a mapper field

- **WHEN** the public mapper schema gains a field
- **THEN** CI fails until the field is supported by a generated control, a
  specialized editor, or a reviewed raw-YAML-only declaration
- **AND** documentation states any temporary UI limitation

#### Scenario: Inspect all mapper fields

- **WHEN** a user opens the Advanced or All mapper view
- **THEN** every field applicable to the current rule shape is discoverable
- **AND** conditional fields appear only when their parent contract enables them

### Requirement: Basic and Advanced mapper workflows

Studio SHALL provide a compact Basic workflow for common joins and a complete
Advanced workflow for canonical mappings, transforms, formatting, states, and
conflict behavior.

#### Scenario: Build a common link rule

- **WHEN** a user creates a Basic link telemetry rule
- **THEN** Studio asks for the metric, target kind, identity/join field, value,
  and optional state thresholds
- **AND** produces a canonical valid mapper representation

#### Scenario: Edit canonical mappings

- **WHEN** a user opens Advanced mapper authoring
- **THEN** identity, selection, extraction, normalization, transforms, state,
  formatting, style, priority, and diagnostic behavior are editable according
  to the installed mapper contract

### Requirement: Target-compatible mapper styling

Mapper default and state styles SHALL reuse canonical style authoring metadata
for the selected target object kind.

#### Scenario: Style a link state

- **WHEN** a mapper rule targets links and a user edits a state style
- **THEN** Studio displays fields compatible with links and link directions
- **AND** rejects node-only or region-only style fields
- **AND** uses the same labels, controls, validation, and Basic/Advanced profile
  as ordinary stylesheet authoring

### Requirement: Sample-driven rule inference

Studio SHALL accept bounded local sample telemetry and use it to propose
auditable mapper rules without silently guessing ambiguous identity.

#### Scenario: Drag a metric onto an object

- **WHEN** a user drags a discovered metric onto a topology object
- **THEN** Studio inspects sample labels and stable object identity
- **AND** proposes a rule with a preview of matched objects and samples
- **AND** asks only for missing or ambiguous join decisions
- **AND** does not commit until the proposal validates

#### Scenario: Infer multiple possible joins

- **WHEN** more than one label can map the sample to topology objects
- **THEN** Studio displays the candidates and their coverage
- **AND** requires an explicit selection instead of choosing silently

### Requirement: Mapper coverage diagnostics

Studio SHALL evaluate sample telemetry against the current mapper and classify
resolution outcomes without requiring Grafana.

#### Scenario: Inspect mapper coverage

- **WHEN** a user runs coverage against sample data
- **THEN** Studio reports resolved, unresolved, ambiguous, duplicate, ignored,
  and invalid samples
- **AND** links each result to the responsible rule and topology object where
  applicable

#### Scenario: Handle high-cardinality samples

- **WHEN** sample count exceeds the documented interactive limit
- **THEN** Studio bounds processing and memory use
- **AND** offers sampling or an explicit higher-limit confirmation
- **AND** keeps canvas interaction responsive

### Requirement: Mapper round-trip safety

Structured mapper edits SHALL preserve comments, ordering, unknown fields, and
unsupported future constructs according to the same lossless source rules as
topology and stylesheet editing.

#### Scenario: Import a future mapper extension

- **WHEN** a mapper contains an unknown extension field
- **THEN** Studio preserves it through unrelated structured edits
- **AND** identifies that field as unsupported by the current visual editor

