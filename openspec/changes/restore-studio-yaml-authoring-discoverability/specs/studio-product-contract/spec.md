## ADDED Requirements

### Requirement: Discoverable schema-aware YAML authoring

Studio SHALL expose schema-aware YAML authoring as a first-class operation in
the Code representation owned by each authoring workspace.

#### Scenario: Open topology or stylesheet source

- **WHEN** an author opens topology or stylesheet YAML from Properties Code
- **THEN** Studio renders the shared Monaco editor
- **AND** exposes a visible, accessible context-help command in the editor
  toolbar
- **AND** keeps the canvas available beside the editor

#### Scenario: Open mapper source

- **WHEN** an author opens mapper YAML from Mapper Code
- **THEN** Studio renders the same shared Monaco editor contract
- **AND** exposes the same context-help command

#### Scenario: Preserve existing code authoring

- **WHEN** an author uses Code after this change
- **THEN** completion, hover, diagnostics, `?` discovery, search, drafts,
  Apply, Revert, and Visual/Code state continue to work
- **AND** Monaco remains lazy until a Code editor is required
