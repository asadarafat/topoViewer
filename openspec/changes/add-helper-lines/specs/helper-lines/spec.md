## ADDED Requirements

### Requirement: Helper Lines Runtime Contract

TopoViewer SHALL support runtime alignment helper lines for draggable objects
through an explicit React API option.

#### Scenario: Helper lines are disabled by default

- **WHEN** a host renders `TopoViewer` without helper-line options
- **THEN** TopoViewer SHALL render no helper-line overlay
- **AND** existing drag behavior SHALL remain unchanged

#### Scenario: Helper lines are enabled by host option

- **WHEN** a host renders `TopoViewer` with helper lines enabled
- **AND** a user drags a visible draggable object
- **THEN** TopoViewer SHALL compute alignment candidates from visible peer
  objects
- **AND** TopoViewer SHALL render temporary guide lines for detected alignment

#### Scenario: Helper lines are runtime-only

- **WHEN** helper lines are enabled
- **THEN** TopoViewer SHALL NOT require topology, stylesheet, or mapper YAML
  changes
- **AND** TopoViewer SHALL NOT persist helper-line state in exported topology
  YAML

### Requirement: Alignment Geometry

TopoViewer SHALL calculate helper-line candidates from object bounding boxes.

#### Scenario: Edge and center alignment are detected

- **WHEN** the dragged object is within the configured threshold of another
  visible object's left, horizontal center, right, top, vertical center, or
  bottom coordinate
- **THEN** TopoViewer SHALL expose the corresponding vertical or horizontal
  helper line

#### Scenario: Hidden objects are ignored

- **WHEN** an object is hidden by layer filtering, collapsed attention state, or
  React Flow hidden state
- **THEN** that object SHALL NOT be used as an alignment candidate

#### Scenario: Parent-relative positions are normalized

- **WHEN** a rendered object has a parent-relative React Flow position
- **THEN** TopoViewer SHALL calculate helper-line geometry from the object's
  absolute flow-coordinate box
- **AND** helper-line alignment SHALL NOT mix parent-relative and absolute
  coordinate spaces

#### Scenario: Dragged object is ignored as a candidate

- **WHEN** an object is being dragged
- **THEN** TopoViewer SHALL exclude that same runtime object from candidate
  alignment comparisons

#### Scenario: Measured dimensions are preferred

- **WHEN** React Flow has measured dimensions for an object
- **THEN** TopoViewer SHALL use measured dimensions for helper-line geometry
- **AND** TopoViewer SHALL fall back to compiled width and height when measured
  dimensions are unavailable

### Requirement: Optional Snapping

TopoViewer SHALL separate guide rendering from snap behavior.

#### Scenario: Snap mode applies live snapped position

- **WHEN** helper lines are enabled with snap mode
- **AND** the dragged object enters the configured threshold
- **THEN** TopoViewer SHALL visibly place the object on the selected alignment
  coordinate during drag
- **AND** the final drag-stop position SHALL match the snapped coordinate

#### Scenario: Snap transforms position changes

- **WHEN** React Flow emits a position change for a dragged object
- **AND** helper-line snap selects a snapped coordinate
- **THEN** TopoViewer SHALL transform the pending position change before
  applying it to React Flow nodes
- **AND** TopoViewer SHALL NOT rely on an overlay-only state update to move the
  object

#### Scenario: Guide-only mode does not move the object

- **WHEN** helper lines are enabled without snap mode
- **THEN** TopoViewer SHALL render guide lines when alignment is detected
- **AND** TopoViewer SHALL NOT change the dragged object's position because of
  helper lines

#### Scenario: Final position callbacks receive the snapped position

- **WHEN** snap mode changes the drag position
- **AND** the host receives `onNodePositionChange`
- **THEN** the callback SHALL receive the snapped position
- **AND** the callback SHALL NOT report a stale unsnapped position from the
  drag-stop event node

### Requirement: Viewport-Correct Overlay

TopoViewer SHALL render helper-line overlays accurately across pan and zoom.

#### Scenario: Overlay follows viewport transform

- **WHEN** the viewport is panned or zoomed
- **AND** a user drags an object into alignment
- **THEN** the helper-line overlay SHALL visually line up with the aligned
  object coordinate in screen space

#### Scenario: Overlay does not intercept interaction

- **WHEN** helper lines are visible
- **THEN** the helper-line overlay SHALL use non-interactive pointer behavior
- **AND** it SHALL NOT block node dragging, edge clicking, pane clicking, menus,
  controls, or selection

#### Scenario: Overlay clears after drag

- **WHEN** dragging stops or is cancelled
- **THEN** TopoViewer SHALL remove helper-line overlays from the canvas

### Requirement: Object Scope

TopoViewer SHALL align draggable rendered TopoViewer objects without changing
their source object semantics.

#### Scenario: Graph nodes are supported

- **WHEN** a rendered graph node is draggable
- **THEN** helper lines SHALL work for that node

#### Scenario: Region drag remains coherent

- **WHEN** a draggable region is snapped by helper lines
- **THEN** the snapped region position SHALL flow through the existing region
  drag translation path
- **AND** region member nodes SHALL move consistently with the region

#### Scenario: Non-draggable objects cannot initiate helper lines

- **WHEN** an object is not draggable
- **THEN** dragging that object SHALL NOT trigger helper lines

#### Scenario: Visible fixed objects can be alignment candidates

- **WHEN** a visible object is an eligible TopoViewer object kind
- **AND** that object is fixed or non-draggable
- **THEN** TopoViewer MAY use it as an alignment candidate
- **AND** TopoViewer SHALL NOT move that candidate because of helper-line snap

### Requirement: Performance Boundaries

TopoViewer SHALL keep helper-line drag computation bounded for dense graphs.

#### Scenario: Candidate limit protects large graphs

- **WHEN** the number of visible candidate objects exceeds the helper-line
  candidate limit
- **THEN** TopoViewer SHALL reduce helper-line work using the documented limit
- **AND** dragging SHALL remain responsive

#### Scenario: Midpoint guides are bounded

- **WHEN** midpoint guide calculation is enabled
- **THEN** TopoViewer SHALL cap midpoint candidate work using
  `midpointCandidateLimit`
- **AND** TopoViewer SHALL disable or degrade midpoint guides rather than run
  unbounded pairwise scans on large graphs

### Requirement: Surface Integration

TopoViewer SHALL expose helper lines consistently across supported host
surfaces where dragging is available.

#### Scenario: Browser harness supports authoring helper lines

- **WHEN** the browser harness enables helper lines
- **AND** the user drags a manual-layout object
- **THEN** the harness SHALL show alignment guides and apply the configured
  snap behavior

#### Scenario: Grafana remains runtime-only

- **WHEN** Grafana enables helper lines
- **AND** the user drags a node in a panel
- **THEN** helper-line snapping SHALL update only Grafana runtime position
  overrides
- **AND** mounted topology bundle YAML SHALL remain unchanged

### Requirement: Documentation And Evidence

TopoViewer SHALL document and verify helper lines before the feature is treated
as complete.

#### Scenario: Docs identify helper lines as interaction UI

- **WHEN** helper-line docs are published
- **THEN** they SHALL state that helper lines are runtime/editor interaction
  controls
- **AND** they SHALL not present helper lines as topology or stylesheet YAML
  syntax

#### Scenario: Visual evidence proves viewport correctness

- **WHEN** implementation claims helper lines are complete
- **THEN** the change SHALL include visual evidence for normal, zoomed, and
  panned drag sessions
- **AND** the evidence SHALL show that helper lines clear after drag stop
