## ADDED Requirements

### Requirement: Contextual YAML assistance command

Studio SHALL expose one context-help command backed by the canonical YAML
assist provider rather than a separate field registry or help model.

#### Scenario: Request help on a documented field

- **WHEN** the cursor is on a documented topology, stylesheet, or mapper field
  and the author invokes context help
- **THEN** Monaco shows the field documentation supplied by the existing hover
  contract
- **AND** editor focus remains in the active document

#### Scenario: Request help at an insertion point

- **WHEN** no documented field is active and the author invokes context help
- **THEN** Monaco shows completion compatible with the active document and
  cursor context
- **AND** does not suggest fields owned by an incompatible object or document

#### Scenario: Consume help in either Studio host

- **WHEN** browser Studio or the VS Code Studio webview invokes context help
- **THEN** both hosts use the same Studio editor and assist implementation
- **AND** neither host owns duplicate schema or completion metadata
