# Grafana Mapper Recipes

**Support status:** Experimental

Use these recipes as starting points for `*.mapper.tv.yaml`. They assume
telemetry series carry stable labels such as `node_id`, `link_id`, `path_id`,
`region_id`, and `direction`.

You can hand-write these recipes or use the Browser Harness Mapper YAML rule
builder. The builder reads the current topology and offers object IDs, layers,
labels, data keys, endpoint pairs, value categories, thresholds, templates, and
overlay styles as guided controls before inserting a canonical `mappings` rule.

## Metric Label Contract

Prefer one stable label per TopoViewer target kind. Keep these labels in
recording rules or query aliases so the mapper does not depend on exporter-
specific labels.

| Label | Maps to |
|---|---|
| `node_id` | `graph.nodes[].id` |
| `link_id` | `graph.links[].id` |
| `path_id` | `graph.paths[].id` |
| `region_id` | `graph.regions[].id` |
| `direction` | `sourceToTarget` or `targetToSource` for `linkDirection` |

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

## Node Health

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

## Link State

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

## Bidirectional Utilization

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

## Path SLO

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

## Region Aggregate Status

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

## Layer Aggregate Status

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

## Graph Summary Status

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

## Next Steps

- [Grafana guide](grafana.md): mount bundles, connect queries, and inspect coverage.
- [Browser harness](browser-harness.md): author and export mapper YAML.
- [Mapper schema](schemas.md): configure editor schema association for `*.mapper.tv.yaml`.
