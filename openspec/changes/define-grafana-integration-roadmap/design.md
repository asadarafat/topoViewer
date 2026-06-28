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
| 4 | Mounted bundle source and TopoViewer mapper foundation | A Grafana user mounts bundles containing `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml`, validates telemetry binding without catalog edits or plugin rebuilds, and passes the Phase 4 production readiness gate |
| 5 | Containerlab telemetry lab | Real local lab telemetry drives the same mounted bundle mapper workflow after Phase 4 is archived |
| 6 | Codespaces portability | Local Containerlab lab is reproducible first, then Codespaces constraints are proven separately |

Detailed implementation notes live in:

- `phases/phase-1-panel-parity.md`
- `phases/phase-2-prometheus-weathermap.md`
- `phases/phase-3-interaction-state.md`
- `phases/phase-4-operational-usecases-docs.md`
- `phases/phase-5-containerlab-telemetry.md`
- `phases/phase-6-codespaces.md`

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
  -> implement-grafana-panel-phase-4
  -> run Phase 4 production readiness gate: live phase4 smoke, full npm run ci, generated-output review, conventional commits
  -> archive implement-grafana-panel-phase-4
  -> implement phase 5 Containerlab telemetry only after Phase 4 is archived
  -> create Codespaces portability phase only after local Containerlab telemetry works repeatably
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

### Phase 4 Ergonomics Benchmark

Phase 4 must not copy generic SVG-first panel workflows. Those workflows are
useful for arbitrary process diagrams, but their authoring model typically asks
the user to create an SVG in a separate drawing tool, then associate
time-series and thresholds through panel configuration. That is too manual for
TopoViewer's topology-as-code direction.

TopoViewer's Phase 4 target is at least a two-factor ergonomics improvement over
that class of workflow:

1. Fewer authoring contexts: topology and visual policy come from TopoViewer YAML
   authored in the harness, not a separate drawing tool plus panel mapping YAML.
2. Safer object binding: mappings use topology object identity (`node_id`,
   `link_id`, `path_id`, `region_id`) plus labels/data selectors, not opaque
   graphics-layer element IDs.

The practical bar is:

- no external graphics editor required for the happy path;
- no manual graphics-layer element-ID management;
- no requirement for users to know repo structure, edit `catalog.yaml`, run
  fixture sync, or rebuild the plugin;
- mounted topology bundles as the primary Grafana workflow, with canonical
  suffixes `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml`;
- a mapper diagnostics surface that previews discovered nodes, links, paths,
  regions, expected metric labels, query coverage, and unmatched telemetry;
- diagnostics that explain whether the issue is source loading, YAML parsing,
  topology validation, query shape, identity mismatch, or threshold policy;
- starter PromQL and example metric labels from `*.mapper.tv.yaml`;
- docs that start from "I have TopoViewer YAML" and end with an operational
  Grafana panel, not from "I have an SVG diagram."

Phase 4 is a foundation phase. It should define and implement generic
mapper-driven overlays for all supported target kinds, but dedicated polished
node-health, service-path, and routing-adjacency dashboards should be separate
follow-up implementation specs.

Phase 4 is not production-ready merely because the implementation checklist is
complete. The production gate is:

- rerun live `npm run grafana:lab:smoke:phase4` after mounted manifest and
  source-diagnostic hardening;
- run full `npm run ci`;
- review generated/build output;
- split the patch into conventional commits;
- archive `implement-grafana-panel-phase-4`.

Phase 5 may exist as a draft spec before that gate passes, but it must not move
to implementation until the gate is complete.

### Product Boundary

Grafana is an operational dashboard surface. It is not the main authoring
environment. Authoring stays in the browser harness, VS Code, or canonical YAML.
Phase 4 lets the panel load mounted topology bundles for operational use, but Grafana
must not become the canonical editor of record.

Grafana may hold runtime state:

- viewport;
- selected/focused objects;
- node position overrides;
- telemetry-derived style overlays.

Grafana must not silently rewrite canonical topology YAML or stylesheet YAML.
Any future save/export behavior must be explicit and must preserve the
topology-as-code workflow.

### Roadmap Language

Public docs should call Grafana exploratory until at least Phase 2 passes
locally. Phase 1 may be described as a local exploratory panel spike. Do not
claim supported Grafana integration until panel packaging, telemetry mapping,
interaction state, docs, and repeatable validation are done.
