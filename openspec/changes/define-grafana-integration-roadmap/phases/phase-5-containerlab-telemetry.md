## Phase 5: Containerlab Telemetry Lab

### Goal

Replace the synthetic telemetry injector with a real local Containerlab telemetry
source only after mounted bundles, mapper validation, coverage diagnostics, and
PromQL starters are stable.

The purpose is not to prove Containerlab can run. The purpose is to prove that
real lab telemetry can drive the same TopoViewer mapper workflow:

```text
Containerlab nodes/interfaces/protocol state
  -> Prometheus scrape targets
  -> Grafana data frames
  -> *.mapper.tv.yaml
  -> TopoViewer runtime overlays
```

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

- interface/link operational state;
- interface utilization;
- protocol adjacency state for one routing protocol;
- node health/capacity if the selected node images expose stable metrics.

Do not start with a full multi-protocol NOC dashboard. The first goal is a
deterministic, inspectable path from real lab metric labels to mapped TopoViewer
objects.

### Acceptance

- A user can start the local Containerlab Grafana lab with one npm command.
- A user can destroy the lab with one npm command.
- Grafana loads the TopoViewer panel from the local plugin build.
- The panel reads mounted topology/style/mapper bundles, not generated fixtures.
- Prometheus scrapes live lab telemetry.
- At least one telemetry mutation changes a TopoViewer node or link overlay.
- Mapper coverage reports matched and unmatched telemetry.
- Screenshots are captured under `.artifacts/grafana-containerlab/`.

### Non-Goals

- Codespaces support.
- Large topology scale testing.
- Plugin signing or release packaging.
- Writing Grafana interactions back to topology YAML.
