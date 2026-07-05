## ADDED Requirements

### Requirement: Card Node Layout Contract

TopoViewer SHALL support an explicit card node layout through a nested
`style.nodeLayout` object.

#### Scenario: Card layout renders inside a round rectangle

- **WHEN** a node style declares `shape: roundRectangle`
- **AND** it declares `nodeLayout.type: card`
- **THEN** TopoViewer SHALL render the node as a card whose content is arranged
  inside the node body
- **AND** the outer node shape, edge anchors, selection behavior, and dragging
  SHALL remain based on the round-rectangle node body

#### Scenario: Existing nodes remain unchanged

- **WHEN** a node style does not declare `nodeLayout`
- **THEN** TopoViewer SHALL render the node using the existing node layout
- **AND** existing examples and user diagrams SHALL not change visual structure
  because of this feature

### Requirement: Shape Gate

TopoViewer SHALL only allow `nodeLayout.type: card` when the same node style
uses `shape: roundRectangle`.

#### Scenario: Card layout without round rectangle is rejected

- **WHEN** a style declares `nodeLayout.type: card`
- **AND** the effective node shape is not `roundRectangle`
- **THEN** validation or semantic lint SHALL report a diagnostic at the
  offending stylesheet rule or object style path
- **AND** runtime rendering SHALL fail soft without crashing the graph

### Requirement: Horizontal Card Content

TopoViewer SHALL support the initial horizontal card layout with a left icon
cell and text content area.

#### Scenario: Icon cell renders on the left

- **WHEN** a card layout declares `nodeLayout.direction: horizontal`
- **AND** `nodeLayout.icon.placement: left`
- **THEN** the icon cell SHALL render on the left side of the card
- **AND** the title/subtitle content SHALL render to the right of the icon cell

#### Scenario: Icon cell dimensions are explicit

- **WHEN** `nodeLayout.icon.width` or `nodeLayout.icon.height` is declared
- **THEN** TopoViewer SHALL size the icon cell using those values
- **AND** the outer node width and height SHALL remain controlled by the
  existing `width` and `height` node style keys

### Requirement: Card Title And Subtitle Fields

TopoViewer SHALL resolve card title and subtitle from explicit object field
paths.

#### Scenario: Title field defaults to name

- **WHEN** a card layout omits `nodeLayout.content.titleField`
- **THEN** TopoViewer SHALL use the node display name as the card title

#### Scenario: Subtitle resolves from data

- **WHEN** a card layout declares `nodeLayout.content.subtitleField: data.subtitle`
- **AND** the node has `data.subtitle`
- **THEN** TopoViewer SHALL render that value as the card subtitle

#### Scenario: Missing subtitle is empty

- **WHEN** a card layout declares a subtitle field that does not exist
- **THEN** TopoViewer SHALL omit the subtitle text
- **AND** rendering SHALL continue without diagnostics unless the field path
  itself is syntactically invalid

### Requirement: Icon-Scoped Badge Placement

TopoViewer SHALL support badge placement relative to the icon cell for card
nodes.

#### Scenario: Badge attaches to icon cell

- **WHEN** a card layout declares `nodeLayout.icon.badgePlacement: topRight`
- **AND** the node has `badgeLabel`
- **THEN** TopoViewer SHALL render the badge at the top-right of the card icon
  cell
- **AND** the badge SHALL not be positioned relative to the entire card body

#### Scenario: Existing badge placement remains compatible

- **WHEN** a non-card node declares `badgePosition`
- **THEN** TopoViewer SHALL keep the existing badge placement behavior

### Requirement: Card Schema, Lint, And YAML Assist

TopoViewer SHALL expose the card layout contract through schemas, semantic
lint, browser harness YAML assist, and VS Code harness YAML assist.

#### Scenario: Schema accepts supported nested object

- **WHEN** a stylesheet contains the supported `nodeLayout` card object
- **THEN** schema validation SHALL accept the nested object

#### Scenario: Unsupported nested values are reported

- **WHEN** a stylesheet declares unsupported card values such as
  `direction: vertical` or `icon.placement: right`
- **THEN** validation or semantic lint SHALL report the unsupported value until
  those values become implemented features

#### Scenario: Authoring assist suggests nested card keys

- **WHEN** a user edits a stylesheet in the browser harness or VS Code harness
- **THEN** YAML assist SHOULD suggest supported `nodeLayout` card keys and enum
  values

### Requirement: Documentation, Examples, And Parity

TopoViewer SHALL document and test card nodes as a supported node layout.

#### Scenario: Docs explain shape versus layout

- **WHEN** card node layout docs are generated
- **THEN** they SHALL explain that `shape` is outer geometry and `nodeLayout`
  is internal content layout
- **AND** they SHALL state that card layout requires `shape: roundRectangle`

#### Scenario: Example renders across surfaces

- **WHEN** the card layout example is opened in Harness, MkDocs, and Zensical
- **THEN** the same topology/style YAML SHALL render the left-icon card layout
  consistently across those surfaces

#### Scenario: Visual evidence is captured before completion

- **WHEN** implementation claims the card layout is complete
- **THEN** the change SHALL include visual evidence showing at least one card
  node example rendered with icon, title, subtitle, badge, and link anchors
