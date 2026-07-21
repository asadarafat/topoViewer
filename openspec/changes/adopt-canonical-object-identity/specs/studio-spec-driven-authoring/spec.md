## ADDED Requirements

### Requirement: Identity-aware authoring metadata

Studio SHALL derive identity fields, alias selectors, validation, and assistance
from the canonical core contract.

#### Scenario: Suggest a visible alias selector

- **WHEN** a selected object has `labels.name: Client`
- **THEN** Studio suggests `node[labels.name = "Client"]` and previews all matches

#### Scenario: Keep topology code free of appearance

- **WHEN** an author requests a style change in Visual mode
- **THEN** Studio updates stylesheet source and leaves topology source unchanged
