## ADDED Requirements

### Requirement: Inspect remains semantic, not visual

The VS Code browser harness Inspect panel SHALL focus on object semantics and
topology mutations rather than visual style authoring.

#### Scenario: Style editor is not primary Inspect content

- **WHEN** a user selects an object in the canvas
- **THEN** Inspect SHALL show object identity, display name, layer, labels,
  data, and applicable relationship controls
- **AND** Inspect SHALL NOT show a primary style key/value editor section

### Requirement: YAML editor suggests valid topology keys

The YAML editor SHALL provide schema-derived suggestions for topology YAML.

#### Scenario: Editing a node object

- **WHEN** the active editor is Topology YAML
- **AND** the cursor is inside a `graph.nodes` item
- **THEN** suggestions SHALL include valid node keys such as `id`, `name`,
  `labels`, `data`, `layers`, and `position`

#### Scenario: Editing a link or path reference

- **WHEN** the active editor is Topology YAML
- **AND** the cursor is inside a link `source`/`target` or path `sequence`
- **THEN** suggestions SHOULD include graph node IDs from the current document

### Requirement: YAML editor suggests valid stylesheet selectors and keys

The YAML editor SHALL provide schema-derived suggestions for stylesheet YAML.

#### Scenario: Editing stylesheet rule style keys

- **WHEN** the active editor is Stylesheet YAML
- **AND** the cursor is inside a stylesheet rule `style` object
- **THEN** suggestions SHALL include style keys valid for the rule selector kind

#### Scenario: Editing stylesheet selectors

- **WHEN** the active editor is Stylesheet YAML
- **AND** the cursor is editing a `selector` value
- **THEN** suggestions SHOULD include selector snippets for object IDs, layers,
  labels, and data keys from the current topology

### Requirement: Selected objects can start stylesheet authoring

The harness SHALL provide a visible workflow that turns the current canvas
selection into an editable stylesheet rule.

#### Scenario: Creating a style rule from a selected node

- **WHEN** a user selects a node in the canvas
- **AND** invokes `Create style rule` or `Style in YAML`
- **THEN** the harness SHALL switch to Stylesheet YAML
- **AND** the harness SHALL insert or focus a rule with selector
  `node[id = "<selected-node-id>"]`
- **AND** the cursor SHALL land inside that rule's `style` block
- **AND** the editor SHALL make style key suggestions available immediately

#### Scenario: Creating a style rule from a selected edge-like object

- **WHEN** a user selects a link or path in the canvas
- **AND** invokes `Create style rule` or `Style in YAML`
- **THEN** the inserted or focused selector SHALL use `link[id = "..."]` or
  `path[id = "..."]` as appropriate
- **AND** style key suggestions SHALL match the selected object kind

### Requirement: YAML editor exposes CLI-like context help

The YAML editor SHALL make suggestions discoverable without requiring users to
know style key names upfront.

#### Scenario: Asking for help inside a style block

- **WHEN** the active editor is Stylesheet YAML
- **AND** the cursor is inside a rule `style` object
- **AND** the user presses `Ctrl+Space`, types `?`, or clicks a visible
  suggestions/help action
- **THEN** the editor SHALL show valid style keys for the current selector kind
- **AND** suggestions SHALL be grouped by purpose such as Geometry, Fill /
  Border / Underlay, Label, Interaction, Edge line, Edge labels, and Arrows
- **AND** each suggestion SHOULD include a short description and value type

#### Scenario: Asking for help after a style key

- **WHEN** the active editor is Stylesheet YAML
- **AND** the cursor is editing the value of a known style key
- **AND** the user asks for suggestions
- **THEN** the editor SHALL show valid values when the key has enum, boolean, or
  color semantics
- **AND** color suggestions SHOULD include approved palette values

#### Scenario: Question mark help does not corrupt YAML

- **WHEN** the user types `?` only to request context help
- **THEN** the editor SHALL open the context suggestion UI
- **AND** the saved YAML model SHALL NOT retain an invalid helper-only `?`
  character

### Requirement: YAML editor suggests valid values

The YAML editor SHALL suggest known values when the key has a constrained value
space.

#### Scenario: Editing enum style values

- **WHEN** the active editor is Stylesheet YAML
- **AND** the cursor is editing a style key with enum values
- **THEN** suggestions SHALL include those enum values

#### Scenario: Editing color values

- **WHEN** the active editor is Stylesheet YAML
- **AND** the cursor is editing a color style key
- **THEN** suggestions SHOULD include project-approved palette values

#### Scenario: Regression coverage spans all style keys and value types

- **WHEN** the TopoViewer style metadata defines a supported style key for any
  selector kind
- **THEN** automated harness tests SHALL verify that key appears in YAML
  stylesheet suggestions
- **AND** automated harness tests SHALL verify value suggestions for every
  supported value type: enum, boolean, color, integer, number, and text

### Requirement: Diagnostics remain tied to YAML lines

Smart suggestions SHALL NOT regress existing validation diagnostics.

#### Scenario: Invalid YAML keeps editor markers

- **WHEN** the active YAML document has a parse or validation diagnostic
- **THEN** Monaco SHALL show markers and whole-line highlights for affected
  lines
