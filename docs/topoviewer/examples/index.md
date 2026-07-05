# Examples

This section is the fastest way to see what TopoViewer can render and which
YAML contract to copy. Read it like a gallery:

- use the object-family pages when you need a specific primitive;
- use the use cases when you want a complete applied workflow;
- use the generated example families when you need exhaustive feature coverage.

The examples are generated from the same canonical fixtures used by tests. That
keeps the documentation honest: if an example renders here, the same topology
and stylesheet are part of the regression surface.

## Start Here

Examples are for reusable patterns, not product-positioning walkthroughs. Start
with the smallest tutorial when you are learning the contract, then use this
section when you need a concrete primitive or applied workflow.

- [First Topology](../start/first-topology.md) teaches the smallest
  `topology.yaml` plus `stylesheet.yaml` pair.
- [Nodes](./nodes/index.md), [Edges](./edges/index.md), and
  [Regions](./regions/index.md) cover focused object behavior.
- [Service Provider Network](use-cases/service-provider-network.md) shows a
  complete network use case with underlay, BGP, transport, service path, and
  failure views.

## Example Families

Use these when you want to learn one part of the model or one visual behavior.
They are intentionally focused and copyable.

| Family | What it teaches |
|---|---|
| [Graph](./graph/index.md) | Nodes, links, layers, labels, data, and parent/child graph facts. |
| [Nodes](./nodes/index.md) | Node shape, icons, labels, status markers, badges, outlines, and underlays. |
| [Edges](./edges/index.md) | Link geometry, labels, arrows, endpoint spacing, dashes, gradients, and directional strokes. |
| [Paths](./paths/index.md) | Ordered service or transport paths across existing links and child objects. |
| [Attention](./attention/index.md) | Focus, dimming, dependency traversal, aggregation, and dense-link grouping. |
| [Regions](./regions/index.md) | Visual grouping, labels, dragging, nesting, and overlap behavior. |
| [Shapes](./shapes/index.md) | Diagram primitives that explain the topology without becoming graph nodes. |
| [Callouts](./callouts/index.md) | Markdown callouts, image callouts, pins, and leader lines. |
| [Styling](./styling/index.md) | Selector-driven visual policy and style overrides. |
| [Layout](./layout/index.md) | Manual, force, and CLOS layout behavior. |
| [Object Family Examples](object-family-examples.md) | A lookup table from object family to focused example and reference contract. |
| [Validation](./validation/index.md) | Broken references, unsafe images, and renderer limits. |

## Use Cases

Use cases show complete workflows rather than isolated features. They are useful
when you want to understand how TopoViewer behaves inside authoring tools,
documentation, topology imports, or operational dashboards.

| Use case | What it proves |
|---|---|
| [React](use-cases/react.md) | Embed TopoViewer as a typed React component with stable topology documents. |
| [MkDocs](use-cases/mkdocs.md) | Render `topoviewer` fenced blocks from Markdown documentation. |
| [Static HTML / Zensical Adapter](use-cases/static-html-zensical-adapter.md) | Mirror authored documentation into static HTML embeds. |
| [Harness](use-cases/harness.md) | Author topology, stylesheet, and mapper YAML while keeping the canvas on the last valid applied state. |
| [Kubernetes Service Map](use-cases/kubernetes-service-map/index.md) | Convert Kubernetes and EDA inventory into a reviewable service map. |
| [Service Provider Network](use-cases/service-provider-network.md) | Render one provider topology as underlay, BGP, transport, service path, and failure view. |
| [Grafana TopoViewer Panel](use-cases/grafana-topoviewer-panel.md) | Mount topology/style/mapper bundles into Grafana and drive runtime overlays from telemetry. |

Open [Use Cases](use-cases/index.md) when you want the applied examples grouped by
workflow instead of by object family.
