TopoViewer's first public adoption path is the React package plus documentation
embeds. Authoring tools and operational dashboards exist to prove the model, but
they are not all part of the same stability promise.

| Surface | Status | Use today |
|---|---|---|
| TypeScript/React package | Supported | Install `topoviewer` from npm and embed schema-validated topology diagrams in React applications. |
| MkDocs | Supported | Publish live YAML examples through `mkdocs-topoviewer`. |
| Browser Studio | Beta Preview | Author, validate, recover, and export portable TopoViewer projects in current desktop Chrome or Edge. |
| Grafana panel | Experimental | Mount topology/style/mapper bundles and render Prometheus-driven overlays. |
| Zensical | Supported Adapter | Preview the same docs content through the generated Zensical site. |
| VS Code extension | Experimental | Host the same Studio application with workspace file access; no VSIX or supported extension contract is published yet. |
| Grafana Containerlab mode | Lab | Validate realistic telemetry under the Grafana lab; not a separate production surface. |
| NetBox | Roadmap | Future in-product topology visualization from NetBox inventory and platform data. |
| OpsMill/Infrahub | Roadmap | Future in-product topology visualization from Infrahub network topology and inventory data. |
