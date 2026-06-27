# TopoViewer Grafana Lab

This lab starts pinned Grafana, Prometheus, and a deterministic telemetry
injector. Grafana mounts the local exploratory TopoViewer panel plugin from
`packages/grafana-topoviewer-panel/dist`.

Phase 1 proves fixture parity. Phase 2 proves a local Prometheus weathermap
vertical slice. Containerlab is intentionally not part of this lab yet; it
belongs to a later phase after the panel, data-frame mapping, and interaction
contract are stable.

## Run

```bash
npm run grafana:lab:up
npm run grafana:lab:smoke:phase1
npm run grafana:lab:smoke:phase2
npm run grafana:lab:down
```

The lab defaults to:

- Grafana: `http://127.0.0.1:3000`
- Phase 1 dashboard: `http://127.0.0.1:3000/d/topoviewer-phase-1/topoviewer-phase-1`
- Phase 2 dashboard: `http://127.0.0.1:3000/d/topoviewer-phase-2/topoviewer-phase-2-weathermap`
- Prometheus: `http://127.0.0.1:9090`
- Telemetry injector: `http://127.0.0.1:9108/scenario`

If the port is busy:

```bash
GRAFANA_HTTP_PORT=3001 PROMETHEUS_HTTP_PORT=9091 TELEMETRY_INJECTOR_HTTP_PORT=9109 npm run grafana:lab:up
GRAFANA_URL=http://127.0.0.1:3001 npm run grafana:lab:smoke:phase1
GRAFANA_URL=http://127.0.0.1:3001 PROMETHEUS_URL=http://127.0.0.1:9091 TELEMETRY_INJECTOR_URL=http://127.0.0.1:9109 npm run grafana:lab:smoke:phase2
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
`pod`. The panel maps `link_id` to TopoViewer links first, then falls back to
`source` and `target`.

The expected authoring workflow is:

1. Author topology and stylesheet YAML in the browser harness or VS Code.
2. Keep link IDs stable for telemetry joins.
3. Promote the topology to canonical harness content.
4. Run `npm run grafana:fixtures:sync`.
5. Start the local lab.
6. Wire Prometheus queries to the TopoViewer panel.
7. Inject scenarios and verify link color, width, style, label, and endpoint
   status changes.

If the topology renders but no telemetry appears, check:

- Prometheus target status for `telemetry-injector:9108`;
- the `fixture_id` label matches the selected panel fixture;
- `link_id` matches a TopoViewer link ID;
- Grafana query mode is instant or refresh has elapsed long enough for a scrape.
