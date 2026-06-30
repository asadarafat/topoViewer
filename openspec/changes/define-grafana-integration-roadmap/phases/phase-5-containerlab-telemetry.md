## Phase 5: Containerlab Telemetry Lab

### Goal

Add a real local Containerlab telemetry source only after mounted bundles,
mapper validation, coverage diagnostics, and PromQL starters are stable.

The purpose is not to prove Containerlab can run. The purpose is to prove that
real lab telemetry can drive the same TopoViewer mapper workflow:

```text
Containerlab nodes/interfaces/protocol state
  -> Prometheus scrape targets
  -> Grafana data frames
  -> mounted *.mapper.tv.yaml
  -> TopoViewer runtime overlays
```

### Current Status

Phase 5 has a repo-local and upstream-candidate implementation: live lab
telemetry drives TopoViewer overlays through mounted topology, stylesheet, and
mapper YAML. The phase is not public-production-ready until a pinned TopoViewer
Grafana panel artifact exists and a fresh lab checkout can install that
artifact, run traffic, and pass the upstream smoke without hidden monorepo
paths.

### Preconditions

- Phase 1 panel fixture parity passes locally.
- Phase 2 synthetic Prometheus weathermap passes locally.
- Phase 3 interaction state survives refresh.
- Phase 4 mounted bundle source works without catalog edits or plugin rebuild.
- Mapper schema, YAML assist, coverage diagnostics, and starter PromQL exist.
- Mounted topology bundles are the default Grafana source mode.
- The default Grafana lab startup no longer depends on generated fixture checks.
- Live `npm run grafana:lab:smoke:phase4` passes after the final Phase 4
  manifest and source-diagnostic changes.
- Full `npm run ci` passes on the final Phase 4 patch set.
- Generated/build outputs from Phase 4 are reviewed and committed
  intentionally, or confirmed absent.
- `implement-grafana-panel-phase-4` is archived.

Until those conditions are true, this phase is allowed to exist as a planning
spec only. It is not ready for implementation.

### Lab Shape

The local lab should add Containerlab as a separate profile or command, not as a
dependency of the deterministic synthetic lab.

Required components:

- pinned Containerlab version or documented installed version check;
- pinned node images for the selected topology;
- Prometheus scrape config for lab telemetry exporters;
- Grafana dashboard using the same TopoViewer panel package;
- mounted TopoViewer bundles with `*.topo.tv.yaml`, `*.style.tv.yaml`, and
  `*.mapper.tv.yaml`;
- cleanup command that destroys the Containerlab topology and Grafana stack.

### Telemetry Scope

Start with a narrow operational slice:

- link operational state;
- bidirectional link utilization.

Do not start with a full multi-protocol NOC dashboard. The first goal is a
deterministic, inspectable path from real lab metric labels to mapped TopoViewer
objects.

Protocol adjacency and node health/capacity are follow-up overlays. They should
not be added until the selected lab exposes stable metrics that are meaningful
without a custom TopoViewer-specific telemetry normalizer.

### Acceptance

- A user can start the local Containerlab Grafana lab with one npm command.
- A user can destroy the lab with one npm command.
- Grafana loads the TopoViewer panel from the local plugin build.
- The panel reads mounted topology/style/mapper bundles, not generated fixtures.
- Prometheus scrapes live lab telemetry.
- At least one telemetry mutation changes a TopoViewer node or link overlay.
- Mapper coverage reports matched and unmatched telemetry.
- Screenshots are captured under `.artifacts/grafana-containerlab/`.
- Release-mode production support requires a pinned panel artifact and
  fresh-checkout smoke; local development may use an explicit plugin dist mount.

### Non-Goals

- Codespaces support.
- Large topology scale testing.
- Plugin signing or release packaging.
- Writing Grafana interactions back to topology YAML.
