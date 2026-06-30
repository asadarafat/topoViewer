# Why TopoViewer?

TopoViewer is a **Topology as Code** toolkit for teams that want network,
infrastructure, service, and other connected-system diagrams to stay close to
source data.

Topology here means a diagram or graph made of meaningful objects and
relationships: nodes, links, paths, regions, layers, labels, data, and attention
rules. TopoViewer keeps those facts in declarative YAML and keeps presentation
policy in selector-based stylesheets, then renders both through an embeddable
TypeScript/React runtime.

![YAML to rendered network diagram](../assets/topoviewer-yaml-to-diagram.png)

## Topology As Code

Topology as Code means the diagram is an artifact with stable semantics:

- topology facts are reviewable YAML, not hand-positioned pixels;
- visual policy is reusable stylesheet YAML, not copied into every object;
- labels and data are queryable by tools, selectors, attention, and telemetry
  mappers;
- the same source can render in documentation, a React product, the browser
  harness, and Grafana without translating it into a new format.

TopoViewer can describe network diagrams, service dependency diagrams,
operational maps, inventory relationships, lab topologies, and other graph-like
systems. It is not limited to physical network topology.

## Different From Mermaid.js

[Mermaid](https://mermaid.js.org/) is broad text-to-diagram syntax for many
diagram families. It is a good fit when the goal is a lightweight diagram in a
Markdown document.

TopoViewer is narrower and more semantic. It is built for inspectable,
data-driven topology views where layers, regions, paths, operational metadata,
focus behavior, reusable stylesheets, and runtime APIs matter. Use TopoViewer
when the diagram needs to act like structured product data, not only rendered
documentation.

| Need | Mermaid-style diagram | TopoViewer topology |
|---|---|---|
| Quick explanatory diagram | Strong fit. | Possible, but likely heavier than needed. |
| Reusable visual policy | Usually authored inside the diagram. | Stylesheet rules target labels, data, and object kinds. |
| Runtime object selection | Host-specific. | Built into React events and attention queries. |
| Operational data overlays | Host-specific. | Mapper-driven overlays are a product direction. |
| Large graph progressive disclosure | Limited by diagram type and renderer. | Attention, layers, regions, paths, and aggregation are first-class concepts. |

## Different From Raw React Flow

[React Flow](https://reactflow.dev/) is the rendering foundation for building
node-based UIs. It is the right choice when you want full control over nodes,
edges, state, and application behavior.

TopoViewer sits above that level. It provides a topology schema, stylesheet
language, validation, examples, docs embeds, harness authoring, and operational
integration patterns. Use raw React Flow when you are building a custom editor
from primitives; use TopoViewer when you want a declarative topology format and
consistent rendering surfaces.

| Need | Raw React Flow | TopoViewer |
|---|---|---|
| Custom node editor from scratch | Strong fit. | Use extensions only where TopoViewer semantics still help. |
| YAML topology source | Build and maintain your own schema. | Built-in topology and stylesheet documents. |
| Docs live viewport | Build a documentation embed path. | MkDocs and Zensical surfaces share the same runtime. |
| Validation and semantic linting | Host-owned. | Provided as package APIs and CI commands. |
| Reusable examples as tests | Host-owned. | Catalog examples are documentation and regression fixtures. |

## Different From Static SVG Or Screenshots

Static SVG, screenshots, and drawing tools are useful for polished one-off
illustrations. They are weak when the source of truth changes often, when
operators need object identity, or when documentation and product surfaces must
stay consistent.

TopoViewer keeps object identity in YAML, so a node can be styled, selected,
validated, focused, exported, and mapped to telemetry without redrawing the
diagram. Static exports still matter, but they are outputs of the topology
source rather than the source itself.

## What Makes It Different

| Need | TopoViewer answer |
| --- | --- |
| Keep diagrams maintainable | Model graph facts in topology YAML and visual policy in a stylesheet. |
| Explain large or dense environments | Use attention queries, aggregation, labels, paths, and regions to show what matters first. |
| Make docs executable | Render the same YAML in MkDocs or Zensical with live viewports, topology source, and stylesheet source side by side. |
| Embed in products | Use the React/TypeScript package directly, or the browser embed bundle through documentation integrations. |
| Author with feedback | Use the browser harness today and the VS Code roadmap for YAML detection, preview, validation, and authoring. |
| Prove behavior | Treat examples as test fixtures with schema validation, semantic linting, and Playwright coverage. |

## YAML To Diagram

The authored source stays small and reviewable:

```yaml
graph:
  nodes:
    - id: pe-fra-1
      labels: { role: pe, site: fra }
    - id: rr-ams-1
      labels: { role: rr, protocol: bgp }
  links:
    - id: bgp-fra-rr
      source: pe-fra-1
      target: rr-ams-1
      labels: { protocol: bgp }
```

The rendered view is produced by the same example catalog used by the tests:

- [YAML to network diagram](yaml-to-diagram/index.md)
- [Real network demo](real-network-demo.md)

## Embed In A Product

TopoViewer is not only a docs plugin. Product teams can embed the React package
directly and keep their own application shell, state management, routing,
permissions, and telemetry model:

```tsx
import { TopoViewer, validateTopoDocument, type TopoDocument } from 'topoviewer';
import 'topoviewer/style.css';

const documentSpec: TopoDocument = validateTopoDocument(rawDocument, 'inventory topology');

export function InventoryTopology() {
  return (
    <TopoViewer
      document={documentSpec}
      selectedLayerIds={['underlay', 'service']}
      onObjectClick={(object) => setSelectedObject(object)}
      onNodePositionChange={(change) => persistNodePosition(change)}
      style={{ height: 680 }}
    />
  );
}
```

## Built For Network Views

TopoViewer is not a generic chart wrapper. Its model is shaped around topology primitives:

- `graph.nodes` for routers, services, controllers, and endpoints.
- `graph.links` for physical, logical, protocol, or dependency relationships.
- `graph.paths` for service paths, transport paths, and ordered dependencies.
- `graph.regions` for sites, domains, ownership, and failure areas.
- `labels` for classification and selector styling.
- `data` for status, severity, capacity, timestamps, and operational signals.

Those facts can drive multiple views of the same environment: underlay, BGP, service path, and failure impact.

## What TopoViewer Is Not

- It is not a replacement for every diagramming language.
- It is not a drag-only drawing canvas where the saved artifact is pixels.
- It is not a network source of truth; it consumes or represents topology data.
- It is not an observability database; Grafana integrations map telemetry into
  runtime overlays.
- It is not a promise that every roadmap integration is production-supported
  today. Check the support status before adopting a surface.

## Integration Direction

- `topoviewer` is the npm/TypeScript library surface for embedding rendered
  topology views inside end products.
- MkDocs is supported today through `mkdocs-topoviewer` with live YAML examples.
- Zensical is built as a parallel static documentation embed target.
- The browser harness is the authoring and preview surface for examples,
  validation, and a future online workflow.
- The VS Code extension is the authoring roadmap: it should detect TopoViewer
  YAML files from the VS Code Explorer, preview them, validate them, and support
  editing workflows.
- NetBox is a roadmap plugin surface for visualizing topology derived from
  NetBox inventory and platform data inside NetBox.
- OpsMill/Infrahub is a roadmap plugin surface for visualizing topology derived
  from Infrahub network topology and inventory data inside that platform.

## Next Steps

- [Getting started](learn/guides/build-your-first-topology.md): render the smallest useful topology.
- [Examples](examples.md): compare curated topology, styling, attention, and Grafana examples.
- [React usage](learn/guides/render-in-react.md): embed TopoViewer in a product surface.
- [Integration roadmap](integration-roadmap.md): check support status before adopting an integration.
