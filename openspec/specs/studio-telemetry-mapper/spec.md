# studio-telemetry-mapper Specification

## Purpose
Define portable telemetry-mapper authoring, inference, diagnostics, styling,
and lossless round trips within the same Studio project as topology and style.

## Requirements
### Requirement: Mapper authoring in the shared workspace

Studio SHALL author the optional telemetry mapper in the same project and
selection-driven workspace as topology and style, without creating a Grafana-
specific topology mode.

#### Scenario: Add telemetry to an existing project

- **WHEN** a user commits the first valid rule for a project without
  `mapper.yaml`
- **THEN** Studio creates the mapper document and first rule in one undoable
  transaction
- **AND** merely opening Mapper, selecting an object, searching fields, or
  expanding View More does not mutate the project
- **AND** keeps topology identity and visual policy in their existing documents
- **AND** the project remains usable by consumers that ignore mapper data

#### Scenario: Select an object while inspecting telemetry

- **WHEN** a user selects a topology object in telemetry view
- **THEN** Studio shows mapper rules and coverage relevant to that object
- **AND** derives rule target kind from the selection without another target
  chooser
- **AND** the same canvas selection remains active in topology and style views

#### Scenario: Author whole-graph telemetry

- **WHEN** Mapper opens without a selected object
- **THEN** Studio uses whole-graph context
- **AND** does not require a synthetic canvas selection

#### Scenario: Reject ambiguous mapping context

- **WHEN** selection mixes incompatible object kinds or contains an unsupported
  object
- **THEN** Studio disables rule creation
- **AND** explains which compatible selection is required

### Requirement: Complete mapper contract coverage

Studio SHALL derive mapper controls from the canonical mapper schema and
authoring metadata, and SHALL account explicitly for every public mapper field.

#### Scenario: Add a mapper field

- **WHEN** the public mapper schema gains a field
- **THEN** CI fails until the field is supported by a generated control, a
  specialized editor, or a reviewed raw-YAML-only declaration
- **AND** documentation states any temporary UI limitation

#### Scenario: Inspect all mapper fields

- **WHEN** a user activates View More or searches mapper fields
- **THEN** every field applicable to the current rule shape is discoverable
- **AND** search covers common and less-common fields without a separate mode
- **AND** conditional fields appear only when their parent contract enables them

### Requirement: Progressive mapper workflow

Studio SHALL provide one compact common-rule workflow with progressive access to
canonical mappings, transforms, formatting, states, and conflict behavior. It
SHALL NOT require the author to choose Basic, Advanced, or All modes.

#### Scenario: Build a common link rule

- **WHEN** a user selects a link and creates a common telemetry rule
- **THEN** Studio asks for the metric, identity/join field, value, and optional
  state thresholds
- **AND** uses the selected link as the target context
- **AND** produces a canonical valid mapper representation

#### Scenario: Edit canonical mappings

- **WHEN** a user activates View More or searches for a less-common field
- **THEN** identity, selection, extraction, normalization, transforms, state,
  formatting, style, priority, and diagnostic behavior are editable according
  to the installed mapper contract

#### Scenario: Manage the mapper document

- **WHEN** a mapper document exists
- **THEN** whole-file export and removal are available from Mapper actions
- **AND** these infrequent actions do not occupy the common rule form

### Requirement: Target-compatible mapper styling

Mapper default and state styles SHALL reuse canonical style authoring metadata
for the selected target object kind.

#### Scenario: Style a link state

- **WHEN** a mapper rule targets links and a user edits a state style
- **THEN** Studio displays fields compatible with links and link directions
- **AND** rejects node-only or region-only style fields
- **AND** uses the same canonical labels, controls, validation, and common-field
  eligibility as ordinary stylesheet authoring

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
