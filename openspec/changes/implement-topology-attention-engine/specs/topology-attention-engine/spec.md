## ADDED Requirements

### Requirement: Dense topology baselines
TopoViewer SHALL provide repeatable dense-topology fixtures and benchmark probes before attention behavior is implemented.

#### Scenario: CI-safe dense smoke fixture
- **WHEN** the dense topology smoke fixture is generated
- **THEN** it SHALL include at least 1000 raw nodes with realistic labels, links, regions, paths, and operational `data.*` fields
- **AND** it SHALL run in CI without requiring external services

#### Scenario: Local large-graph benchmark
- **WHEN** the local benchmark command runs against 5000-node or 10000-node generated fixtures
- **THEN** it SHALL write structured JSON results for parse, validation, index build, reduction, layout, first render, and focus update timing

### Requirement: Semantic graph index
TopoViewer SHALL build an immutable runtime index for graph objects and their semantic relationships.

#### Scenario: Index contains graph relationships
- **WHEN** a topology document is compiled
- **THEN** the index SHALL expose lookup by ID, labels, `data.*` fields, region membership, path membership, parent-child membership, adjacency, and reverse adjacency

#### Scenario: Index preserves source graph immutability
- **WHEN** focus, scoring, or reduction logic reads from the index
- **THEN** it SHALL NOT mutate the source topology document or compiled graph facts

### Requirement: Focus query API
TopoViewer SHALL expose a runtime focus API that returns focused, related, and context object sets with reason metadata.

#### Scenario: Focus by semantic query
- **WHEN** a focus query selects labels, data predicates, paths, regions, or object IDs
- **THEN** the focus API SHALL return matching focused object IDs
- **AND** SHALL return reason metadata explaining why each focused object matched

#### Scenario: Focus by dependency depth
- **WHEN** a focus query requests upstream, downstream, or bidirectional dependency traversal from one or more seed objects
- **THEN** the focus API SHALL return related object IDs up to the requested depth
- **AND** SHALL keep non-matching objects available as context unless the caller explicitly hides context

### Requirement: Progressive disclosure
TopoViewer SHALL support aggregate overview graphs for dense source topologies.

#### Scenario: Collapse by existing graph structure
- **WHEN** a dense topology is reduced for overview
- **THEN** the reduction pipeline SHALL be able to collapse by regions, parent-child nodes, or label-defined groups
- **AND** SHALL preserve source membership references for later drill-down

#### Scenario: Aggregates expose summaries
- **WHEN** an aggregate object is rendered
- **THEN** it SHALL expose child counts, link counts, and severity summaries for labels, tooltips, and stylesheets

#### Scenario: Operator-controlled aggregate drill-down
- **WHEN** an aggregate configuration enables click expansion
- **THEN** clicking a collapsed aggregate summary SHALL expand that group
- **AND** clicking the expanded region hull or parent object SHALL collapse that group when the aggregate was derived from that object
- **AND** unrelated aggregate groups SHALL remain collapsed unless the caller or operator explicitly expands them

#### Scenario: Optional viewport aggregate policy
- **WHEN** an aggregate configuration declares viewport zoom thresholds
- **THEN** the embed SHALL collapse matching groups below the collapse threshold
- **AND** SHALL expand matching groups above the expansion threshold
- **AND** SHALL keep the source topology unchanged
- **AND** public documentation SHALL present this as an advanced host policy, not the default operator workflow

#### Scenario: Link grouping threshold
- **WHEN** visible links share a grouping key and meet the configured threshold
- **THEN** the reduction pipeline SHALL render one aggregate link for that group
- **AND** SHALL preserve member link IDs, count, endpoint, and layer metadata for drill-down, labels, stylesheets, and export

#### Scenario: Documentation uses compact authored examples
- **WHEN** aggregate and link-grouping behavior is documented for dense topology
- **THEN** the public example SHALL use a compact authored graph that shows summaries, counted links, and drill-down
- **AND** larger generated dense graphs SHALL remain available as stress fixtures or benchmarks
- **AND** the public dense example SHALL demonstrate explicit click drill-down rather than zoom-triggered disclosure

### Requirement: Importance scoring
TopoViewer SHALL calculate deterministic and explainable importance scores for visible graph objects.

#### Scenario: Score combines attention factors
- **WHEN** a focused view is derived
- **THEN** scoring SHALL consider focus match, path membership, operational severity, dependency fanout, recent change markers, and context proximity when those inputs exist

#### Scenario: Score explains emphasis
- **WHEN** debug output or developer tooling inspects a scored object
- **THEN** it SHALL include the contributing score reasons that made the object prominent

### Requirement: Context-aware labels
TopoViewer SHALL treat labels as a limited attention budget rather than rendering all labels at equal priority.

#### Scenario: Label priority follows focus and score
- **WHEN** a focused view is rendered
- **THEN** labels for focused and high-score objects SHALL be prioritized over low-score context labels

#### Scenario: Aggregate labels summarize instead of enumerate
- **WHEN** an object is collapsed into an aggregate
- **THEN** the aggregate label SHALL summarize count and severity instead of listing all child object labels

### Requirement: Operator focus modes
TopoViewer SHALL provide first-class focus modes for common operator workflows.

#### Scenario: Object focus
- **WHEN** a caller focuses a node, link, path, or region
- **THEN** that object SHALL be emphasized
- **AND** path focus SHALL emphasize path members
- **AND** unrelated context SHALL be dimmed by default rather than removed

#### Scenario: Blast-radius focus
- **WHEN** a caller focuses blast radius from a seed object and depth
- **THEN** upstream, downstream, or bidirectional dependency neighbors SHALL be emphasized according to the requested direction and depth

#### Scenario: Change focus
- **WHEN** graph objects include change metadata
- **THEN** a caller SHALL be able to focus objects changed since a selected timestamp or revision marker

### Requirement: Focused export
TopoViewer SHALL preserve focused view state in static exports.

#### Scenario: Export current attention state
- **WHEN** a user exports SVG, PNG, or PDF from a focused view
- **THEN** the exported artifact SHALL reflect the active focus, dimming, aggregate, label, and scoring presentation

### Requirement: Scale-first rendering guardrails
TopoViewer SHALL avoid full recomputation for repeated focus interactions when source graph facts do not change.

#### Scenario: Derived view caching
- **WHEN** focus state changes without source graph changes
- **THEN** TopoViewer SHALL reuse compatible graph indexes, layout inputs, and reduction caches where valid

#### Scenario: Rendering backend decisions are measured
- **WHEN** Canvas, WebGL, worker offload, or viewport culling is introduced
- **THEN** the change SHALL include benchmark evidence showing which measured bottleneck it addresses
