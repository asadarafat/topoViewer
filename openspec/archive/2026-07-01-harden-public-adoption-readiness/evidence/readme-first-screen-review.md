# README First-Screen Review

Date: 2026-06-30

The generated `README.md` first screen now answers the three public-adoption
questions without requiring repository knowledge.

| Question | Evidence |
|---|---|
| What is it? | The opening states TopoViewer is a Topology as Code toolkit for network, infrastructure, service, and connected-system diagrams. |
| What is the stable core? | The first screen lists `topology.yaml`, `stylesheet.yaml`, and `TopoViewer` as the core contract. |
| Why use it? | The README explains that static topology diagrams drift and that TopoViewer keeps topology as reviewable code. |
| How do I install it? | The Install section gives `npm install topoviewer @xyflow/react react react-dom`. |
| How do I see it? | The First Result section gives `npm run docs:preview` and local MkDocs, Zensical, and harness URLs. |
| Where is the smallest YAML? | The First Result section links directly to the First topology guide. |
| What is not ready yet? | The integration surfaces and support-status labels distinguish Supported Adapter, Experimental, Lab, and Roadmap surfaces from the supported React package and MkDocs path. |

Current first-screen decision: the README now leads with npm/package/demo
badges, the product sentence, the small stable core, the checked-in collage,
`npm install topoviewer @xyflow/react react react-dom`, one React render
snippet, and React/MkDocs embed guidance. Zensical, VS Code, Grafana,
Containerlab, NetBox, and OpsMill/Infrahub remain documented lower in the
integration-surface table, but they are no longer the first adoption story.

Remaining risk: the README depends on the checked-in promotional collage, so
the collage must be regenerated when the harness, MkDocs, Zensical, or Grafana
surfaces materially change.
