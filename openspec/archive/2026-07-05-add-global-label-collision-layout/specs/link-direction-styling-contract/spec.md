## ADDED Requirements

### Requirement: Link Direction Style Inheritance

TopoViewer SHALL treat `linkDirection` as a virtual styling target derived from
a parent link.

#### Scenario: Parent link defines base style

- **WHEN** a parent link defines line color, line width, dash style, arrow
  shape, label style, or opacity
- **THEN** each rendered direction lane SHALL inherit those values unless a
  `linkDirection` selector, direction-specific style, or mapper overlay
  overrides them

### Requirement: Direction Labels Represent Vector Values

TopoViewer SHALL use direction labels for directional values such as bandwidth,
packet rate, or per-direction state.

#### Scenario: Bidirectional telemetry

- **WHEN** a link has `sourceToTarget` and `targetToSource` direction values
- **THEN** each direction lane MAY render its own label without changing the
  parent link label

### Requirement: Arrows Are Marker Geometry

TopoViewer SHALL keep source and target arrows as marker geometry.

#### Scenario: Physical port name is available

- **WHEN** a physical port name such as `e1-1` or `eth1` must be shown near a
  link endpoint
- **THEN** the port name SHALL be rendered through `sourceLabel` or
  `targetLabel`, not as text inside the arrow marker

### Requirement: Endpoint Labels Represent Port Names

TopoViewer SHALL use `sourceLabel` and `targetLabel` for endpoint-specific link
text such as interface names.

#### Scenario: Link has physical endpoints

- **WHEN** a link defines `sourceLabel: e1-1` and `targetLabel: e1-49`
- **THEN** the renderer SHALL place those labels near the corresponding
  endpoints and SHALL keep them distinct from direction telemetry labels

### Requirement: Annotation Overlay Layers

TopoViewer SHALL support annotation overlay visibility separately from topology
layer visibility.

#### Scenario: Hide bandwidth overlay

- **WHEN** a user hides the bandwidth overlay
- **THEN** directional telemetry strokes and labels MAY be hidden while the
  parent topology link remains visible

### Requirement: Mapper Overlays Preserve Parent Link Identity

Mapper-driven direction styling SHALL apply runtime visual state to direction
lanes without mutating the parent link identity.

#### Scenario: Prometheus sample maps to one direction

- **WHEN** a telemetry sample maps to `linkDirection[direction =
  "sourceToTarget"]`
- **THEN** the direction lane MAY receive runtime style while the parent link ID,
  source, target, and endpoint labels remain stable
