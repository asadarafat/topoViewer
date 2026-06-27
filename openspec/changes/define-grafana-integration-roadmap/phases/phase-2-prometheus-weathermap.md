## Phase 2: Prometheus Weathermap Vertical Slice

### Goal

Prove the real telemetry path:

```text
telemetry injector -> Prometheus -> Grafana data source -> Grafana data frames
  -> TopoViewer telemetry rules -> rendered link state
```

Static Prometheus frame JSON is allowed for unit tests, but not enough for this
phase to pass.

### Version Pins

```text
Grafana OSS: grafana/grafana:13.1.0
Prometheus: prom/prometheus:v3.5.0
```

`check-versions.mjs` must reject `latest`, unversioned images, and floating
major/minor tags. Smoke tests must verify the running Grafana and Prometheus
versions through their health/build APIs.

### Proposed Files

```text
labs/grafana-topoviewer/
  .env
  docker-compose.yml
  prometheus/prometheus.yml
  prometheus/rules/topoviewer-lab.yml
  telemetry-injector/package.json
  telemetry-injector/src/server.ts
  telemetry-injector/src/scenarios.ts
  telemetry-injector/src/metrics.ts
  telemetry-injector/tests/scenarios.test.ts
  scripts/check-versions.mjs
  scripts/inject-telemetry.mjs
  scripts/smoke-grafana.mjs

packages/grafana-topoviewer-panel/
  src/telemetryRules.ts
  src/stateOverlayAdapter.ts
  tests/telemetryRules.test.ts
  tests/stateOverlayAdapter.test.ts
```

### Injector API

```text
GET  /health
GET  /metrics
POST /scenario/healthy
POST /scenario/link-failure
POST /metric
```

### Initial Metrics

```text
topoviewer_link_up{link_id,source,target,site,pod} 0|1
topoviewer_link_utilization_percent{link_id,source,target,site,pod} number
topoviewer_link_rx_bps{link_id,source,target,site,pod} number
topoviewer_link_tx_bps{link_id,source,target,site,pod} number
topoviewer_link_errors_total{link_id,source,target,site,pod} counter
```

### Weathermap Behavior

Link utilization maps to visual state:

- `< 50`: success green;
- `50-79`: primary/info blue;
- `80-89`: warning orange;
- `>= 90`: error red;
- down: red dashed line with stronger width.

Interaction:

- hover link shows source, target, utilization, bps, errors, and timestamp;
- click link focuses the link and endpoints;
- click endpoint node highlights incident links;
- dashboard variables filter by site, pod, severity, or minimum utilization;
- dragging nodes does not break metric matching.

### Acceptance

- `link-failure` injector scenario changes a Prometheus metric.
- Grafana query sees the changed metric after scrape/refresh.
- TopoViewer panel updates the matching link color/width/style.
- Returning to `healthy` restores normal link style.
- The first full visual assertions run on `layered-network` and
  `clos-2spine-4leaf`.
- All harness fixtures still load after telemetry support is enabled.
