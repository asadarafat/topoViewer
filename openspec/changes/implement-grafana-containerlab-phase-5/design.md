## Design

Phase 5 adds a real lab telemetry source, not a new mapper system. The lab
adapts a compact SR Linux streaming telemetry pattern into a TopoViewer-specific
`topoviewer-grafana` profile.

```text
Containerlab SR Linux fabric
  -> gNMIc subscriptions / Prometheus exporter
  -> Prometheus
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

### Repo Layout

The first implementation should extend the existing Grafana lab tree:

```text
labs/grafana-topoviewer/
  containerlab/
    topoviewer-grafana.clab.yml
    configs/
      srlinux/
      gnmic/
      prometheus/
      grafana/
    scripts/
      up.sh
      down.sh
      smoke.mjs
      capture-artifacts.mjs
  topoviewer-bundles/
    clab-clos/
      clab-clos.topo.tv.yaml
      clab-clos.style.tv.yaml
      clab-clos.mapper.tv.yaml
```

The Containerlab profile should not require a runtime clone of any external
repository. Required lab files should be adapted into this repo with the minimum
surface needed for TopoViewer validation.

### First Topology Shape

Use a small CLOS-like topology first. The first pass should optimize for metric
identity clarity, not scale:

- two spine SR Linux nodes;
- two to three leaf SR Linux nodes;
- two client hosts or traffic endpoints;
- fabric links between each spine and leaf;
- at least one client-facing leaf link;
- one protocol adjacency if exposed reliably;
- one mounted TopoViewer bundle with mapper rules.

The topology should be named `topoviewer-grafana` in Containerlab so container
names, Prometheus targets, dashboard titles, artifact paths, and smoke output
are easy to correlate.

### Service Stack

The lab should include:

- SR Linux containers pinned to one tested image tag;
- a gNMIc container pinned to one tested image tag;
- a Prometheus container pinned to one tested image tag;
- a Grafana container pinned to the same major/minor version used by the
  existing Grafana lab;
- the local TopoViewer Grafana panel plugin mounted into Grafana;
- mounted TopoViewer bundle directories under `/etc/topoviewer/bundles`;
- optional traffic helper containers only when they make telemetry state changes
  deterministic.

Grafana should be locally editable by default. Provisioned dashboards are useful
for smoke setup, but the operator should be able to experiment without copying
JSON out of Grafana.

### Metric Identity

Mapper-friendly labels should be preferred at the Prometheus edge:

- `source_id`
- `node_id`
- `link_id`
- `source`
- `target`
- `protocol`
- `site`
- `interface`
- `direction`

If exporter labels are not TopoViewer-friendly, use Prometheus relabeling or
recording rules rather than adding hard-coded panel mapping.

The mapper should treat device-native names as inputs, not as renderer concepts.
For example:

- node overlays should join through `node_id`;
- link overlays should join through `link_id` when available;
- link overlays may join through `source`, `target`, and `interface` when
  `link_id` is not present;
- adjacency overlays should join through `source`, `target`, and `protocol`;
- graph or layer summary overlays should aggregate from matched child objects.

### Telemetry Use Cases

The first phase should prove three live operational views:

- Link state: an interface or adjacency transition changes link color, label,
  width, and/or dash style.
- Utilization: interface counters or generated traffic change link color,
  badge text, and tooltip/label values.
- Node health or adjacency: a protocol/session/health metric changes a node
  outline, status marker, or badge.

All visual changes must be expressed in `clab-clos.mapper.tv.yaml` state rules.
The panel should not contain CLOS-specific or SR Linux-specific hard-coded style
logic.

### TopoViewer Bundle Contract

The mounted bundle is the production workflow:

```text
clab-clos.topo.tv.yaml
clab-clos.style.tv.yaml
clab-clos.mapper.tv.yaml
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

Artifacts should live under `.artifacts/grafana-containerlab/`.

### Non-Goals

- Do not move YAML authoring into Grafana.
- Do not remove the synthetic lab.
- Do not use fixture-source mode for production validation.
- Do not publish external lab repository links in public docs or OpenSpec files.
- Do not make Codespaces part of Phase 5; that belongs to a later portability
  phase once local Containerlab is stable.
