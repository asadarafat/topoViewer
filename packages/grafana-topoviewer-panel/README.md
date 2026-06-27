# Grafana TopoViewer Panel

Exploratory Grafana panel plugin for proving that Grafana can embed the shared
TopoViewer runtime without renderer forks or Grafana-owned topology YAML copies.

Phase 1 renders canonical browser harness fixtures inside a pinned local Grafana
lab. Phase 2 adds a local Prometheus weathermap slice where deterministic link
metrics style TopoViewer links and endpoint status markers at runtime. Phase 3
adds local interaction-state persistence for viewport, selection, and node drag
overrides. Plugin signing, Containerlab, and supported release packaging remain
later phases.

## Commands

```bash
npm run grafana:fixtures:check
npm run grafana:injector:test
npm run grafana:panel:test
npm run grafana:panel:build
```

The build uses Webpack because Grafana panel plugins load AMD modules. Vite ESM
output is not sufficient for the Grafana plugin loader.

## Fixture Source

Fixtures are generated from:

```text
packages/topoviewer/content/examples/catalog.yaml
packages/topoviewer/content/examples/**
```

The generated module lives at:

```text
packages/grafana-topoviewer-panel/src/generated/harnessFixtures.ts
```

Regenerate after canonical example changes:

```bash
npm run grafana:fixtures:sync
```

## Local Grafana

Start the pinned Grafana lab:

```bash
npm run grafana:lab:up
```

Run the smoke tests:

```bash
npm run grafana:lab:smoke:phase1
npm run grafana:lab:smoke:phase2
```

Inject a telemetry scenario:

```bash
npm run grafana:lab:inject -- healthy
npm run grafana:lab:inject -- high-utilization
npm run grafana:lab:inject -- link-failure
```

The Phase 2 dashboard is:

```text
http://127.0.0.1:3000/d/topoviewer-phase-2/topoviewer-phase-2-weathermap
```

The panel maps Prometheus labels to TopoViewer links using `link_id` first, then
`source` and `target` as a fallback. Canonical topology YAML and stylesheet YAML
stay immutable; telemetry is applied as a transient TopoViewer extension.

## Interaction State

The panel can persist runtime interaction state locally:

- viewport pan/zoom;
- selected and focused objects;
- local node position overrides from dragging;
- reset of local node position overrides.

This state is keyed by fixture and graph ID. It is stored in session or browser
storage depending on panel options. It is not written back to topology YAML,
stylesheet YAML, or Grafana dashboard JSON.

Stop the lab:

```bash
npm run grafana:lab:down
```

If port `3000` is already used:

```bash
GRAFANA_HTTP_PORT=3001 npm run grafana:lab:up
GRAFANA_URL=http://127.0.0.1:3001 npm run grafana:lab:smoke:phase1
GRAFANA_URL=http://127.0.0.1:3001 PROMETHEUS_URL=http://127.0.0.1:9090 TELEMETRY_INJECTOR_URL=http://127.0.0.1:9108 npm run grafana:lab:smoke:phase2
```
