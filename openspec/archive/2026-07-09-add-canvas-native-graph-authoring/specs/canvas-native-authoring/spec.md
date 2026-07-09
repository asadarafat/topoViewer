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

#### Scenario: Shape is placed at clicked canvas location

- **WHEN** the user selects the shape tool
- **AND** clicks an empty canvas location
- **THEN** the Harness SHALL create a `diagram.shapes[]` entry with
  deterministic ID, annotation layer, explicit position, and explicit size
- **AND** the new shape SHALL render in the canvas and be selected for
  inspection
- **AND** reload SHALL preserve the shape geometry

#### Scenario: Callout is placed at clicked canvas location

- **WHEN** the user selects the callout tool
- **AND** clicks an empty canvas location
- **THEN** the Harness SHALL create a `diagram.callouts[]` entry with
  deterministic ID, annotation layer, explicit position, and default content
- **AND** the new callout SHALL render in the canvas and be selected for
  inspection
- **AND** reload SHALL preserve the callout geometry

#### Scenario: Creation uses semantic default authoring layers

- **WHEN** the user creates a new node, node preset, link, or region
- **THEN** the generated YAML SHALL default the object to the `physical` layer
- **WHEN** the user creates a new path
- **THEN** the generated YAML SHALL default the object to the `paths` layer
- **WHEN** the user creates a callout, shape, or text-like annotation
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

### Requirement: Region Group Authoring

The Harness SHALL treat authored regions as durable topology group containers.
Existing member-derived regions SHALL remain valid, and canvas-authored regions
MAY also carry explicit `position` and `size` so empty or partially populated
groups can be placed intentionally.

#### Scenario: Region creation owns selected members

- **WHEN** the user creates a region from selected nodes or drag bounds
- **THEN** the generated YAML SHALL add a `graph.regions[]` entry with
  deterministic member IDs
- **AND** the generated region SHALL be selectable and draggable by default
- **AND** the region tool SHALL exit after creation so the next drag can move
  the group

#### Scenario: Empty region container is placed from the canvas

- **WHEN** the user activates the region tool
- **AND** clicks an empty canvas location
- **THEN** the Harness SHALL create a `graph.regions[]` entry with
  deterministic ID, semantic default layer, `members: []`, explicit `position`,
  and explicit `size`
- **AND** the empty region SHALL render as a selectable and draggable region
  container
- **AND** undo/redo and reload SHALL preserve the region container

#### Scenario: Dragging a node into a region assigns membership

- **WHEN** a node is dragged into an explicit region container
- **THEN** the committed YAML SHALL add that node ID to the region `members`
- **AND** the node SHALL be removed from sibling regions at the same parent
  level
- **AND** the membership change SHALL be part of the node-move transaction

#### Scenario: Releasing a node from a region is explicit

- **WHEN** a node belongs to a region
- **AND** the user right-clicks the node
- **THEN** the Harness SHALL expose a release-from-region action
- **WHEN** the user chooses that action
- **THEN** the committed YAML SHALL remove that node from the region `members`
- **AND** explicit empty region containers SHALL remain present
- **AND** dragging a node outside a region SHALL NOT release it implicitly

#### Scenario: Sibling regions do not duplicate member ownership

- **WHEN** a top-level region is created or edited with member nodes
- **THEN** those member nodes SHALL be removed from sibling top-level regions
- **AND** sibling regions that become empty SHALL be removed unless they still
  contain child regions or explicit `position`/`size` container geometry
- **AND** explicit nested regions using `parent` SHALL remain valid

#### Scenario: Region drag persists as member movement

- **WHEN** the user drags a draggable region
- **THEN** the visible member nodes SHALL move with the region
- **AND** the committed YAML SHALL update the member node positions in one
  undoable transaction
- **AND** explicit region containers SHALL update their container position in
  the same transaction
- **AND** undo/redo and reload SHALL preserve the expected member positions

#### Scenario: Region collapse is not local-only state

- **WHEN** the Harness exposes native region collapse or expand
- **THEN** the behavior SHALL be backed by `attention.aggregate` or a schema
  addition
- **AND** the Harness SHALL NOT fake collapse by hiding members only in local
  React state
- **WHEN** a user collapses a region
- **THEN** the topology YAML SHALL contain a stable region aggregate group such
  as `summary-<regionId>`
- **AND** that group SHALL be absent from `attention.aggregate.expandedGroupIds`
- **AND** the rendered graph SHALL replace the region members with the aggregate
  summary node
- **WHEN** the user expands the aggregate summary
- **THEN** the topology YAML SHALL add the group to
  `attention.aggregate.expandedGroupIds`
- **AND** the original region and member nodes SHALL render again
- **AND** undo/redo and reload SHALL preserve the expected collapsed or
  expanded state

### Requirement: Direct Geometry Editing

The Harness SHALL expose direct move and resize handles for objects whose
geometry can be represented in YAML.

#### Scenario: Standalone text is represented as a callout variant

- **WHEN** the Harness exposes text-like annotation authoring in this phase
- **THEN** it SHALL use `diagram.callouts[]` rather than a separate text
  primitive
- **AND** the primary canvas toolbar SHALL NOT expose a standalone text tool
  until a distinct schema primitive is justified
- **AND** text-like annotations SHALL inherit callout create, move, resize,
  edit, delete, undo/redo, and reload behavior

#### Scenario: Dragging an object persists position

- **WHEN** the user drags a positioned node, shape, or callout
- **THEN** the rendered object SHALL follow the pointer smoothly
- **AND** the final topology YAML SHALL contain the committed position
- **AND** undo/redo and reload SHALL preserve the expected position

#### Scenario: Shape and callout runtime nodes preserve their object kind

- **WHEN** the renderer emits a drag-stop event for a diagram shape or callout
- **THEN** the Harness SHALL map the runtime node back to `diagram.shapes[]` or
  `diagram.callouts[]`
- **AND** it SHALL NOT treat the runtime node as a graph node
- **AND** the committed YAML SHALL update the correct diagram object

#### Scenario: Resize updates supported geometry only

- **WHEN** the user resizes a selected shape, callout, or explicit region
  container
- **THEN** the canvas SHALL show native resize handles only while that object is
  selected and the host has enabled editing
- **AND** the resize SHALL be committed as one transaction on resize stop
- **AND** the YAML SHALL update the object's `position` and `size` fields
- **AND** undo/redo and reload SHALL preserve the resized geometry
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
