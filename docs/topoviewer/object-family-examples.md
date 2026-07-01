# Object Family Examples

This page maps each TopoViewer object family to a focused rendered example and the exact reference contract. Use it when you know the object family you want to author but need a small example before writing YAML.

| Object family | Focused example | Reference contract | What the example proves |
|---|---|---|---|
| Document root and layout | [Layout examples](reference/layout/index.md) | [Object attributes](object-reference.md#layout) | Top-level `layout` controls placement while graph facts stay declarative. |
| Graph and layers | [Graph basic](reference/graph/index.md) | [Object attributes](object-reference.md#graph) | `graph.layers`, `graph.nodes`, and `graph.links` form the smallest useful topology. |
| Labels and data | [Labels and data](reference/graph/index.md#labels-and-data) | [Labels map](object-reference.md#labels-map) and [data bag](object-reference.md#data-bag) | `labels` drive selectors and classification; `data` carries operational facts. |
| Nodes | [Node examples](reference/nodes/index.md) | [Node attributes](object-reference.md#node) and [node style keys](stylesheet-reference.md#node-style-keys) | Node body shape, icon fit, labels, badges, status markers, and outline/underlay styling. |
| Links | [Edge examples](reference/edges/index.md) | [Link attributes](object-reference.md#link) and [link style keys](stylesheet-reference.md#link-style-keys) | Route geometry, arrows, labels, endpoint spacing, parallel edges, gradients, and interaction. |
| Directional link strokes | [Directional link strokes](reference/edges/directional-link-strokes/index.md) | [Link direction attributes](object-reference.md#link-direction) and [linkDirection style keys](stylesheet-reference.md#link-direction-style-keys) | One physical link can show two independently styled traffic directions. |
| Paths | [Path examples](reference/paths/index.md) | [Path attributes](object-reference.md#path) and [path style keys](stylesheet-reference.md#path-style-keys) | Ordered paths and stitched child paths render service or transport narratives. |
| Regions | [Region examples](reference/regions/index.md) | [Region attributes](object-reference.md#region) and [region style keys](stylesheet-reference.md#region-style-keys) | Regions group members, reserve label space, and can be draggable or selectable when requested. |
| Shapes | [Shape examples](reference/shapes/index.md) | [Diagram shape attributes](object-reference.md#diagram-shape) and [shape style keys](stylesheet-reference.md#shape-style-keys) | Diagram primitives explain structure without becoming topology nodes. |
| Callouts and pins | [Callout examples](reference/callouts/index.md) | [Callout attributes](object-reference.md#callout) and [callout style keys](stylesheet-reference.md#callout-style-keys) | Markdown callouts, leader lines, images, and pin anchors support documentation-grade diagrams. |
| Attention | [Attention examples](reference/attention/index.md) | [Attention reference](attention-reference.md) | Focus, change queries, dependency traversal, aggregation, and link grouping all come from graph facts. |
| Stylesheet rules | [Styling examples](reference/styling/index.md) | [Stylesheet reference](stylesheet-reference.md) | Selectors map graph facts to reusable visual policy. |
| Grafana mapper | [Mapper recipes](grafana-mapper-recipes.md) | [Mapper attributes](object-reference.md#grafana-mapper-objects) | Telemetry values can resolve to TopoViewer objects and apply runtime-only overlays. |

## Validation

The examples above are generated from the canonical example catalog. Run these checks before publishing new object-family coverage:

```bash
npm run examples:audit
npm run docs:lint
```
