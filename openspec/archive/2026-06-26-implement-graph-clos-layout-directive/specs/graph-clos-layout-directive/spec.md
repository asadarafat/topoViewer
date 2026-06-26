## ADDED Requirements

### Requirement: Generic CLOS layout directive

TopoViewer SHALL support a `layout.mode: clos` directive that computes node
positions for CLOS-like staged graphs.

The directive SHALL be generic and SHALL NOT require a network, vendor, or
deployment-specific role model.

#### Scenario: CLOS layout is selected from YAML

Given a TopoViewer document declares `layout.mode: clos`
When the document is compiled
Then TopoViewer SHALL compute graph node positions with the CLOS layout engine
And SHALL NOT run the force layout engine for those nodes.

#### Scenario: Generic graph vocabulary is accepted

Given nodes have no labels named `leaf`, `spine`, `super-spine`, or another
deployment-specific stage role
And the graph structure is a staged CLOS-like graph
When `layout.mode: clos` is compiled
Then TopoViewer SHALL still infer stages and place the graph as a staged CLOS
layout.

#### Scenario: Common CLOS labels are styling metadata by default

Given nodes have labels such as `leaf`, `spine`, or `super-spine`
And no explicit `layout.clos.stageKey` or `layout.inferLabelRole` is configured
When `layout.mode: clos` is compiled
Then TopoViewer SHALL treat those labels as ordinary graph metadata
And SHALL infer stage order from graph structure rather than from the label
names.

#### Scenario: Common CLOS labels can be explicit stage hints

Given nodes have labels such as `leaf`, `spine`, or `super-spine`
And `layout.clos.stageKey` or `layout.inferLabelRole` explicitly maps those
labels to stages
When `layout.mode: clos` is compiled
Then TopoViewer SHALL honor the configured stage hint
And SHALL NOT require those label names as built-in schema semantics.

### Requirement: Automatic stage inference

TopoViewer SHALL infer likely CLOS stages from graph topology when no explicit
stage metadata is provided.

The inference SHALL use deterministic graph-structural signals such as directed
source-to-target hierarchy, adjacency, link endpoint count, boundary likelihood,
shared neighborhoods, and stage-to-stage connectivity consistency.

#### Scenario: Directed hierarchy determines root when available

Given a graph has no explicit stage metadata
And valid links form an acyclic source-to-target hierarchy
When `layout.mode: clos` is compiled
Then TopoViewer SHALL treat source-side boundary nodes as earlier CLOS stages
And SHALL NOT let a lower-stage node with higher fanout become the root.

#### Scenario: Link endpoint count contributes to fuzzy stage inference

Given a graph has no explicit stage metadata
And some nodes terminate more valid links than their peers
And link direction is not usable as an acyclic hierarchy
When `layout.mode: clos` is compiled
Then TopoViewer SHALL use endpoint count as one deterministic fuzzy signal
And SHALL prefer lower endpoint-count boundary nodes as root-side candidates.

#### Scenario: Role labels are not stage rules by default

Given a graph has `labels.role` values such as `p`, `pe`, `agg`, and `access`
And `layout.inferLabelRole` is not configured
When `layout.mode: clos` is compiled
Then TopoViewer SHALL treat those role labels as ordinary graph metadata
And SHALL infer stages from graph structure rather than role-name semantics.

#### Scenario: Three-stage CLOS is inferred

Given a graph with lower-stage nodes connected densely to middle-stage nodes
And middle-stage nodes connected densely to upper-stage nodes
And no explicit stage metadata
When `layout.mode: clos` is compiled
Then TopoViewer SHALL infer three stages
And place nodes in stage order on the primary layout axis.

#### Scenario: Super-spine-like nodes are inferred by structure

Given a three-stage or five-stage CLOS-like graph
And the highest-level core nodes have no authored role label
When `layout.mode: clos` is compiled
Then TopoViewer SHALL infer those nodes as the most core or super-spine-like
stage based on graph structure
And SHALL expose the result only as layout/debug metadata, not as required graph
semantics.

#### Scenario: Ten-stage CLOS is supported

Given a CLOS-like graph with ten structurally distinct stages
And `layout.clos.maxStages` is at least `10`
When `layout.mode: clos` is compiled
Then TopoViewer SHALL infer or honor ten stages
And place all ten stages in deterministic order.

### Requirement: Explicit stage and group hints

TopoViewer SHALL allow generic explicit hints for ambiguous CLOS graphs.

Hints SHALL use generic field paths and SHALL NOT require network-specific
field names.

#### Scenario: Explicit stage key overrides inference

Given `layout.clos.stageKey` points to a node field such as `labels.stage` or
`data.stage`
And a node has a valid stage value at that field
When `layout.mode: clos` is compiled
Then TopoViewer SHALL honor the explicit stage for that node
And infer only the remaining ambiguous nodes around the explicit hint.

#### Scenario: Label-role map overrides fuzzy inference

Given `layout.inferLabelRole` maps stage names to role values
And a node has a classifier value matching one of those role values
When `layout.mode: clos` is compiled
Then TopoViewer SHALL honor the mapped stage for that node
And use fuzzy endpoint-count inference only for unmapped nodes.

#### Scenario: No explicit root marker is exposed

Given a user wants CLOS root detection
When authoring a TopoViewer YAML document
Then TopoViewer SHALL NOT require or expose a `rootNodeIds` layout option
And SHALL infer root-side placement from directed hierarchy or fuzzy structural
signals.

#### Scenario: Explicit group key controls horizontal grouping

Given `layout.clos.groupKey` points to a node field such as `labels.group` or
`data.group`
When `layout.mode: clos` is compiled
Then TopoViewer SHALL group nodes with the same resolved value within their
stage
And preserve deterministic ordering inside each group.

#### Scenario: Explicit stage order controls named stages

Given `layout.clos.stageKey` resolves string stage values
And `layout.clos.stageOrder` lists those values in desired order
When `layout.mode: clos` is compiled
Then TopoViewer SHALL place stages in the listed order
And SHALL use deterministic ordering for any unlisted stage values.

#### Scenario: Conflicting explicit stage hints are diagnosed

Given `layout.clos.stageKey` resolves a node to one stage
And `layout.inferLabelRole` or `layout.clos.inferLabelRole` resolves the same
node to a different stage
When TopoViewer semantically lints the document
Then TopoViewer SHALL report a `clos-conflicting-stage-hints` warning
And SHALL still produce deterministic positions.

#### Scenario: Pinned nodes preserve authored position

Given `layout.clos.preservePinned` is enabled
And `layout.clos.pinnedNodeIds` contains a node ID with an authored position
When `layout.mode: clos` is compiled
Then TopoViewer SHALL preserve that node position
And pack inferred positions around pinned nodes without mutating input YAML.

### Requirement: Stage-aware crossing reduction

TopoViewer SHALL order nodes within each inferred stage to reduce edge
crossings.

The algorithm SHALL remain deterministic and bounded for large graphs.

#### Scenario: Barycentric ordering is stable

Given two equivalent CLOS graphs with nodes listed in different YAML order
When `layout.mode: clos` is compiled
Then TopoViewer SHALL produce the same positions for the same node IDs
And ordering ties SHALL be resolved by stable label or ID ordering.

#### Scenario: Same-stage and skip-stage links remain visible

Given a CLOS-like graph has a same-stage link or a link that skips a stage
When `layout.mode: clos` is compiled
Then TopoViewer SHALL keep the link renderable
And SHALL NOT fail stage inference solely because of that link.

### Requirement: Generic fallback for ambiguous graphs

TopoViewer SHALL produce deterministic positions when a graph is not clearly
CLOS-like.

#### Scenario: Low-confidence graph still renders

Given a graph with ambiguous or non-CLOS structure
When `layout.mode: clos` is compiled
Then TopoViewer SHALL produce deterministic fallback positions
And SHOULD report a diagnostic or metadata warning explaining that CLOS
inference confidence is low.

#### Scenario: Stage cap is respected

Given `layout.clos.maxStages` is lower than the number of likely structural
stages
When `layout.mode: clos` is compiled
Then TopoViewer SHALL cap the inferred stages at `maxStages`
And SHOULD report that the cap affected inference.

### Requirement: Renderer-agnostic layout implementation

The CLOS layout engine SHALL calculate positions only.

It SHALL NOT import React, access the DOM, or render UI.

#### Scenario: Layout engine can be unit tested without React

Given unit tests import the CLOS layout function
When the tests pass graph nodes, graph links, and layout options
Then the function SHALL return positions without requiring React, browser APIs,
or a mounted TopoViewer component.

#### Scenario: React Flow receives positioned nodes only

Given TopoViewer compiles a document with `layout.mode: clos`
When the renderer receives compiled graph nodes
Then the nodes SHALL already have CLOS-computed positions
And React Flow SHALL remain responsible only for rendering and interaction.

### Requirement: Documentation and authoring support

TopoViewer SHALL document `layout.mode: clos` and provide authoring support for
its options.

#### Scenario: Public docs explain generic CLOS layout

Given a user reads the layout documentation
When they find the CLOS layout section
Then the docs SHALL explain that CLOS layout is based on staged graph
structure, not deployment-specific semantics
And SHALL explain when to rely on inference versus when to add hints.

#### Scenario: Docs explain the practical root inference workflow

Given a user wants CLOS layout without manual coordinates
When they read the authoring or layout docs
Then the docs SHALL explain that directed `source` -> `target` links are the
preferred way to express root-to-leaf structure
And SHALL show that a high-fanout lower-stage node does not become root when
directed hierarchy is clear.

#### Scenario: Docs explain fuzzy endpoint-count fallback

Given a graph has mixed or bidirectional links where direction is not usable
When a user reads the CLOS layout docs
Then the docs SHALL explain that endpoint count is only a fuzzy fallback
And SHALL explain that lower endpoint-count boundary nodes are treated as
root-side candidates while dense high-degree nodes are treated as intermediate
or fabric-like candidates.

#### Scenario: Docs explain labels versus layout semantics

Given topology nodes use labels such as `node: spine`, `node: leaf`,
`role: p`, or `role: pe`
When a user reads the CLOS layout docs
Then the docs SHALL state that those labels are styling/filtering metadata by
default
And SHALL state that they affect layout only when the author explicitly uses
`layout.clos.stageKey` or `layout.inferLabelRole`.

#### Scenario: Docs provide practical YAML snippets

Given a user wants to copy a working CLOS layout pattern
When they read the CLOS layout docs
Then the docs SHALL include a minimal automatic-layout snippet with
`layout.mode: clos`, `direction`, `nodeGap`, and `groupGap`
And SHALL include a separate opt-in snippet for explicit stage metadata using
`stageKey` and `stageOrder`
And SHALL include a separate opt-in snippet for `inferLabelRole`.

#### Scenario: Harness template demonstrates automatic CLOS layout

Given a user opens the `CLOS 2-spine 4-leaf` harness template
When they inspect the topology and stylesheet YAML
Then the topology SHALL omit manual node positions
And the stylesheet SHALL avoid `stageKey` and `stageOrder`
And the docs SHALL explain that directed fabric links drive the staged layout
while `labels.node` controls styling only.

#### Scenario: Docs state when CLOS layout is the wrong tool

Given a graph is not staged, is mostly cyclic, or has no meaningful
source-to-target structure
When a user reads the CLOS layout docs
Then the docs SHALL recommend `manual` or `force` layout instead
And SHALL explain that CLOS fallback remains deterministic but may not match
the user's intended hierarchy.

#### Scenario: YAML assist suggests CLOS keys

Given a user edits a layout block in the browser harness or VS Code extension
When YAML assist is requested
Then it SHALL suggest `mode: clos`
And SHALL suggest valid CLOS option keys and enum values.
