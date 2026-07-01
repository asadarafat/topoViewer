# README First-Screen Review

Date: 2026-06-30

The generated `README.md` first screen now answers the three public-adoption
questions without requiring repository knowledge.

| Question | Evidence |
|---|---|
| What is it? | The opening states TopoViewer is a Topology as Code toolkit for network, infrastructure, service, and connected-system diagrams. |
| What is the stable core? | The first screen lists `topology.yaml`, `stylesheet.yaml`, and `TopoViewer` as the core contract. |
| Why use it? | The README explains that static topology diagrams drift and that TopoViewer keeps topology as reviewable code. |
| How do I see it? | The First Result section gives `npm run docs:preview` and local MkDocs, Zensical, and harness URLs. |
| Where is the smallest YAML? | The First Result section links directly to the First topology guide. |
| What is not ready yet? | The integration surfaces and support-status labels distinguish Pre-Publish Supported, Supported Adapter, Experimental, Lab, and Roadmap surfaces. |

Remaining risk: the README depends on the checked-in promotional collage, so
the collage must be regenerated when the harness, MkDocs, Zensical, or Grafana
surfaces materially change.
