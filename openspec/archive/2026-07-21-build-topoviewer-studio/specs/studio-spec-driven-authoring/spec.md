## ADDED Requirements

### Requirement: Canonical authoring metadata

The `topoviewer` package SHALL own canonical metadata for every public style
field, including type, target compatibility, default, description, grouping,
authoring level, ordering, conditional visibility, and control hints.

#### Scenario: Add a public style field

- **WHEN** a new public style field is added to the runtime contract
- **THEN** CI requires corresponding canonical authoring metadata
- **AND** the field is renderable by a generic typed control or an explicitly
  reviewed specialized editor
- **AND** Studio does not require a second manually synchronized field registry

#### Scenario: Consume metadata outside Studio

- **WHEN** schema assistance, docs generation, or another pure consumer needs
  field facts
- **THEN** it imports the canonical metadata from `topoviewer`
- **AND** it does not import Studio UI or host code

### Requirement: Complete generated style controls

Studio SHALL make every applicable public style field discoverable and editable
through a common-field list, progressive disclosure, complete search, or
reviewed raw-YAML fallback behavior.

#### Scenario: Inspect common fields

- **WHEN** an object or style target is selected
- **THEN** Studio shows the task-oriented default fields compatible with that
  object
- **AND** omits low-frequency fields without making them unavailable

#### Scenario: Reveal less-common fields

- **WHEN** a user activates View More
- **THEN** Studio reveals every additional compatible public field in the same
  attribute matrix
- **AND** View Less restores the common-field list without changing style data

#### Scenario: Search complete fields

- **WHEN** a user searches style fields
- **THEN** Studio searches canonical names, labels, descriptions, groups, and
  aliases
- **AND** search includes common and less-common fields without requiring a
  separate mode
- **AND** displays every compatible public field with its effective value

#### Scenario: Edit a nested contract

- **WHEN** a compatible nested style such as `nodeLayout` is selected
- **THEN** Studio renders its nested fields as one coherent group
- **AND** enforces parent conditions and value compatibility
- **AND** preserves unknown nested keys during unrelated edits

### Requirement: Customizable main-field profile

Users SHALL be able to add fields to the main list, move them behind View More,
hide them, and reorder authoring fields without changing the runtime schema or
project bundle. These infrequent controls SHALL remain behind a contextual
field menu rather than occupying every field row.

#### Scenario: Add a field to the main list

- **WHEN** a user promotes a less-common field to the main list
- **THEN** Studio stores a sparse versioned preference override
- **AND** the field appears without opening View More for the applicable object
  kinds
- **AND** exported topology and stylesheet files remain unchanged

#### Scenario: Reset authoring preferences

- **WHEN** a user resets a field profile
- **THEN** Studio removes the user override and restores the shipped profile
- **AND** does not remove project style values

#### Scenario: Migrate profile metadata

- **WHEN** canonical field metadata changes between compatible versions
- **THEN** Studio migrates valid overrides
- **AND** reports removed or incompatible overrides without blocking the project

### Requirement: Workspace ownership rail

Studio SHALL separate object creation, visual policy, viewport configuration,
telemetry mapping, and selected-object facts without duplicating an editor in
multiple panels. A persistent vertical rail SHALL control the left workspace;
the rail SHALL occupy the leftmost workspace column with the active panel
immediately to its right. Topo, Object, Style, Viewport, and Mapper SHALL share
that workspace, and Studio SHALL NOT reserve a permanent right properties
column.

#### Scenario: Switch left workspaces

- **WHEN** an author activates Topo, Object, Style, Viewport, or Mapper on the vertical
  workspace rail
- **THEN** exactly one corresponding left panel is visible
- **AND** Topo exposes the object palette
- **AND** Object exposes selected-object `topology.yaml` facts
- **AND** Style exposes `stylesheet.yaml` policy and selected-object This object
  authoring
- **AND** Viewport exposes canvas and interaction settings
- **AND** Mapper exposes the rule-oriented `mapper.yaml` workspace
- **AND** the canvas remains available without a reserved right editor column

#### Scenario: Inspect a selected object

- **WHEN** an author selects a topology or annotation object
- **THEN** the Object workspace exposes only selection-owned `topology.yaml`
  fields such as identity,
  labels, data, geometry, and layer membership
- **AND** generated identity, exact coordinates, and source-file ownership are
  available behind an Advanced disclosure instead of occupying the primary form
- **AND** a user can copy the stable object ID without editing it
- **AND** does not duplicate Style, Viewport, or Mapper controls

#### Scenario: Preserve authoring intent across selection

- **WHEN** an author selects an existing canvas object while Topo is active
- **THEN** Studio opens Object for direct property editing
- **AND** creating an object from the palette keeps Topo active for repeated
  placement
- **AND** selecting an object while Style, Viewport, or Mapper is active updates
  selection context without changing the active workspace

#### Scenario: Derive authoring context from selection

- **WHEN** an author selects a styleable or telemetry-compatible object
- **THEN** Style and Mapper derive the applicable object kind from that
  selection
- **AND** the primary workflow does not ask the author to repeat the target kind
- **AND** same-kind multi-selection reports the object count
- **AND** unsupported or mixed selection reports an actionable context instead
  of silently choosing a target

#### Scenario: Browse without mutating source

- **WHEN** an author opens a style attribute, changes workspace, expands View
  More, or inspects an inherited value
- **THEN** Studio does not create a style rule or modify YAML
- **AND** the first committed value creates any required default rule in the
  same undoable transaction

#### Scenario: Navigate the workspace rail

- **WHEN** a user navigates the rail with pointer, keyboard, touch, or assistive
  technology
- **THEN** the rail exposes tab semantics, an accessible name, and visible
  selection
- **AND** changing tabs preserves the project, canvas selection, undo history,
  and uncommitted valid edits
- **AND** constrained layouts remain navigable without page-level horizontal
  overflow
- **AND** visual order, DOM order, and keyboard order remain rail, active
  workspace, then canvas

### Requirement: Typed and usable controls

Generated forms SHALL use controls appropriate to the field semantics and SHALL
support validation, unset, reset-to-default, and explicit-value behavior.

#### Scenario: Edit a constrained value

- **WHEN** metadata defines an enum, range, color, asset, selector, boolean,
  number, list, or nested object
- **THEN** Studio presents an appropriate accessible control
- **AND** validates before commit
- **AND** explains accepted values and errors using canonical metadata

#### Scenario: Open field actions

- **WHEN** a user opens a generated field's action menu
- **THEN** each action remains legible on one line within the available
  Inspector or viewport width
- **AND** the menu does not inherit the icon trigger's fixed dimensions
- **AND** disabled and focused actions remain distinguishable

#### Scenario: Use an unsupported future field

- **WHEN** imported YAML contains a field unknown to the installed Studio
  version
- **THEN** Studio preserves it
- **AND** identifies it as unsupported rather than deleting or silently
  coercing it

### Requirement: Effective style provenance

Studio SHALL explain how each effective style value was resolved and where an
edit will be written.

#### Scenario: Inspect an overridden value

- **WHEN** multiple defaults, selector rules, object values, or runtime states
  contribute to a field
- **THEN** the Inspector displays the winning value and source
- **AND** makes overridden contributors and source locations inspectable

#### Scenario: Edit a shared rule

- **WHEN** a user chooses to edit an existing selector rule
- **THEN** Studio previews the number and identities of affected objects
- **AND** writes to that rule only after the scope is clear

#### Scenario: Create an object-specific override

- **WHEN** a user deliberately chooses selected-object scope
- **THEN** Studio creates or updates the canonical object-specific representation
- **AND** does not imply the change updated a reusable policy

### Requirement: Attribute-first style cascade authoring

Studio SHALL expose the TopoViewer style cascade as ordered reusable selector
rules followed by an optional per-object override. The Style panel SHALL present
each canonical style attribute once, with adjacent Default, Rule, and This
object cells, rather than requiring authors to switch document modes before
finding an attribute. Rule authoring SHALL not be limited to selectors that
already match the currently selected object. Rule remains the human-facing name
for selector-owned policy, and This object remains the human-facing name for
the inline bypass layer.

#### Scenario: Compare the authored layers for one attribute

- **WHEN** an author opens the Style panel
- **THEN** Studio lists canonical style attributes in a generated matrix
- **AND** shows the bare target rule under Default, the active specific rule
  under Rule, and the selected object's inline override under This object
- **AND** a cell opens the typed editor for that attribute and only that layer
- **AND** unset values remain visibly inherited rather than being copied into
  another layer

#### Scenario: Author a reusable selector rule

- **WHEN** an author activates a Rule cell
- **THEN** Studio expands selector choice and lifecycle controls beside that
  attribute editor rather than reserving permanent panel space
- **AND** lists every stylesheet rule compatible with the active object kind in
  source order
- **AND** supports creating, renaming, duplicating, reordering, and removing a
  rule through undoable stylesheet mutations
- **AND** previews current matches before a shared change is committed

#### Scenario: Build a selector from topology facts

- **WHEN** an object is selected
- **THEN** Studio suggests selectors for its kind, stable ID, and low-cardinality
  labels
- **AND** keeps the exact selector text editable
- **AND** never copies arbitrary high-cardinality data into a selector without
  an explicit author edit

#### Scenario: Author an individual override

- **WHEN** an author activates a This object cell for the selected object
- **THEN** Studio writes only to that object's inline `style`
- **AND** identifies the override as the final authored layer after matching
  reusable rules
- **AND** Unset removes the inline value and reveals the inherited value again

#### Scenario: Compose rules and an override

- **WHEN** matching selector rules and an object override both contribute
- **THEN** Studio displays the effective value and ordered provenance
- **AND** lets the author edit either layer independently
- **AND** does not offer a redundant operation that writes the same value to
  both layers

#### Scenario: Manage styles without a selected object

- **WHEN** no canvas object is selected
- **THEN** Studio retains the last established compatible object kind, or Node
  in a fresh session, for reusable-rule authoring
- **AND** does not expose a redundant target selector in the primary workflow
- **AND** disables This object cells until a compatible object is selected

### Requirement: Lossless structured editing

Studio's structured editors SHALL preserve comments, ordering, scalar style,
unknown fields, and untouched source ranges wherever the requested operation
does not require normalization.

#### Scenario: Edit one known field

- **WHEN** a user changes one known field through the Inspector
- **THEN** unrelated comments, unknown keys, and ordering remain unchanged
- **AND** the source diff is limited to the intended edit and required syntax

#### Scenario: Require normalization

- **WHEN** an edit cannot preserve the source representation safely
- **THEN** Studio previews the normalization diff and reason
- **AND** requires confirmation before rewriting the affected scope
