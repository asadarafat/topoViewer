## Phase 1: Panel Package And Harness Fixture Parity

### Goal

Create the Grafana panel package and prove it renders canonical TopoViewer
harness fixtures without duplicating topology or stylesheet YAML.

### Proposed Files

```text
packages/grafana-topoviewer-panel/
  package.json
  plugin.json
  webpack.config.cjs
  scripts/build-plugin.mjs
  src/module.ts
  src/TopoViewerPanel.tsx
  src/panelOptions.ts
  src/harnessFixtureCatalog.ts
  src/runtimeModel.ts
  src/types.ts
  src/generated/harnessFixtures.ts
  tests/harnessFixtureCatalog.test.ts
  tests/panelOptions.test.ts
  tests/runtimeModel.test.ts
```

Grafana loads panel plugin modules as AMD bundles. Phase 1 should use a
Grafana-compatible Webpack build instead of a Vite/Rolldown ESM build.

### Fixture Discovery

`harnessFixtureCatalog.ts` must match browser harness discovery semantics from
`packages/vscode-topoviewer/vite.harness.config.ts`:

- read `packages/topoviewer/content/examples/catalog.yaml`;
- include only examples with `harness:` metadata;
- use `harness.id || example.id`;
- use `harness.name || example.title`;
- use `harness.order ?? Number.MAX_SAFE_INTEGER`;
- resolve `sourceFiles`, `sourcePath`, and `path` safely inside
  `packages/topoviewer/content/examples`;
- reject duplicate fixture IDs;
- sort by order, name, then ID.

### Fixture Projection

Add generated TypeScript fixture projection only:

```text
scripts/lib/grafana-harness-fixtures.mjs
scripts/sync-grafana-harness-fixtures.mjs
scripts/check-grafana-harness-fixtures.mjs
packages/grafana-topoviewer-panel/src/generated/harnessFixtures.ts
```

The generated module embeds fixture metadata plus topology and stylesheet YAML
strings. Generated files are derived from canonical content. They are not the
source of truth.

### Local Lab

Add a pinned Grafana-only lab:

```text
labs/grafana-topoviewer/
  .env
  docker-compose.yml
  grafana/provisioning/dashboards/dashboards.yaml
  grafana/dashboards/topoviewer-phase-1.json
  scripts/check-port.mjs
  scripts/check-versions.mjs
  scripts/up.sh
  scripts/down.sh
  scripts/smoke-grafana-phase-1.mjs
```

Phase 1 must not add Prometheus, telemetry injectors, or Containerlab. Those
belong in Phase 2.

### Root Commands

```json
{
  "grafana:fixtures:sync": "node scripts/sync-grafana-harness-fixtures.mjs",
  "grafana:fixtures:check": "node scripts/check-grafana-harness-fixtures.mjs",
  "grafana:panel:build": "npm --workspace grafana-topoviewer-panel run build",
  "grafana:panel:test": "npm --workspace grafana-topoviewer-panel run test",
  "grafana:lab:up": "bash labs/grafana-topoviewer/scripts/up.sh",
  "grafana:lab:down": "bash labs/grafana-topoviewer/scripts/down.sh",
  "grafana:lab:smoke:phase1": "node labs/grafana-topoviewer/scripts/smoke-grafana-phase-1.mjs"
}
```

### Acceptance

- All canonical harness fixtures are listed.
- The generated Grafana fixture index contains every harness fixture.
- No Grafana-owned checked-in topology or stylesheet YAML exists for harness
  fixtures.
- The panel renders each fixture without blocking diagnostics.
- Object counts and layer availability match the TopoViewer compiled result.
- Smoke tests cover all fixtures for load/parsing, but detailed visual
  assertions may start with `layered-network` and `clos-2spine-4leaf`.
