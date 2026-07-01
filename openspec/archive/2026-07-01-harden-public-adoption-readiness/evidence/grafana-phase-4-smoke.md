# Grafana Phase 4 Smoke Evidence

Date: 2026-06-30

## Commands

Port `3000` was already in use, so the disposable lab was run on explicit alternate localhost ports:

```bash
GRAFANA_HTTP_PORT=3001 PROMETHEUS_HTTP_PORT=9091 TELEMETRY_INJECTOR_HTTP_PORT=9109 npm run grafana:lab:up
GRAFANA_URL=http://127.0.0.1:3001 TELEMETRY_INJECTOR_URL=http://127.0.0.1:9109 npm run grafana:lab:smoke:phase4
GRAFANA_HTTP_PORT=3001 PROMETHEUS_HTTP_PORT=9091 TELEMETRY_INJECTOR_HTTP_PORT=9109 npm run grafana:lab:down
```

## Result

Phase 4 smoke passed against mounted `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml` bundles without fixture catalog edits or fixture sync.

## Captured Local Artifacts

Generated under `.artifacts/grafana-phase-4/`:

- `mounted-bundle-selection.png`
- `mapping-coverage.png`
- `mapper-diagnostics-promql.png`
- `mounted-bundles.png`
- `telemetry-overlay-link-failure.png`

These are local review artifacts and are intentionally not checked into git.
