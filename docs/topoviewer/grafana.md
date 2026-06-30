# Grafana Guide

**Support status:** Experimental

TopoViewer in Grafana is for operational topology views where source topology
stays declarative and telemetry only creates runtime overlays.

The preferred workflow is:

```text
Harness authoring -> bundle files -> mounted Grafana directory -> selected panel bundle -> Prometheus data frames -> mapper overlays
```

Do not edit fixture catalogs, run fixture sync, or rebuild the plugin for a
normal user-provided topology. Fixture mode exists for demos and regression
tests only.

## Fresh Checkout Path

Use this sequence when validating the local Grafana lab from a clean checkout:

```bash
npm ci
npm run grafana:lab:up
npm run grafana:lab:smoke:phase4
npm run grafana:lab:inject -- healthy
npm run grafana:lab:inject -- high-utilization
npm run grafana:lab:inject -- link-failure
npm run grafana:lab:down
```

The local lab uses disposable credentials, anonymous Admin, unsigned plugin
loading, and localhost-published ports. It is validation scaffolding only.

Default dashboard:

```text
http://127.0.0.1:3000/d/topoviewer-phase-4/topoviewer-phase-4-mounted-bundles
```

If port `3000` is already used:

```bash
GRAFANA_HTTP_PORT=3001 npm run grafana:lab:up
GRAFANA_URL=http://127.0.0.1:3001 npm run grafana:lab:smoke:phase4
```

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
| Local Grafana lab | Pinned by the lab Docker Compose/image inputs. |
| Node.js | Node.js 24 LTS for build and tests. |
| React runtime | React 18 via Grafana/plugin build dependencies. |
| TopoViewer runtime | Same workspace `topoviewer` package version as the panel build. |
| Signing status | Unsigned for local labs. Signed public distribution is not claimed yet. |

## Role And Access Checks

The panel backend reads mounted files from the Grafana container and serves only
the selected bundle YAML to the panel frontend. Validate access with Grafana
roles before using this workflow outside a disposable lab.

Manual check matrix:

| Role | Expected behavior |
|---|---|
| Viewer | Can open dashboards that already include the TopoViewer panel, load the selected mounted bundle, pan/zoom/select, and see telemetry overlays. Cannot change panel options or save dashboards. |
| Editor | Can do Viewer actions, edit panel options, select a different mounted bundle, and save dashboard changes when the dashboard is not provisioned read-only. |
| Admin | Can do Editor actions, install/configure the plugin, configure data sources, and manage dashboard provisioning. |
| Anonymous | Disabled for shared or production environments. In the local lab only, anonymous is intentionally Admin so smoke tests and screenshots are fast. |

Production-shaped validation:

1. Disable anonymous access.
2. Create or map one Viewer, one Editor, and one Admin user.
3. Mount a read-only bundle directory under `/etc/topoviewer/bundles`.
4. Confirm Viewer can render but cannot change bundle selection.
5. Confirm Editor can change bundle selection and save only editable dashboards.
6. Confirm Admin can configure the plugin and data source.
7. Confirm failed or missing bundle paths return redacted diagnostics, not host
   filesystem paths.

## Authoring To Mounting

1. Open the browser harness.
2. Edit `Topology YAML`, `Stylesheet YAML`, and `Mapper YAML`.
3. Press `Apply` until the viewport and diagnostics are valid.
4. Use `Download bundle`.
5. Mount the exported files into Grafana under one bundle directory.
6. Select that bundle in the panel options.
7. Bind Grafana queries so their labels match the mapper joins.
8. Inspect mapper coverage before trusting the visual state.

The mounted directory shape is:

```text
/etc/topoviewer/bundles/<bundle-id>/
  <bundle-id>.topo.tv.yaml
  <bundle-id>.style.tv.yaml
  <bundle-id>.mapper.tv.yaml
```

Docker Compose mount shape:

```yaml
services:
  grafana:
    volumes:
      - ./topoviewer-bundles:/etc/topoviewer/bundles:ro
    environment:
      TOPOVIEWER_BUNDLE_ROOT: /etc/topoviewer/bundles
```

Every bundle directory must contain exactly one `*.topo.tv.yaml`, one
`*.style.tv.yaml`, and one `*.mapper.tv.yaml` unless an explicit manifest is
configured.

## Mapper Contract

Mapper YAML translates telemetry samples into runtime style patches. It does
not rewrite source topology or stylesheet YAML.

Compact rule shape:

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
        lineColor: "#ff9800"
        lineWidth: 4
      saturated:
        lineColor: "#d32f2f"
        lineWidth: 7
        label: "{{ state }} {{ value | round }}%"
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
        label: "{{ value | bps }}"
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

Supported template tokens in style strings include `{{ value }}`,
`{{ value | round }}`, `{{ value | bps }}`, `{{ severity }}`,
`{{ state }}`, `{{ metric }}`, `{{ target.id }}`, `{{ label.<name> }}`,
and `{{ field.<name> }}`.

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

## Mapper Examples By Target

Node badge and status:

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

Link style and label text:

```yaml
rules:
  - id: link-utilization
    metric: interface_utilization_percent
    select: link
    join: link_id
    value: percent
    states:
      busy: ">=70"
    style:
      default:
        label: "{{ value | round }}%"
        lineColor: "#4caf50"
      busy:
        label: "busy {{ value | round }}%"
        lineColor: "#ff9800"
        lineWidth: 6
```

Link operational state:

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
        labelColor: "#c62828"
```

Directional link data:

```yaml
rules:
  - id: directional-bandwidth
    metric: interface_direction_bps
    select: linkDirection
    join:
      link: link_id
      direction: direction
    states:
      hot: ">=5000000000"
    style:
      default:
        label: "{{ label.direction }} {{ value | bps }}"
        lineWidth: 4
      hot:
        label: "{{ label.direction }} hot {{ value | bps }}"
        lineColor: "#d32f2f"
        targetArrowSize: 16
```

Path SLO:

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

Region aggregate state:

```yaml
mappings:
  - id: region-errors
    metric: region_error_count
    target:
      kind: region
      resolve:
        by: label
        key: region
        metricLabel: region
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

Layer aggregate state:

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

Graph summary state:

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

## Query Output Expectations

The mapper works best when Prometheus series carry stable topology labels.

| State | Example sample | Expected overlay |
|---|---|---|
| Healthy | `link_up{link_id="Leaf-1-Spine-1"} 1` | Link remains in the default healthy style. |
| Degraded | `interface_utilization_percent{link_id="Leaf-1-Spine-1"} 82` | Rule state such as `busy` changes color, width, label, or badge. |
| Failed | `link_up{link_id="Leaf-1-Spine-1"} 0` | Rule state such as `down` changes label and failure styling. |
| No data | No matching series. | Source topology still renders; mapper coverage reports no matched telemetry. |
| Ambiguous | Endpoint-only labels match multiple parallel links. | Overlay is blocked for that sample and coverage increments ambiguous matches. |

Stable label recommendations:

| Label | Target |
|---|---|
| `node_id` | `graph.nodes[].id` |
| `link_id` | `graph.links[].id` |
| `path_id` | `graph.paths[].id` |
| `region_id` | `graph.regions[].id` |
| `direction` | `sourceToTarget` or `targetToSource` for `linkDirection` |

## Mapper Coverage

The panel separates source state, telemetry state, mapper state, and interaction
state.

Coverage counters:

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
shows a "cannot be saved" message, either:

- save an editable copy for local exploration; or
- update the dashboard JSON in the provisioning source.

Panel state that lives in browser/session storage is local runtime state. It is
not written into dashboard JSON, topology YAML, stylesheet YAML, or mapper YAML.

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

## Next Steps

- [Grafana telemetry call flow](grafana-telemetry-call-flow.md): data path from mounted bundle and Prometheus query to runtime overlay.
- [Browser harness](browser-harness.md): author the topology, stylesheet, and mapper bundle before mounting it.
- [Integration roadmap](integration-roadmap.md): understand what is supported, experimental, lab-only, or roadmap.
