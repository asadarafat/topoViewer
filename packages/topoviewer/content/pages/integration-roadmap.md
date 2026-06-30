# Integration Roadmap

**Support status:** Roadmap

TopoViewer currently supports the React/TypeScript source API before public npm publication, the MkDocs plugin, and a static Zensical adapter. VS Code and Grafana are experimental surfaces in this repo. NetBox and OpsMill/Infrahub are roadmap items and are not supported packages yet.

## Status Summary

| Surface | Status | First useful shape |
| --- | --- | --- |
| React / TypeScript | Pre-Publish Supported | Import `TopoViewer` from the source package build and render topology plus stylesheet data while public npm release gates are completed. |
| MkDocs | Supported | Use the `mkdocs-topoviewer` fenced-block plugin with live YAML examples. |
| Zensical | Supported Adapter | Build the mirrored Zensical site from shared docs and static TopoViewer embed assets. |
| NetBox | Roadmap | Build a NetBox plugin that renders TopoViewer diagrams inside NetBox from inventory and mapping profiles. |
| OpsMill / Infrahub | Roadmap | Build an in-platform OpsMill/Infrahub extension that publishes TopoViewer views or artifacts from graph data. |
| VS Code | Experimental | Use `packages/vscode-topoviewer` for a Material UI authoring preview, schema-backed YAML assist, candidate Apply/Revert workflow, semantic diagnostics, fixture workflow, browser-test harness, and PNG export wiring. |
| Grafana | Experimental | Render mounted topology/style/mapper bundles and Prometheus-driven overlays in a Grafana panel; validate local lab behavior separately. |

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
topology.yaml + stylesheet.yaml -> schema-backed YAML assist -> candidate Apply/Revert -> semantic lint -> Material UI live preview webview
```

Current shape:

- command-based preview for `.yaml` and `.yml` authoring files;
- configurable pairing between `topology.yaml` and `stylesheet.yaml`;
- shared React and Material UI webview used by VS Code and the browser harness;
- schema validation, schema-backed key suggestions, style-value suggestions, and semantic lint from the existing TopoViewer package;
- candidate editing where YAML drafts do not mutate the canvas until Apply succeeds;
- durable diagnostics with line navigation and editor markers;
- layer toggles, source tabs, docs link, and PNG export wiring for browser and VS Code hosts.

Use cases:

- live preview while editing YAML;
- schema validation, indentation-aware YAML assist, and typed style-value completion;
- safe YAML draft review before changing the rendered canvas;
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

Grafana is useful for operational dashboards. The integration direction is a
mounted TopoViewer bundle plus Grafana data frames. Topology, style, and mapper
YAML are mounted into Grafana as source files; telemetry arrives through Grafana
queries; mapper rules translate telemetry samples into runtime overlays without
mutating the mounted topology or stylesheet YAML.

The production contract has three separate responsibilities:

| Responsibility | Owner | Contract |
| --- | --- | --- |
| Source documents | User or automation | Mount one `*.topo.tv.yaml`, one `*.style.tv.yaml`, and one `*.mapper.tv.yaml` per bundle. |
| Bundle loading | TopoViewer plugin backend | Discover bundle directories, reject missing or duplicate canonical files, parse YAML, and expose the selected bundle to the panel. |
| Runtime overlays | TopoViewer panel frontend | Combine source YAML, Grafana data frames, mapper rules, and local interaction state into a rendered operational topology. |

```topoviewer
topology: examples/integration/grafana-telemetry-call-flow/topology.yaml
stylesheet: examples/integration/grafana-telemetry-call-flow/stylesheet.yaml
height: 520px
controls: true
controlsOpen: false
title: Grafana telemetry call flow
selectedLayerIds:
  - source
  - telemetry
  - runtime
  - diagnostics
```

The same call-flow diagram is maintained as a dedicated architecture page so it
does not inherit the public example-page template.

The local Grafana lab uses anonymous Admin access and unsigned plugin loading
for disposable validation only. That setup is not production deployment guidance.

Production flow:

1. Author topology, stylesheet, and mapper YAML in the browser harness.
2. Use `Download bundle` to export `<graph>.topo.tv.yaml`,
   `<graph>.style.tv.yaml`, and `<graph>.mapper.tv.yaml`.
3. Mount those files into Grafana under a bundle directory such as
   `/etc/topoviewer/bundles/<bundle-id>/`.
4. The plugin backend discovers bundles and serves the selected source documents
   to the panel through a resource endpoint.
5. Grafana queries Prometheus or another configured data source and passes the
   query result to the panel as data frames.
6. The panel compiles the mapper, resolves samples to TopoViewer objects, and
   produces runtime-only overlays.
7. TopoViewer renders canonical topology and stylesheet YAML plus overlays and
   local interaction state.

The harness is the preferred authoring surface because it validates the mapper
with the same topology and stylesheet that Grafana later consumes. A text editor
can still be used, but early adopters should not need to know repository
fixture structure, generated catalogs, or plugin build steps just to bring their
own topology into Grafana.

Optional Prometheus recording rules can normalize vendor-specific metrics into
stable metric names or labels, but they are not the TopoViewer source of truth.
The source of truth remains the mounted TopoViewer bundle.

Local commands:

```bash
npm run grafana:fixtures:check
npm run grafana:injector:test
npm run grafana:panel:test
npm run grafana:panel:build
npm run grafana:lab:up
npm run grafana:lab:smoke:phase1
npm run grafana:lab:smoke:phase2
npm run grafana:lab:inject -- link-failure
npm run grafana:lab:down
```

Use `GRAFANA_HTTP_PORT=<port>`, `PROMETHEUS_HTTP_PORT=<port>`, and
`TELEMETRY_INJECTOR_HTTP_PORT=<port>` with `grafana:lab:up` if local ports are
already occupied. Use matching `GRAFANA_URL`, `PROMETHEUS_URL`, and
`TELEMETRY_INJECTOR_URL` values with the smoke commands.

Telemetry mapping requires stable topology identifiers:

| Prometheus label | Purpose |
| --- | --- |
| `fixture_id` | Selects the matching harness fixture telemetry set. |
| `link_id` | Primary join key to `graph.links[].id`. |
| `direction` | Direction key for `linkDirection` overlays: `sourceToTarget` or `targetToSource`. |
| `source` / `target` | Fallback join key when a metric does not carry `link_id`. |
| `site` / `pod` | Dashboard filtering and troubleshooting labels. |

The panel keeps canonical topology and stylesheet YAML immutable. Grafana data
frames are converted into runtime overlays that update link color, width, style,
label, directional link strokes, and endpoint status markers.

Directional link telemetry should use the mounted bundle mapper rather than
duplicating physical links:

```yaml
rules:
  - id: fabric-direction-utilization
    metric: topoviewer_link_direction_utilization_percent
    select: linkDirection
    join:
      link: link_id
      direction: direction
    value: percent
    states:
      high: ">=80"
      saturated: ">=90"
    style:
      default:
        label: "{{ label.direction }} {{ value | round }}%"
      high:
        lineColor: "#ff9800"
        lineWidth: 5
      saturated:
        lineColor: "#d32f2f"
        lineWidth: 7
        lineStyle: dashed
```

The matching PromQL shape is:

```promql
topoviewer_link_direction_utilization_percent{fixture_id="clos-2spine-4leaf"}
```

Coverage diagnostics distinguish unresolved samples, ambiguous endpoint
matches, missing parent links, missing or unsupported direction keys, duplicate
direction overlays, and stale static object references.

Diagnostics should stay visible and actionable:

| Diagnostic area | Examples |
| --- | --- |
| Source loading | Missing bundle root, empty bundle root, duplicate `*.topo.tv.yaml`, YAML parse error. |
| Composition | Empty graph, invalid references, unsupported renderer limit. |
| Mapper schema | Invalid target kind, invalid join shape, unsupported style key for a target kind. |
| Query/data | PromQL returns no series, missing value field, missing join label. |
| Mapping coverage | Unresolved sample, ambiguous endpoint match, duplicate overlay, stale static object ID. |

Phase 3 adds local interaction state:

| State | Persistence |
| --- | --- |
| Viewport pan/zoom | `off`, `session`, or `browser` |
| Selected and focused objects | `off`, `session`, or `browser` |
| Local node drag positions | `off`, `session`, or `browser` |

The position overrides are runtime-only. They are applied after canonical
topology/layout and before telemetry styling. Resetting positions clears local
overrides without changing Prometheus-derived link or endpoint state.

Grafana remains Experimental because the supported operational surface needs
more release hardening:

```text
Grafana data frames / JSON model -> TopoViewer props -> operational topology panel
```

Use cases:

- service topology panel with live state;
- failure view from alerts, metrics, or logs;
- customer or service path next to latency, traffic, or error panels;
- NOC view that focuses affected nodes and dims healthy context.

Risks include plugin signing, dashboard refresh behavior, CSP, dashboard-level
state persistence, Containerlab integration, and dense-topology performance.

## Roadmap Rule

Only call an integration `Supported` when a working package, adapter, or
documented runtime path exists. Until then, roadmap entries must stay explicit
about planned scope and unresolved risks.
