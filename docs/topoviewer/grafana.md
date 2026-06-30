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

Mapper attributes:

| Attribute | Type | Accepted values | Use |
|---|---|---|---|
| `version` | number | `1` | Canonical mapper document version. |
| `identity.sourceId` | string | Any stable bundle/source ID. | Optional source identity. |
| `identity.sourceIdLabel` | string | Grafana label name. | Filters samples to the selected topology source. |
| `rules[].id` | string | Unique rule ID. | Diagnostic and coverage identity. |
| `rules[].metric` | string | Grafana metric/data-frame name. | Selects samples for a rule. |
| `rules[].select` | string | `node`, `link`, `linkDirection`, `path`, `region`, `layer`, `graph`, or a TopoViewer selector. | Selects target object kind or subset. |
| `rules[].join` | string or map | Label name, or `link` plus `direction` for `linkDirection`. | Resolves telemetry labels to TopoViewer objects. |
| `rules[].value` | string | Field/label name such as `percent`, `up`, or omitted value field. | Selects the numeric or scalar value. |
| `rules[].states` | map | State name to comparison, such as `">=80"` or `"==0"`. | Names value ranges for conditional styles. |
| `rules[].style.default` | style map | Any supported runtime style key for the target kind. | Baseline overlay for matched samples. |
| `rules[].style.<state>` | style map | Any supported runtime style key for the target kind. | State-specific overlay. |
| `mappings[]` | array | Canonical mapping objects. | Advanced resolver, threshold, aggregate, and condition shape. |

Supported target kinds are `node`, `link`, `linkDirection`, `path`, `region`,
`layer`, and `graph`.

Supported resolver modes in canonical `mappings[]` are `id`, `label`, `data`,
`endpoint`, `selector`, `aggregate`, and `staticObjectIds`.

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

Next: [Grafana telemetry call flow](grafana-telemetry-call-flow.md) for the
architecture diagram.
