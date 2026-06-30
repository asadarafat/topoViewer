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

### Primary Product Priority

The highest priority for this roadmap is early-adopter ergonomics across the
complete integration path:

```text
browser harness / VS Code authoring
  -> topology, stylesheet, and mapper YAML
  -> mounted Grafana bundle
  -> Grafana panel source diagnostics
  -> Prometheus query/data frame
  -> mapper coverage
  -> TopoViewer runtime overlay
  -> documented troubleshooting
```

Rendering a topology in Grafana is necessary but not sufficient. The adoption
bar is that a user can follow public docs, mount their own YAML, bind telemetry
to objects, understand coverage, and recover from failure without knowing repo
internals.

### Phase Plan

| Phase | Scope | Completion Signal |
| --- | --- | --- |
| 1 | Panel package and canonical harness fixture parity | Grafana renders every canonical harness fixture without Grafana-owned YAML copies |
| 2 | Local Prometheus weathermap vertical slice | Prometheus injector changes link metrics and Grafana panel updates TopoViewer link state |
| 3 | Interactive panel runtime state | User pan/zoom/select/focus/drag survives refresh according to explicit persistence options |
| 4 | Mounted bundle source, TopoViewer mapper foundation, and production hardening | A Grafana user mounts bundles containing `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml`, validates telemetry binding without catalog edits, fixture sync, or plugin rebuilds, and passes the Phase 4 production readiness gate |
| 5 | Containerlab telemetry lab | Real local lab telemetry drives the same mounted bundle mapper workflow; public production support waits for a pinned plugin artifact and fresh-checkout smoke |

Detailed implementation notes live in:

- `phases/phase-1-panel-parity.md`
- `phases/phase-2-prometheus-weathermap.md`
- `phases/phase-3-interaction-state.md`
- `phases/phase-4-operational-usecases-docs.md`
- `phases/phase-5-containerlab-telemetry.md`

Repo-wide adoption risk, documentation gaps, release readiness, and security
hardening are tracked in:

- `openspec/changes/harden-public-adoption-readiness/audit.md`

Grafana-specific phase work must satisfy that public-adoption gate instead of
maintaining a separate, drifting audit.

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
  -> implement-grafana-panel-phase-4-production-hardening
  -> run Phase 4 production readiness gate: live phase4 smoke, full npm run ci, generated-output review, conventional commits
  -> archive implement-grafana-panel-phase-4
  -> archive implement-grafana-panel-phase-4-production-hardening
  -> implement phase 5 Containerlab telemetry only after Phase 4 is archived
  -> keep phase 5 open until release-mode plugin artifact and fresh-checkout smoke pass
```

This keeps the roadmap durable while each implementation phase stays small
enough to review, test, and archive independently.

Codespaces is intentionally outside this Grafana roadmap. It is a repo-wide
development environment concern that must cover MkDocs, Zensical, the browser
harness, the synthetic Grafana lab, and the Containerlab Grafana lab. Track that
work in `openspec/changes/define-codespaces-dev-environment/`.

### Development Fixture Contract

Grafana fixture mode exists for development, demo, and CI parity. It must use
the same fixture source as the browser harness:

```text
packages/topoviewer/content/examples/catalog.yaml
  -> entries with `harness:` metadata
  -> topology.yaml / stylesheet.yaml from packages/topoviewer/content/examples/**
  -> browser harness fixtures
  -> generated Grafana panel fixture module
```

Phase 1 generates
`packages/grafana-topoviewer-panel/src/generated/harnessFixtures.ts` so the
exploratory panel can load all harness fixtures without a separate static data
service.

After Phase 4 production hardening, generated fixtures are not production input.
The default Grafana lab and production plugin workflow must use mounted bundles
containing `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml`.
Fixture checks remain explicit dev/CI commands and must not block
`npm run grafana:lab:up`.

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

The benchmark is failed if the happy path requires any of these:

- editing repo fixture catalogs;
- running generated fixture sync to make a user topology appear;
- rebuilding the plugin for every topology change;
- knowing monorepo source paths;
- reading TypeScript source to understand mapper keys;
- guessing metric label names;
- using Grafana as the primary mapper authoring surface;
- debugging telemetry changes without mapping coverage output.

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

### Production-Grade Documentation Contract

Grafana documentation is part of the product, not a follow-up polish task. The
docs must be written for a capable early adopter who has not read the source
code.

Required documentation paths:

| Path | User question | Required outcome |
| --- | --- | --- |
| Five-minute happy path | "Can this work for me?" | User starts the synthetic lab, opens Grafana, changes telemetry, and sees a TopoViewer overlay change. |
| Bring your YAML | "How do I use my topology?" | User mounts `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml` without catalog edits or plugin rebuild. |
| Mapper authoring | "How do I bind metrics to objects?" | User creates mapper rules in the harness with schema and topology-aware suggestions. |
| Prometheus binding | "What labels and PromQL do I need?" | User sees stable label conventions, starter PromQL, expected frame shape, and anti-patterns. |
| Mapping coverage | "Why did nothing change?" | User can distinguish no data, unmatched telemetry, duplicate mapping, ambiguous endpoint match, stale ID, and unsupported overlay. |
| Interaction behavior | "What persists on refresh?" | User understands pan, zoom, selection, focus, drag, telemetry overlays, bundle changes, and reset. |
| Containerlab proof | "Can this work with real lab telemetry?" | User runs or reviews the advanced lab after understanding the synthetic flow. |
| Production boundary | "What can I rely on?" | User sees status labels for experimental, lab, production-shaped, unsigned, signed, and future-supported artifacts. |

Each path should include:

- exact commands;
- expected URLs;
- expected screenshots or visual states;
- example YAML snippets;
- expected Grafana query or mapping coverage output;
- troubleshooting for the nearest likely failure;
- a short explanation of why the step exists.

Documentation is not production-grade if it only describes architecture, only
shows a final screenshot, or assumes maintainer knowledge of the repo.

### Early-Adopter Definition Of Done

Before Grafana is described as more than experimental, the project must prove:

- a fresh checkout can run the documented synthetic Grafana path;
- a user-provided mounted bundle can be selected without repo edits;
- mapper YAML can be authored or corrected in the harness;
- docs explain how to map at least node, link, path, region, layer, and graph
  targets;
- mapping coverage is visible and documented;
- telemetry overlays are runtime-only and do not mutate topology/style source;
- screenshots prove healthy, degraded, and failed examples;
- Containerlab docs are clearly advanced/lab status and do not obscure the
  simpler mounted-bundle path;
- plugin artifact/signing/install status is explicit and not implied.

### Security And Penetration Gate

The Grafana integration must pass a hostile-input and lab-exposure gate before
it can be called early-adopter ready. The gate is intentionally mean because
this integration reads files from mounted paths, parses user YAML, renders SVG
and HTML-derived content, exposes a backend resource endpoint, and runs lab
services with intentionally unsafe defaults.

Minimum gate:

- `npm audit --omit=dev --audit-level=moderate` is clean, or every finding is
  documented with shipped/not-shipped impact and an owner;
- full `npm audit --audit-level=moderate` is triaged so Grafana external/dev
  advisories are not ignored silently;
- Go backend dependencies are checked with `go test ./...` and a Go
  vulnerability scan where available;
- Grafana backend resource endpoint has tests for path traversal, symlink
  escape, manifest escape, oversized files, massive directory count, duplicate
  IDs, and absolute path leakage;
- Grafana resource endpoint behavior is tested or documented for Viewer,
  Editor, Admin, and anonymous lab access;
- SVG, Markdown/callout HTML, mapper template, and YAML parser hostile payloads
  are captured in regression tests;
- lab Docker/Containerlab docs warn that anonymous Admin and unsigned plugins
  are disposable local-lab settings, not production settings;
- lab port bindings are either localhost-only by default or documented loudly as
  potentially exposed through Docker host networking;
- plugin artifact inspection proves no `.env`, local absolute paths, hidden
  maintainer files, or unintended generated files ship;
- docs include a "do not copy this to production" section for every unsafe lab
  default.

Anything less is a demo, not a trustworthy integration.

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

Once Phase 4 and Phase 5 implementations exist, public wording must still remain
honest: "production-shaped" is acceptable for mounted-bundle labs, but
"supported" requires an installable plugin artifact, documented compatibility,
manual validation from a fresh checkout, and user-facing docs that pass the
documentation contract above.
