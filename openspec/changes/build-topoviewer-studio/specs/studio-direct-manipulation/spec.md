## ADDED Requirements

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

### Requirement: Direct graph relationship authoring

Studio SHALL use visible React Flow connection affordances and graph-semantic
validation for relationship creation without requiring a permanent link mode.

#### Scenario: Connect two nodes

- **WHEN** a user drags from a valid source affordance to a valid target
  affordance
- **THEN** Studio creates a link attached to the intended endpoints
- **AND** normalizes identity and geometry deterministically where direction is
  not semantically significant
- **AND** preserves explicit direction where the model requires it

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

