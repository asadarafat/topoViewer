## 1. Codify Current Link Direction Styling Contract

- [x] 1.1 Audit archived direction-lane specs against the current implementation
- [x] 1.2 Document that `linkDirection` inherits parent link style before direction-specific overrides
- [x] 1.3 Document that direction arrows are marker geometry only and must not carry port text
- [x] 1.4 Document that physical port text belongs to `sourceLabel` and `targetLabel`
- [x] 1.5 Document overlay-layer behavior for endpoint labels and directional telemetry
- [x] 1.6 Add or update regression tests proving mapper overlays can style direction lanes without mutating parent link identity
- [x] 1.7 Add or update docs examples that contrast edge label, endpoint label, and direction label usage

## 2. Define Global Label Placement Contract

- [x] 2.1 Define label participant kinds for node labels, node meta, region labels, edge labels, endpoint labels, and direction labels
- [x] 2.2 Define default label priorities and stable tie-breaking behavior
- [x] 2.3 Define collision policies: `none`, `avoid`, `fade`, and `hide`
- [x] 2.4 Define style keys for global and target-specific auto placement
- [x] 2.5 Define how manual label offsets apply after auto placement
- [x] 2.6 Define recompute triggers so Grafana refreshes remain stable

## 3. Implement Placement Engine

- [x] 3.1 Add a shared graph-coordinate label descriptor model
- [x] 3.2 Add deterministic size estimation for overlay labels and edge-label obstacles
- [x] 3.3 Add candidate generation for node, region, edge, endpoint, and direction labels
- [x] 3.4 Add candidate scoring against node bodies and already placed labels
- [x] 3.5 Add collision-policy handling for unavoidable overlaps
- [x] 3.6 Preserve existing manual endpoint offsets as final nudges
- [x] 3.7 Keep placement stable under repeated telemetry refreshes with identical values

## 4. Wire Renderer Surfaces

- [x] 4.1 Apply global placement to node labels
- [x] 4.1a Apply global placement to node meta
- [x] 4.2 Apply global placement to region labels
- [x] 4.3 Apply shared placement to edge midpoint labels
- [x] 4.4 Apply shared placement to endpoint `sourceLabel` and `targetLabel`
- [x] 4.5 Apply shared placement to `linkDirection` labels
- [x] 4.6 Ensure label z-index remains independent from object z-index
- [x] 4.7 Ensure attention grouping and collapsed aggregate labels still render predictably

## 5. Documentation And Examples

- [x] 5.1 Update stylesheet reference for label auto-placement and collision-policy keys
- [x] 5.2 Update endpoint-label docs to explain auto placement versus manual offsets
- [x] 5.3 Update directional-stroke docs to explain direction labels as vector values
- [x] 5.4 Add a dense CLOS example showing region, node, endpoint, and bandwidth labels together
- [x] 5.5 Update the Grafana TopoViewer panel use case after the ST CLOS bundle is visually cleaned up

## 6. Validation

- [x] 6.1 Add unit tests for label candidate generation and scoring
- [x] 6.2 Add renderer tests for cross-object label collisions
- [x] 6.3 Add Grafana CLOS smoke screenshot coverage for the cleaned topology
- [x] 6.4 Add docs screenshot coverage for the dense label example
- [x] 6.5 Run focused TopoViewer, docs, and Grafana checks
- [x] 6.6 Run full `npm run ci` after generated outputs are committed
