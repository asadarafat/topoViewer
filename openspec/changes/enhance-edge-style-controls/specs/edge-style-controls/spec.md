## ADDED Requirements

### Requirement: Directional arrow controls

TopoViewer SHALL support direction-specific arrow styling for edge source and target markers.

#### Scenario: Target arrow uses direction-specific style

- **WHEN** an edge style declares `targetArrowShape`, `targetArrowColor`, and `targetArrowSize`
- **THEN** the target marker SHALL render with the requested supported shape, color, and size
- **AND** the visible edge line SHALL remain aligned with the marker

#### Scenario: Source and target arrows are independent

- **WHEN** an edge style declares different source and target arrow values
- **THEN** TopoViewer SHALL render the source and target markers independently
- **AND** either side MAY be disabled with `none`

#### Scenario: Shared arrow color remains compatible

- **WHEN** an existing edge style declares `arrowColor` without direction-specific arrow colors
- **THEN** TopoViewer SHALL use `arrowColor` as the fallback for source and target markers
- **AND** existing `sourceArrowShape` and `targetArrowShape` styles SHALL continue to render

#### Scenario: Unsupported arrow shape is reported

- **WHEN** an edge style declares an unsupported arrow shape
- **THEN** validation or semantic lint SHALL report the unsupported value at the offending style path
- **AND** runtime rendering SHALL fail soft by using `none` or a safe default marker

### Requirement: Rich edge label styling

TopoViewer SHALL allow center, source, and target edge labels to be styled independently while preserving existing global label defaults.

#### Scenario: Endpoint label inherits global edge label style

- **WHEN** an edge style declares `sourceLabel` or `targetLabel`
- **AND** only global label keys such as `labelColor`, `labelFontSize`, `labelFontWeight`, `textBackgroundColor`, or `textBackgroundOpacity` are declared
- **THEN** source and target labels SHALL inherit the global label style

#### Scenario: Endpoint label overrides style

- **WHEN** an edge style declares endpoint-specific keys such as `sourceLabelColor`, `sourceLabelBackgroundColor`, or `sourceLabelBorderColor`
- **THEN** the source label SHALL use those endpoint-specific values
- **AND** the target label SHALL continue using global or target-specific values

#### Scenario: Label interaction can be disabled

- **WHEN** an edge style declares `labelInteractive: false`
- **THEN** center, source, and target labels SHALL remain visible
- **AND** those labels SHALL NOT capture pointer events

### Requirement: Endpoint spacing

TopoViewer SHALL support spacing between the rendered edge endpoint and the connected node boundary.

#### Scenario: Source endpoint spacing

- **WHEN** an edge style declares `sourceDistanceFromNode`
- **THEN** the visible source endpoint SHALL move from the computed node boundary toward the target endpoint by that distance
- **AND** the graph source ID, layout source, and dependency traversal SHALL remain unchanged

#### Scenario: Target endpoint spacing

- **WHEN** an edge style declares `targetDistanceFromNode`
- **THEN** the visible target endpoint SHALL move from the computed node boundary toward the source endpoint by that distance
- **AND** target arrow and target label positioning SHALL use the adjusted endpoint

#### Scenario: Short edge clamping

- **WHEN** source and target spacing would collapse or invert a short edge
- **THEN** TopoViewer SHALL clamp spacing to keep a visible path
- **AND** validation or lint MAY report excessive spacing when it is statically detectable

### Requirement: Deterministic route controls

TopoViewer SHALL support explicit route controls for segment and taxi style edges.

#### Scenario: Segment controls define bend geometry

- **WHEN** an edge style declares `curveStyle: segments` or equivalent supported segment intent
- **AND** declares `segmentWeights` and `segmentDistances`
- **THEN** TopoViewer SHALL render a deterministic segmented path using those values
- **AND** labels, arrows, line outlines, and attention state SHALL follow the rendered path

#### Scenario: Taxi controls define orthogonal route geometry

- **WHEN** an edge style declares `curveStyle: taxi` or equivalent supported taxi intent
- **AND** declares `taxiDirection`, `taxiTurn`, or `taxiTurnMinDistance`
- **THEN** TopoViewer SHALL render a deterministic orthogonal route using those values where possible
- **AND** invalid route inputs SHALL fall back to the current route behavior with a lint diagnostic

### Requirement: Linear gradient edge lines

TopoViewer SHALL support linear gradient strokes for edge lines.

#### Scenario: Linear gradient line

- **WHEN** an edge style declares `lineFill: linearGradient`
- **AND** declares `lineGradientStopColors`
- **THEN** TopoViewer SHALL render the visible edge line using a linear gradient
- **AND** `lineGradientStopPositions` SHALL control stop placement when provided

#### Scenario: Gradient preserves existing edge behavior

- **WHEN** a gradient edge also declares line width, dash pattern, line opacity, arrow markers, line outline, or attention state
- **THEN** those behaviors SHALL continue to apply consistently

#### Scenario: Invalid gradient stops

- **WHEN** gradient stop colors and positions are malformed or mismatched
- **THEN** validation or semantic lint SHALL report the issue
- **AND** runtime rendering SHALL fall back to a solid line color

### Requirement: Edge interaction flags

TopoViewer SHALL let authors disable edge and label interaction separately.

#### Scenario: Non-interactive decorative edge

- **WHEN** an edge style declares `interactive: false`
- **THEN** the edge SHALL remain visible
- **AND** clicking the edge SHALL NOT trigger TopoViewer object focus or host edge click callbacks

#### Scenario: Label interaction remains independent

- **WHEN** an edge style declares `interactive: true` and `labelInteractive: false`
- **THEN** clicking the visible edge path SHALL remain interactive
- **AND** clicking the label SHALL pass through to the viewport or underlying element

### Requirement: Documentation and examples

TopoViewer SHALL document enhanced edge controls as practical edge styling, not full Cytoscape parity.

#### Scenario: Public docs list supported canonical keys

- **WHEN** edge style documentation is generated
- **THEN** it SHALL list the supported TopoViewer `camelCase` keys
- **AND** it SHALL state that kebab-case Cytoscape keys are not accepted as TopoViewer authoring syntax

#### Scenario: Examples demonstrate visual intent

- **WHEN** enhanced edge examples are generated
- **THEN** each example SHALL include a live viewport, topology YAML, stylesheet YAML, and expected assertions
- **AND** the examples SHALL use compact graphs where arrows, labels, spacing, routing, gradient lines, and interaction behavior are easy to inspect

## MODIFIED Requirements

### Requirement: Edge style documentation

TopoViewer SHALL update edge style documentation and schemas so the expanded practical edge style keys are discoverable and validated.

#### Scenario: Existing edge styles remain compatible

- **WHEN** existing documents use `lineColor`, `lineWidth`, `lineStyle`, `lineDashPattern`, `curveStyle`, `sourceArrowShape`, `targetArrowShape`, `sourceLabel`, or `targetLabel`
- **THEN** those styles SHALL continue to render with the same behavior unless a new key is explicitly added
- **AND** first-party examples SHALL remain canonical `camelCase`
