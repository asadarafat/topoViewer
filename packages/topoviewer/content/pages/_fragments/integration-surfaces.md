TopoViewer's first public adoption path is the React package plus documentation
embeds. Authoring tools and operational dashboards exist to prove the model, but
they are not all part of the same stability promise.

| Surface | Status | Use today |
|---|---|---|
| TypeScript/React package | Supported | Install `topoviewer` from npm and embed schema-validated topology diagrams in React applications. |
| MkDocs | Supported | Publish live YAML examples through `mkdocs-topoviewer`. |
| Browser Studio | Beta Preview | Author, validate, recover, and export portable TopoViewer projects in current desktop Chrome or Edge. |
| Desktop Studio | Experimental | Run the same Studio application in a Wails shell with native directory projects; unsigned CI artifacts remain internal. |
| Grafana panel | Experimental | Mount topology/style/mapper bundles and render Prometheus-driven overlays. |
| Zensical | Supported Adapter | Preview the same docs content through the generated Zensical site. |
| Grafana Containerlab mode | Lab | Validate realistic telemetry under the Grafana lab; not a separate production surface. |
| NetBox | Roadmap | Future in-product topology visualization from NetBox inventory and platform data. |
| OpsMill/Infrahub | Roadmap | Future in-product topology visualization from Infrahub network topology and inventory data. |
