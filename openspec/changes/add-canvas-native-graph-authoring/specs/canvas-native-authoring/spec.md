## ADDED Requirements

### Requirement: Canvas Tool Palette

The Harness SHALL provide a canvas-native tool palette for common topology
authoring actions.

#### Scenario: Tool selection changes canvas behavior

- **WHEN** the user selects a canvas tool such as select, pan, router, service,
  link, path, region, callout, or shape
- **THEN** the canvas SHALL expose pointer behavior appropriate to that tool
- **AND** the active tool SHALL be visually identifiable
- **AND** keyboard shortcuts SHALL either activate the matching tool or remain
  inert when the tool is unavailable

#### Scenario: Unsupported tools are not advertised

- **WHEN** an object family or operation cannot be represented as valid
  TopoViewer YAML
- **THEN** the Harness SHALL NOT expose it as a primary canvas tool

### Requirement: Click-To-Create Objects

The Harness SHALL support creating supported objects from canvas pointer
locations.

#### Scenario: Node preset is placed at clicked canvas location

- **WHEN** the user selects a node preset tool
- **AND** clicks an empty canvas location
- **THEN** the Harness SHALL create a graph node using the clicked topology
  coordinate
- **AND** the generated YAML SHALL contain the new node with deterministic ID,
  semantic default layer, and explicit position
- **AND** undo/redo SHALL remove and restore the node

#### Scenario: Creation uses semantic default authoring layers

- **WHEN** the user creates a new node, node preset, link, or region
- **THEN** the generated YAML SHALL default the object to the `physical` layer
- **WHEN** the user creates a new path
- **THEN** the generated YAML SHALL default the object to the `paths` layer
- **WHEN** the user creates a callout, shape, or future text primitive
- **THEN** the generated YAML SHALL default the object to the `annotations`
  layer
- **AND** visible layer filters SHALL NOT redirect those writes to a different
  layer

### Requirement: Drag-To-Connect Links

The Harness SHALL support drawing graph links directly between nodes.

#### Scenario: Drag from source node to target node creates a link

- **WHEN** the user activates the link tool
- **AND** drags from a source node or handle to a target node or handle
- **THEN** the Harness SHALL show a live connection preview
- **AND** dropping on a valid target SHALL create a `graph.links[]` entry
- **AND** the YAML SHALL record deterministic source and target object IDs
- **AND** source/target handle or endpoint metadata SHALL be recorded when the
  schema supports it

#### Scenario: Invalid link drop cancels safely

- **WHEN** the user starts drawing a link
- **AND** drops on an invalid target or empty canvas
- **THEN** no link SHALL be added
- **AND** the previous YAML SHALL remain unchanged
- **AND** the UI SHALL leave the user in a recoverable state

### Requirement: Strict And Loose Path Authoring

The Harness SHALL treat a path as an ordered topology route or tunnel intent,
not as an implicit graph link generator.

#### Scenario: Disconnected path segments are rejected

- **WHEN** the user builds a path by clicking nodes in sequence
- **AND** an adjacent node pair in that sequence has no graph reachability
  through existing `graph.links[]`
- **THEN** the Harness SHALL reject the segment
- **AND** the UI SHALL explain that graph reachability is required
- **AND** the generated YAML SHALL NOT add a `graph.paths[]` entry
- **AND** the generated YAML SHALL NOT add a phantom `graph.links[]` entry

#### Scenario: Loose reachable path segments are allowed without creating links

- **WHEN** the user builds a path by clicking nodes in sequence
- **AND** an adjacent node pair in that sequence has graph reachability through
  existing `graph.links[]`
- **AND** that adjacent node pair has no direct `graph.links[]` edge between
  them
- **THEN** the Harness SHALL allow the segment as a loose/tunnel path segment
- **AND** the UI SHOULD make the loose segment state visible while authoring
- **AND** the generated YAML SHALL add only a `graph.paths[]` entry
- **AND** the generated YAML SHALL NOT add a phantom `graph.links[]` entry

#### Scenario: Path over existing links preserves links

- **WHEN** an adjacent node pair in the path sequence is backed by an existing
  `graph.links[]` edge
- **AND** the user commits the path
- **THEN** the Harness SHALL add a `graph.paths[]` sequence
- **AND** the existing `graph.links[]` entries SHALL remain in YAML
- **AND** the path visual SHALL read as a route overlay, not as a replacement
  for the underlying links

### Requirement: Direct Geometry Editing

The Harness SHALL expose direct move and resize handles for objects whose
geometry can be represented in YAML.

#### Scenario: Dragging an object persists position

- **WHEN** the user drags a positioned node, shape, or callout
- **THEN** the rendered object SHALL follow the pointer smoothly
- **AND** the final topology YAML SHALL contain the committed position
- **AND** undo/redo and reload SHALL preserve the expected position

#### Scenario: Resize updates supported geometry only

- **WHEN** the user resizes a shape or other resize-capable object
- **THEN** the YAML SHALL update the object's size or supported geometry fields
- **AND** resize handles SHALL NOT be shown for object families whose size is
  controlled only by stylesheet policy

### Requirement: Marquee And Multi-Selection

The Harness SHALL support canvas-native multi-selection.

#### Scenario: Marquee selects objects in its bounds

- **WHEN** the user drags from empty canvas with the select tool active
- **THEN** the Harness SHALL render a marquee rectangle
- **AND** objects inside the marquee SHALL become selected
- **AND** the Inspector and status strip SHALL reflect the selected object count

#### Scenario: Multi-selection transforms together

- **WHEN** multiple positioned objects are selected
- **AND** the user drags the selection
- **THEN** all selected positioned objects SHALL move by the same topology delta
- **AND** the YAML SHALL update every moved object in one undoable transaction

### Requirement: Clipboard And Duplication

The Harness SHALL support copy, paste, duplicate, delete, undo, and redo for
selected topology objects.

#### Scenario: Duplicate rewrites IDs and internal references

- **WHEN** the user duplicates a selection containing nodes and links between
  those nodes
- **THEN** the duplicated nodes and links SHALL receive deterministic new IDs
- **AND** duplicated links SHALL point to the duplicated endpoint nodes
- **AND** the duplicate operation SHALL be one undoable transaction

#### Scenario: Delete preserves recovery

- **WHEN** the user deletes selected objects
- **THEN** the objects and dependent relationships SHALL be removed according to
  the documented deletion contract
- **AND** undo SHALL restore them
- **AND** redo SHALL remove them again

### Requirement: Alignment And Distribution

The Harness SHALL provide deterministic alignment and distribution commands for
selected positioned objects.

#### Scenario: Align command updates YAML positions

- **WHEN** the user selects multiple positioned objects
- **AND** invokes an align command
- **THEN** the selected objects SHALL align to the requested axis
- **AND** the YAML positions SHALL reflect the aligned coordinates
- **AND** undo/redo SHALL preserve the command boundary

### Requirement: YAML Draft Safety

Canvas authoring SHALL not corrupt dirty YAML drafts.

#### Scenario: Canvas mutation is blocked while YAML draft is dirty

- **WHEN** topology, stylesheet, or mapper YAML has unapplied draft changes
- **AND** the user tries a canvas mutation
- **THEN** the Harness SHALL prevent the mutation or explicitly apply it only to
  the draft
- **AND** the user SHALL receive clear apply/revert guidance
- **AND** the currently rendered graph SHALL not enter a half-applied state

### Requirement: CRUD Permutation Coverage

The Harness SHALL include regression coverage for all supported authoring CRUD
permutations.

#### Scenario: Supported object families have create/read/update/delete coverage

- **WHEN** a canvas-native object family is marked supported
- **THEN** automated tests SHALL cover create, selection/read, update, delete,
  undo/redo, and reload persistence where applicable
- **AND** tests SHALL assert both rendered UI state and YAML output

### Requirement: Authoring Documentation

TopoViewer SHALL document the canvas-native authoring loop as a product feature.

#### Scenario: Guide teaches UI first

- **WHEN** a user opens the Harness authoring guide
- **THEN** the guide SHALL start with the canvas workflow and quick authoring
  path
- **AND** YAML details SHALL explain what the UI produced rather than replacing
  the UI workflow
