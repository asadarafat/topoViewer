# TopoViewer

TopoViewer is a declarative graph renderer for network, infrastructure, and service-topology diagrams.

It keeps graph facts in YAML, visual policy in selector stylesheets, and renderer behavior behind testable package boundaries.

## Start Here

- [Authoring model](topoviewer/authoring.md)
- [Reference model](topoviewer/reference-model.md)
- [Stylesheet](topoviewer/stylesheet.md)
- [Topology attention](topoviewer/attention.md)
- [MkDocs embed](topoviewer/mkdocs.md)
- [Production hardening](topoviewer/production.md)
- [Attention examples](topoviewer/reference/attention/index.md)
- [Topology attention roadmap](topoviewer/attention-roadmap.md)

## Packages

| Package | Runtime | Install |
|---|---|---|
| `topoviewer` | React/browser/npm | `npm install topoviewer` |
| `mkdocs-topoviewer` | MkDocs/Python | `pip install mkdocs-topoviewer` |

## Examples

The feature examples are generated from `packages/topoviewer/examples/test-cases`. Each example is both documentation and a Playwright-backed test fixture.
