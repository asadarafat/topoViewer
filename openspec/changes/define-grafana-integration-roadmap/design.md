## Design

Grafana integration is a multi-phase product track, not one implementation
chunk. The first implementation must prove a narrow vertical slice before the
project invests in the full operational dashboard surface.

### Integration Shape

TopoViewer should run inside Grafana as a panel plugin:

```text
Grafana data frames / panel options / runtime interaction state
  -> Grafana adapter package
  -> TopoViewer React runtime
  -> interactive operational topology panel
```

The panel must wrap the existing `topoviewer` runtime. It must not fork renderer
behavior or maintain separate topology examples.

### Phase Plan

| Phase | Scope | Completion Signal |
| --- | --- | --- |
| 1 | Panel package and canonical harness fixture parity | Grafana renders every canonical harness fixture without Grafana-owned YAML copies |
| 2 | Local Prometheus weathermap vertical slice | Prometheus injector changes link metrics and Grafana panel updates TopoViewer link state |
| 3 | Interactive panel runtime state | User pan/zoom/select/focus/drag survives refresh according to explicit persistence options |
| 4 | Expanded operational dashboards and docs | Node health, service path, routing adjacency, and end-to-end authoring-to-telemetry docs exist |
| 5 | Codespaces portability | Local lab is reproducible first, then Codespaces constraints are proven separately |

Detailed implementation notes live in:

- `phases/phase-1-panel-parity.md`
- `phases/phase-2-prometheus-weathermap.md`
- `phases/phase-3-interaction-state.md`
- `phases/phase-4-operational-usecases-docs.md`
- `phases/phase-5-codespaces.md`

### Execution Sequence

Each phase should become its own implementation OpenSpec before code changes
start. Do not implement directly from this roadmap.

The lifecycle is:

```text
1. Create phase implementation OpenSpec.
2. Implement the phase.
3. Validate the phase against its acceptance criteria.
4. Archive the phase implementation OpenSpec.
5. Update this roadmap only if implementation changed the direction, phase
   boundary, or next-phase assumptions.
6. Create the next phase implementation OpenSpec.
```

Current sequence:

```text
define-grafana-integration-roadmap
  -> implement-grafana-panel-phase-1
  -> create implement-grafana-panel-phase-2
  -> archive phase 1 after generated-output commit and final full CI
  -> implement phase 2
  -> implement-grafana-panel-phase-3
  -> archive phases after validation and review
  -> create phase 4 only after interaction-state behavior is accepted
```

This keeps the roadmap durable while each implementation phase stays small
enough to review, test, and archive independently.

### Canonical Fixture Contract

Grafana must use the same fixture source as the browser harness:

```text
packages/topoviewer/content/examples/catalog.yaml
  -> entries with `harness:` metadata
  -> topology.yaml / stylesheet.yaml from packages/topoviewer/content/examples/**
  -> browser harness fixtures
  -> generated Grafana panel fixture module
```

Phase 1 generates `packages/grafana-topoviewer-panel/src/generated/harnessFixtures.ts`
so the exploratory panel can load all harness fixtures without a separate static
data service. Future phases may add lab-only projections under
`.artifacts/grafana-lab/` if Prometheus or Containerlab fixtures require runtime
data, but canonical topology and stylesheet YAML remain under
`packages/topoviewer/content/examples/**`.

Initial required harness fixtures:

- `layered-network`
- `clos-2spine-4leaf`
- `insert-workflow`
- `attention-workflow`
- `inspector-workflow`
- `dense-links`

### Version Pins

The local lab must be reproducible. Do not use floating image tags.

Initial pins:

```text
Grafana OSS: grafana/grafana:13.1.0
Prometheus: prom/prometheus:v3.5.0
Node exporter: quay.io/prometheus/node-exporter:v1.9.1, only if needed
```

The lab must include a version check that rejects `latest`, unversioned images,
and floating major/minor tags.

### First Vertical Slice

The first implementation should not attempt all operational use cases. It should
build only the minimum useful path:

```text
canonical harness fixture
  -> Grafana panel
  -> Prometheus link metric
  -> telemetry rule
  -> TopoViewer link color/width/style update
  -> user click/focus/drag remains usable
```

Recommended first fixtures:

- `layered-network`
- `clos-2spine-4leaf`

All harness fixtures must load in smoke tests, but only those two need full
weathermap interaction assertions in the first vertical slice.

### Product Boundary

Grafana is an operational dashboard surface. It is not the main authoring
environment. Authoring stays in the browser harness, VS Code, or canonical YAML.

Grafana may hold runtime state:

- viewport;
- selected/focused objects;
- node position overrides;
- telemetry-derived style overlays.

Grafana must not rewrite canonical topology YAML or stylesheet YAML.

### Roadmap Language

Public docs should call Grafana exploratory until at least Phase 2 passes
locally. Phase 1 may be described as a local exploratory panel spike. Do not
claim supported Grafana integration until panel packaging, telemetry mapping,
interaction state, docs, and repeatable validation are done.
