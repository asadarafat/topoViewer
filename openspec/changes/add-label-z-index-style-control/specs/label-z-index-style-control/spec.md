## ADDED Requirements

### Requirement: Canonical label z-index style key

TopoViewer SHALL support `labelZIndex` as the canonical public style key for
label draw order.

#### Scenario: Canonical camelCase spelling is used

- **WHEN** a stylesheet or per-object style declares `labelZIndex`
- **THEN** TopoViewer SHALL treat it as the label draw-order control
- **AND** the key SHALL be documented with that exact casing

#### Scenario: Existing zIndex remains object draw order

- **WHEN** a style declares both `zIndex` and `labelZIndex`
- **THEN** `zIndex` SHALL control the object body, region hull, shape body, or
  edge line draw order
- **AND** `labelZIndex` SHALL control the label draw order independently

#### Scenario: Non-canonical spellings are rejected

- **WHEN** a style declares `label-z-index`, `labelZindex`, or another
  non-canonical spelling for this control
- **THEN** semantic lint or validation SHALL report the key as unsupported
- **AND** the renderer SHALL NOT treat it as an alias

### Requirement: Label z-index applies to rendered labels

TopoViewer SHALL apply `labelZIndex` to rendered labels for supported object
kinds without changing object geometry.

#### Scenario: Node label can be lifted without lifting node body

- **WHEN** a node style declares `zIndex: 10` and `labelZIndex: 120`
- **THEN** the node body SHALL render at object z-index 10
- **AND** the node label SHALL render at label z-index 120
- **AND** node position, dimensions, drag behavior, edge anchors, and selection
  behavior SHALL remain stable

#### Scenario: Region label can be lifted above region members

- **WHEN** a region style declares a low `zIndex` for the region hull and a
  higher `labelZIndex`
- **THEN** the region hull SHALL remain behind its members
- **AND** the region label SHALL be able to render above those members
- **AND** region member placement SHALL remain unchanged

#### Scenario: Edge label can be ordered independently from edge line

- **WHEN** a link or path style declares `zIndex` and `labelZIndex`
- **THEN** the edge line SHALL use `zIndex`
- **AND** the center edge label SHALL use `labelZIndex`

#### Scenario: Default behavior is preserved when labelZIndex is absent

- **WHEN** a document does not declare `labelZIndex`
- **THEN** TopoViewer SHALL preserve current label rendering and draw order
- **AND** existing examples and snapshots SHALL not require style changes

### Requirement: Endpoint label z-index overrides

TopoViewer SHALL support endpoint-specific edge label draw order through
canonical `sourceLabelZIndex` and `targetLabelZIndex` style keys.

#### Scenario: Source label z-index overrides shared label z-index

- **WHEN** an edge style declares `labelZIndex: 80` and `sourceLabelZIndex: 95`
- **THEN** the center label SHALL use z-index 80
- **AND** the source label SHALL use z-index 95

#### Scenario: Target label z-index overrides shared label z-index

- **WHEN** an edge style declares `labelZIndex: 80` and `targetLabelZIndex: 95`
- **THEN** the center label SHALL use z-index 80
- **AND** the target label SHALL use z-index 95

#### Scenario: Endpoint labels fall back to shared label z-index

- **WHEN** an edge style declares `labelZIndex` but omits
  `sourceLabelZIndex` and `targetLabelZIndex`
- **THEN** source and target labels SHALL use `labelZIndex` when they render

### Requirement: Label z-index validation and authoring support

TopoViewer SHALL validate and document label z-index controls as finite numeric
style values.

#### Scenario: Invalid numeric value is reported

- **WHEN** a style declares a non-finite value for `labelZIndex`,
  `sourceLabelZIndex`, or `targetLabelZIndex`
- **THEN** semantic lint or validation SHALL report the issue at the offending
  style path
- **AND** runtime rendering SHALL preserve a visible graph

#### Scenario: YAML authoring suggests the canonical key

- **WHEN** the VS Code harness or browser harness provides stylesheet key
  suggestions
- **THEN** it SHALL suggest `labelZIndex` for label-capable object kinds
- **AND** it SHALL suggest `sourceLabelZIndex` and `targetLabelZIndex` for
  edge-capable object kinds
- **AND** value suggestions SHALL treat these keys as numeric values

#### Scenario: Public docs explain zIndex versus labelZIndex

- **WHEN** stylesheet documentation is generated
- **THEN** it SHALL describe `zIndex` as object draw order
- **AND** it SHALL describe `labelZIndex` as label draw order
- **AND** it SHALL state that `labelZIndex` is not automatic collision
  detection or automatic label placement

### Requirement: Label layering remains exportable and testable

TopoViewer SHALL keep label z-index behavior visible in browser rendering,
documentation embeds, and export paths.

#### Scenario: Documentation embed renders label z-index examples

- **WHEN** a label z-index example is rendered in MkDocs or Zensical
- **THEN** the live viewport SHALL show the intended label draw order
- **AND** Playwright assertions SHALL verify the relevant label style or DOM
  layering marker

#### Scenario: Export includes independently layered labels

- **WHEN** a diagram containing `labelZIndex` is exported
- **THEN** exported PNG or SVG output SHALL include the labels in the expected
  visual order
- **AND** export SHALL not omit labels rendered through an overlay or portal
