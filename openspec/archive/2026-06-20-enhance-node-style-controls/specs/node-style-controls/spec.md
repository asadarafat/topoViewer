## ADDED Requirements

### Requirement: Node label placement and readability controls

TopoViewer SHALL support practical node label placement, wrapping, backing, and zoom-aware readability controls through canonical node style keys.

#### Scenario: Label position moves around the node body

- **WHEN** a node style declares `labelPosition`
- **THEN** TopoViewer SHALL place the node label at the requested supported position relative to the node body
- **AND** the node body, icon, drag behavior, selection behavior, and edge anchors SHALL remain stable

#### Scenario: Label offsets refine placement

- **WHEN** a node style declares `labelXOffset` or `labelYOffset`
- **THEN** TopoViewer SHALL offset the rendered label by the requested pixel values
- **AND** the underlying graph position SHALL remain unchanged

#### Scenario: Wrapped label uses max width

- **WHEN** a node style declares `labelTextWrap: wrap` and `labelTextMaxWidth`
- **THEN** TopoViewer SHALL wrap the label text within that maximum width
- **AND** safe markdown rendering SHALL continue to apply

#### Scenario: Label backing improves contrast

- **WHEN** a node style declares `labelBackgroundColor`, `labelBackgroundOpacity`, `labelBorderColor`, `labelBorderWidth`, or `labelPadding`
- **THEN** TopoViewer SHALL render the label with that backing treatment
- **AND** the backing SHALL not cover the node body unless `labelPosition: center` or explicit offsets place it there

#### Scenario: Minimum zoomed font size suppresses unreadable labels

- **WHEN** a node style declares `minZoomedLabelFontSize`
- **AND** the viewport zoom would make the effective label font size smaller than that value
- **THEN** TopoViewer SHALL hide or suppress the label visually
- **AND** the node SHALL remain visible, selectable, focusable where applicable, and present in graph traversal

### Requirement: Node border, outline, and underlay controls

TopoViewer SHALL support node emphasis controls for border style, outline, and underlay without changing graph geometry.

#### Scenario: Border style applies to node body geometry

- **WHEN** a node style declares `borderStyle`, `borderDashPattern`, or `borderOpacity`
- **THEN** TopoViewer SHALL apply those values to the rendered node body border
- **AND** existing `borderColor` and `borderWidth` behavior SHALL remain compatible

#### Scenario: Outline emphasizes node body

- **WHEN** a node style declares `outlineColor`, `outlineWidth`, or `outlineOpacity`
- **THEN** TopoViewer SHALL render an outline around or behind the node body
- **AND** the outline SHALL NOT change React Flow node dimensions, edge anchor calculations, or layout inputs

#### Scenario: Underlay renders behind node

- **WHEN** a node style declares `underlayColor`, `underlayPadding`, or `underlayOpacity`
- **THEN** TopoViewer SHALL render an underlay behind the node body
- **AND** the underlay SHALL preserve dragging, selection, and object click behavior

### Requirement: Icon and image fit controls

TopoViewer SHALL let node styles control icon opacity, padding, fit, and icon-frame background while preserving the reusable `icons` model.

#### Scenario: Icon fit controls image rendering

- **WHEN** a node uses an image or SVG icon
- **AND** a node style declares `iconFit`
- **THEN** TopoViewer SHALL render the icon using the requested supported fit behavior
- **AND** unsupported values SHALL be reported by validation or semantic lint

#### Scenario: Icon padding shrinks content area

- **WHEN** a node style declares `iconPadding`
- **THEN** TopoViewer SHALL inset the icon content inside the configured icon box
- **AND** the node body size and edge anchors SHALL remain unchanged

#### Scenario: Icon opacity applies to glyph and image icons

- **WHEN** a node style declares `iconOpacity`
- **THEN** TopoViewer SHALL apply that opacity to glyph, SVG, and image icon content
- **AND** the node body fill, border, label, badge, and status marker SHALL keep their own opacity behavior

### Requirement: Aggregate badge and status styling

TopoViewer SHALL support compact badge and status marker styling for aggregate and high-signal nodes.

#### Scenario: Explicit badge renders on node

- **WHEN** a node style declares `badgeLabel`
- **THEN** TopoViewer SHALL render a short badge on the node
- **AND** `badgeColor`, `badgeBackgroundColor`, `badgeBorderColor`, and `badgePosition` SHALL style and place the badge when provided

#### Scenario: Status marker renders on node

- **WHEN** a node style declares `statusColor`
- **THEN** TopoViewer SHALL render a compact status marker on the node
- **AND** `statusPlacement` and `statusSize` SHALL control placement and size when provided

#### Scenario: Aggregate node can receive generated summary badge

- **WHEN** attention aggregation creates an aggregate summary node
- **AND** the aggregate summary has member count or severity summary data
- **THEN** TopoViewer MAY provide default badge or status values for that aggregate node
- **AND** explicit stylesheet or per-object style keys SHALL override generated badge or status defaults

#### Scenario: Badge content remains compact

- **WHEN** a badge label is too long for compact rendering
- **THEN** TopoViewer SHALL preserve graph rendering without layout failure
- **AND** validation or semantic lint MAY report a warning tied to the offending style path

### Requirement: Node style validation and lint

TopoViewer SHALL validate and lint the expanded node style contract using canonical `camelCase` keys and supported values.

#### Scenario: Unsupported node style value is reported

- **WHEN** a node style declares an unsupported value for `labelPosition`, `labelTextWrap`, `labelTextOverflow`, `borderStyle`, `iconFit`, `badgePosition`, or `statusPlacement`
- **THEN** validation or semantic lint SHALL report the unsupported value at the offending style path
- **AND** runtime rendering SHALL fail soft by using a safe default

#### Scenario: Invalid numeric node style is reported

- **WHEN** a node style declares a non-finite, negative, or out-of-range numeric value for a key that requires constrained numbers
- **THEN** validation or semantic lint SHALL report the issue at the offending style path
- **AND** runtime rendering SHALL preserve a visible graph

#### Scenario: Kebab-case aliases are rejected

- **WHEN** a stylesheet or per-object style uses kebab-case aliases for new node style keys
- **THEN** validation or semantic lint SHALL reject those aliases
- **AND** documentation SHALL show only canonical `camelCase` authoring

### Requirement: Documentation and examples

TopoViewer SHALL document enhanced node controls as practical topology styling, not full Cytoscape parity.

#### Scenario: Public docs list supported canonical keys

- **WHEN** node style documentation is generated
- **THEN** it SHALL list the supported TopoViewer `camelCase` keys
- **AND** it SHALL state that kebab-case Cytoscape keys are not accepted as TopoViewer authoring syntax

#### Scenario: Examples demonstrate visual intent

- **WHEN** enhanced node examples are generated
- **THEN** each example SHALL include a live viewport, topology YAML, stylesheet YAML, and expected assertions
- **AND** the examples SHALL use compact graphs where label placement, border/outline/underlay, icon fit, badges, and status markers are easy to inspect

## MODIFIED Requirements

### Requirement: Node style documentation

TopoViewer SHALL update node style documentation and schemas so the expanded practical node style keys are discoverable and validated.

#### Scenario: Existing node styles remain compatible

- **WHEN** existing documents use `icon`, `iconSize`, `iconWidth`, `iconHeight`, `width`, `height`, `shape`, `shapePolygonPoints`, `backgroundColor`, `borderColor`, `borderWidth`, `iconColor`, `labelColor`, `labelFontSize`, `labelFontWeight`, `metaColor`, `metaFontSize`, `metaFontWeight`, `opacity`, `zIndex`, `display`, `draggable`, or `selectable`
- **THEN** those styles SHALL continue to render with the same behavior unless a new key is explicitly added
- **AND** first-party examples SHALL remain canonical `camelCase`
