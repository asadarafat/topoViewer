TopoViewer is designed to be used as a library, a documentation embed, and an
authoring surface.

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
- Grafana remains a roadmap dashboard surface for operational topology panels
  if the standalone Grafana integration plan is retained.

