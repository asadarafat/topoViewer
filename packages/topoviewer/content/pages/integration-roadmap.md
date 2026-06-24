# Integration Roadmap

TopoViewer currently supports the React/TypeScript package, the MkDocs plugin, and a static Zensical adapter. VS Code has an experimental package in this repo. Other integrations are roadmap items and are not supported packages yet.

## Status Summary

| Surface | Status | First useful shape |
| --- | --- | --- |
| React / TypeScript | Supported | Import `TopoViewer` from the npm package and render topology plus stylesheet data. |
| MkDocs | Supported | Use the `mkdocs-topoviewer` fenced-block plugin with live YAML examples. |
| Zensical | Supported adapter | Build the mirrored Zensical site from shared docs and static TopoViewer embed assets. |
| NetBox | Feasibility | Build a NetBox plugin that renders TopoViewer diagrams inside NetBox from inventory and mapping profiles. |
| OpsMill / Infrahub | Feasibility | Build an in-platform OpsMill/Infrahub extension that publishes TopoViewer views or artifacts from graph data. |
| VS Code | Experimental package | Use `packages/vscode-topoviewer` for a Material UI authoring preview, schema validation, semantic lint, fixture workflow, browser-test harness, and export command wiring. |
| Grafana | Exploratory | Spike a panel plugin that maps Grafana data frames or JSON payloads into TopoViewer props. |

## NetBox

NetBox is a strong candidate for inventory-driven diagrams. The first integration should be a NetBox plugin, not an external generator:

```text
NetBox plugin -> NetBox models/API -> mapping profile -> embedded TopoViewer view + optional YAML export
```

Use cases:

- site, rack, device, interface, cable, and circuit topology diagrams;
- provider edge and core views from devices, roles, tags, and circuit relationships;
- topology tabs or panels directly inside NetBox objects, sites, tenants, and services;
- optional documentation snapshots exported from the plugin when teams still want MkDocs pages.

NetBox inventory does not automatically provide BGP health, service path state, alarms, traffic, or failures. Those overlays may need operational data from another source.

## OpsMill / Infrahub

Infrahub is graph-native, which maps well to TopoViewer's graph model. The first integration should live inside the OpsMill/Infrahub workflow, not as an external exporter:

```text
Infrahub extension/artifact workflow -> schema-aware mapping profile -> TopoViewer view or published artifact
```

Use cases:

- intended-state topology from graph data;
- branch comparison between active and proposed infrastructure;
- service dependency and ownership views;
- architecture documentation generated from Infrahub artifacts or transforms;
- in-platform preview of TopoViewer diagrams tied to branches, artifacts, and schema-defined objects.

Infrahub schemas are flexible, so any plugin or extension must use explicit mapping profiles rather than fixed TopoViewer assumptions.

## VS Code

VS Code now has an experimental authoring package in `packages/vscode-topoviewer`:

```text
topology.yaml + stylesheet.yaml -> schema validation + semantic lint -> Material UI live preview webview
```

Current shape:

- command-based preview for `.yaml` and `.yml` authoring files;
- configurable pairing between `topology.yaml` and `stylesheet.yaml`;
- shared React and Material UI webview used by VS Code and the browser harness;
- schema validation and semantic lint from the existing TopoViewer package;
- layer toggles, source tabs, diagnostics, docs link, and export command wiring.

Use cases:

- live preview while editing YAML;
- schema validation and completion;
- semantic diagnostics for missing references and invalid selectors;
- commands to create examples, open docs, run validation, and export screenshots.

Local browser harness:

```bash
npm run vscode:harness
npm run test:vscode-harness
```

The browser harness runs on a strict fixed local Vite server at
`127.0.0.1:5174`, loads fixture topology and stylesheet files, calls local
validation, and supports Playwright tests before extension-only manual testing
is treated as sufficient.

VS Code remains experimental, not supported, until there is a documented install
path, release artifact, and release validation path.

## Grafana

Grafana is useful for operational dashboards, but it needs a panel spike before it can be called planned support:

```text
Grafana data frames / JSON model -> TopoViewer props -> operational topology panel
```

Use cases:

- service topology panel with live state;
- failure view from alerts, metrics, or logs;
- customer or service path next to latency, traffic, or error panels;
- NOC view that focuses affected nodes and dims healthy context.

Risks include plugin signing, data-frame mapping, dashboard refresh behavior, CSP, and dense-topology performance.

## Roadmap Rule

Only call an integration "supported" when a working package, adapter, or documented runtime path exists. Until then, roadmap entries must stay explicit about feasibility, planned scope, and unresolved risks.
