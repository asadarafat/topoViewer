## MODIFIED Requirements

### Requirement: Efficient repeated authoring

Studio SHALL provide clipboard, duplicate, delete, align, distribute, nudge,
resize, undo, redo, and contextual actions without requiring modal dialogs for
routine reversible work.

Layer operations SHALL be available from a dedicated Layers manager under
Project Source's Topology Outline and SHALL reuse the canonical layer
controller rather than being duplicated in canvas-toolbar or viewport settings.
The manager SHALL support creation, selection, rename, reorder, visibility,
selection membership, usage inspection, and safe replacement-on-delete.

Alignment assistance SHALL expose helper lines and alignment snapping as one
coherent primary choice. Fixed canvas dimensions and presentation overrides
SHALL remain available behind Advanced viewport disclosure.

#### Scenario: Duplicate and place an object

- **WHEN** a user duplicates a selected object
- **THEN** Studio creates a valid object with a collision-free identity and a
  visible offset
- **AND** preserves compatible style/data while repairing relationships that
  cannot be copied safely

#### Scenario: Use authoring shortcuts in the YAML editor

- **WHEN** keyboard focus is inside a text or Monaco editor
- **THEN** canvas shortcuts do not intercept normal editing commands unless the
  shortcut is explicitly scoped and documented for that editor

#### Scenario: Manage a layer through the canonical controller

- **WHEN** an author creates, renames, reorders, assigns, removes, or deletes a
  layer through Project Source
- **THEN** Studio applies the corresponding pure core authoring plan through one
  controller command
- **AND** creates one coherent history entry
- **AND** preserves unrelated source formatting and fields

#### Scenario: Delete a referenced layer safely

- **WHEN** an author deletes a layer that is referenced by topology objects
- **THEN** Studio requires an explicit replacement or removal decision
- **AND** prevents deletion of the final layer
- **AND** leaves no dangling layer references after confirmation
