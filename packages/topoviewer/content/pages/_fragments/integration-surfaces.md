TopoViewer is designed to be used as a library, a documentation embed, an
authoring surface, and an operational dashboard runtime. The surfaces do not
all have the same maturity.

| Surface | Status | Use today |
|---|---|---|
| TypeScript/React package | Pre-Publish Supported | Embed the renderer from the repo/package build while public npm release gates are completed. |
| MkDocs | Supported | Publish live YAML examples through `mkdocs-topoviewer`. |
| Zensical | Supported Adapter | Preview the same docs content through the generated Zensical site. |
| Browser harness | Experimental | Author, validate, preview, and export TopoViewer YAML. |
| VS Code extension | Experimental | Preview TopoViewer YAML locally; automatic full-project authoring is still evolving. |
| Grafana panel | Experimental | Mount topology/style/mapper bundles and render Prometheus-driven overlays. |
| Grafana Containerlab mode | Lab | Validate realistic telemetry under the Grafana lab; not a separate production surface. |
| NetBox | Roadmap | Future in-product topology visualization from NetBox inventory and platform data. |
| OpsMill/Infrahub | Roadmap | Future in-product topology visualization from Infrahub network topology and inventory data. |
