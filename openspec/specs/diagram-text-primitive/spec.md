# diagram-text-primitive Specification

## Purpose
Define safe, layer-aware standalone text objects, their visual style contract,
and the host-neutral authoring operations used to manipulate them.

## Requirements
### Requirement: Standalone text objects

TopoViewer SHALL accept standalone text objects in `diagram.texts` and render
them as inert, layer-aware, positioned diagram objects.

#### Scenario: Render a multiline text object

- **WHEN** a valid document declares a text object with `text`, `position`,
  `size`, and layers
- **THEN** the compiler emits one text node with stable source identity
- **AND** the renderer preserves line breaks without interpreting HTML
- **AND** layer filtering behaves like shapes and callouts

#### Scenario: Reject unsafe interpretation

- **WHEN** text contains HTML, script-like syntax, or template delimiters
- **THEN** the renderer displays the content as inert text
- **AND** no HTML or script execution path is introduced

### Requirement: Text style contract

TopoViewer SHALL publish schema, validation, authoring metadata, defaults, and
runtime support for the canonical text style keys.

#### Scenario: Author a text color

- **WHEN** a stylesheet targets `text` and sets supported typography,
  alignment, appearance, geometry, interaction, or draw-order keys
- **THEN** validation accepts the values
- **AND** compilation applies them deterministically
- **AND** Studio exposes them in Basic or All authoring views

### Requirement: Text authoring contract

Pure authoring APIs SHALL create, find, copy, paste, move, resize, delete, and
layer standalone text objects without host-specific logic.

#### Scenario: Create and resize text

- **WHEN** Studio creates a text object and commits a resize
- **THEN** one `diagram.texts` entry is inserted
- **AND** its explicit position and size are updated in one undoable command
- **AND** unrelated source content remains unchanged
