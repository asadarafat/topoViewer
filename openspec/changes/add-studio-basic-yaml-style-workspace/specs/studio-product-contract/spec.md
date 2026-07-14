# Studio Product Contract Delta

## ADDED Requirements

### Requirement: Candidate stylesheet lifecycle

Studio SHALL distinguish the applied project stylesheet from one temporary
candidate stylesheet used by Basic and YAML style authoring.

#### Scenario: Preview a valid candidate

- **WHEN** the candidate stylesheet validates successfully
- **THEN** the canvas renders that candidate immediately
- **AND** Studio identifies it as an unapplied style draft
- **AND** the applied project source remains unchanged until Apply or Save

#### Scenario: Preserve an invalid candidate

- **WHEN** candidate YAML has syntax, schema, semantic, or security errors
- **THEN** Studio retains the exact invalid text and exposes source diagnostics
- **AND** disables Apply
- **AND** renders the latest valid candidate rather than blanking the canvas

#### Scenario: Apply a candidate

- **WHEN** an author applies a valid dirty candidate
- **THEN** Studio commits one undoable stylesheet source replacement
- **AND** rebases candidate state to the new applied source revision
- **AND** does not persist the whole project unless Save is requested

#### Scenario: Revert a candidate

- **WHEN** an author reverts a dirty candidate
- **THEN** Basic and YAML return to the current applied stylesheet
- **AND** the project source and canvas selection remain unchanged

#### Scenario: Save with a valid candidate

- **WHEN** an author saves while a valid candidate is dirty
- **THEN** Studio applies the candidate and persists the resulting project as one
  user operation
- **AND** does not silently omit the previewed style changes

#### Scenario: Save with an invalid candidate

- **WHEN** an author saves while the candidate is invalid
- **THEN** Studio blocks persistence of that candidate
- **AND** focuses or links to the Style diagnostics
- **AND** retains both the invalid text and last valid project

#### Scenario: Leave the Style workspace

- **WHEN** an author closes Style or switches workspace within the same project
- **THEN** Studio preserves the candidate and its diagnostics
- **AND** reopening Style restores the same Basic/YAML mode and draft

#### Scenario: Replace the project or stylesheet externally

- **WHEN** a dirty candidate would be invalidated by project replacement or an
  external stylesheet revision
- **THEN** Studio requires Apply, Revert, or explicit discard
- **AND** never silently rebases or loses candidate text

### Requirement: Candidate state remains portable and host-neutral

Candidate style state SHALL be owned by Studio and SHALL behave equivalently in
browser and VS Code hosts.

#### Scenario: Recover after interruption

- **WHEN** bounded recovery captures a project with a dirty or invalid style
  candidate
- **THEN** Studio can restore candidate text separately from the last valid
  applied project
- **AND** no host promotes invalid candidate text to authoritative source

#### Scenario: Export before applying

- **WHEN** an author exports while a candidate remains unapplied
- **THEN** Studio requires the same valid Apply semantics used by Save
- **AND** exported consumers receive one canonical stylesheet, not hidden draft
  state
