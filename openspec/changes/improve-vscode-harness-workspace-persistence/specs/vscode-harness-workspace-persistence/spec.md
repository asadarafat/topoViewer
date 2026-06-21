## ADDED Requirements

### Requirement: Browser fixtures are templates

The browser harness SHALL present bundled fixtures as starting templates rather
than the only editable topology documents.

#### Scenario: Create a custom topology

- **WHEN** the user clicks `New topology`
- **THEN** the harness SHALL create a saved custom topology entry
- **AND** the new topology SHALL contain valid Topology YAML with a default
  layer
- **AND** the custom topology SHALL appear in the template selector

#### Scenario: Save and refresh custom topology

- **WHEN** the user edits a custom topology and saves it
- **AND** the browser is refreshed
- **THEN** the harness SHALL reload the same custom topology
- **AND** the edited topology and stylesheet YAML SHALL be preserved

#### Scenario: Revert a template

- **WHEN** the user edits a template-derived topology
- **AND** the user clicks `Revert template`
- **THEN** the harness SHALL clear browser-local edits for that template
- **AND** the original fixture YAML SHALL be restored

### Requirement: YAML editor copy action

The browser harness SHALL let users copy active Monaco YAML content from the
editor surface.

#### Scenario: Copy active YAML

- **WHEN** the user opens the YAML panel
- **THEN** the active YAML editor SHALL show a top-right copy button
- **WHEN** the user clicks the copy button
- **THEN** the active topology or stylesheet YAML SHALL be copied
- **AND** the status strip SHALL show copy feedback
