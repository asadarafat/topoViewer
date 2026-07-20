# Use Cases

Use cases are complete workflows. They combine topology facts, stylesheets,
layouts, attention, generated inventory, mapper YAML, or runtime telemetry into
something closer to how TopoViewer is used in practice.

Use the feature-family pages when you need one primitive. Use this page when you
want to see how the primitives fit together.

## Embed In React

[React](react.md) shows the package install path, component contract, and typed
integration surface for product teams that render TopoViewer inside an
application.

Use it when TopoViewer should be part of a React workflow rather than a
documentation-only page.

## Render In MkDocs

[MkDocs](mkdocs.md) shows how documentation authors use `topoviewer` fenced
blocks to render topology YAML and stylesheet YAML in a docs site.

Use it when the diagram should live beside architecture, operations, or design
documentation.

## Render In Static HTML Or Zensical

[Static HTML / Zensical Adapter](static-html-zensical-adapter.md) shows how the
same authored documentation can be mirrored into static HTML embeds.

Use it when the target documentation runtime is not the MkDocs plugin but still
needs the same TopoViewer viewport behavior.

## Build A Single-Page HTML Demo

[Single Page HTML](single-page-html.md) shows a no-build CodePen-style NOC
replay that loads the published embed bundle, generates topology documents in
memory, and remounts TopoViewer as incident state changes.

Use it when you need the fastest possible application-style demo without a
bundler or local project.

## Author One Portable Bundle In Studio

[TopoViewer Studio](topoviewer-studio.md) runs one topology, stylesheet, and
mapper bundle through Studio, MkDocs/Zensical, and Grafana
packaging. It demonstrates that authoring stays surface-neutral while each
consumer keeps its own runtime responsibilities.

Use it when evaluating Studio or designing a bundle pipeline that must not fork
topology identity by destination.

## Author Graphs On The Canvas

[Graph Authoring](graph-authoring.md) shows the canvas-native authoring surface:
node placement, link drawing, path sequencing, regions, shapes, callouts,
marquee selection, duplicate, align, distribute, grid snap, and the YAML written
by each action.

Use it when you want a draw.io-style workflow that still produces reviewable
TopoViewer topology files.

## Build A Kubernetes Service Map

[Kubernetes Service Map](kubernetes-service-map/index.md) shows how platform
inventory can become a topology model. The example uses EDA as a concrete case
study, but the pattern is generic:

1. collect Services, Deployments, Pods, domain resources, and relationships;
2. convert stable object identity into `topology.yaml`;
3. keep visual policy in `stylesheet.yaml`;
4. render the resulting service map in TopoViewer.

Use it when a platform team needs a relationship view that is easier to review
than raw command output.

## Read A Service Provider Network

[Service Provider Network](service-provider-network.md) uses one compact
provider topology to answer multiple operational questions: underlay capacity,
BGP sessions, transport intent, service path, and failure impact.

Use it when one source model needs to produce several network views without
maintaining separate static diagrams.

## Operate In Grafana

[Grafana TopoViewer Panel](grafana-topoviewer-panel.md)
shows the mounted-bundle workflow:

```text
*.topo.tv.yaml + *.style.tv.yaml + *.mapper.tv.yaml
        +
Prometheus data frames
        =
runtime topology overlay
```

Use it when topology should stay declarative while telemetry changes the runtime
presentation in Grafana.
