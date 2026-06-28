# TopoViewer Grafana Lab

This lab starts pinned Grafana, Prometheus, and a deterministic telemetry
injector. Grafana mounts the local exploratory TopoViewer panel plugin from
`packages/grafana-topoviewer-panel/dist`.

Phase 1 proves fixture parity. Phase 2 proves a local Prometheus weathermap
vertical slice. Phase 4 proves the production workflow: TopoViewer YAML bundles
mounted into Grafana and selected by the panel backend. Containerlab is
intentionally not part of this lab yet; it belongs to a later phase after the
panel, mapper, data-frame mapping, and interaction contract are stable.

## Run

```bash
npm run grafana:lab:up
npm run grafana:lab:smoke:phase1
npm run grafana:lab:smoke:phase2
npm run grafana:lab:smoke:phase4
npm run grafana:lab:down
```

The lab defaults to:

- Grafana: `http://127.0.0.1:3000`
- Phase 1 dashboard: `http://127.0.0.1:3000/d/topoviewer-phase-1/topoviewer-phase-1`
- Phase 2 dashboard: `http://127.0.0.1:3000/d/topoviewer-phase-2/topoviewer-phase-2-weathermap`
- Phase 4 dashboard: `http://127.0.0.1:3000/d/topoviewer-phase-4/topoviewer-phase-4-mounted-bundles`
- Prometheus: `http://127.0.0.1:9090`
- Telemetry injector: `http://127.0.0.1:9108/scenario`

If the port is busy:

```bash
GRAFANA_HTTP_PORT=3001 PROMETHEUS_HTTP_PORT=9091 TELEMETRY_INJECTOR_HTTP_PORT=9109 npm run grafana:lab:up
GRAFANA_URL=http://127.0.0.1:3001 npm run grafana:lab:smoke:phase1
GRAFANA_URL=http://127.0.0.1:3001 PROMETHEUS_URL=http://127.0.0.1:9091 TELEMETRY_INJECTOR_URL=http://127.0.0.1:9109 npm run grafana:lab:smoke:phase2
GRAFANA_URL=http://127.0.0.1:3001 npm run grafana:lab:smoke:phase4
```

The smoke test iterates every canonical harness fixture and captures detailed
screenshots for `layered-network` and `clos-2spine-4leaf` under
`.artifacts/grafana-phase-1/`.

## Telemetry Scenarios

```bash
npm run grafana:lab:inject -- healthy
npm run grafana:lab:inject -- high-utilization
npm run grafana:lab:inject -- link-failure
```

The injector exports these Prometheus metrics:

- `topoviewer_link_up`
- `topoviewer_link_utilization_percent`
- `topoviewer_link_rx_bps`
- `topoviewer_link_tx_bps`
- `topoviewer_link_errors_total`
- `topoviewer_metric_timestamp_seconds`

Every metric carries `fixture_id`, `link_id`, `source`, `target`, `site`, and
`pod`. Fixture dashboards use the built-in compatibility mapper. Mounted-bundle
dashboards use the selected bundle's `*.mapper.tv.yaml`, so a metric can target
nodes, links, paths, regions, layers, or the whole graph through explicit
resolver rules.

## Mounted Bundle Workflow

The production-shaped workflow is:

1. Author topology and stylesheet YAML in the browser harness or VS Code.
2. Author the mapper YAML that joins telemetry labels to topology objects.
3. Save each topology as one bundle directory containing:
   - `*.topo.tv.yaml`
   - `*.style.tv.yaml`
   - `*.mapper.tv.yaml`
4. Mount the bundle root into Grafana at `/etc/topoviewer/bundles`.
5. Select the bundle in the TopoViewer panel.
6. Wire Prometheus queries to the panel.
7. Inject scenarios and verify mapped objects change through runtime overlays.
8. Open the mapper status details in the panel to inspect coverage,
   diagnostics, and PromQL starters.

Mapper rules are intentionally explicit. A typical link rule looks like:

```yaml
version: 1
identity:
  sourceId: layered-network
  sourceIdLabel: fixture_id
palette:
  success:
    color: "#4caf50"
    accent: "#2e7d32"
  info:
    color: "#42a5f5"
    accent: "#1976d2"
  warning:
    color: "#ff9800"
    accent: "#ed6c02"
  error:
    color: "#d32f2f"
    accent: "#c62828"
mappings:
  - id: link-utilization
    metric: topoviewer_link_utilization_percent
    target:
      kind: link
      resolve:
        by: id
        metricLabel: link_id
    value:
      as: utilizationPercent
    thresholds:
      info: 50
      warning: 80
      error: 90
    overlay:
      lineColorBySeverity: true
      lineWidthBySeverity: true
      statusMarker: true
      outlineBySeverity: true
      label: "{{ value | round }}%"
```

The mapper does not rewrite topology YAML or stylesheet YAML. It behaves like a
Grafana display policy: telemetry samples are evaluated against mapper rules,
then TopoViewer receives runtime overlays for the matched objects. Keep the
normal shape, icon, label, and base color policy in `*.style.tv.yaml`; keep
telemetry thresholds, severity colors, and operational overlays in
`*.mapper.tv.yaml`.

To manually test a color change, edit the `palette.error.color` value in the
mounted mapper file, refresh the Phase 4 dashboard or switch the bundle selector
away and back, and inject a high-utilization or link-failure scenario.

Use precise IDs for direct joins (`node_id`, `link_id`, `path_id`,
`region_id`) and labels/data keys for grouping or inventory joins.

The panel coverage line answers the first operational debugging question:

```text
Mapper coverage: resolved/source-matched samples · objects overlaid · unresolved · ambiguous · duplicate
```

If endpoint matching is ambiguous, add a stable object ID label such as
`link_id`. If no samples match, compare the mapper `metric` values with the
Grafana query frame names and Prometheus metric names.

This lab mounts:

```text
labs/grafana-topoviewer/topoviewer-bundles/
  layered-network/
    layered-network.topo.tv.yaml
    layered-network.style.tv.yaml
    layered-network.mapper.tv.yaml
  clos-2spine-4leaf/
    clos-2spine-4leaf.topo.tv.yaml
    clos-2spine-4leaf.style.tv.yaml
    clos-2spine-4leaf.mapper.tv.yaml
```

The Docker Compose mount is:

```yaml
volumes:
  - ./topoviewer-bundles:/etc/topoviewer/bundles:ro
```

For production-shaped tests with explicit bundle paths, set the panel option
`mountedBundle.manifestPath` to a manifest file under `/etc/topoviewer/bundles`.
The manifest can name each bundle and point to the exact topology, stylesheet,
and mapper files. If no manifest is configured, the plugin uses strict suffix
discovery and requires exactly one `*.topo.tv.yaml`, one `*.style.tv.yaml`, and
one `*.mapper.tv.yaml` per bundle directory.

The old generated fixture flow remains useful for demo parity and regression
tests. It is not the intended production workflow for user-provided topology.

If the topology renders but no telemetry appears, check:

- Prometheus target status for `telemetry-injector:9108`;
- the identity label in `*.mapper.tv.yaml` matches the selected bundle;
- the mapper metric name matches the Grafana query output;
- the resolver label, such as `link_id`, matches a TopoViewer object ID;
- Grafana query mode is instant or refresh has elapsed long enough for a scrape.
