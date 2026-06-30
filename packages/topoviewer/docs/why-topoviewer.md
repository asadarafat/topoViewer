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

## Different From Mermaid.js

TopoViewer is not a generic Mermaid.js replacement. Mermaid is broad
text-to-diagram syntax for many diagram families. TopoViewer is narrower and
more semantic: it is built for inspectable, data-driven topology views where
layers, regions, paths, operational metadata, focus behavior, and reusable
runtime APIs matter.

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

## Built For Network Views

TopoViewer is not a generic chart wrapper. Its model is shaped around topology primitives:

- `graph.nodes` for routers, services, controllers, and endpoints.
- `graph.links` for physical, logical, protocol, or dependency relationships.
- `graph.paths` for service paths, transport paths, and ordered dependencies.
- `graph.regions` for sites, domains, ownership, and failure areas.
- `labels` for classification and selector styling.
- `data` for status, severity, capacity, timestamps, and operational signals.

Those facts can drive multiple views of the same environment: underlay, BGP, service path, and failure impact.

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

- [Getting started](getting-started.md): render the smallest useful topology.
- [Examples](examples.md): compare curated topology, styling, attention, and Grafana examples.
- [React usage](react.md): embed TopoViewer in a product surface.
- [Integration roadmap](integration-roadmap.md): check support status before adopting an integration.
