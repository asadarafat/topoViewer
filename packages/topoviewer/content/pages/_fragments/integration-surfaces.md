TopoViewer's first public adoption path is the React package plus documentation
embeds. Authoring tools and operational dashboards exist to prove the model, but
they are not all part of the same stability promise.

| Surface | Status | Use today |
|---|---|---|
| TypeScript/React package | Supported | Install `topoviewer` from npm and embed schema-validated topology diagrams in React applications. |
| MkDocs | Supported | Publish live YAML examples through `mkdocs-topoviewer`. |
| Browser harness | Experimental | Author, validate, preview, and export TopoViewer YAML while the authoring UX matures. |
| Grafana panel | Experimental | Mount topology/style/mapper bundles and render Prometheus-driven overlays. |
| Zensical | Supported Adapter | Preview the same docs content through the generated Zensical site. |
| VS Code extension | Experimental | Preview TopoViewer YAML locally; automatic full-project authoring is still evolving. |
| Grafana Containerlab mode | Lab | Validate realistic telemetry under the Grafana lab; not a separate production surface. |
| NetBox | Roadmap | Future in-product topology visualization from NetBox inventory and platform data. |
| OpsMill/Infrahub | Roadmap | Future in-product topology visualization from Infrahub network topology and inventory data. |
