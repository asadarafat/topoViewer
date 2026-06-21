## ADDED Requirements

### Requirement: Explicit connection authoring

The VS Code browser harness SHALL let users create and edit `Connection`
relationships through explicit source and target controls.

#### Scenario: Connection composer does not depend on preselection

- **WHEN** the user chooses `Connection` in Build mode without selecting two
  nodes first
- **THEN** the harness SHALL show compact source and target node controls
- **AND** the controls SHALL be populated from validated `graph.nodes`
- **AND** the create action SHALL stay disabled until source and target are
  valid and different

#### Scenario: Canvas selection can prefill connection controls

- **WHEN** two or more nodes are selected and the user chooses `Connection`
- **THEN** the connection composer SHALL prefill source and target from the
  selected node order
- **AND** the user SHALL be able to change either endpoint before creating the
  link

#### Scenario: Created connection updates canonical YAML

- **WHEN** the user creates a valid connection from the composer
- **THEN** the harness SHALL add or update a `graph.links[]` entry
- **AND** the entry SHALL include `source` and `target`
- **AND** the mutation SHALL be structured, deterministic, undoable, and
  redoable
- **AND** validation SHALL run after the mutation

#### Scenario: Existing connection endpoints can be edited

- **WHEN** a single link is selected in Inspect mode
- **THEN** the Inspector SHALL expose source and target node controls
- **AND** changing either endpoint SHALL update the selected `graph.links[]`
  entry through structured mutation
- **AND** invalid endpoint combinations SHALL NOT be written to YAML

### Requirement: Explicit path authoring

The VS Code browser harness SHALL let users create and edit `Path`
relationships through explicit source, transit, and target controls.

#### Scenario: Path composer exposes ordered node controls

- **WHEN** the user chooses `Path` in Build mode
- **THEN** the harness SHALL show source, transit-node, and target controls
- **AND** source and target SHALL be required
- **AND** transit nodes SHALL be optional
- **AND** transit nodes SHALL be reorderable and removable from the UI

#### Scenario: Selection can prefill path sequence

- **WHEN** two or more nodes are selected and the user chooses `Path`
- **THEN** the path composer SHALL prefill the path sequence from selected node
  order
- **AND** the first selected node SHALL become source
- **AND** the last selected node SHALL become target
- **AND** any nodes between them SHALL become ordered transit nodes

#### Scenario: Created path writes sequence

- **WHEN** the user creates a valid path
- **THEN** the harness SHALL add or update a `graph.paths[]` entry
- **AND** the entry SHALL include `sequence: [source, ...transit, target]`
- **AND** the mutation SHALL be structured, deterministic, undoable, and
  redoable
- **AND** validation SHALL run after the mutation

#### Scenario: Existing path sequence can be edited

- **WHEN** a single path is selected in Inspect mode
- **THEN** the Inspector SHALL expose source, ordered transit nodes, and target
  controls
- **AND** changing the ordered sequence SHALL update the selected
  `graph.paths[]` entry through structured mutation
- **AND** invalid path sequences SHALL NOT be written to YAML

### Requirement: Node position persistence

The VS Code browser harness SHALL persist user-driven canvas node movement into
canonical Topology YAML.

#### Scenario: Dragging a node writes position after release

- **WHEN** the user drags a graph node on the canvas and releases it
- **THEN** the harness SHALL update that node's `position` in Topology YAML
- **AND** the update SHALL happen after drag release, not continuously during
  drag
- **AND** the position SHALL be rounded to stable integer coordinates
- **AND** validation SHALL run after the mutation

#### Scenario: Position shape is preserved where practical

- **WHEN** a moved node already has tuple position syntax
- **THEN** the updated YAML SHALL preserve tuple-style `[x, y]` position
- **WHEN** a moved node already has object position syntax
- **THEN** the updated YAML SHALL preserve object-style `{ x, y }` position
- **WHEN** a moved node has no position
- **THEN** the updated YAML SHALL add compact tuple-style `[x, y]` position

#### Scenario: Position updates are undoable

- **WHEN** node movement writes a position mutation
- **THEN** the mutation SHALL create an undo transaction
- **AND** undo SHALL restore the previous YAML position and rendered canvas
  state
- **AND** redo SHALL reapply the moved position and rendered canvas state

#### Scenario: Invalid YAML blocks canvas persistence safely

- **WHEN** the current Topology YAML cannot be parsed or validated
- **AND** the user attempts relationship or position authoring through UI
- **THEN** the harness SHALL refuse the structured mutation
- **AND** Monaco content SHALL remain unchanged
- **AND** the harness SHALL show a compact diagnostic explaining why the action
  could not be applied

### Requirement: Relationship authoring remains compact

The relationship and path authoring controls SHALL fit the current VS Code
harness rail without turning Build or Inspect into a large form builder.

#### Scenario: Relationship controls follow harness density

- **WHEN** relationship authoring controls render
- **THEN** they SHALL use compact Material UI sizing consistent with Fixture,
  Inspect, and Attention controls
- **AND** source, target, and transit node controls SHALL remain scroll-safe at
  the minimum authoring rail width
- **AND** Playwright coverage SHALL verify no horizontal clipping or label
  overlap at the minimum rail width

### Requirement: Inspect rows stay synchronized with YAML and canvas

The VS Code browser harness SHALL hydrate Inspect rows from the selected
object's current YAML state and rendered effective style.

#### Scenario: Existing labels and data hydrate into editable rows

- **WHEN** a graph object with labels and data is selected
- **THEN** Inspect SHALL show the existing labels as editable label rows
- **AND** Inspect SHALL show the existing data keys as editable data rows
- **AND** applying those rows SHALL replace the selected object's label or data
  record in Topology YAML

#### Scenario: Style rows show provenance

- **WHEN** a selected object receives a style value from a stylesheet rule
- **THEN** Inspect SHALL show that style row with `stylesheet` provenance
- **WHEN** a selected object has an inline style value in Topology YAML
- **THEN** Inspect SHALL show that style row with `inline` provenance

#### Scenario: Applying style rows only writes changed values

- **WHEN** a selected object inherits several values from stylesheet rules
- **AND** the user changes only one inherited style row
- **THEN** the changed value SHALL be written as an inline style override
- **AND** unchanged inherited values SHALL NOT be materialized into the selected
  object's Topology YAML

#### Scenario: Inline style override can be reset

- **WHEN** a selected object has an inline style override
- **AND** the user resets that style row
- **THEN** the inline override SHALL be removed from Topology YAML
- **AND** Inspect SHALL show the stylesheet/default value after validation

#### Scenario: Style key picker is grouped

- **WHEN** a user opens the style key picker
- **THEN** style keys SHALL be grouped by purpose so geometry, labels, status,
  icon, border/underlay, line, routing, and arrow controls are easier to scan
