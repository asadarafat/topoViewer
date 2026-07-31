## MODIFIED Requirements

### Requirement: Mapper authoring in the shared workspace

Studio SHALL author the optional telemetry mapper in the same project and
selection-driven workbench as topology and style, without creating a Grafana-
specific topology mode. Mapper YAML SHALL use the shared source editor, while
rule forms, inference, sample analysis, and coverage SHALL use the preview-local
Mapper Visual drawer.

#### Scenario: Add telemetry to an existing project

- **WHEN** a user commits the first valid rule for a project without
  `mapper.yaml`
- **THEN** Studio creates the mapper document and first rule in one undoable
  transaction
- **AND** project source lists the new mapper document
- **AND** merely opening Mapper, selecting an object, searching fields, opening
  source, or expanding View More does not mutate the project
- **AND** keeps topology identity and visual policy in their existing documents
- **AND** the project remains usable by consumers that ignore mapper data

#### Scenario: Select an object while inspecting telemetry

- **WHEN** a user selects a topology object while Mapper Visual is pinned
- **THEN** Studio shows mapper rules and coverage relevant to that object
- **AND** derives rule target kind from the selection without another target
  chooser
- **AND** the same preview selection remains active in topology and style views

#### Scenario: Author whole-graph telemetry

- **WHEN** Mapper Visual opens without a selected object
- **THEN** Studio uses whole-graph context
- **AND** does not require a synthetic canvas selection

#### Scenario: Edit mapper source

- **WHEN** an author opens mapper YAML from project source or a Mapper source
  action
- **THEN** Studio uses the shared Monaco editor with mapper completion, hover,
  context help, diagnostics, Apply, and Revert
- **AND** keeps Mapper Visual state and sample analysis available when the
  author returns to preview

#### Scenario: Reject ambiguous mapping context

- **WHEN** selection mixes incompatible object kinds or contains an unsupported
  object
- **THEN** Studio disables rule creation
- **AND** explains which compatible selection is required
