## ADDED Requirements

### Requirement: Canvas-first resizable harness layout

The VS Code browser harness SHALL default to a canvas-first workspace with a
resizable authoring column.

#### Scenario: Default layout prioritizes the canvas

- **WHEN** the browser harness loads on a desktop-width viewport
- **THEN** the left authoring column SHALL occupy approximately one-third of the
  workspace width
- **AND** the canvas preview SHALL occupy approximately two-thirds of the
  workspace width
- **AND** Monaco and the TopoViewer canvas SHALL both remain visible without
  horizontal page scrolling

#### Scenario: Vertical divider resizes the workspace

- **WHEN** a user drags the vertical divider between the left column and the
  canvas
- **THEN** the left column width SHALL update live
- **AND** the canvas width SHALL update live
- **AND** Monaco SHALL relayout without clipping text
- **AND** the TopoViewer canvas SHALL relayout without becoming blank

#### Scenario: Divider is accessible

- **WHEN** the vertical divider receives keyboard focus
- **THEN** arrow keys SHALL adjust the split within configured min/max bounds
- **AND** the divider SHALL expose an accessible label that describes the resize
  behavior
- **AND** there SHALL be a way to restore the one-third/two-thirds default

#### Scenario: Split preference persists

- **WHEN** the user changes the split and reloads the browser harness
- **THEN** the harness SHALL restore the previous split from browser-local
  persistence
- **AND** invalid or out-of-range persisted values SHALL fall back to the default
  split

#### Scenario: Narrow viewports remain usable

- **WHEN** viewport width is too narrow for the side-by-side minimums
- **THEN** the harness SHALL use a stacked or drawer-style fallback
- **AND** controls SHALL NOT overlap the canvas, Monaco editor, or each other

### Requirement: Build node and preset palette

The VS Code browser harness SHALL include a `Build` section for adding
TopoViewer nodes, relationships, containers, notes, and presets without
requiring users to hand-author every YAML block.

#### Scenario: Build section uses TopoViewer authoring language

- **WHEN** the left column renders
- **THEN** it SHALL include a `Build` section
- **AND** the generic graph entity SHALL be labeled `Node`, not `Object`
- **AND** the section SHALL include `Primitives` and `Presets` groups
- **AND** broader object language SHALL be used only where the selected entity
  can be a node, link, path, region, shape, or callout

#### Scenario: Build palette is compact and discoverable

- **WHEN** the Build section is open
- **THEN** it SHALL show compact object buttons with labels and tooltips
- **AND** it SHALL avoid consuming the majority of the left-column height
- **AND** it SHALL remain usable without hiding Monaco entirely
- **AND** icon-forward palette treatment MAY be added later without changing the
  structured insertion contract

#### Scenario: Initial primitive and preset set is useful for topology authoring

- **WHEN** the Build section lists available entries
- **THEN** Primitives SHALL include Node, Connection, Path, Region, and Callout
- **AND** Presets SHALL include Router, Service, Controller, and External
- **AND** Presets SHALL include user-saved presets from the Inspector

#### Scenario: Inserted entries update canonical YAML

- **WHEN** a user inserts a primitive or preset from the Build section
- **THEN** the harness SHALL update the Topology YAML
- **AND** the update SHALL use structured document mutation rather than blind
  string concatenation
- **AND** the inserted entry SHALL have a unique ID
- **AND** the inserted entry SHALL belong to a valid layer
- **AND** existing validation SHALL run after insertion

#### Scenario: Inserted entries render on the canvas

- **WHEN** a user inserts a valid visible entry
- **THEN** the entry SHALL become visible in the TopoViewer canvas after
  validation
- **AND** the insertion SHALL NOT require reloading the harness

#### Scenario: Inspector saves reusable presets

- **WHEN** a user inspects a selected object
- **THEN** the Inspector SHALL provide a way to save the current configured
  object as a Preset
- **AND** the Preset SHALL capture the object kind, name, labels, data, inline
  style, icon, type, title, and body where those fields exist
- **AND** the saved Preset SHALL appear in the Build Presets group
- **AND** inserting the saved Preset SHALL use structured Topology YAML mutation

### Requirement: Explicit authoring modes

The VS Code browser harness SHALL make canvas interaction mode explicit so
selection, insertion, inspection, and attention authoring are predictable.

#### Scenario: Harness exposes authoring modes

- **WHEN** the browser harness renders
- **THEN** it SHALL expose compact grouped tabs for Build, Inspect, YAML,
  Attention, and Layers workflows
- **AND** the active mode SHALL be visually clear
- **AND** the fixture selector SHALL be visually separated from the grouped tabs
- **AND** Diagnostics SHALL be visible as a status row between the grouped tabs
  and active pane
- **AND** switching modes SHALL NOT mutate YAML by itself

#### Scenario: Canvas behavior follows active mode

- **WHEN** the active mode changes
- **THEN** canvas click behavior SHALL follow that mode's documented behavior
- **AND** the active tab's controls SHALL use the available vertical rail space
- **AND** mode controls SHALL be reachable by keyboard

#### Scenario: Layers are a mode and diagnostics are always visible

- **WHEN** the user needs layer visibility controls
- **THEN** Layers SHALL be available as its own mode tab
- **AND** layer controls SHALL be compact, scrollable, and count-backed
- **WHEN** the user needs validation feedback
- **THEN** Diagnostics SHALL be visible without switching modes
- **AND** successful diagnostics SHALL collapse to a compact status row
- **AND** warning or error diagnostics SHALL summarize the current validation
  state in the same row

### Requirement: Canvas selection model

The VS Code browser harness SHALL maintain a first-class canvas selection model
that can feed Build, Inspector, and Attention workflows.

#### Scenario: Canvas selection supports common selection behavior

- **WHEN** a user clicks a selectable canvas object
- **THEN** the harness SHALL select that object
- **AND** modifier-assisted clicks SHALL support multi-selection
- **AND** clicking blank canvas SHALL clear selection
- **AND** the left rail SHALL summarize the selected object kind and count

#### Scenario: Selection tracks document changes

- **WHEN** topology YAML changes remove or rename selected objects
- **THEN** the harness SHALL clear or repair selection
- **AND** stale selections SHALL NOT be used for Build, Inspector, or
  Attention mutations

#### Scenario: Selection is UI state until mutation

- **WHEN** the user selects canvas objects
- **THEN** selection SHALL NOT rewrite Topology YAML by itself
- **AND** YAML SHALL change only when the user performs an explicit mutation
  such as insert, inspect edit, delete, or attention update

#### Scenario: Selection can drive topology authoring

- **WHEN** selected objects are compatible with an authoring action
- **THEN** selected nodes MAY be used as link or path endpoints
- **AND** selected nodes MAY be used as region members
- **AND** selected objects MAY be used as callout targets
- **AND** selected objects MAY populate Attention focus fields

### Requirement: Selected object inspector

The VS Code browser harness SHALL include a compact Inspector for editing
selected object properties through canonical YAML.

#### Scenario: Inspector shows selected object properties

- **WHEN** one compatible object is selected
- **THEN** the Inspector SHALL show `Object name` as a read-only canonical key
  such as `node:fra-pe`
- **AND** it SHALL expose editable controls for display name, layers, labels,
  data, and supported position fields
- **AND** it SHALL expose an object-aware style picker for inline `style`
- **AND** the style picker SHALL show style keys applicable to the selected
  object kind
- **AND** it SHALL provide an add-style action that writes the selected key/value
  through structured YAML mutation
- **AND** it SHALL provide a save-as-Preset action for the selected object

#### Scenario: Inspector handles incompatible selection

- **WHEN** no object is selected
- **THEN** the Inspector SHALL stay collapsed or show a compact empty state
- **WHEN** multiple incompatible object kinds are selected
- **THEN** incompatible property controls SHALL be disabled or hidden

#### Scenario: Inspector edits update YAML and canvas

- **WHEN** a user edits a supported selected object property
- **THEN** the harness SHALL update Topology YAML through structured mutation
- **AND** validation SHALL run
- **AND** the canvas SHALL rerender without a full harness reload

#### Scenario: Inspector delete is reversible

- **WHEN** a user deletes selected objects through the Inspector
- **THEN** the delete action SHALL update Topology YAML
- **AND** the action SHALL be undoable
- **AND** dependent references SHALL be handled by validation diagnostics or by
  safe structured cleanup

### Requirement: Safe YAML mutation and undo

The VS Code browser harness SHALL use safe, undoable YAML mutation for
UI-driven authoring actions.

#### Scenario: Structured mutation preserves document validity

- **WHEN** Build, Inspector, or Attention controls mutate the document
- **THEN** the harness SHALL parse the current Topology YAML as structured data
- **AND** it SHALL refuse mutation when YAML cannot be parsed
- **AND** it SHALL serialize deterministic YAML after mutation
- **AND** it SHALL run schema validation and semantic lint after mutation
- **AND** it SHALL NOT append opaque snippets to the text buffer

#### Scenario: Mutation failure preserves user content

- **WHEN** a structured mutation cannot be applied
- **THEN** the current Monaco editor content SHALL remain unchanged
- **AND** the harness SHALL show a clear diagnostic or inline error
- **AND** direct Monaco editing SHALL remain available

#### Scenario: UI-driven mutations are undoable

- **WHEN** a user performs a UI-driven Topology YAML mutation
- **THEN** the harness SHALL create an undo transaction with a user-facing label
- **AND** undo SHALL restore the prior topology text and rendered state
- **AND** redo SHALL restore the next topology text and rendered state
- **AND** undo/redo SHALL cover Build insertions, Inspector edits, Attention edits,
  deletion, and layer assignment changes

#### Scenario: Local layout state is reset separately

- **WHEN** the user changes the left/canvas split width
- **THEN** split reset behavior SHALL restore layout defaults
- **AND** YAML undo/redo SHALL NOT be required for split width changes

### Requirement: Attention UI editor

The VS Code browser harness SHALL include a compact Attention editor for
authoring the canonical Topology YAML `attention` block.

#### Scenario: Attention editor is available in the authoring rail

- **WHEN** the left column renders
- **THEN** it SHALL include an Attention editor section
- **AND** the section SHALL summarize the current focus, interaction,
  aggregation, and link-grouping state
- **AND** it SHALL use progressive disclosure so the full editor does not crowd
  Monaco, Build, Layers, or Diagnostics
- **AND** controls SHALL include concise helper text that explains what to
  enter and the effect of applying the value
- **AND** controls SHALL use compact Material UI sizing consistent with Fixture
  and Inspect controls

#### Scenario: Attention editor updates canonical YAML

- **WHEN** a user changes an Attention editor control
- **THEN** the harness SHALL update the Topology YAML `attention` block
- **AND** the update SHALL use structured document mutation rather than blind
  string concatenation
- **AND** no hidden attention state SHALL diverge from the YAML document
- **AND** existing validation SHALL run after the update

#### Scenario: Focus controls cover common query types

- **WHEN** the Attention editor Focus controls are open
- **THEN** the user SHALL be able to configure focus by node IDs, link IDs,
  path IDs, region IDs, labels, or data matchers
- **AND** object-ID pickers SHALL be populated from the current validated
  document
- **AND** labels and data SHALL be edited with compact key/value controls
- **AND** the user SHALL be able to choose the presentation mode for the query

#### Scenario: Focus controls can use canvas selection

- **WHEN** the user chooses to use current selection for Attention focus
- **THEN** selected nodes SHALL populate `attention.query.nodeIds`
- **AND** selected links SHALL populate `attention.query.linkIds`
- **AND** selected paths SHALL populate `attention.query.pathIds`
- **AND** selected regions SHALL populate `attention.query.regionIds`
- **AND** incompatible mixed selections SHALL be filtered by active focus type
  or rejected with a compact explanation

#### Scenario: Interaction controls are declarative

- **WHEN** the user configures Attention interaction
- **THEN** the editor SHALL expose `attention.interactive`
- **AND** the editor SHALL expose `attention.clickMode`
- **AND** click-to-focus and blank-canvas reset behavior SHALL be represented
  through the declarative attention configuration where supported

#### Scenario: Aggregation controls support dense topology review

- **WHEN** the user configures Attention aggregation
- **THEN** the editor SHALL support region-based aggregate groups
- **AND** the editor SHALL support `attention.aggregate.expandOnClick`
- **AND** the editor SHALL leave parent-child and label-based aggregation as
  visible future controls if they are not implemented in the first pass

#### Scenario: Link grouping controls are exposed

- **WHEN** the user configures Attention link grouping
- **THEN** the editor SHALL expose threshold-based link grouping controls
- **AND** the resulting YAML SHALL update `attention.links.grouping`
- **AND** the canvas SHALL rerender grouped links after validation passes

#### Scenario: Attention editor handles invalid documents safely

- **WHEN** the current YAML cannot be validated
- **THEN** the Attention editor SHALL disable mutation controls
- **AND** it SHALL explain that validation must pass before attention can be
  edited through structured controls
- **AND** direct Monaco editing SHALL remain available

#### Scenario: Attention edits update the canvas

- **WHEN** a user configures a valid visible attention query
- **THEN** the TopoViewer canvas SHALL update without reloading the harness
- **AND** the YAML editor SHALL show the corresponding `attention` block

### Requirement: Efficient authoring screen real estate

The VS Code browser harness SHALL keep dense authoring controls usable without
turning the page into stacked panels.

#### Scenario: Left column avoids oversized panels

- **WHEN** the left column renders
- **THEN** the active Build, Inspect, YAML, Attention, or Layers
  tab SHALL own the available vertical rail space
- **AND** YAML mode SHALL make Monaco the dominant source-editing area
- **AND** non-YAML modes SHALL avoid stacked card layouts
- **AND** active-pane headings SHALL NOT repeat the selected mode tab unless
  they add new context
- **AND** empty selection state SHALL live inside the Inspect panel rather than
  as a detached `No selection` label
- **AND** diagnostics SHALL remain visible as a low-noise status row outside the
  mode tabs

#### Scenario: Utility controls use consistent compact density

- **WHEN** Fixture, Inspect, and Attention controls render in the authoring rail
- **THEN** their select fields, text fields, checkboxes, and action buttons
  SHALL use compact Material UI density where practical
- **AND** the implementation SHALL avoid hardcoded pixel heights for matching
  those controls
- **AND** Playwright coverage SHALL compare field sizing structurally rather
  than asserting fixed pixel values

#### Scenario: Layer controls remain compact

- **WHEN** layer controls render
- **THEN** they SHALL remain scrollable
- **AND** they SHALL show compact object counts
- **AND** they SHALL use text sizing appropriate for a utility panel

#### Scenario: Canvas controls stay focused

- **WHEN** the preview canvas renders
- **THEN** primary preview actions SHALL remain compact in the top-left
- **AND** lower-frequency actions SHALL use icon buttons and tooltips where
  practical
- **AND** canvas controls SHALL NOT obscure important topology content at the
  default viewport size

#### Scenario: Visual regressions are covered

- **WHEN** the harness UI is changed
- **THEN** Playwright coverage SHALL verify the split layout, divider behavior,
  authoring modes, selection, Build panel, object insertion, Inspector,
  undo/redo, Attention editor behavior, compact layers, and responsive fallback
- **AND** screenshot review SHALL cover desktop light/dark and a narrow viewport

### Requirement: Workflow-specific harness fixtures

The VS Code browser harness SHALL include small fixtures that exercise each
authoring workflow clearly.

#### Scenario: Harness fixtures are workflow-specific

- **WHEN** harness fixtures are listed
- **THEN** there SHALL be fixtures for Build, Attention, Inspector, and dense
  link grouping workflows
- **AND** each fixture SHALL remain small enough for visual review at the
  default harness viewport
- **AND** each exposed layer SHALL have at least one topology or diagram object

#### Scenario: Attention fixture covers attention UI controls

- **WHEN** the Attention workflow fixture loads
- **THEN** it SHALL include at least one path focus case
- **AND** it SHALL include at least one region aggregation case
- **AND** it SHALL include at least one parallel-link grouping case
