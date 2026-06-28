## Design

Phase 5 adds a real lab telemetry source, not a new mapper system.

```text
Containerlab
  -> telemetry exporter / device metrics
  -> Prometheus
  -> Grafana data frames
  -> *.mapper.tv.yaml
  -> TopoViewer runtime overlay
```

### Entry Gate

Phase 5 is not the next executable implementation until Phase 4 is accepted.
Before any Containerlab code, commands, dashboards, or bundles are added:

```bash
npm run grafana:lab:smoke:phase4
npm run ci
```

Both commands must pass on the final Phase 4 patch set, generated/build outputs
must be reviewed, and `implement-grafana-panel-phase-4` must be archived.

If this gate is not satisfied, Phase 5 stays as a draft spec only. Starting
Containerlab before this point would mix lab runtime risk with unresolved panel
and mapper risk, which would make failures harder to diagnose.

### Lab Separation

The existing synthetic lab remains the deterministic baseline:

```bash
npm run grafana:lab:up
npm run grafana:lab:smoke:phase2
npm run grafana:lab:smoke:phase4
```

Containerlab gets separate commands, for example:

```bash
npm run grafana:clab:up
npm run grafana:clab:smoke
npm run grafana:clab:down
```

### First Topology

Use a small topology first. The first pass should optimize for metric identity
clarity, not scale:

- two to four network nodes;
- at least two links;
- one protocol adjacency if exposed reliably;
- one mounted TopoViewer bundle with mapper rules.

### Metric Identity

Mapper-friendly labels should be preferred at the Prometheus edge:

- `source_id`
- `node_id`
- `link_id`
- `source`
- `target`
- `protocol`
- `site`

If exporter labels are not TopoViewer-friendly, use Prometheus relabeling or
recording rules rather than adding hard-coded panel mapping.

### Acceptance Artifacts

The smoke test should capture:

- Grafana dashboard screenshot before telemetry mutation;
- Grafana dashboard screenshot after telemetry mutation;
- mapper coverage status;
- Prometheus target health;
- lab version output.

Artifacts should live under `.artifacts/grafana-containerlab/`.
