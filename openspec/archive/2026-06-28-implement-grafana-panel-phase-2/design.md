# Design

## Phase Boundary

Phase 2 answers one question: can live Prometheus telemetry drive TopoViewer
visual state inside Grafana?

```text
canonical harness fixture
  -> Grafana panel
  -> Prometheus query data frame
  -> telemetry overlay rules
  -> TopoViewer rendered link and endpoint state
```

The phase should not solve every operational dashboard. It should prove the
first real data path with one high-value use case: network weathermap.

## Local Lab

Extend the existing `labs/grafana-topoviewer` lab:

```text
labs/grafana-topoviewer/
  .env
  docker-compose.yml
  grafana/provisioning/datasources/prometheus.yaml
  grafana/dashboards/topoviewer-phase-2.json
  prometheus/prometheus.yml
  telemetry-injector/package.json
  telemetry-injector/src/server.mjs
  telemetry-injector/src/scenarios.mjs
  telemetry-injector/src/metrics.mjs
  telemetry-injector/tests/scenarios.test.mjs
  scripts/inject-telemetry.mjs
  scripts/smoke-grafana-phase-2.mjs
```

Version pins:

```text
Grafana OSS: grafana/grafana:13.1.0
Prometheus: prom/prometheus:v3.5.0
Telemetry injector runtime: node:24.12.0-bookworm-slim, or an equally exact
Node 24 image tag that exists in Docker Hub
```

The existing version check must reject `latest`, unversioned tags, and floating
major/minor tags for every lab container. Smoke tests must verify the running
Grafana and Prometheus versions through their health/build APIs.

## Telemetry Injector

The injector should be deterministic and small. It should expose:

```text
GET  /health
GET  /metrics
GET  /scenario
POST /scenario/healthy
POST /scenario/high-utilization
POST /scenario/link-failure
POST /metric
```

Initial metrics:

```text
topoviewer_link_up{link_id,source,target,site,pod,fixture_id} 0|1
topoviewer_link_utilization_percent{link_id,source,target,site,pod,fixture_id} number
topoviewer_link_rx_bps{link_id,source,target,site,pod,fixture_id} number
topoviewer_link_tx_bps{link_id,source,target,site,pod,fixture_id} number
topoviewer_link_errors_total{link_id,source,target,site,pod,fixture_id} counter
topoviewer_metric_timestamp_seconds{link_id,source,target,fixture_id} unix_seconds
```

The injector must include scenario data for at least:

- `layered-network`;
- `clos-2spine-4leaf`.

Other canonical harness fixtures may expose empty telemetry but must still load
without panel diagnostics.

## Grafana Panel Contract

Add explicit Phase 2 options:

```ts
interface TopoViewerGrafanaPanelOptions {
  fixtureId: string;
  themeMode?: 'auto' | 'light' | 'dark';
  showControls?: boolean;
  controlsOpen?: boolean;
  telemetry?: {
    enabled?: boolean;
    enabled?: boolean;
    infoPercent?: number;
    warningPercent?: number;
    errorPercent?: number;
  };
}
```

Grafana data frames are the runtime input; canonical topology YAML and
stylesheet YAML remain immutable. The initial field contract is intentionally
fixed to the injector metric names and labels to keep Phase 2 small and
testable. Configurable field names belong in a later phase only if real
dashboards need them.

## Overlay Adapter

Add panel-side adapter modules:

```text
packages/grafana-topoviewer-panel/src/telemetryFrames.ts
packages/grafana-topoviewer-panel/src/telemetryRules.ts
packages/grafana-topoviewer-panel/src/stateOverlayAdapter.ts
packages/grafana-topoviewer-panel/tests/telemetryFrames.test.ts
packages/grafana-topoviewer-panel/tests/telemetryRules.test.ts
packages/grafana-topoviewer-panel/tests/stateOverlayAdapter.test.ts
```

Responsibilities:

- read Grafana `PanelData.series`;
- normalize fields into `link_id`, `source`, `target`, utilization, up/down,
  throughput, errors, and timestamp;
- match metrics to TopoViewer links by `link_id` first, then by source/target
  fallback;
- generate runtime style overlays without writing back to topology YAML;
- preserve fixture selection and base topology rendering if telemetry is empty.

## Weathermap Rules

Initial link severity mapping:

| Condition | Visual Result |
| --- | --- |
| link down | red, dashed, wider line, endpoint status marker |
| utilization `< 50` | success green |
| utilization `50-79` | info blue |
| utilization `80-89` | warning orange |
| utilization `>= 90` | error red |

The overlay should update:

- `lineColor`;
- `lineWidth`;
- `lineStyle`;
- `lineDashPattern`;
- link label text or source/target labels;
- endpoint node status markers;
- optional focus/attention state for clicked incident links.

Use Material UI palette colors already used by the harness examples unless the
stylesheet explicitly overrides telemetry colors.

## Dashboard Behavior

The phase-2 dashboard should have:

- TopoViewer weathermap panels for `layered-network` and `clos-2spine-4leaf`;
- one Prometheus query panel for the raw link metrics;
- dashboard variables for `fixture_id`, `site`, `pod`, and severity;
- a short status text panel that shows active scenario and injector health.

The TopoViewer panel fixture selector must still list every canonical harness
fixture. The dashboard variable may default to `layered-network`, but switching
fixtures must not require Grafana-specific topology YAML.

## Interaction

Phase 2 interaction is runtime-only:

- hover link shows source, target, utilization, bps, errors, and timestamp;
- click link focuses that link and its endpoints;
- click endpoint node highlights incident degraded links;
- node drag remains usable during telemetry refresh but does not need to survive
  browser refresh until Phase 3.

Metric matching must use stable topology IDs and labels, not screen position, so
dragging a node cannot break telemetry mapping.

## Documentation

Add practical docs covering:

1. Author topology in the browser harness.
2. Ensure link IDs or source/target labels are stable.
3. Promote the topology to canonical harness content.
4. Generate Grafana fixture projection.
5. Start the local Grafana/Prometheus/injector lab.
6. Select the fixture in Grafana.
7. Inject healthy, high-utilization, and link-failure scenarios.
8. Observe TopoViewer link and endpoint visual changes.
9. Troubleshoot missing metrics, bad labels, stale scrape data, and empty data
   frames.

## Validation

Fast checks:

- unit tests for scenario generation;
- unit tests for frame parsing;
- unit tests for telemetry rule thresholds;
- unit tests for overlay generation;
- fixture projection check;
- panel build.

Local lab smoke:

- start Grafana, Prometheus, and injector;
- verify pinned running versions;
- verify Prometheus scrapes injector;
- verify Grafana data source query returns link metrics;
- render every canonical harness fixture;
- run `healthy`, `high-utilization`, and `link-failure` scenarios;
- assert visible style changes for `layered-network` and
  `clos-2spine-4leaf`;
- capture screenshots under `.artifacts/grafana-phase-2/`.

## Acceptance

- Real injector scenario changes Prometheus metrics.
- Grafana query sees the changed metric after scrape/refresh.
- TopoViewer panel updates matching link color, width, style, labels, and
  endpoint status.
- Returning to `healthy` restores normal weathermap state.
- All canonical harness fixtures still load without blocking diagnostics.
- Public docs still mark Grafana exploratory.

## Phase 2 Findings For Phase 3

Phase 2 proved the telemetry overlay should stay a transient TopoViewer
extension. That keeps authored topology and stylesheet YAML immutable while
Grafana refreshes data frames.

Phase 3 should persist only Grafana runtime state:

- viewport;
- selected objects;
- focus context;
- optional node position overrides;
- the currently selected fixture.

Telemetry-derived style must not be persisted as user-authored style. Otherwise
temporary Prometheus state could pollute canonical YAML or saved dashboards.
