## ADDED Requirements

### Requirement: Transactional attention authoring

Studio SHALL apply visual attention authoring through the canonical command and
session boundary. Each confirmed action SHALL produce at most one topology
source mutation and one coherent history entry.

#### Scenario: Commit and undo an attention action

- **WHEN** an author confirms a valid visual attention change
- **THEN** Studio computes the result from the latest valid semantic snapshot
- **AND** commits one command that preserves current selection
- **AND** undo and redo restore the complete previous and next Attention policy

#### Scenario: Reject a visual attention action

- **WHEN** the core contract rejects an unknown ID, invalid aggregate source,
  invalid threshold, or empty grouping key set
- **THEN** Studio reports one actionable command error
- **AND** source, preview, history, selection, and recovery state remain
  unchanged

#### Scenario: Keep attention authoring outside the initial bundle

- **WHEN** Studio starts without expanding Attention
- **THEN** the visual Attention manager is not part of the initial JavaScript
  chunk
- **AND** the existing startup and dense-project interaction budgets continue
  to pass
