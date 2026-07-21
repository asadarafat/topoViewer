## ADDED Requirements

### Requirement: Studio canonical identity editing

Studio SHALL expose `id` as the primary editable identity and `labels.name` as
an optional visible alias. It SHALL NOT expose generic `name` as a competing
object field.

#### Scenario: Rename from Visual mode

- **WHEN** an author edits the selected object's ID
- **THEN** Studio previews affected references, applies the semantic rename
  atomically, keeps the new object selected, and creates one undo entry

#### Scenario: Rename from Code mode

- **WHEN** an author changes an ID scalar in topology YAML
- **THEN** Studio offers the same reference-safe refactor or reports dangling
  references rather than applying a partially valid document

#### Scenario: Edit the visible alias

- **WHEN** an author sets `labels.name`
- **THEN** only display content changes and graph references remain unchanged

### Requirement: Studio stylesheet ownership

Studio SHALL create and edit persistent appearance only in stylesheet YAML.

#### Scenario: Create or duplicate an object

- **WHEN** a palette item or duplicated object includes appearance
- **THEN** topology receives only canonical object facts and stylesheet receives
  the corresponding rule in the same transaction
