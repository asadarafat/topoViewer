# Studio Direct Manipulation Delta

## MODIFIED Requirements

### Requirement: Resizable positioned objects

Studio SHALL resize nodes, shapes, callouts, and standalone text objects through
the shared renderer interaction and commit explicit geometry only at resize
completion.

#### Scenario: Resize with pointer

- **WHEN** an author drags a selected object's resize handle
- **THEN** geometry follows the pointer without transition lag or document
  recompilation
- **AND** resize completion commits one undoable position-and-size command
- **AND** a short completion cue confirms the operation

#### Scenario: Respect reduced motion

- **WHEN** the host requests reduced motion
- **THEN** resize geometry remains usable
- **AND** the completion animation is disabled

### Requirement: Direct label and text editing

Studio SHALL open a contextual editor when an author double-clicks an editable
object label or text surface.

#### Scenario: Edit a node label

- **WHEN** an author double-clicks a node and changes its displayed name
- **THEN** a Material quick editor opens next to the pointer
- **AND** Enter commits one undoable scalar mutation
- **AND** Escape cancels without changing YAML

#### Scenario: Edit standalone text

- **WHEN** an author double-clicks a standalone text object
- **THEN** the quick editor supports multiline text
- **AND** the canvas and YAML update after commit
- **AND** focus returns to the canvas

#### Scenario: Edit other visible labels

- **WHEN** an author double-clicks a region, shape, link, path, callout, or link
  direction with an editable visible label
- **THEN** Studio resolves the canonical scalar field
- **AND** the same quick-edit command and undo contract applies
