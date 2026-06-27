## Phase 4: Operational Use Cases And Documentation

### Goal

Expand beyond the weathermap slice into the other operator workflows and
document the end-to-end authoring-to-telemetry path.

### Use Case: Node Health And Capacity Hotspots

Metrics:

```text
topoviewer_node_up{node_id,site,pod,role} 0|1
topoviewer_node_cpu_utilization_percent{node_id,site,pod,role} number
topoviewer_node_memory_utilization_percent{node_id,site,pod,role} number
topoviewer_node_temperature_celsius{node_id,site,pod,role} number
```

Expected behavior:

- node status marker maps to health;
- outline color maps to worst active severity;
- badge label shows `CPU`, `MEM`, `DOWN`, or reduced metric value;
- degraded node selection remains stable across telemetry refresh.

### Use Case: Service Path SLO And Blast Radius

Metrics:

```text
topoviewer_service_error_rate{service,path_id,tenant} number
topoviewer_service_latency_ms{service,path_id,tenant} number
topoviewer_service_packet_loss_percent{service,path_id,tenant} number
```

Expected behavior:

- breached service path is focused;
- endpoints and transit nodes are highlighted;
- unrelated context dims;
- clearing focus restores topology context but keeps telemetry warning styles.

### Use Case: Routing Adjacency Health

Metrics:

```text
topoviewer_bgp_session_up{node_id,peer,site} 0|1
topoviewer_isis_adjacency_up{node_id,peer,site} 0|1
topoviewer_ospf_neighbor_up{node_id,peer,site} 0|1
```

Expected behavior:

- affected nodes show `BGP`, `ISIS`, or `OSPF` badges;
- matching peer links are highlighted when present;
- protocol overlays can be toggled independently from the weathermap overlay.

### Documentation Workflow

Docs must cover:

1. Author topology in the browser harness.
2. Promote it into the canonical harness fixture catalog.
3. Validate topology YAML and stylesheet YAML.
4. Build the Grafana panel package.
5. Start local Grafana/Prometheus/Containerlab lab.
6. Sync harness fixtures into generated Grafana lab projections.
7. Select the fixture in Grafana.
8. Map TopoViewer object IDs/labels to Prometheus labels.
9. Inject telemetry scenario.
10. Confirm Prometheus stores the change.
11. Confirm Grafana query frames carry the data.
12. Confirm TopoViewer visual state changes.
13. Interact with the panel: pan, zoom, select, focus, drag, refresh, reset.

### Object Identity Mapping

Prefer stable IDs:

```text
node_id -> graph.nodes[].id
link_id -> graph.links[].id
path_id -> graph.paths[].id
region_id -> graph.regions[].id
```

Allow label matching for inventory dimensions:

```text
site, pod, rack, role, service, tenant
```

### Acceptance

- Each use case has a docs page or section with metrics, PromQL, visual changes,
  user interactions, and validation steps.
- Troubleshooting covers version mismatch, missing fixture, missing telemetry
  labels, no telemetry update, stale refresh, and lab startup failure.
