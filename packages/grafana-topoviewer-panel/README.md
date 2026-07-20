# Grafana TopoViewer Panel

**Support status:** Experimental

Grafana panel plugin for embedding the shared TopoViewer runtime without
renderer forks or Grafana-owned topology YAML copies.

The current experimental surface supports mounted Topology-as-Code bundles,
mapper-driven runtime overlays, local interaction-state persistence, and a
checked-in Containerlab telemetry lab. Plugin signing and supported release
packaging remain future release work.

## Artifact Status

The local labs load an unsigned plugin build to make development fast. That is
not a public install artifact. Do not use lab settings such as anonymous Admin,
disabled login, or `allow_loading_unsigned_plugins` for an exposed Grafana
instance.

A reviewed installable artifact should include:

- a plugin zip built from a committed version;
- SHA-256 checksums for the zip and backend binaries;
- an SBOM or equivalent dependency inventory;
- release notes with support status, compatibility, known limitations, and
  migration notes;
- the exact Grafana version range validated for that artifact.

Current experimental compatibility:

| Item | Current validation |
|---|---|
| Grafana packages | `13.1.0` SDK packages in this workspace; `13.0.1` in the checked-in Containerlab runtime. |
| Node.js | Node.js 24 LTS for build and tests. |
| React runtime | React 18 through the plugin build dependencies. |
| TopoViewer runtime | Same workspace `topoviewer` package version as the panel build. |
| Signing status | Unsigned local lab builds only; signed public distribution is not claimed yet. |

## Commands

Containerlab telemetry lab:

```bash
npm run grafana:clab:up
npm run grafana:clab:smoke
npm run grafana:clab:down
```

Panel checks:

```bash
npm run grafana:panel:test
npm run grafana:panel:build
npm run grafana:fixtures:check
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

- author topology and visual policy in TopoViewer Studio or YAML;
- mount bundles into Grafana without fixture sync or plugin rebuilds;
- bind telemetry with schema-backed `*.mapper.tv.yaml`;
- inspect mapping coverage before trusting the visual state;
- keep telemetry overlays runtime-only instead of rewriting source YAML.

## Source Modes

The panel supports two topology sources:

- `mountedBundle`: production-shaped workflow. Grafana mounts one bundle root
  and the plugin backend discovers one or more bundle directories.
- `fixture`: demo and regression workflow. The panel renders generated example
  fixtures bundled into the frontend.

New panels default to `mountedBundle`. Legacy dashboards that only set
`fixtureId` keep using fixture mode so old demo dashboards do not break.

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

This is intentionally a runtime display policy. The static diagram contract
stays in `*.topo.tv.yaml` and `*.style.tv.yaml`; telemetry events/data frames
produce runtime overlays through `*.mapper.tv.yaml`. That mirrors Grafana's
threshold-style visualization model: data is not rewritten, but the panel
changes color, width, labels, badges, and markers according to current values.
The mapper can also behave like conditional runtime stylesheet rules:

```text
metric sample + TopoViewer selector + optional conditions -> style patch
```

Use this when the dashboard needs to change any supported TopoViewer object
style from telemetry, not only fault-management or link weathermap colors.

Supported target kinds are:

- `node`
- `link`
- `linkDirection`
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

Prefer `rules:` for hand-authored mapper YAML. The panel compiles rules into the
canonical mapper model internally.

```yaml
version: 1
identity:
  sourceId: branch-core
  sourceIdLabel: source_id
rules:
  - id: link-utilization
    metric: interface_utilization_percent
    select: link
    join: link_id
    value: percent
    states:
      busy: ">=70"
      saturated: ">=90"
    style:
      default:
        lineColor: "#4caf50"
        label: "{{ value | round }}%"
      busy:
        lineColor: "#ff9800"
        lineWidth: 4
      saturated:
        lineColor: "#d32f2f"
        lineWidth: 7
        label: "{{ state }} {{ value | round }}%"
```

For up/down state, the same shape stays short:

```yaml
rules:
  - id: link-state
    metric: link_up
    select: link
    join: link_id
    value: up
    states:
      down: "==0"
    style:
      default:
        label: UP
        lineColor: "#4caf50"
      down:
        label: DOWN
        lineColor: "#d32f2f"
        lineStyle: dashed
```

`select` can be an object kind such as `node` or `link`, or a TopoViewer
selector such as `node[labels.role = "pe"]`. `join` is the Grafana label that
carries the selected object ID. `states` maps values into names, and
`style.default` plus `style.<state>` apply runtime TopoViewer style patches.

Use canonical `mappings:` only when the compact form is not expressive enough,
for example label/data joins, endpoint joins, aggregate targets, or explicit
conditions. Canonical condition checks can test computed `severity`, the
selected metric `value`, a Grafana data-frame `label`, or a Grafana data-frame
`field`. Condition style patches use TopoViewer style keys and string values
may use templates such as `{{ value }}`, `{{ value | round }}`,
`{{ value | bps }}`, `{{ severity }}`, `{{ metric }}`, `{{ target.id }}`,
`{{ label.name }}`, and `{{ field.name }}`.

Directional links use the same compact mapper model, but the most ergonomic
join uses two stable telemetry labels: the parent `link_id` and the direction
key from the topology YAML.

```yaml
rules:
  - id: directional-bandwidth
    metric: interface_direction_bps
    select: linkDirection
    join:
      link: link_id
      direction: direction
    states:
      busy: ">=1000000000"
      saturated: ">=5000000000"
    style:
      default:
        label: "{{ value | bps }}"
        lineColor: "#4caf50"
        lineWidth: 4
      busy:
        lineColor: "#ff9800"
        lineWidth: 6
      saturated:
        label: "hot {{ value | bps }}"
        lineColor: "#d32f2f"
        lineWidth: 8
```

For this mapper, Prometheus samples should carry labels like
`link_id="Leaf-1-Spine-1"` and `direction="sourceToTarget"`.

A starter PromQL query for that rule is intentionally plain:

```promql
topoviewer_link_direction_utilization_percent{fixture_id="clos-2spine-4leaf"}
```

The panel reads the sample labels, resolves `link_id + direction` to a
`graph.links[].directions.*` object, and applies the matched style as a runtime
overlay. A mounted bundle can therefore show `sourceToTarget` as green while
`targetToSource` is orange, red, dashed, wider, or relabeled from telemetry
without duplicating the physical link in topology YAML.

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
- missing parent links for `linkDirection` telemetry;
- missing or unsupported direction keys;
- duplicate direction mappings;
- stale static object references;
- PromQL starter queries derived from the mapper.

Source diagnostics are separated from telemetry diagnostics. YAML parse errors
include the document label and line/column when the parser provides them.
Mapper schema diagnostics include the mapper path, such as
`mappings[0].target.kind`, so the author can correct the bundle in Studio or an
editor.

## Compatibility Fixture Source

Fixture mode is for bundled examples, demo dashboards, and regression tests. It
is not the production workflow for user-provided topology. Users should mount
`*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml` bundles instead of
editing the repo catalog, syncing fixtures, or rebuilding the plugin.

Fixtures are generated from:

```text
packages/topoviewer/content/examples/catalog.yaml
packages/topoviewer/content/examples/**
```

The generated module lives at:

```text
packages/grafana-topoviewer-panel/src/generated/demoFixtures.ts
```

Regenerate after canonical example changes:

```bash
npm run grafana:fixtures:sync
npm run grafana:fixtures:check
```

`npm run grafana:clab:up` does not run fixture sync or fixture checks. Those
checks stay explicit so the production-shaped mounted-bundle lab is not blocked
by development fixture drift.

## Containerlab Telemetry Lab

The Containerlab lab is the real-telemetry validation path. It starts a
two-spine, three-leaf SR Linux fabric, three Linux clients, gNMIc, Prometheus,
Grafana, Alloy, and Loki. Grafana mounts the local panel build and the checked-in
bundle root used by the mounted-bundle workflow.

This profile uses lab-only Grafana authentication defaults, unsigned plugin
loading, and host-published service ports. Run it only on a trusted local host
or a controlled lab host with firewall rules.

This lab is development and validation scaffolding only.
The lab permits unsigned plugin loading and anonymous Admin access; neither is
production configuration.

```text
/etc/topoviewer/bundles/st-clos/
  st-clos.topo.tv.yaml
  st-clos.style.tv.yaml
  st-clos.mapper.tv.yaml
```

Prometheus recording rules derive stable `topology`, `link_id`, and `direction`
labels from gNMIc metrics. The mapper applies those samples as runtime overlays
to links and link directions without putting lab-specific logic in the panel.

The lab configures a routed client path through the SR Linux fabric. Use these
commands to generate visible interface counter movement:

```bash
npm run grafana:clab:traffic:start
npm run grafana:clab:traffic:status
npm run grafana:clab:traffic:stop
```

Default URLs after startup:

```text
Grafana:    http://127.0.0.1:3000/d/network-telemetry-topoviewer/network-telemetry-topoviewer
Prometheus: http://127.0.0.1:9090
```

Artifacts from `npm run grafana:clab:smoke` are written to the ignored local
artifact directory for review.

### Upstream-Candidate Smoke

The checked-in lab follows the upstream streaming telemetry lab shape and adds
TopoViewer with the smallest useful delta. Prometheus recording rules provide
mapper-friendly labels without introducing a panel-specific telemetry service.

The production plugin contract is:

- release mode: unpack a pinned TopoViewer Grafana panel artifact into the
  lab's plugin install directory;
- development mode: symlink or copy a local `packages/grafana-topoviewer-panel/dist`
  build into the same directory.

An external lab patch must not vendor the plugin `dist` directory or hard-code
this monorepo's local path. After deploying that lab and starting traffic,
validate it with:

```bash
GRAFANA_URL=http://127.0.0.1:3000 \
PROMETHEUS_URL=http://127.0.0.1:9090 \
npm run grafana:clab:smoke:upstream
```

The smoke checks Grafana, plugin registration, mounted bundle discovery,
Prometheus recording rules, live directional traffic, mapper coverage, and a
dashboard screenshot. The default screenshot and trace outputs stay in the
ignored local artifact directory.

Fresh-checkout operator workflow for an external lab:

```bash
# 1. Unpack a pinned TopoViewer Grafana panel artifact into the lab checkout.
mkdir -p configs/grafana/plugins/asadarafat-topoviewer-panel

# 2. Deploy the lab.
containerlab deploy --topo st.clab.yml

# 3. Start visible traffic.
bash traffic.sh start all

# 4. Compare the dashboards in a browser:
#    Original: http://127.0.0.1:3000/d/ce11ch1funwu8d/network-telemetry
#    B:        http://127.0.0.1:3000/d/network-telemetry-topoviewer/network-telemetry-topoviewer
```

The equivalent checked-in bundle is:

```text
labs/grafana-topoviewer/topoviewer-bundles/st-clos/
  st-clos.topo.tv.yaml
  st-clos.style.tv.yaml
  st-clos.mapper.tv.yaml
```

The mapper is backed by Prometheus recording rules:

- `topoviewer_st_link_up`
- `topoviewer_st_link_direction_bps`

Both include `topology="st-clos"` and stable TopoViewer join labels such as
`link_id` and `direction`. The checked-in mapper renders direction bandwidth
labels with `label: "{{ value | bps }}"`.

The recording rules should be generated from topology telemetry bindings rather
than maintained as a separate mapping table. In the CLOS lab, each topology link
declares raw Prometheus labels under `data.telemetry`, and each direction
declares raw traffic labels under `directions.<direction>.data.telemetry.bps`.
The generator emits `topoviewer_st_link_up` and
`topoviewer_st_link_direction_bps` with stable `link_id` and `direction` labels.

If the provisioned dashboard cannot be saved from the Grafana UI, persist the
change in
`labs/grafana-topoviewer/containerlab/configs/grafana/dashboards/topoviewer-containerlab.json`
or save an editable copy for local exploration.

## Interaction State

The panel can persist runtime interaction state locally:

- viewport pan/zoom;
- selected and focused objects;
- local node position overrides from dragging;
- reset of local node position overrides.

This state is keyed by topology source, selected bundle or fixture, and graph
ID. It is stored in session or browser storage depending on panel options. It
is not written back to topology YAML, stylesheet YAML, mapper YAML, or Grafana
dashboard JSON.

Stop the lab:

```bash
npm run grafana:clab:down
```

The startup script intentionally requires ports `3000` and `9090` to be free.
Resolve conflicts before starting the lab so its dashboard, provisioning, and
smoke-test URLs remain deterministic.
