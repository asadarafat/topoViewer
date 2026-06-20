# TopoViewer Reference

TopoViewer renders declarative graph and diagram documents from YAML. The canonical examples on this site are generated from `examples/test-cases/` in the npm package so each documented behavior has one matching test fixture.

| Model | YAML section | Purpose |
|---|---|---|
| Semantic graph | `graph.nodes`, `graph.links`, `graph.paths`, `graph.regions` | Network, service, infrastructure, or dependency facts |
| Diagram primitives | `diagram.shapes`, `diagram.callouts` | Visual explanation objects that should not pollute graph facts |

## Feature Test Cases

### Graph

- [Graph basic](reference/graph/basic/index.md): A minimal graph with two nodes and one named link.
- [Labels and data](reference/graph/labels-and-data/index.md): Classification lives in `labels`; operational values live in `data`.
- [Parent and child nodes](reference/graph/parent-child-nodes/index.md): Logical nodes can be nested inside physical parent nodes.

### Nodes

- [Named node shapes](reference/nodes/named-node-shapes/index.md): Node body shape can encode device or service role without changing graph facts.
- [Custom polygon node](reference/nodes/custom-polygon-shape/index.md): Polygon node bodies use normalized x/y point pairs through `shapePolygonPoints`.
- [Node label placement](reference/nodes/label-placement/index.md): Node labels can be placed around or inside node bodies with wrapping and backing controls.
- [Border, outline, and underlay](reference/nodes/border-outline-underlay/index.md): Node border, outline, and underlay controls provide operational emphasis without changing graph facts.
- [Icon fit and badges](reference/nodes/icon-fit-and-badges/index.md): Icon fit, badges, and status markers add compact node-level signals.

### Edges

- [Edge curve styles](reference/edges/curve-styles/index.md): Different `curveStyle` values produce different edge routing models.
- [Arrows, dashes, and labels](reference/edges/arrows-dashes-labels/index.md): Edges can carry labels, arrows, and dash patterns without changing topology semantics.
- [Arrow and label controls](reference/edges/arrow-label-controls/index.md): Directional arrow and endpoint label styles can be controlled independently.
- [Endpoint spacing and routing](reference/edges/endpoint-spacing-routing/index.md): Endpoint spacing, segment controls, and taxi controls make edge routes explicit.
- [Gradient and interaction flags](reference/edges/gradient-and-interaction/index.md): Linear gradients and interaction flags can be declared directly on edge style rules.
- [Floating anchors](reference/edges/floating-anchors/index.md): Floating anchors connect to the nearest point on each node boundary.
- [Parent link pipe](reference/edges/parent-link-pipe/index.md): A child link can be visually carried inside a parent transport link.

### Paths

- [Sequenced path](reference/paths/sequenced-path/index.md): A path sequence models ordered traversal through graph nodes.
- [Stitched child path](reference/paths/stitched-child-path/index.md): A child service path can stitch from child endpoints into a parent transport path.

### Attention

- [Object focus](reference/attention/object-focus/index.md): Click one topology object to highlight it while dimming the surrounding context.
- [Change focus](reference/attention/change-focus/index.md): Focus objects with recent change metadata while preserving topology context.
- [Region collapse](reference/attention/region-collapse/index.md): Collapse a region into an aggregate summary, then click it to expand member nodes.
- [Dense summary drill-down](reference/attention/dense-summary-drilldown/index.md): Keep dense metro topologies readable with summary nodes, counted full-mesh links, and explicit click-to-expand drill-down.
- [Advanced zoom policy](reference/attention/advanced-zoom-policy/index.md): Optionally bind aggregate expansion to zoom thresholds when a host needs map-style overview/detail transitions.
- [Link grouping](reference/attention/link-grouping/index.md): Group parallel links by endpoint and layer when the count crosses a threshold.
- [Query primitives](reference/attention/query-primitives/index.md): Focus by explicit IDs, labels, data fields, and stylesheet-compatible selectors.
- [Region focus](reference/attention/region-focus/index.md): Focus a region and its member nodes while preserving surrounding context.
- [Dependency focus](reference/attention/dependency-focus/index.md): Traverse directed topology relationships to show downstream blast radius.
- [Hide context](reference/attention/hide-context/index.md): Use hide-context mode when the focused set should be isolated instead of dimmed.
- [Parent and label collapse](reference/attention/parent-label-collapse/index.md): Collapse parent-child objects and label-defined groups into aggregate summaries.
- [Aggregate badge and status](reference/attention/aggregate-badge-status/index.md): Collapsed aggregate summaries can expose hidden member count and worst severity as compact node cues.

### Regions

- [Nested regions](reference/regions/nested-regions/index.md): Regions can be nested so broad domains contain smaller domains.
- [Overlapping regions](reference/regions/overlapping-regions/index.md): A shared node can be a member of multiple regions.
- [Draggable regions](reference/regions/draggable-regions/index.md): Regions can be selectable and draggable hulls.

### Shapes

- [Two-dimensional shapes](reference/shapes/two-dimensional/index.md): 2D geometry primitives are diagram objects, not graph facts.
- [Three-dimensional shapes](reference/shapes/three-dimensional/index.md): 3D geometry primitives are available for common diagram metaphors.
- [Shape rotation](reference/shapes/rotation/index.md): Shape geometry can be rotated directly or through a stylesheet rule.

### Callouts

- [Markdown callouts](reference/callouts/markdown/index.md): Callout bodies support markdown, inline formatting, and images.
- [Pins and leaders](reference/callouts/pins-and-leaders/index.md): Leaders can attach to named pins instead of object centers.
- [Image embed callout](reference/callouts/image-embed/index.md): Image embeds are allowed when the URL is safe.

### Styling

- [Selector styling](reference/styling/selectors/index.md): Selector rules classify objects by kind, id, labels, or data.
- [Inline style override](reference/styling/inline-style-override/index.md): Inline `style` overrides are local escape hatches on individual objects.
- [Light and dark theme variables](reference/styling/theme-light-dark/index.md): Theme-aware styles should use TopoViewer CSS variables.

### Layout

- [Manual layout](reference/layout/manual/index.md): Manual layout preserves authored positions.
- [Force layout](reference/layout/force/index.md): Force layout computes positions when the author omits coordinates.

### Validation

- [Broken reference validation](reference/validation/broken-reference/index.md): The semantic linter catches links that reference missing nodes.
- [Unsafe image validation](reference/validation/unsafe-image/index.md): The semantic linter rejects unsafe image references.
- [Renderer limit validation](reference/validation/limit-exceeded/index.md): Renderer limits fail fast before a diagram becomes unsafe or unusable.

### Integration

- [Complete network demo](complete-network-demo/index.md): An integrated network example combining graph facts, regions, child nodes, paths, shapes, and callouts.

The important rule is simple: if an object is part of the topology, model it under `graph.*`. If it explains the topology visually, model it under `diagram.*`.
