## ADDED Requirements

### Requirement: Node shape stylesheet values

TopoViewer SHALL allow node body shapes to be declared through node stylesheet rules and per-node style overrides.

#### Scenario: Selector assigns node shape

- **WHEN** a stylesheet rule matching `node` declares `style.shape`
- **THEN** every matched node SHALL render with that body shape
- **AND** later matching stylesheet rules SHALL override earlier shape values
- **AND** an individual object `style.shape` override SHALL still take precedence over matched stylesheet rules

#### Scenario: Supported named shapes

- **WHEN** `style.shape` is one of the supported named node shapes
- **THEN** the node SHALL render that geometry within the node body width and height
- **AND** labels, icons, edge anchors, selection state, dragging, attention dimming, and export behavior SHALL remain functional

#### Scenario: Multi-word shape values use camelCase

- **WHEN** a node style declares a multi-word shape value
- **THEN** the supported TopoViewer value SHALL use camelCase, such as `roundRectangle`, `bottomRoundRectangle`, `cutRectangle`, or `concaveHexagon`
- **AND** hyphenated or legacy shape values SHALL be rejected by validation or semantic lint

### Requirement: Custom polygon points

TopoViewer SHALL support custom polygon node shapes using normalized point coordinates.

#### Scenario: Polygon points as array

- **WHEN** a node style declares `shape: polygon`
- **AND** declares `shapePolygonPoints` as an array of numbers
- **THEN** TopoViewer SHALL interpret the values as alternating x/y points in the `[-1, 1]` coordinate space
- **AND** SHALL render the polygon scaled to the node body bounds

#### Scenario: Polygon points as canonical string

- **WHEN** a node style declares `shape: polygon`
- **AND** declares `shapePolygonPoints` as a space-separated string
- **THEN** TopoViewer SHALL parse the value as alternating x/y points in the `[-1, 1]` coordinate space
- **AND** SHALL render the same geometry as the equivalent numeric array

#### Scenario: Invalid polygon points

- **WHEN** polygon points are missing, have an odd number of values, contain non-numeric values, contain fewer than three x/y pairs, or contain coordinates outside `[-1, 1]`
- **THEN** validation SHALL report a clear warning or error tied to the offending stylesheet or object style path
- **AND** runtime rendering SHALL fall back to a safe default shape rather than throwing

### Requirement: Rendering compatibility

TopoViewer SHALL render node body geometry without regressing existing node behavior.

#### Scenario: Icon and label remain aligned

- **WHEN** a node uses a non-ellipse shape such as `diamond`, `hexagon`, `tag`, or `vee`
- **THEN** the icon SHALL remain centered in the node body
- **AND** the label and metadata SHALL remain outside or below the body according to current node layout behavior

#### Scenario: Edges anchor to shaped nodes

- **WHEN** an edge connects to a shaped node
- **THEN** the edge SHALL continue to use stable source and target anchors
- **AND** the anchor behavior SHALL not depend on unsupported browser hit-testing of arbitrary SVG paths

#### Scenario: Attention and selection states apply to shaped nodes

- **WHEN** attention focus, dimming, aggregation, selection, or hover state applies to a shaped node
- **THEN** the visual state SHALL apply to the node body shape and its icon consistently

### Requirement: Documentation and examples

TopoViewer SHALL document node shape authoring as a stylesheet feature.

#### Scenario: Public docs show stylesheet-first authoring

- **WHEN** node shapes are documented
- **THEN** the docs SHALL show `shape` in stylesheet YAML as the recommended authoring path
- **AND** SHALL mention object `style` only as an override escape hatch
- **AND** SHALL avoid introducing a separate public `shapeStyle` block
- **AND** SHALL use `camelCase` for style keys such as `shapePolygonPoints`
- **AND** SHALL use camelCase for multi-word shape values such as `roundRectangle`

#### Scenario: Reference examples expose source

- **WHEN** the node shape examples are generated
- **THEN** each example SHALL include a live viewport, topology YAML, and stylesheet YAML
- **AND** at least one example SHALL show named shapes by device role
- **AND** at least one example SHALL show `shape: polygon` with canonical `shapePolygonPoints`

## MODIFIED Requirements

### Requirement: Node style documentation

TopoViewer SHALL update node style documentation and schemas so supported `shape` values are discoverable and validated.

#### Scenario: Schema validates shape values

- **WHEN** a stylesheet or combined document is validated
- **THEN** supported canonical node shape names SHALL be accepted
- **AND** unsupported, hyphenated, or legacy node shape names SHALL produce a validation error or semantic lint issue

#### Scenario: Existing examples are migrated

- **WHEN** existing examples use old shape values such as `roundrectangle`
- **THEN** they SHALL be updated to canonical values such as `roundRectangle`
- **AND** validation SHALL not depend on legacy shape-value aliases
