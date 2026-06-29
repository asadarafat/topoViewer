## ADDED Requirements

### Requirement: Link Direction Graph Model

TopoViewer SHALL support optional directional strokes on a physical graph link.

#### Scenario: Link declares both directions

- **WHEN** a link declares `directions.sourceToTarget`
- **AND** declares `directions.targetToSource`
- **THEN** TopoViewer SHALL keep the parent link as one physical adjacency
- **AND** SHALL compile two directional objects associated with the parent link
- **AND** SHALL expose each direction with its direction key, label, labels, data, style, source, target, and parent link ID

#### Scenario: Link declares one direction

- **WHEN** a link declares only one supported direction
- **THEN** TopoViewer SHALL compile only that directional object
- **AND** SHALL continue rendering the parent link context

#### Scenario: Direction ID is omitted

- **WHEN** a direction omits `id`
- **THEN** TopoViewer SHALL derive a stable ID from the parent link ID and direction key
- **AND** repeated compilation of the same topology SHALL produce the same derived ID

#### Scenario: Invalid direction key

- **WHEN** a link declares a direction key other than `sourceToTarget` or `targetToSource`
- **THEN** validation or semantic lint SHALL report the invalid key at the offending path
- **AND** runtime rendering SHALL ignore the invalid direction while preserving the parent link

### Requirement: Link Direction Selectors

TopoViewer SHALL support `linkDirection` as a virtual selector target for stylesheet rules.

#### Scenario: Selector matches all link directions

- **WHEN** a stylesheet rule uses `selector: linkDirection`
- **THEN** the rule SHALL apply to all compiled directional strokes
- **AND** SHALL NOT apply to parent links, nodes, paths, or regions

#### Scenario: Selector matches one direction key

- **WHEN** a stylesheet rule uses `selector: linkDirection[direction = "sourceToTarget"]`
- **THEN** the rule SHALL apply only to `sourceToTarget` lanes
- **AND** SHALL NOT apply to `targetToSource` lanes

#### Scenario: Selector matches direction labels or data

- **WHEN** a stylesheet rule matches `linkDirection[labels.role = "utilization"]` or `linkDirection[data.metric = "if_out_bps"]`
- **THEN** TopoViewer SHALL evaluate the selector against the directional lane labels and data

#### Scenario: Selector can match parent link identity

- **WHEN** a stylesheet rule matches a parent link ID, source, or target through the documented selector fields
- **THEN** TopoViewer SHALL apply the rule to matching directional strokes associated with that parent link

### Requirement: Straight Directional Stroke Rendering

TopoViewer SHALL render Phase 1 directional strokes as independent styled straight subpaths belonging to one physical parent link.

#### Scenario: Opposing strokes render on one physical link

- **WHEN** a straight link has both canonical directions
- **AND** directional stroke rendering is enabled or implied by direction presence
- **THEN** TopoViewer SHALL render one physical link corridor between the same source and target nodes
- **AND** SHALL render two opposing directional strokes on that physical link corridor
- **AND** the directions SHALL be visually distinguishable with arrows, labels, or style
- **AND** the result SHALL NOT look like two duplicate physical links

#### Scenario: Opposing arrowheads preserve a center gap

- **WHEN** a straight link renders both canonical directions
- **THEN** TopoViewer SHALL preserve a visible gap between the opposing arrowheads near the center of the link
- **AND** the gap SHALL be configurable with `directionCenterGap`
- **AND** the gap SHALL NOT remove the parent physical link context

#### Scenario: Direction strokes preserve a start gap from nodes

- **WHEN** a straight link renders directional strokes
- **THEN** TopoViewer SHALL preserve a visible inset between each node boundary and the start of its outgoing directional stroke
- **AND** the inset SHALL be configurable with `directionStartGap`
- **AND** the inset SHALL NOT change the parent link source or target endpoint semantics

#### Scenario: Direction lane styles are independent

- **WHEN** different styles apply to `sourceToTarget` and `targetToSource`
- **THEN** TopoViewer SHALL render each directional stroke with its own supported line, arrow, label, opacity, and dash style

#### Scenario: Direction arrow size defaults to lane width

- **WHEN** a directional stroke declares an arrow shape
- **AND** does not declare a direction-specific arrow size
- **THEN** TopoViewer SHALL size that arrow from the rendered directional `lineWidth`

#### Scenario: Direction arrow offset does not hide the line under the marker

- **WHEN** a directional stroke declares `sourceArrowOffset: 0` or `targetArrowOffset: 0`
- **THEN** TopoViewer SHALL place the arrow tip on the computed directional endpoint
- **AND** SHALL trim the visible stroke before the marker body so the line does not paint underneath the arrowhead
- **AND** SHALL account for round or square line caps when calculating the visible stroke end

#### Scenario: Direction inline style overrides shared direction style

- **WHEN** a stylesheet rule applies a shared style to `linkDirection`
- **AND** `directions.sourceToTarget.style` declares different values
- **THEN** the `sourceToTarget` directional stroke SHALL use its inline direction style for those keys
- **AND** the `targetToSource` directional stroke SHALL keep its own independently computed style

#### Scenario: Direction telemetry overlay overrides only one lane

- **WHEN** a mapper overlay applies runtime style to `sourceToTarget`
- **THEN** TopoViewer SHALL update only the `sourceToTarget` directional stroke rendering
- **AND** SHALL NOT change `targetToSource`
- **AND** SHALL NOT mutate source topology or stylesheet YAML

#### Scenario: Direction labels render near their stroke

- **WHEN** a direction declares a label or receives a label from style or telemetry overlay
- **THEN** TopoViewer SHALL render the label near the corresponding directional stroke
- **AND** SHALL preserve existing label readability controls such as background, border, offset, and z-index

#### Scenario: Parent link label avoids direction labels by default

- **WHEN** a parent link renders directional strokes
- **AND** the parent link has a center label
- **AND** no explicit `labelXOffset` or `labelYOffset` is set for the parent link
- **THEN** TopoViewer SHALL automatically offset the parent center label away from the directional lane labels
- **AND** explicit offsets, including `0`, SHALL override the automatic offset

#### Scenario: Parent link remains the interaction target

- **WHEN** a directional lane is rendered in Phase 1
- **THEN** TopoViewer SHALL preserve parent link hit target behavior
- **AND** SHALL NOT require direction-specific selection events for this phase

### Requirement: Directional Telemetry Mapping

TopoViewer mapper integrations SHALL support mapping telemetry samples to directional link strokes by stable link and direction identity.

#### Scenario: Mapper targets link directions by stable labels

- **WHEN** a mapper rule declares `select: linkDirection`
- **AND** joins telemetry by `link_id` and `direction`
- **THEN** the mapper SHALL resolve matching telemetry samples to the corresponding directional strokes
- **AND** SHALL apply runtime-only overlays to those strokes

#### Scenario: Mapper overlay stays runtime-only

- **WHEN** a telemetry sample changes direction style or label through a mapper rule
- **THEN** the rendered direction lane SHALL reflect the runtime overlay
- **AND** the source topology and stylesheet YAML SHALL remain unchanged

### Requirement: Documentation And Examples

TopoViewer SHALL document directional link strokes as the recommended model for bidirectional operational telemetry on one physical adjacency.

#### Scenario: Graph docs explain direction keys

- **WHEN** graph reference docs are generated
- **THEN** they SHALL document `directions.sourceToTarget` and `directions.targetToSource`
- **AND** SHALL explain that the direction keys are relative to the parent link `source` and `target`

#### Scenario: Style docs explain linkDirection selectors

- **WHEN** stylesheet reference docs are generated
- **THEN** they SHALL document `linkDirection` selector support
- **AND** SHALL list the supported style keys and target-specific restrictions

#### Scenario: Example demonstrates bidirectional bandwidth

- **WHEN** users open the directional link lane example
- **THEN** they SHALL see one physical link rendered with two opposing directional strokes
- **AND** the topology YAML, stylesheet YAML, and mapper YAML SHALL be available where relevant

## MODIFIED Requirements

### Requirement: Existing Link Compatibility

TopoViewer SHALL preserve current link behavior for topologies that do not use `link.directions`.

#### Scenario: Existing link has no directions

- **WHEN** an existing topology declares normal links without `directions`
- **THEN** TopoViewer SHALL render those links with the existing behavior
- **AND** existing tests, examples, schemas, and docs SHALL remain compatible
