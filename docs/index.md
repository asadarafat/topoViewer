# TopoViewer

TopoViewer turns YAML topology facts and selector stylesheets into interactive network, infrastructure, and service-topology diagrams.

![TopoViewer YAML to rendered network diagram](assets/topoviewer-yaml-to-diagram.png)

It keeps graph facts in YAML, visual policy in selector stylesheets, and renderer behavior behind testable package boundaries.

## Start Here

- [Why TopoViewer?](topoviewer/why-topoviewer.md)
- [YAML to diagram](topoviewer/yaml-to-diagram/index.md)
- [Real network demo](topoviewer/real-network-demo.md)
- [Integration roadmap](topoviewer/integration-roadmap.md)
- [Authoring model](topoviewer/authoring.md)
- [Reference model](topoviewer/reference-model.md)
- [Stylesheet](topoviewer/stylesheet.md)
- [Topology attention](topoviewer/attention.md)
- [MkDocs embed](topoviewer/mkdocs.md)
- [Zensical adapter](topoviewer/zensical.md)
- [Production hardening](topoviewer/production.md)
- [Attention examples](topoviewer/reference/attention/index.md)

## Packages

| Package | Runtime | Install |
|---|---|---|
| `topoviewer` | React/browser/npm | `npm install topoviewer` |
| `mkdocs-topoviewer` | MkDocs/Python | `pip install mkdocs-topoviewer` |

## Examples

The feature examples are generated from `packages/topoviewer/examples/test-cases`. Each example is both documentation and a Playwright-backed test fixture.
