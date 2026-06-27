## Phase 1: Panel Package And Harness Fixture Parity

### Goal

Create the Grafana panel package and prove it renders canonical TopoViewer
harness fixtures without duplicating topology or stylesheet YAML.

### Proposed Files

```text
packages/grafana-topoviewer-panel/
  package.json
  plugin.json
  src/module.ts
  src/TopoViewerPanel.tsx
  src/panelOptions.ts
  src/dataFrameAdapter.ts
  src/harnessFixtureCatalog.ts
  src/runtimeModel.ts
  src/types.ts
  tests/dataFrameAdapter.test.ts
  tests/harnessFixtureCatalog.test.ts
  tests/panelOptions.test.ts
```

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

### Local Lab Projection

Add generated fixture projection only:

```text
labs/grafana-topoviewer/
  data/generated/fixtures/index.json
  data/generated/fixtures/<fixture-id>/topology.yaml
  data/generated/fixtures/<fixture-id>/stylesheet.yaml
  scripts/list-harness-fixtures.mjs
  scripts/sync-harness-fixtures.mjs
```

Generated files are derived from canonical content. They are not the source of
truth.

### Root Commands

```json
{
  "grafana:panel:build": "npm --workspace grafana-topoviewer-panel run build",
  "grafana:lab:list-fixtures": "node labs/grafana-topoviewer/scripts/list-harness-fixtures.mjs",
  "grafana:lab:sync-fixtures": "node labs/grafana-topoviewer/scripts/sync-harness-fixtures.mjs"
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
