## ADDED Requirements

### Requirement: Shared Label Placement Model

TopoViewer SHALL represent visible labels from nodes, node metadata, regions,
links, endpoint labels, and link direction lanes as participants in a shared
placement model before rendering them.

#### Scenario: Dense operational topology

- **WHEN** a topology contains node labels, region labels, endpoint port labels,
  and direction bandwidth labels in the same viewport
- **THEN** the renderer SHALL evaluate those labels together rather than
  positioning each label family in isolation

### Requirement: Deterministic Placement

TopoViewer SHALL place labels deterministically for the same topology, style,
selected layers, overlay layers, and telemetry values.

#### Scenario: Grafana refresh with unchanged values

- **WHEN** Grafana refreshes data frames without changing rendered label text or
  topology geometry
- **THEN** label positions SHALL remain stable

### Requirement: Label Priorities

TopoViewer SHALL apply default label priorities and allow those priorities to be
overridden by style.

#### Scenario: Region label conflicts with node label

- **WHEN** a region label conflicts with a node primary label
- **THEN** the node primary label SHALL keep priority unless style explicitly
  overrides the priority

### Requirement: Collision Policies

TopoViewer SHALL support collision policies for labels.

#### Scenario: Unavoidable overlap

- **WHEN** all candidate placements for a label still overlap higher-priority
  labels or node bodies
- **THEN** the renderer SHALL apply the configured collision policy, such as
  preserving, fading, or hiding the lower-priority label

### Requirement: Manual Offsets Remain Explicit Nudges

TopoViewer SHALL preserve manual label offset keys as final explicit nudges
after automatic placement chooses a base position.

#### Scenario: User tunes a port label

- **WHEN** `sourceLabelAutoPosition` is enabled and `sourceLabelXOffset` is set
- **THEN** automatic placement SHALL choose the base source-label position and
  the manual X offset SHALL be applied afterward

### Requirement: Graph Layout Independence

TopoViewer SHALL NOT move topology nodes, regions, or link endpoints solely to
avoid label collisions.

#### Scenario: Label collision on a manual graph

- **WHEN** labels collide in a graph with `layout.mode: manual`
- **THEN** the label placement pass MAY move labels but SHALL NOT move graph
  objects
