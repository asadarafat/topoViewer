## Design

### Scope

Phase 1 answers one question: can Grafana embed TopoViewer and render the same
canonical harness fixtures as the browser harness?

```text
canonical harness fixture catalog
  -> generated Grafana panel fixture projection
  -> Grafana panel fixture selector
  -> TopoViewer React runtime
  -> local Grafana smoke screenshots
```

No telemetry is included in this phase.

### Phase Handoff

When Phase 1 passes:

1. Archive `openspec/changes/implement-grafana-panel-phase-1`.
2. Create `openspec/changes/implement-grafana-panel-phase-2`.
3. Use `define-grafana-integration-roadmap/phases/phase-2-prometheus-weathermap.md`
   as the starting point for Phase 2.
4. Update `define-grafana-integration-roadmap` only if Phase 1 changed the
   roadmap, acceptance boundary, fixture strategy, or Grafana package/lab
   assumptions.

Phase 1 should not quietly absorb Phase 2 work. If Prometheus, telemetry rules,
or Containerlab become necessary, stop and promote that work into the Phase 2
OpenSpec.

### Package Shape

```text
packages/grafana-topoviewer-panel/
  package.json
  plugin.json
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

The package should import `TopoViewer` and shared CSS from the workspace
`topoviewer` package. Grafana-specific code stays in this package.

### Fixture Discovery

`harnessFixtureCatalog.ts` must match the browser harness loader in
`packages/vscode-topoviewer/vite.harness.config.ts`:

- read `packages/topoviewer/content/examples/catalog.yaml`;
- include only examples with `harness:` metadata;
- use `harness.id || example.id` as fixture ID;
- use `harness.name || example.title` as fixture display name;
- use `harness.order ?? Number.MAX_SAFE_INTEGER` as order;
- resolve `sourceFiles.topology`, `sourceFiles.stylesheet`, `sourcePath`, and
  `path` the same way as the browser harness;
- reject duplicate fixture IDs;
- reject paths outside `packages/topoviewer/content/examples`;
- sort by order, then name, then ID.

Initial required fixture IDs:

```text
layered-network
clos-2spine-4leaf
insert-workflow
attention-workflow
inspector-workflow
dense-links
```

### Fixture Projection

Phase 1 should generate a panel-consumable TypeScript module:

```text
packages/grafana-topoviewer-panel/src/generated/harnessFixtures.ts
```

The generated module contains fixture metadata plus topology and stylesheet
YAML strings. This keeps the Phase 1 panel self-contained and avoids needing a
static data service before telemetry work begins.

The generator must be deterministic and checkable:

```text
scripts/sync-grafana-harness-fixtures.mjs
scripts/check-grafana-harness-fixtures.mjs
```

The generated module is a projection, not a new source of truth. Canonical YAML
stays under `packages/topoviewer/content/examples/**`.

### Panel Options

Minimum panel options:

```ts
interface TopoViewerGrafanaPanelOptions {
  fixtureId: string;
  themeMode?: 'auto' | 'light' | 'dark';
  showControls?: boolean;
  controlsOpen?: boolean;
}
```

Default fixture: `layered-network`.

If `fixtureId` is missing or invalid, the panel should render a diagnostic with
the available fixture IDs.

### Runtime Model

`runtimeModel.ts` converts panel options and selected fixture into TopoViewer
runtime props:

```text
panel options
  -> selected generated fixture
  -> topology YAML string
  -> stylesheet YAML string
  -> TopoViewer props
```

The panel should not parse or mutate topology YAML directly unless the existing
TopoViewer runtime API requires it.

### Local Grafana Lab

Phase 1 uses pinned Grafana only:

```text
labs/grafana-topoviewer/
  .env
  docker-compose.yml
  grafana/provisioning/dashboards/dashboards.yaml
  grafana/dashboards/topoviewer-phase-1.json
  scripts/up.sh
  scripts/down.sh
  scripts/check-versions.mjs
  scripts/smoke-grafana-phase-1.mjs
```

Pin:

```dotenv
GRAFANA_VERSION=13.1.0
GRAFANA_IMAGE=grafana/grafana:${GRAFANA_VERSION}
GRAFANA_HTTP_PORT=3000
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin
```

No Prometheus service in Phase 1.

### Root Scripts

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

Grafana lab commands are local-only in Phase 1. Do not add Docker-dependent
commands to default `npm run ci`.

### Validation

Phase 1 validation has two levels:

1. Fast repo checks:
   - fixture generator check;
   - panel unit tests;
   - panel package build.
2. Local Grafana smoke:
   - start pinned Grafana;
   - open provisioned dashboard;
   - iterate every harness fixture in the panel selector;
   - verify no blocking diagnostics;
   - capture detailed screenshots for `layered-network` and
     `clos-2spine-4leaf`;
   - write artifacts under `.artifacts/grafana-phase-1/`.

### Acceptance

- Phase 1 does not introduce Grafana-owned topology YAML copies.
- Every canonical harness fixture appears in the Grafana panel selector.
- Every canonical harness fixture renders without blocking diagnostics.
- `layered-network` and `clos-2spine-4leaf` have local Grafana smoke
  screenshots.
- Public docs still mark Grafana as exploratory.
