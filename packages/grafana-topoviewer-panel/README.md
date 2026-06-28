# Grafana TopoViewer Panel

Grafana panel plugin for embedding the shared TopoViewer runtime without
renderer forks or Grafana-owned topology YAML copies.

Phase 1 renders canonical browser harness fixtures inside a pinned local
Grafana lab. Phase 2 adds a local Prometheus weathermap slice. Phase 3 adds
local interaction-state persistence for viewport, selection, and node drag
overrides. Phase 4 adds mounted Topology-as-Code bundles plus mapper-driven
runtime overlays. Plugin signing, Containerlab, and supported release packaging
remain later phases.

## Commands

```bash
npm run grafana:fixtures:check
npm run grafana:injector:test
npm run grafana:panel:test
npm run grafana:panel:build
```

The build uses Webpack because Grafana panel plugins load AMD modules. Vite ESM
output is not sufficient for the Grafana plugin loader. The build also compiles
the Go backend binary `gpx_topoviewer-panel`, which serves mounted bundle YAML
to the browser panel through Grafana resource endpoints.

## Why TopoViewer In Grafana

TopoViewer is a topology-as-code panel, not an SVG-first graphics panel. The
happy path starts from topology identity and relationships:

```text
topology.yaml + stylesheet.yaml + mapper.yaml
  -> Grafana data frames
  -> runtime overlays on nodes, links, paths, regions, layers, or graph state
```

That is intentionally different from workflows where a separate drawing asset is
created first and telemetry is later attached to graphics-layer element IDs. For
network and service topology, object identity already exists in the graph:
`node_id`, `link_id`, `path_id`, `region_id`, labels, data fields, layers, and
selectors. The mapper uses those topology-native identities, so the operator can
audit why a metric matched, failed to match, or matched ambiguously.

The goal is less panel-side glue:

- author topology and visual policy in the TopoViewer harness or YAML;
- mount bundles into Grafana without fixture sync or plugin rebuilds;
- bind telemetry with schema-backed `*.mapper.tv.yaml`;
- inspect mapping coverage before trusting the visual state;
- keep telemetry overlays runtime-only instead of rewriting source YAML.

## Source Modes

The panel supports two topology sources:

- `mountedBundle`: production-shaped workflow. Grafana mounts one bundle root
  and the plugin backend discovers one or more bundle directories.
- `fixture`: demo and regression workflow. The panel renders generated harness
  fixtures bundled into the frontend.

Mounted bundles live under `/etc/topoviewer/bundles` by default:

```text
/etc/topoviewer/bundles/
  branch-core/
    branch-core.topo.tv.yaml
    branch-core.style.tv.yaml
    branch-core.mapper.tv.yaml
```

Every complete bundle directory must contain exactly one file for each suffix:

- `*.topo.tv.yaml`
- `*.style.tv.yaml`
- `*.mapper.tv.yaml`

If a directory needs explicit file selection, set the optional panel option
`mountedBundle.manifestPath` to a manifest under the mounted bundle root:

```yaml
version: "0.1"
bundles:
  - id: branch-core
    name: Branch Core
    topology: branch-core/branch-core.topo.tv.yaml
    stylesheet: branch-core/branch-core.style.tv.yaml
    mapper: branch-core/branch-core.mapper.tv.yaml
```

Without a manifest, bundle discovery is intentionally strict. Missing or
duplicate suffix files produce source diagnostics instead of guessing.

The Docker Compose mount shape is:

```yaml
services:
  grafana:
    volumes:
      - ./topoviewer-bundles:/etc/topoviewer/bundles:ro
    environment:
      TOPOVIEWER_BUNDLE_ROOT: /etc/topoviewer/bundles
```

The mapper file is the explicit telemetry binding artifact. It maps Grafana
data-frame metrics to TopoViewer objects without mutating topology or
stylesheet YAML.

Supported target kinds are:

- `node`
- `link`
- `path`
- `region`
- `layer`
- `graph`

Supported resolver modes are:

- `id`
- `label`
- `data`
- `endpoint`
- `selector`
- `aggregate`
- `staticObjectIds`

Example:

```yaml
version: 1
identity:
  sourceId: branch-core
  sourceIdLabel: source_id
mappings:
  - id: link-utilization
    metric: interface_utilization_percent
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

Mapper overlays are controlled schema-backed configuration rather than
arbitrary JavaScript. The schema is exported as:

```text
topoviewer/schemas/topoviewer-mapper.schema.json
```

The browser/VS Code YAML intelligence path has mapper key and value suggestions
for target kinds, resolver modes, object IDs, metric labels, thresholds, and
overlay modes.

When telemetry is enabled, the panel shows mapper coverage and diagnostics:

- samples resolved by mapper rules;
- unresolved telemetry;
- ambiguous endpoint matches;
- duplicate object mappings;
- PromQL starter queries derived from the mapper.

Source diagnostics are separated from telemetry diagnostics. YAML parse errors
include the document label and line/column when the parser provides them.
Mapper schema diagnostics include the mapper path, such as
`mappings[0].target.kind`, so the author can correct the bundle in the harness
or editor.

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
npm run grafana:lab:smoke:phase4
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

The mounted bundle dashboard is:

```text
http://127.0.0.1:3000/d/topoviewer-phase-4/topoviewer-phase-4-mounted-bundles
```

Mounted-bundle telemetry uses the selected `*.mapper.tv.yaml`. Fixture
dashboards keep the older built-in `topoviewer_link_*` compatibility path for
demo and regression coverage. Canonical topology YAML and stylesheet YAML stay
immutable; telemetry is applied as a transient TopoViewer extension.

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
