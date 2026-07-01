## ADDED Requirements

### Requirement: Direction Lane Geometry Hardening

TopoViewer SHALL keep directional lanes visually inside one physical parent link corridor across supported edge routing modes.

#### Scenario: Parallel physical links keep separate corridors

- **WHEN** multiple physical links exist between the same source and target
- **AND** one or more physical links declares direction lanes
- **THEN** each physical link SHALL retain its own physical-link corridor
- **AND** direction lanes SHALL render inside their parent physical-link corridor
- **AND** direction lanes SHALL NOT visually merge into direction lanes from another physical link

#### Scenario: Curved parent edge keeps direction lanes on the parent route

- **WHEN** a parent link uses a supported curved or routed edge style
- **AND** the link declares direction lanes
- **THEN** the direction lanes SHALL follow the parent edge route
- **AND** the lanes SHALL preserve the configured center gap and start gap

### Requirement: Direction Lane Interaction

TopoViewer SHALL distinguish parent link interaction from direction lane interaction.

#### Scenario: Parent link is selected

- **WHEN** the user selects the parent physical link hit target
- **THEN** TopoViewer SHALL emit a link selection event with the parent link ID
- **AND** MAY highlight both directional lanes as link context

#### Scenario: Direction lane is selected

- **WHEN** the user selects a visible direction lane
- **THEN** TopoViewer SHALL emit a `linkDirection` selection event
- **AND** the event SHALL include the parent link ID, direction key, and direction ID

### Requirement: Direction Lane Attention

TopoViewer SHALL support attention focus for parent links and individual direction lanes.

#### Scenario: Parent link is focused

- **WHEN** attention focuses a parent link
- **THEN** both directional lanes on that link SHALL remain readable
- **AND** unrelated topology objects SHALL be dimmed according to the active attention mode

#### Scenario: One direction lane is focused

- **WHEN** attention focuses one directional lane
- **THEN** the focused lane SHALL remain prominent
- **AND** the parent physical link context SHALL remain visible
- **AND** unrelated topology objects SHALL be dimmed according to the active attention mode

### Requirement: Direction Mapper Coverage

TopoViewer mapper integrations SHALL report actionable coverage diagnostics for direction telemetry.

#### Scenario: Direction sample cannot be resolved

- **WHEN** a telemetry sample references a missing link ID or unsupported direction
- **THEN** mapper coverage SHALL report the sample as unresolved
- **AND** SHALL NOT mutate source topology or stylesheet YAML

#### Scenario: Direction sample is ambiguous

- **WHEN** a telemetry sample resolves to more than one directional lane
- **THEN** mapper coverage SHALL report the sample as ambiguous
- **AND** SHALL NOT apply that sample unless a documented resolver disambiguates it

#### Scenario: Direction samples are stale or duplicate

- **WHEN** telemetry contains stale or duplicate samples for one direction lane
- **THEN** mapper coverage SHALL report the condition separately from matched and unresolved samples
- **AND** SHALL expose enough context for the user to identify the affected link and direction

### Requirement: Direction Lane Documentation Hardening

TopoViewer SHALL document production use of directional lanes across docs, harness, and Grafana workflows.

#### Scenario: Mounted bundle example drives direction lanes

- **WHEN** users open the Grafana mounted-bundle documentation
- **THEN** they SHALL see a `*.mapper.tv.yaml` example that maps directional telemetry to `linkDirection`
- **AND** the example SHALL include stable metric labels and PromQL starter guidance

#### Scenario: Cross-surface parity is verified

- **WHEN** the hardening change is validated
- **THEN** harness, MkDocs, Zensical, and Grafana SHALL be checked against representative direction-lane examples
- **AND** differences in geometry, labels, or styling SHALL be fixed or documented before archiving
