# Grafana TopoViewer Containerlab Lab

**Support status:** Lab

Try TopoViewer inside Grafana with a real Containerlab topology, gNMI
telemetry, Prometheus queries, mapper overlays, and fault-style scenarios.

TopoViewer is not just another Grafana panel. The topology stays declarative in
`*.topo.tv.yaml` and `*.style.tv.yaml`; telemetry is joined through
`*.mapper.tv.yaml` and applied as runtime visual state. The mounted source files
remain the source of truth.

## What You Will Build

The lab runs this stack locally:

```text
Containerlab routers
  -> gNMI telemetry
  -> gNMIc Prometheus exporter
  -> Prometheus
  -> Grafana data frames
  -> TopoViewer mapper overlays
```

The result is an editable Grafana dashboard with a TopoViewer panel. The panel
loads a mounted topology bundle, reads Prometheus data frames, resolves metrics
to TopoViewer objects, and paints runtime overlays such as link state,
directional bandwidth, status markers, labels, and line styles.

## Architecture

| Layer | Responsibility |
|---|---|
| Containerlab | Starts the router/container topology and local lab services. |
| gNMIc | Subscribes to device telemetry and exposes Prometheus-format metrics. |
| Prometheus | Scrapes gNMIc and the TopoViewer normalizer. |
| TopoViewer normalizer | Converts lab telemetry into mapper-friendly labels and scenario states. |
| Grafana | Provisions the Prometheus data source, dashboard, and TopoViewer panel. |
| TopoViewer panel backend | Discovers mounted bundle files and serves selected YAML to the panel. |
| TopoViewer panel frontend | Renders the topology and applies mapper-driven runtime overlays. |

## Quick Start

Use the real Containerlab path when you want the end-to-end lab:

```bash
npm ci
npm run grafana:clab:up
npm run grafana:clab:traffic:start
npm run grafana:clab:smoke
```

Open Grafana:

```text
http://127.0.0.1:3001/d/topoviewer-clab/topoviewer-containerlab-phase-5
```

Stop traffic and tear the lab down:

```bash
npm run grafana:clab:traffic:stop
npm run grafana:clab:down
```

Check traffic without changing state:

```bash
npm run grafana:clab:traffic:status
```

The smoke test validates that Grafana, Prometheus, gNMIc metrics, and the
TopoViewer normalizer are reachable after the lab starts.

## Local Ports

The Containerlab lab defaults are pinned in
`labs/grafana-topoviewer/containerlab/.env`.

| Service | Default URL |
|---|---|
| Grafana | `http://127.0.0.1:3001` |
| Prometheus | `http://127.0.0.1:9091` |
| gNMIc metrics | `http://127.0.0.1:9804/metrics` |
| TopoViewer normalizer | `http://127.0.0.1:9110/health` |

The local lab uses disposable credentials, localhost-published ports, unsigned
plugin loading, and local-only assumptions. Keep it on a trusted workstation.

## Lab Files

The working lab lives under:

```text
labs/grafana-topoviewer/containerlab/
  topoviewer-grafana.clab.yml
  configs/
    gnmic/gnmic.yml
    prometheus/prometheus.yml
    prometheus/rules.yml
    grafana/provisioning/
    grafana/dashboards/topoviewer-containerlab.json
```

Mounted TopoViewer bundles live under:

```text
labs/grafana-topoviewer/topoviewer-bundles/
```

Each bundle directory uses the production-shaped suffix contract:

```text
<bundle-id>/
  <bundle-id>.topo.tv.yaml
  <bundle-id>.style.tv.yaml
  <bundle-id>.mapper.tv.yaml
```

Every bundle directory must contain exactly one `*.topo.tv.yaml`, one
`*.style.tv.yaml`, and one `*.mapper.tv.yaml` unless an explicit manifest is
configured.

## Source Bundle Mounting

Grafana mounts bundle files read-only under `/etc/topoviewer/bundles`:

```yaml
services:
  grafana:
    volumes:
      - ./topoviewer-bundles:/etc/topoviewer/bundles:ro
    environment:
      TOPOVIEWER_BUNDLE_ROOT: /etc/topoviewer/bundles
```

The panel backend owns source discovery. It scans the mounted bundle root,
rejects missing or duplicate canonical suffixes, parses YAML, validates the
TopoViewer documents, and serves only the selected bundle to the panel frontend.

Ordinary bundle-file changes should not require fixture catalog edits, fixture
sync, a plugin rebuild, or a Grafana restart. Use Grafana refresh or reselect
the bundle when you need the panel to reload mounted files.

## Authoring Workflow

1. Open the browser harness.
2. Edit `Topology YAML`, `Stylesheet YAML`, and `Mapper YAML`.
3. Press `Apply` until the viewport and diagnostics are valid.
4. Use `Download bundle`.
5. Mount the exported bundle directory into Grafana.
6. Select that bundle in the panel options.
7. Bind Grafana queries so their labels match the mapper joins.
8. Inspect mapper coverage before trusting the visual state.

The harness is the authoring surface. Grafana is the operational rendering
surface.

## Mapper Label Contract

Prefer one stable label per TopoViewer target kind. Keep these labels in
recording rules or query aliases so mapper YAML does not depend on
exporter-specific labels.

| Label | Maps to |
|---|---|
| `node_id` | `graph.nodes[].id` |
| `link_id` | `graph.links[].id` |
| `path_id` | `graph.paths[].id` |
| `region_id` | `graph.regions[].id` |
| `layer_id` | `graph.layers[].id` |
| `direction` | `sourceToTarget` or `targetToSource` for `linkDirection` |
| `source_id` | Optional topology/source identity guard. |

PromQL starter shapes:

```promql
node_health{node_id!="", source_id="$source_id"}
interface_oper_state{link_id!="", source_id="$source_id"}
interface_direction_bps{link_id!="", direction=~"sourceToTarget|targetToSource", source_id="$source_id"}
service_path_latency_ms{path_id!="", source_id="$source_id"}
region_error_count{region_id!="", source_id="$source_id"}
layer_health{layer_id!="", source_id="$source_id"}
graph_incidents{source_id="$source_id"}
```

## Mapper Contract

Mapper YAML translates telemetry samples into runtime style patches. It does
not rewrite source topology or stylesheet YAML.

Compact link rule:

```yaml
rules:
  - id: link-utilization
    metric: interface_utilization_percent
    select: link
    join: link_id
    value: percent
    states:
      busy: ">=70"
      saturated: ">=90"
    style:
      default:
        label: "{{ value | round }}%"
        lineColor: "#4caf50"
      busy:
        label: "busy {{ value | round }}%"
        lineColor: "#ff9800"
        lineWidth: 6
      saturated:
        label: "{{ state }} {{ value | round }}%"
        lineColor: "#d32f2f"
        lineWidth: 8
```

Directional link rule:

```yaml
rules:
  - id: directional-bandwidth
    metric: interface_direction_bps
    select: linkDirection
    join:
      link: link_id
      direction: direction
    states:
      busy: ">=1000000000"
      saturated: ">=5000000000"
    style:
      default:
        label: "{{ label.direction }} {{ value | bps }}"
        lineColor: "#4caf50"
        lineWidth: 4
      busy:
        lineColor: "#ff9800"
        lineWidth: 6
      saturated:
        label: "hot {{ value | bps }}"
        lineColor: "#d32f2f"
        lineWidth: 8
```

Supported template tokens in style strings include `{{ value }}`,
`{{ value | round }}`, `{{ value | bps }}`, `{{ severity }}`,
`{{ state }}`, `{{ metric }}`, `{{ target.id }}`, `{{ label.<name> }}`,
and `{{ field.<name> }}`.

## Mapper Attribute Reference

Root attributes:

| Attribute | Type | Accepted values | Use |
|---|---|---|---|
| `$schema` | string | Schema URL. | Optional editor/schema hint. |
| `version` | number | `1` | Canonical mapper document version. |
| `identity.sourceId` | string | Any stable topology/source ID. | Expected source identity, usually the bundle or topology ID. |
| `identity.sourceIdLabel` | string | Grafana label name. | Telemetry label that must equal `identity.sourceId`; unmatched samples are ignored. |
| `palette.success` | string or `{ color, accent }` | CSS color. | Healthy/default severity color. |
| `palette.info` | string or `{ color, accent }` | CSS color. | Informational severity color. |
| `palette.warning` | string or `{ color, accent }` | CSS color. | Warning severity color. |
| `palette.error` | string or `{ color, accent }` | CSS color. | Error severity color. |
| `rules` | array | Compact authoring rules. | Preferred hand-authored mapper shape. |
| `mappings` | array | Canonical mapping rules. | Advanced resolver, threshold, aggregate, and condition shape. |

Compact `rules[]` attributes:

| Attribute | Type | Accepted values | Relationship to TopoViewer |
|---|---|---|---|
| `rules[].id` | string | Unique stable ID. | Used in diagnostics and coverage output. |
| `rules[].metric` | string | Grafana metric/data-frame name. | Must match the query result name. |
| `rules[].select` | string | `node`, `link`, `linkDirection`, `path`, `region`, `layer`, `graph`, or a selector such as `node[labels.role = "pe"]`. | Selects the TopoViewer object kind or subset. |
| `rules[].join` | string | Telemetry label such as `node_id`, `link_id`, `path_id`, or `region_id`. | Label value must equal the selected TopoViewer object ID. |
| `rules[].join.link` | string | Telemetry label name. | For `linkDirection`, carries parent `graph.links[].id`. |
| `rules[].join.direction` | string | Telemetry label name. | For `linkDirection`, carries `sourceToTarget` or `targetToSource`. |
| `rules[].value` | string | `percent`, `utilization`, `utilizationPercent`, `up`, `errors`, `errorsTotal`, `latency`, `latencyMs`, `loss`, `lossPercent`, `capacity`, `capacityPercent`, `health`. | Gives the sample value a semantic type for formatting and severity behavior. |
| `rules[].states.<name>` | string | Expressions such as `==0`, `!=up`, `>0`, `>=70`, `<20`, or a bare scalar. | Defines named value states. State names become `{{ state }}` in style templates. |
| `rules[].style.default` | style map | Any supported runtime style key for the selected target kind. | Baseline overlay applied to matched samples. |
| `rules[].style.<state>` | style map | Any supported runtime style key for the selected target kind. | State-specific overlay when `states.<state>` matches. |

Canonical `mappings[]` attributes:

| Attribute | Type | Accepted values | Relationship to TopoViewer |
|---|---|---|---|
| `mappings[].id` | string | Unique stable ID. | Used in diagnostics and coverage output. |
| `mappings[].metric` | string | Grafana metric/data-frame name. | Must match the query result name. |
| `mappings[].target.kind` | string | `node`, `link`, `linkDirection`, `path`, `region`, `layer`, `graph`. | TopoViewer object family receiving the overlay. |
| `mappings[].target.resolve.by` | string | `id`, `label`, `data`, `endpoint`, `selector`, `aggregate`, `staticObjectIds`. | Resolver mode used to bind telemetry samples to TopoViewer objects. |
| `mappings[].target.resolve.metricLabel` | string | Telemetry label name. | Primary join value for `id`, `label`, or `data` resolvers. |
| `mappings[].target.resolve.linkMetricLabel` | string | Telemetry label name. | Parent link ID label for `linkDirection`. |
| `mappings[].target.resolve.directionMetricLabel` | string | Telemetry label name. | Direction label for `linkDirection`; value must be `sourceToTarget` or `targetToSource`. |
| `mappings[].target.resolve.key` | string | TopoViewer label/data key. | Used with `label` or `data`; compares telemetry label value to `labels.<key>` or `data.<key>`. |
| `mappings[].target.resolve.sourceLabel` | string | Telemetry label name. | Source node ID for endpoint-based link matching. |
| `mappings[].target.resolve.targetLabel` | string | Telemetry label name. | Target node ID for endpoint-based link matching. |
| `mappings[].target.resolve.selector` | string | TopoViewer selector. | Selects all matching objects; use carefully for broad overlays. |
| `mappings[].target.resolve.objectIds` | string array | TopoViewer object IDs. | Static explicit target list. |
| `mappings[].value.field` | string | Data-frame field name. | Reads a named field instead of the default sample value. |
| `mappings[].value.as` | string | `up`, `utilizationPercent`, `errorsTotal`, `latencyMs`, `lossPercent`, `capacityPercent`, `health`. | Semantic value type for thresholds and formatting. |
| `mappings[].thresholds.info` | number | Numeric threshold. | Produces `info` severity when crossed. |
| `mappings[].thresholds.warning` | number | Numeric threshold. | Produces `warning` severity when crossed. |
| `mappings[].thresholds.error` | number | Numeric threshold. | Produces `error` severity when crossed. |
| `mappings[].thresholds.direction` | string | `above` or `below`. | Whether larger or smaller values are worse. Defaults to `above`. |
| `mappings[].overlay.lineColorBySeverity` | boolean | `true` or `false`. | Sets line color from severity palette for links, paths, and direction lanes. |
| `mappings[].overlay.lineWidthBySeverity` | boolean | `true` or `false`. | Increases line width by severity for links, paths, and direction lanes. |
| `mappings[].overlay.sourceArrowColorBySeverity` | boolean | `true` or `false`. | Sets source arrow color for links and direction lanes. |
| `mappings[].overlay.targetArrowColorBySeverity` | boolean | `true` or `false`. | Sets target arrow color for links and direction lanes. |
| `mappings[].overlay.outlineBySeverity` | boolean | `true` or `false`. | Sets node/region outline from severity. |
| `mappings[].overlay.statusMarker` | boolean | `true` or `false`. | Sets status marker color from severity. |
| `mappings[].overlay.backgroundColorBySeverity` | boolean | `true` or `false`. | Sets background color from severity for supported targets. |
| `mappings[].overlay.borderColorBySeverity` | boolean | `true` or `false`. | Sets border color from severity for supported targets. |
| `mappings[].overlay.badgeLabel` | string | Template string. | Sets node badge text or equivalent supported target badge. |
| `mappings[].overlay.label` | string | Template string. | Sets runtime label text for the target. |
| `mappings[].overlay.propagateToLayerMembers` | boolean | `true` or `false`. | For `layer` or aggregate targets, optionally propagates state to child objects. |
| `mappings[].overlay.style` | style map | Any supported runtime style key for the target kind. | Base style patch before conditions. |
| `mappings[].conditions[].id` | string | Stable condition ID. | Optional diagnostic/review label. |
| `mappings[].conditions[].when.severity` | string | `none`, `success`, `info`, `warning`, `error`. | Matches derived severity. |
| `mappings[].conditions[].when.value` | map | `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `contains`, `exists`. | Matches sample value. |
| `mappings[].conditions[].when.label` | map | `key` plus scalar condition. | Matches telemetry label value. |
| `mappings[].conditions[].when.field` | map | `key` plus scalar condition. | Matches data-frame field value. |
| `mappings[].conditions[].style` | style map | Any supported runtime style key for the target kind. | Conditional style patch. |

Resolver modes:

| Resolver | Required fields | Use |
|---|---|---|
| `id` | `metricLabel`, or `linkMetricLabel` plus `directionMetricLabel` for `linkDirection`. | Match telemetry label value to TopoViewer object ID. |
| `label` | `key`, `metricLabel`. | Match telemetry label value to `labels.<key>`. |
| `data` | `key`, `metricLabel`. | Match telemetry label value to `data.<key>`. |
| `endpoint` | `sourceLabel`, `targetLabel`. | Match a link by source and target node IDs; avoid this with parallel links unless labels disambiguate. |
| `selector` | `selector`. | Apply one sample or aggregate state to all objects matching a TopoViewer selector. |
| `aggregate` | Usually `selector` or `objectIds`. | Summarize child objects into a layer/region/graph style. |
| `staticObjectIds` | `objectIds`. | Apply a metric to a fixed object list. |

## Demo Scenarios

| Scenario | Command path | What changes |
|---|---|---|
| Healthy | `npm run grafana:clab:smoke` | Baseline mapper coverage and normal link state. |
| High utilization | `npm run grafana:clab:smoke` | Directional bandwidth and utilization overlays move into warning/error styles. |
| Link failure | `npm run grafana:clab:smoke` | A selected link reports down state and failure styling. |
| Live traffic | `npm run grafana:clab:traffic:start` | Client traffic creates live telemetry for the dashboard queries. |

The normalizer scenarios are test controls. The topology source still comes from
mounted `*.tv.yaml` files, not from Prometheus.

## Mapper Recipes

### Node Health

```yaml
rules:
  - id: node-health
    metric: node_health
    select: node
    join: node_id
    value: health
    states:
      down: "==0"
    style:
      default:
        badgeLabel: OK
        statusColor: "#4caf50"
      down:
        badgeLabel: DOWN
        statusColor: "#d32f2f"
        outlineColor: "#d32f2f"
        outlineWidth: 6
```

### Link State

```yaml
rules:
  - id: link-oper-state
    metric: interface_oper_state
    select: link
    join: link_id
    value: up
    states:
      down: "==0"
    style:
      default:
        label: UP
        lineColor: "#4caf50"
        lineWidth: 3
      down:
        label: DOWN
        lineColor: "#d32f2f"
        lineWidth: 7
        lineStyle: dashed
```

### Bidirectional Utilization

```yaml
rules:
  - id: link-direction-utilization
    metric: interface_direction_bps
    select: linkDirection
    join:
      link: link_id
      direction: direction
    states:
      busy: ">=1000000000"
      saturated: ">=5000000000"
    style:
      default:
        label: "{{ label.direction }} {{ value | bps }}"
        lineWidth: 4
      busy:
        lineColor: "#ff9800"
        lineWidth: 6
      saturated:
        label: "hot {{ value | bps }}"
        lineColor: "#d32f2f"
        lineWidth: 8
```

### Path SLO

```yaml
mappings:
  - id: service-path-latency
    metric: service_path_latency_ms
    target:
      kind: path
      resolve:
        by: id
        metricLabel: path_id
    value:
      as: latencyMs
    thresholds:
      warning: 50
      error: 100
    overlay:
      lineColorBySeverity: true
      lineWidthBySeverity: true
      label: "{{ value | round }} ms"
```

### Region Aggregate Status

```yaml
mappings:
  - id: region-errors
    metric: region_error_count
    target:
      kind: region
      resolve:
        by: id
        metricLabel: region_id
    value:
      as: errorsTotal
    thresholds:
      warning: 1
      error: 10
    overlay:
      borderColorBySeverity: true
      backgroundColorBySeverity: true
      label: "errors {{ value | round }}"
```

### Layer Aggregate Status

```yaml
mappings:
  - id: underlay-layer-health
    metric: layer_health
    target:
      kind: layer
      resolve:
        by: staticObjectIds
        objectIds:
          - underlay
    value:
      as: health
    overlay:
      statusMarker: true
      propagateToLayerMembers: true
```

### Graph Summary Status

```yaml
mappings:
  - id: graph-incident-count
    metric: graph_incidents
    target:
      kind: graph
      resolve:
        by: aggregate
    thresholds:
      warning: 1
      error: 5
    overlay:
      label: "{{ value | round }} active incidents"
```

## How It Works

TopoViewer in Grafana has two inputs that stay intentionally separate:

- mounted source files: `*.topo.tv.yaml`, `*.style.tv.yaml`, and
  `*.mapper.tv.yaml`;
- Grafana data frames produced from Prometheus HTTP query responses or another
  Grafana data source.

The source files define the stable diagram. Telemetry only creates runtime
overlays. It can change labels, colors, widths, directional strokes, badges,
and status treatment, but it must not rewrite the mounted topology or
stylesheet.

This diagram uses a strict modeling rule: nodes are processing systems or
runtime components only. Files, mounted bundles, Grafana data frames, selected
source documents, mapper output, diagnostics payloads, and overlays are shown as
numbered edge labels or region context.

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

!!! note "Numbered edge legend"

    1. The harness writes a mounted TopoViewer bundle: `*.topo.tv.yaml`,
       `*.style.tv.yaml`, and `*.mapper.tv.yaml`.
    2. The TopoViewer plugin backend serves the selected topology, stylesheet,
       and mapper source to the TopoViewer plugin frontend.
    3. The Grafana query path calls the Prometheus HTTP API and returns
       telemetry query responses through the Grafana runtime.
    4. The TopoViewer plugin frontend passes mapper rules and telemetry samples
       into the mapper runtime.
    5. The TopoViewer plugin frontend passes topology and stylesheet state to
       the embedded renderer.
    6. The mapper runtime produces transient runtime overlays for matching
       TopoViewer objects.
    7. The mapper runtime emits frontend runtime diagnostics: coverage,
       ambiguous matches, unsupported overlays, and render-facing warnings.
    8. The TopoViewer plugin backend emits source diagnostics: discovery,
       parse, schema, and bundle-selection errors.

### Source Loading

The TopoViewer plugin backend owns source discovery. It scans the mounted bundle
root, rejects missing or duplicate canonical suffixes, parses the YAML,
validates the TopoViewer documents, and serves the selected bundle to the
TopoViewer plugin frontend.

### Telemetry Flow

The Grafana query path calls the Prometheus HTTP API and returns query responses
through the Grafana runtime. The TopoViewer plugin frontend consumes those
results as Grafana data frames. The plugin does not infer topology from
Prometheus. Instead, it compiles the mapper YAML and resolves each telemetry
sample against the already-loaded TopoViewer inventory:

1. identify the metric and value field;
2. resolve the target kind, such as node, link, path, region, layer, or graph;
3. join the sample by object ID, label, data field, endpoint, selector, or a
   static target;
4. evaluate mapper states;
5. produce runtime-only style deltas.

### Overlay Application

The TopoViewer renderer is embedded inside the TopoViewer plugin frontend. It
receives three inputs in order:

1. topology YAML;
2. stylesheet YAML;
3. mapper-produced runtime overlays.

That order matters. The topology and stylesheet remain the source of truth.
Overlays are transient operational state, so the same topology can show normal,
degraded, congested, or failed conditions without changing the authored YAML.

### Diagnostics

Diagnostics are split by owner:

- the plugin backend reports source diagnostics for mounted bundle discovery,
  canonical suffix validation, YAML parsing, schema validation, and selected
  bundle loading;
- the plugin frontend reports runtime diagnostics for mapper coverage,
  telemetry matching, unsupported overlay styles, render limits, and panel
  state.

Diagnostics should surface source parse errors, unsupported style keys, empty
topologies, renderer-limit violations, unresolved mapper rules, ambiguous
matches, duplicate samples, and stale mapper references.

## Mapper Coverage

The panel separates source state, telemetry state, mapper state, and interaction
state.

| Counter | Meaning |
|---|---|
| Total samples | Samples received from Grafana data frames. |
| Source matched | Samples that match the selected mapper source identity, when configured. |
| Metric matched | Samples whose metric name is used by at least one mapper rule. |
| Resolved | Samples mapped to one or more TopoViewer objects. |
| Unresolved | Samples that matched a rule but no object. |
| Applied objects | Unique TopoViewer objects receiving overlays. |
| Ambiguous | Samples that match too many objects. |
| Duplicate | Multiple samples/rules write the same overlay target. |
| Stale | Static object IDs that no longer exist in topology YAML. |

Treat non-zero unresolved, ambiguous, duplicate, or stale counts as a review
signal. They do not always mean the panel is broken, but they mean the operator
should inspect the mapper before trusting the visual state.

## Interactivity

The panel supports runtime interaction state:

| Interaction | Persistence | Source YAML impact |
|---|---|---|
| Pan and zoom | Session or browser storage, depending on panel options. | None. |
| Select and focus | Session or browser storage, depending on panel options. | None. |
| Dragged node positions | Session or browser storage, depending on panel options. | None. |
| Reset local positions | Clears local overrides. | None. |
| Bundle selection | Dashboard/panel option. | None. |
| Grafana refresh | Refetches data frames and can refetch mounted bundle YAML. | None. |

Dragged positions are local runtime overrides. They are applied after
canonical topology/layout and before telemetry overlays.

## Dashboard Editability

Provisioned dashboards cannot be saved back through the Grafana UI. If Grafana
shows a "cannot be saved" message, either save an editable copy for local
exploration or update the dashboard JSON in the provisioning source.

Panel state that lives in browser/session storage is local runtime state. It is
not written into dashboard JSON, topology YAML, stylesheet YAML, or mapper YAML.

## Synthetic Grafana Fallback

Use this path when you want to validate the Grafana plugin and mounted-bundle
workflow without Containerlab:

```bash
npm run grafana:lab:up
npm run grafana:lab:smoke:phase4
npm run grafana:lab:inject -- healthy
npm run grafana:lab:inject -- high-utilization
npm run grafana:lab:inject -- link-failure
npm run grafana:lab:down
```

Default dashboard:

```text
http://127.0.0.1:3000/d/topoviewer-phase-4/topoviewer-phase-4-mounted-bundles
```

If port `3000` is already used:

```bash
GRAFANA_HTTP_PORT=3001 npm run grafana:lab:up
GRAFANA_URL=http://127.0.0.1:3001 npm run grafana:lab:smoke:phase4
```

Fixture mode exists for demos and regression tests only. The production-shaped
workflow is mounted bundles.

## Plugin Artifact Trust

The checked-in Grafana lab loads an unsigned local plugin build so developers
can iterate quickly. That is acceptable for local validation only. Do not copy
the lab settings for an exposed Grafana instance:

- do not enable anonymous Admin for shared environments;
- do not rely on `allow_loading_unsigned_plugins` outside development;
- do not install an unreviewed local `dist` directory as a durable artifact.

A reviewed installable panel artifact should include:

- the plugin zip built from a committed version;
- SHA-256 checksums for the zip and backend binaries;
- an SBOM or equivalent dependency inventory;
- release notes that list support status, compatibility, known limitations, and
  migration notes;
- the exact Grafana version range validated for the artifact.

Current experimental validation matrix:

| Item | Current validation |
|---|---|
| Grafana packages | `13.1.0` in the panel workspace. |
| Local Grafana lab | `grafana/grafana:13.1.0` in the Containerlab `.env`. |
| Node.js | Node.js 24 LTS for build and tests. |
| React runtime | React 18 via Grafana/plugin build dependencies. |
| TopoViewer runtime | Same workspace `topoviewer` package version as the panel build. |
| Signing status | Unsigned for local labs. Signed public distribution is not claimed yet. |

## Role And Access Checks

The panel backend reads mounted files from the Grafana container and serves only
the selected bundle YAML to the panel frontend. Validate access with Grafana
roles before using this workflow outside a disposable lab.

| Role | Expected behavior |
|---|---|
| Viewer | Can open dashboards that already include the TopoViewer panel, load the selected mounted bundle, pan/zoom/select, and see telemetry overlays. Cannot change panel options or save dashboards. |
| Editor | Can do Viewer actions, edit panel options, select a different mounted bundle, and save dashboard changes when the dashboard is not provisioned read-only. |
| Admin | Can do Editor actions, install/configure the plugin, configure data sources, and manage dashboard provisioning. |
| Anonymous | Disabled for shared or production environments. In the local lab only, anonymous is intentionally Admin so smoke tests and screenshots are fast. |

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| No topology renders | Bundle missing, duplicate suffix files, YAML parse error, or invalid topology references. | Check source diagnostics and mounted directory shape. |
| Topology renders but overlays do not | Query returns no matching metric or mapper `metric` is wrong. | Compare Grafana query names with `rules[].metric`. |
| Coverage shows unresolved samples | Join label value does not match any TopoViewer object ID. | Check `node_id`, `link_id`, `path_id`, or `region_id` labels. |
| Coverage shows ambiguous samples | Endpoint or selector matching found multiple objects. | Prefer explicit IDs or add stable labels to disambiguate. |
| Coverage shows duplicate mappings | Multiple samples write the same object/state. | Add source labels, rule filters, or aggregate behavior. |
| Directional lanes do not update | Missing parent `link_id`, missing `direction`, or unsupported direction value. | Use `direction: sourceToTarget` or `targetToSource`. |
| Mapper YAML fails | Unsupported key, invalid target kind, invalid resolver, or invalid style key. | Use harness Mapper YAML assist and schema diagnostics. |
| Edited mounted files do not appear | Grafana has not refetched the selected bundle. | Use dashboard refresh, reload the page, or change/reselect the bundle. |
| Containerlab command fails before deploy | Missing Docker, Containerlab, or occupied ports. | Install the required tool or free the fixed ports shown by the preflight error. |
