# studio-direct-manipulation Specification

## Purpose
Define graph-valid, transactional canvas authoring for creating, connecting,
positioning, grouping, selecting, and editing TopoViewer objects directly.
## Requirements
### Requirement: Drag-to-create object palette

Studio SHALL provide a searchable object palette whose templates can be dragged
directly onto the canvas to create topology and annotation objects.

#### Scenario: Create a node in one gesture

- **WHEN** a user drags a node template from the palette and drops it at a valid
  canvas position
- **THEN** Studio creates one schema-valid node at that position
- **AND** assigns a deterministic collision-free ID and compatible default layer
- **AND** selects the node and exposes its Inspector
- **AND** records one undo transaction

#### Scenario: Drop on an invalid target

- **WHEN** a palette item is dropped where that object cannot be created
- **THEN** Studio does not mutate the project
- **AND** provides an accessible explanation of the invalid target

#### Scenario: Create without pointer drag

- **WHEN** a keyboard or assistive-technology user chooses an object template
- **THEN** Studio provides an equivalent choose-and-place workflow
- **AND** the resulting object and history behavior match pointer creation

#### Scenario: Browse canonical object families

- **WHEN** a user browses the palette
- **THEN** templates are grouped under their canonical object family
- **AND** Basic and styled variants remain within that family
- **AND** a styled template such as Router creates a valid node backed by a
  declared local icon rather than appearing as an unrelated asset object

#### Scenario: Create a self-contained visual node template

- **WHEN** a user creates a Router or Switch from the palette
- **THEN** the palette previews the trusted local SVG used by that template
- **AND** the created node references the corresponding icon key
- **AND** Studio writes the required icon declaration to `stylesheet.yaml` when
  the opened project does not already declare it
- **AND** the project remains portable without remote image dependencies

#### Scenario: Complete an immediate creation command

- **WHEN** a user activates or drops a placeable node, region, annotation, or
  preset template
- **THEN** Studio creates the object and completes that command immediately
- **AND** does not leave the template visually selected as a persistent mode

### Requirement: Direct graph relationship authoring

Studio SHALL use visible React Flow connection affordances and graph-semantic
validation for relationship creation through an explicit transient edge mode.
Only relationship tools SHALL remain active while waiting for endpoints.

#### Scenario: Enter edge authoring

- **WHEN** a user activates Link, Parallel link, Parent link pipe, or Directional
  traffic
- **THEN** Studio highlights compatible endpoints for that relationship
- **AND** exits the mode after one successful relationship, a second activation,
  or `Escape`

#### Scenario: Connect two nodes

- **WHEN** a user drags from a valid source affordance to a valid target
  affordance
- **THEN** Studio creates a link attached to the intended endpoints
- **AND** normalizes identity and geometry deterministically where direction is
  not semantically significant
- **AND** preserves explicit direction where the model requires it

#### Scenario: Create parallel links

- **WHEN** a user repeats a valid connection between the same two nodes
- **THEN** Studio creates another link with a collision-free stable ID
- **AND** the runtime renders deterministic parallel lanes
- **AND** graph reachability continues to treat the endpoints as connected

#### Scenario: Attach a callout leader

- **WHEN** a user connects a callout and a node in either gesture direction
- **THEN** Studio writes the node as the callout's canonical leader target
- **AND** does not create a graph link for the annotation relationship

#### Scenario: Reject an invalid connection

- **WHEN** a proposed relationship violates schema or graph semantics
- **THEN** invalid targets are distinguishable before drop
- **AND** Studio does not create a partial or visually broken link
- **AND** the reason is available without relying on color alone

### Requirement: Graph-valid path authoring

Path creation SHALL respect the TopoViewer path contract and SHALL preserve all
existing graph links.

#### Scenario: Create a reachable path

- **WHEN** selected path endpoints have a valid traversal through existing links
- **THEN** Studio creates a path using that traversal or asks the user to choose
  among valid alternatives
- **AND** shortest, selected-order, and loose route choices are presented beside
  the Path command rather than as a global viewport option
- **AND** existing links remain unchanged

#### Scenario: Attempt an unreachable path

- **WHEN** no graph traversal exists between the selected endpoints
- **THEN** Studio blocks path creation
- **AND** explains which connectivity is missing
- **AND** does not invent or delete links

### Requirement: Region and group-like behavior

Studio SHALL support direct region placement, explicit membership, group
movement, collapse/expand, and release operations while preserving TopoViewer's
region semantics.

#### Scenario: Drop a node into a region

- **WHEN** a user moves a node into an eligible region and completes the gesture
- **THEN** Studio provides deterministic membership feedback
- **AND** commits the membership and position atomically according to the
  configured containment policy

#### Scenario: Release an object from a region

- **WHEN** a user invokes the accessible release-from-region action
- **THEN** Studio removes membership without deleting the object
- **AND** preserves an intentional absolute position outside the region

#### Scenario: Prevent accidental overlapping regions

- **WHEN** a region is created or moved into a conflicting placement
- **THEN** Studio previews the conflict and offers a deterministic non-overlap
  placement or an explicit override where nesting is valid

### Requirement: Transactional direct manipulation

High-frequency interaction SHALL be decoupled from source serialization,
validation, persistence, and history until the gesture commits.

#### Scenario: Drag an object repeatedly

- **WHEN** a user moves an object through many pointer positions
- **THEN** the renderer updates from transient interaction state
- **AND** Studio does not serialize the full YAML document per pointer event
- **AND** drag stop commits one command and one history entry

#### Scenario: Cancel an active gesture

- **WHEN** a user presses Escape or the host cancels an active gesture
- **THEN** the project returns to its pre-gesture semantic and source state
- **AND** no persistence or history entry is created

### Requirement: Efficient repeated authoring

Studio SHALL provide clipboard, duplicate, delete, align, distribute, nudge,
resize, undo, redo, and contextual actions without requiring modal dialogs for
routine reversible work.

Layer operations SHALL be available from a dedicated Layers control on the
canvas toolbar and SHALL reuse the canonical layer controller rather than being
hidden inside general viewport settings.

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
