## Design

Phase 5 adds a real lab telemetry source, not a new mapper system. The primary
implementation target is an upstream-compatible adaptation of the existing SR
Linux streaming telemetry lab. TopoViewer should appear as a small, useful
addition to that lab rather than as a competing lab stack.

```text
Containerlab SR Linux fabric
  -> gNMIc subscriptions / Prometheus exporter
  -> Prometheus
  -> generated recording rules for stable TopoViewer object labels
  -> Grafana data frames
  -> *.mapper.tv.yaml
  -> TopoViewer runtime overlay
```

### Entry Gate

Phase 5 was blocked until Phase 4 was accepted. Before any Containerlab code,
commands, dashboards, or bundles are added:

```bash
npm run grafana:lab:smoke:phase4
npm run ci
```

Both commands must pass on the final Phase 4 patch set, generated/build outputs
must be reviewed, and `implement-grafana-panel-phase-4` must be archived.

This gate is now satisfied. Phase 5 work should stay scoped to the real lab
telemetry path and must not reopen Phase 4 mapper or mounted-bundle behavior
except for defects discovered by real telemetry.

### Lab Separation

The existing synthetic lab remains the deterministic baseline:

```bash
npm run grafana:lab:up
npm run grafana:lab:smoke:phase2
npm run grafana:lab:smoke:phase4
```

Containerlab gets separate commands:

```bash
npm run grafana:clab:up
npm run grafana:clab:smoke
npm run grafana:clab:down
```

### Upstream-Compatible Layout

The first implementation should keep the upstream lab layout intact and add the
smallest useful TopoViewer surface:

```text
st.clab.yml
configs/
  prometheus/
    prometheus.yml
    topoviewer-rules.yml
  grafana/
    dashboards/
      telemetry-dashboard-topoviewer.json
    topoviewer-bundles/
      st-clos/
        st-clos.topo.tv.yaml
        st-clos.style.tv.yaml
        st-clos.mapper.tv.yaml
```

For local validation before publication, Grafana may bind-mount the local
TopoViewer plugin dist. The upstream PR should not vendor the plugin dist. Once
the plugin is published or signed, the lab should load it through Grafana's
normal plugin installation mechanism.

This distinction is important:

- local development may use a repo-relative plugin bind mount;
- the upstream-candidate patch must not require this monorepo layout;
- the upstream-candidate patch must document a plugin source contract that a
  fresh lab checkout can satisfy.

Until that split exists, the lab is a validated demo, not a production-grade
integration.

### Production Readiness Bar

Phase 5 is production-ready only when the upstream-candidate workflow is
repeatable from a fresh checkout:

```bash
containerlab deploy --topo st.clab.yml
bash traffic.sh start all
```

After those commands and the documented plugin installation step, Grafana must
show the TopoViewer dashboard with live telemetry overlays and mapper coverage
without relying on hidden local state.

The acceptance bar is deliberately stricter than "it works on this machine":

- no hard-coded paths into this monorepo in the upstream-candidate patch;
- no vendored Grafana plugin `dist` directory in the upstream-candidate patch;
- no custom TopoViewer telemetry normalizer service in the production path;
- no manual catalog sync or generated fixture copy step;
- no undocumented dependency on prior `npm run build` output;
- one smoke command that can be run after deployment and fails with actionable
  logs when Grafana, Prometheus, gNMIc, bundle discovery, mapper coverage, or
  rendering breaks.

### Plugin Install Contract

The production contract should support two modes:

- release mode: Grafana installs a pinned TopoViewer panel artifact/version;
- development mode: Grafana bind-mounts a locally built plugin dist through an
  explicit override variable or override compose/Containerlab file.

Only development mode may point at this repository's `packages/.../dist`
directory. Release mode is the only mode acceptable for the upstream-candidate
patch once the plugin artifact exists.

The lab documentation must say exactly which mode is being used. If release
mode is not yet available, the OpenSpec must keep this phase open and classify
the result as a demo candidate.

### First Topology Shape

Use the existing lab CLOS topology first. The first pass should optimize for
reviewability and metric identity clarity, not scale:

- two spine SR Linux nodes;
- three leaf SR Linux nodes;
- three client hosts or traffic endpoints;
- fabric links between each spine and leaf;
- client-facing leaf links;
- one mounted TopoViewer bundle with mapper rules.

The TopoViewer graph identity should match the lab purpose, for example
`st-clos`, while preserving the existing Containerlab topology name and node
names.

### Service Stack

The lab should include:

- SR Linux containers pinned to one tested image tag;
- a gNMIc container pinned to one tested image tag;
- a Prometheus container pinned to one tested image tag;
- a Grafana container pinned to the lab's current tested version;
- the TopoViewer Grafana panel plugin loaded through the documented release or
  development install mode;
- mounted TopoViewer bundle directories under `/etc/topoviewer/bundles`;
- the existing traffic script for deterministic visible telemetry changes.

Grafana should keep the original `Network Telemetry` dashboard unchanged and
add a B dashboard for comparison. The B dashboard should copy the original
dashboard and replace only the `Network Telemetry` topology panel with
TopoViewer. Provisioned dashboards are useful for smoke setup, but the operator
should be able to experiment without copying JSON out of Grafana.

For an upstream-ready dashboard, provisioning should create the starting point
without trapping the operator in an immutable dashboard. If Grafana provisioning
keeps the dashboard read-only, the docs must explain how to persist changes in
the provisioning source or the lab should provide an editable copy workflow.

### Metric Identity

Mapper-friendly labels should be produced at the Prometheus edge:

- `source_id`
- `node_id`
- `link_id`
- `source`
- `target`
- `protocol`
- `site`
- `interface`
- `direction`

If exporter labels are not TopoViewer-friendly, use Prometheus recording rules
or relabeling rather than a TopoViewer-specific normalizer sidecar.

Those recording rules must not become a second hand-maintained topology model.
For the CLOS lab, the raw exporter binding belongs in topology YAML next to the
link it describes:

```yaml
graph:
  links:
    - id: spine1-leaf1
      data:
        telemetry:
          up:
            record: topoviewer_st_link_up
            metric: interface_oper_state
            labels:
              source: spine1
              interface_name: e1-1
      directions:
        sourceToTarget:
          data:
            telemetry:
              bps:
                record: topoviewer_st_link_direction_bps
                metric: interface_traffic_rate_out_bps
                labels:
                  source: spine1
                  interface_name: e1-1
```

A generation step turns those bindings into Prometheus recording rules. The
mapper then consumes only the stable `link_id` and `direction` labels. This
keeps the panel and mapper generic while avoiding a separate manual table of
`source/interface_name` to TopoViewer object IDs.

The mapper should treat device-native names as inputs, not as renderer concepts.
For example:

- node overlays should join through `node_id`;
- link overlays should join through `link_id` when available;
- link overlays may join through `source`, `target`, and `interface` when
  `link_id` is not present;
- adjacency overlays should join through `source`, `target`, and `protocol`;
- graph or layer summary overlays should aggregate from matched child objects.

### Telemetry Use Cases

The first phase should prove live operational views that are already natural in
the lab:

- Link state: an interface or adjacency transition changes link color, label,
  width, and/or dash style.
- Utilization: interface counters or generated traffic change link color,
  badge text, and tooltip/label values.
- Directionality: bidirectional interface traffic changes distinct source-to-
  target and target-to-source link lanes.

All visual changes must be expressed in `st-clos.mapper.tv.yaml` state rules.
The panel should not contain CLOS-specific or SR Linux-specific hard-coded style
logic.

The initial production-grade use case should stay focused on link state and
bidirectional utilization. Adjacency and node-health overlays are valuable, but
they should be added only if the lab exposes stable metrics without bloating the
first review. If those signals require fragile assumptions, document them as a
later phase instead of forcing them into Phase 5.

### TopoViewer Bundle Contract

The mounted bundle is the production workflow:

```text
st-clos.topo.tv.yaml
st-clos.style.tv.yaml
st-clos.mapper.tv.yaml
```

The topology YAML should model only topology facts: devices, links, interfaces,
layers, labels, and stable identity fields. The stylesheet YAML should model
baseline shape, icons, colors, labels, and dense-view defaults. The mapper YAML
should model telemetry queries, joins, states, thresholds, and runtime style
overlays.

The browser harness remains the authoring tool for the topology and stylesheet.
Mapper schema assistance should be extended when the lab exposes new useful
metric labels or join patterns.

### Acceptance Artifacts

The smoke test should capture:

- Grafana dashboard screenshot before telemetry mutation;
- Grafana dashboard screenshot after telemetry mutation;
- mapper coverage status;
- Prometheus target health;
- gNMIc target/subscription health;
- lab version output.
- generated PromQL or query list used by the panel;
- final bundle discovery response from the panel backend.
- the exact plugin installation mode and plugin version or local dist path;
- a copy of the upstream-candidate patch stat;
- a screenshot that demonstrates readable topology, not just a successful
  render.

Artifacts should live under `.artifacts/grafana-containerlab/`.

### Upstream PR Gate

Before this phase can be archived, generate an upstream-candidate patch and
review it against these rules:

- the patch is understandable without TopoViewer monorepo context;
- the patch keeps the existing lab topology and telemetry pipeline recognizable;
- the patch keeps the original dashboard unchanged and adds only the B
  dashboard, mounted bundle, recording rules, and minimal Grafana/Prometheus
  wiring;
- the README section explains the value in operator terms;
- the demo can be removed cleanly if the upstream maintainers do not want it;
- the plugin install path is realistic for a user who is not developing
  TopoViewer itself.

If any rule fails, the phase remains open.

### Non-Goals

- Do not move YAML authoring into Grafana.
- Do not remove the synthetic lab.
- Do not use fixture-source mode for production validation.
- Do not add a custom telemetry normalizer to the upstream lab.
- Do not vendor the TopoViewer plugin dist into the upstream lab.
- Do not publish external lab repository links in public docs or OpenSpec files.
- Do not make Codespaces part of Phase 5; that belongs to a later portability
  phase once local Containerlab is stable.
