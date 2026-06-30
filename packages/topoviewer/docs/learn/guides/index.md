# Guides

Use this page to choose the shortest path for the surface you are building.
TopoViewer has one core model, but the workflow is different when you are
authoring YAML, embedding a renderer, operating with telemetry, or preparing
assets for release.

## Author A Topology

Start here when you need to create or edit topology YAML.

1. [Build your first topology](build-your-first-topology.md)
2. [Browser harness](browser-harness.md)
3. [Create a layered network map](create-a-layered-network-map.md)
4. [Style a topology](style-a-topology.md)
5. [Layout a topology](layout-a-topology.md)

## Embed TopoViewer

Start here when TopoViewer will render inside another product or documentation
site.

| Surface | Start here |
|---|---|
| React product | [React usage](render-in-react.md) |
| MkDocs | [Render in MkDocs](render-in-mkdocs.md) |
| Zensical | [Render in Zensical](render-in-zensical.md) |
| Static exports | [Export to SVG/PNG](export-to-svg-png.md) |

## Operate With Telemetry

Start here when the diagram should react to operational data.

1. [Render in Grafana](render-in-grafana.md)
2. Author `*.mapper.tv.yaml` in the [browser harness](browser-harness.md)
3. Review the [mapper schema](../../api-reference/schema/mapper.md)

## Ship With Confidence

Use these guides when a topology is ready to be checked into a repo, published
in docs, or wired into CI.

- [Validate YAML](validate-yaml.md)
- [Debug rendering](debug-rendering.md)
- [Compatibility](compatibility.md)

## Next Steps

- [Quick start](../quick-start.md)
- [Topology model](../concepts/topology-model.md)
- [API Reference](../../api-reference/schema/topology.md)
