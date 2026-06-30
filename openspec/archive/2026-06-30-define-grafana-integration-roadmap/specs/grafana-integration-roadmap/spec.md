## ADDED Requirements

### Requirement: Grafana Roadmap Is Phased

TopoViewer SHALL treat Grafana integration as a phased roadmap, not a single
large implementation.

#### Scenario: Public Status Is Accurate

- **WHEN** public docs mention Grafana
- **THEN** Grafana SHALL be marked exploratory until at least the local panel
  parity and Prometheus weathermap phases pass
- **AND** docs SHALL NOT claim supported Grafana integration before the panel,
  telemetry mapping, interaction state, docs, and validation are complete

#### Scenario: Implementation Order Is Enforced

- **WHEN** implementation begins
- **THEN** Phase 1 SHALL prove panel rendering and canonical harness fixture
  parity before Prometheus, interactivity persistence, or expanded use cases are
  treated as release work

### Requirement: Early-Adopter Ergonomics Are The Primary Grafana Success Metric

TopoViewer SHALL judge Grafana integration by how quickly and safely an early
adopter can bring their own TopoViewer YAML into Grafana, bind telemetry, and
understand the result.

#### Scenario: User Does Not Need Maintainer Knowledge

- **GIVEN** a user has topology and stylesheet YAML
- **WHEN** they follow Grafana docs
- **THEN** they can create or validate mapper YAML, mount the bundle, select it
  in the panel, configure telemetry, and inspect mapping coverage
- **AND** they do not need to know monorepo source paths, edit fixture catalogs,
  run fixture sync, rebuild the plugin for each topology, or read TypeScript
  source code.

#### Scenario: Adoption Gaps Are Tracked Explicitly

- **WHEN** the Grafana roadmap is reviewed
- **THEN** it SHALL include a blunt adoption-gap audit
- **AND** implementation phases SHALL treat those gaps as product blockers, not
  nice-to-have documentation tasks.

#### Scenario: Documentation Is A Product Gate

- **WHEN** a Grafana phase claims production-shaped or early-adopter readiness
- **THEN** docs SHALL include runnable commands, expected URLs, expected
  screenshots or visual states, copyable YAML, expected query or mapping
  coverage output, and troubleshooting for likely failures
- **AND** architecture-only documentation SHALL NOT be sufficient.

### Requirement: Grafana Security And Abuse Resistance Is Explicit

TopoViewer SHALL treat Grafana mounted bundles, mapper YAML, SVG/HTML-derived
rendering, and lab services as security-sensitive integration surfaces.

#### Scenario: Lab Defaults Cannot Masquerade As Production

- **GIVEN** the local Grafana labs enable anonymous Admin, admin/admin defaults,
  unsigned plugin loading, and exposed host ports
- **WHEN** those labs are documented
- **THEN** docs SHALL label them as disposable local-lab settings
- **AND** docs SHALL provide production-safe counterexamples or warnings
- **AND** no public adoption page SHALL imply those defaults are acceptable for
  a real shared Grafana instance.

#### Scenario: Backend Resource Endpoint Resists File Abuse

- **GIVEN** a user or attacker controls mounted bundle files, manifest content,
  or panel options for root/manifest/bundle ID
- **WHEN** they attempt path traversal, symlink escape, absolute path escape,
  oversized files, duplicate bundle IDs, missing suffix files, massive bundle
  directories, or malformed manifests
- **THEN** the backend SHALL reject unsafe access, keep CPU/memory bounded, and
  return actionable diagnostics without leaking sensitive host paths.

#### Scenario: Hostile YAML And Rendered Content Stay Inert

- **GIVEN** topology, stylesheet, mapper, Markdown/callout, SVG, or telemetry
  label content contains hostile payloads
- **WHEN** the panel, harness, MkDocs, or Zensical renders it
- **THEN** scripts, event handlers, `javascript:` references, raw HTML
  execution, CSS/attribute breakout, and mapper-template injection SHALL NOT
  execute
- **AND** the UI SHALL remain responsive for oversized or malformed input.

#### Scenario: Dependency Advisories Are Triage Blockers

- **GIVEN** `npm audit`, Go vulnerability scanning, or plugin artifact
  inspection reports issues
- **WHEN** Grafana integration is evaluated for early-adopter readiness
- **THEN** each issue SHALL be fixed or documented with shipped impact,
  dev/tooling/external classification, owner, and follow-up action
- **AND** untriaged moderate or higher advisories SHALL block production-ready
  wording.

#### Scenario: Plugin Artifact Is Inspectable

- **GIVEN** an early adopter needs to install the plugin outside the monorepo
- **WHEN** the plugin artifact is produced
- **THEN** the artifact SHALL have documented version/Grafana compatibility,
  checksum or provenance expectation, file manifest, signing/unsigned status,
  and install instructions
- **AND** it SHALL NOT include `.env`, local absolute paths, private files, or
  unintended generated junk.

### Requirement: Phase 1 Panel Parity

TopoViewer SHALL first prove a Grafana panel can render canonical TopoViewer
harness fixtures without fixture drift.

#### Scenario: Panel Package Wraps TopoViewer

- **WHEN** the Grafana panel package is implemented
- **THEN** it SHALL live in a dedicated package such as
  `packages/grafana-topoviewer-panel`
- **AND** it SHALL import and wrap the existing `topoviewer` runtime
- **AND** it SHALL NOT fork renderer behavior

#### Scenario: Grafana Uses Canonical Harness Fixtures

- **WHEN** Grafana panel demos or tests need topology fixtures
- **THEN** they SHALL discover fixtures from
  `packages/topoviewer/content/examples/catalog.yaml` entries with `harness`
  metadata
- **AND** discovery SHALL match browser harness semantics for fixture ID, display
  name, source file resolution, path safety, duplicate detection, and ordering
- **AND** Grafana SHALL NOT maintain checked-in Grafana-only topology or
  stylesheet YAML copies for those fixtures

#### Scenario: All Harness Fixtures Load

- **WHEN** Phase 1 smoke tests run
- **THEN** every canonical harness fixture SHALL load in the Grafana panel
- **AND** the initial required fixture set SHALL include `layered-network`,
  `clos-2spine-4leaf`, `insert-workflow`, `attention-workflow`,
  `inspector-workflow`, and `dense-links`
- **AND** compiled object counts and layer availability SHALL match TopoViewer
  compiled output for the same topology and stylesheet

### Requirement: Phase 2 Prometheus Weathermap

TopoViewer SHALL prove real telemetry flow with a narrow Prometheus-driven
weathermap before broader operational dashboards.

#### Scenario: Local Lab Versions Are Pinned

- **WHEN** the local lab is implemented
- **THEN** Grafana SHALL use an exact image tag such as
  `grafana/grafana:13.1.0`
- **AND** Prometheus SHALL use an exact image tag such as
  `prom/prometheus:v3.5.0`
- **AND** the lab SHALL reject `latest`, unversioned images, and floating
  major/minor tags
- **AND** smoke checks SHALL verify running versions

#### Scenario: Prometheus Injector Drives Grafana Data Frames

- **WHEN** telemetry behavior is validated
- **THEN** a deterministic injector SHALL mutate Prometheus metrics
- **AND** Prometheus SHALL scrape the injector
- **AND** Grafana SHALL query Prometheus through a provisioned data source
- **AND** the TopoViewer panel SHALL consume resulting Grafana data frames
- **AND** static Prometheus frame fixtures SHALL NOT be sufficient for Phase 2
  completion

#### Scenario: Network Weathermap Works

- **WHEN** the panel runs the first weathermap vertical slice
- **THEN** Prometheus link metrics SHALL drive TopoViewer link color, width,
  line style, label text, and endpoint status markers
- **AND** users SHALL be able to hover a link, click a link to focus it and its
  endpoints, filter by dashboard variables, and drag endpoint nodes without
  breaking metric matching
- **AND** the first detailed assertions SHOULD use `layered-network` and
  `clos-2spine-4leaf`
- **AND** all harness fixtures SHALL still load after telemetry support is
  enabled

### Requirement: Phase 3 Interaction State

TopoViewer SHALL support operational interaction inside Grafana without making
Grafana the source authoring environment.

#### Scenario: Runtime Interaction State Is Separate From YAML

- **WHEN** a user pans, zooms, selects, focuses, or drags a node in Grafana
- **THEN** the panel SHALL update runtime interaction state
- **AND** it SHALL NOT rewrite canonical topology YAML or stylesheet YAML

#### Scenario: Dragged Positions Survive Refresh When Enabled

- **WHEN** node position persistence is enabled
- **THEN** dragged positions SHALL survive dashboard refresh while the topology
  identity is unchanged
- **AND** position overrides SHALL take precedence over base topology positions
  and layout results
- **AND** reset SHALL clear local position overrides without clearing
  telemetry-derived visual state

#### Scenario: Telemetry And Interaction Do Not Race

- **WHEN** telemetry refreshes while the user has viewport, focus, selection, or
  drag state
- **THEN** telemetry SHALL update visual/attention state without clearing user
  interaction state

### Requirement: Phase 4 Mounted Bundle Source And TopoViewer Mapper Foundation

TopoViewer SHALL expand from a fixture-backed weathermap into an ergonomic
topology-as-code Grafana workflow only after the first telemetry slice and
interaction-state phases are proven.

#### Scenario: TopoViewer Beats SVG-First Panel Authoring

- **WHEN** a Grafana user has existing TopoViewer topology and stylesheet YAML
- **THEN** the user SHALL be able to render it in a TopoViewer panel by mounting
  a bundle root containing `*.topo.tv.yaml`, `*.style.tv.yaml`, and
  `*.mapper.tv.yaml` files into Grafana
- **AND** object mapping SHALL use TopoViewer object IDs, labels, and data
  rather than opaque graphics-layer element IDs
- **AND** the panel SHALL keep source YAML, mapping, telemetry, and interaction
  state visibly separated
- **AND** the user SHALL NOT need to edit `catalog.yaml`, run fixture sync, or
  rebuild the plugin for each topology

#### Scenario: Mounted Bundle Source Exists

- **WHEN** Phase 4 source support is implemented
- **THEN** mounted topology bundles SHALL be the primary production workflow
- **AND** each discovered bundle SHALL use canonical suffixes:
  `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml`
- **AND** generated canonical harness fixtures SHALL remain supported only for
  demos, examples, and CI parity
- **AND** invalid source loading, YAML parsing, and TopoViewer validation errors
  SHALL produce actionable panel diagnostics

#### Scenario: Fixture Source Is Deprecated For Production

- **WHEN** Phase 4 production hardening is implemented
- **THEN** generated harness fixture source SHALL remain available only for
  backwards-compatible demos, examples, and CI parity
- **AND** new production-shaped Grafana panels SHALL default to mounted topology
  bundles
- **AND** the default local Grafana lab startup SHALL NOT require fixture sync
  or fixture check
- **AND** fixture parity SHALL remain covered by explicit dev/CI commands

#### Scenario: Multiple Bundles Are Selectable

- **WHEN** the mounted bundle root contains multiple valid bundles
- **THEN** the panel SHALL let the user select which bundle to render
- **AND** changing the selected bundle SHALL reload topology, stylesheet,
  mapper, diagnostics, mapping coverage, and interaction identity for the
  selected bundle

#### Scenario: TopoViewer Mapper Is Required For Mounted Workflow

- **WHEN** mounted bundle source is used
- **THEN** telemetry object binding SHALL be declared in
  `*.mapper.tv.yaml`
- **AND** the mapper SHALL define metric selectors, target object kinds,
  resolver modes, value extraction, thresholds, overlays, and starter query
  intent
- **AND** mapper rules SHALL support controlled any-to-any mapping from any
  supported Grafana metric series to supported TopoViewer target kinds
- **AND** supported target kinds SHALL include `node`, `link`, `path`,
  `region`, `layer`, and `graph`
- **AND** `layer` and `graph` SHALL be treated as aggregate targets
- **AND** hidden code-only mapping SHALL NOT be the primary production contract

#### Scenario: TopoViewer Mapper Authoring Is Schema Assisted

- **WHEN** users author `*.mapper.tv.yaml`
- **THEN** the browser harness and VS Code harness SHALL provide schema-backed
  YAML suggestions
- **AND** suggestions SHALL include valid mapper keys, enum values, topology
  object IDs, labels, data keys, join targets, thresholds, overlay modes, and
  starter PromQL where relevant
- **AND** the same schema SHALL be reused by Grafana validation, harness assist,
  documentation, and tests

#### Scenario: Mapper Diagnostics Guide The User

- **WHEN** TopoViewer mapper YAML is configured
- **THEN** the panel SHALL inspect the compiled topology and show available
  nodes, links, paths, regions, layers, labels, and data keys
- **AND** it SHALL recommend stable metric labels such as `node_id`, `link_id`,
  `path_id`, and `region_id`
- **AND** it SHALL read or generate starter PromQL for supported telemetry use
  cases from the mapper/topology pair
- **AND** it SHALL show matched objects, unmatched telemetry, unmapped topology
  objects, duplicate mappings, ambiguous endpoint matches, and stale IDs
- **AND** endpoint-only link matching SHALL warn when parallel links make the
  match ambiguous

#### Scenario: Generic Runtime Overlay Foundation

- **WHEN** mapper-driven telemetry overlays are implemented
- **THEN** mapper rules SHALL be able to target node, link, path, region,
  layer, and graph objects through target-specific runtime overlay adapters
- **AND** unsupported overlay controls SHALL produce diagnostics instead of
  hidden failures
- **AND** overlays SHALL remain runtime-only and SHALL NOT mutate source
  topology or stylesheet YAML

#### Scenario: Dedicated Operational Playbooks Are Follow-Up Work

- **WHEN** node health, service path SLO, or routing adjacency dashboards are
  needed
- **THEN** they SHALL be implemented as follow-up specs that reuse the Phase 4
  mapper foundation
- **AND** they SHALL NOT add hard-coded metric behavior to the panel in place of
  `*.mapper.tv.yaml`

#### Scenario: Documentation Covers End-To-End Workflow

- **WHEN** Grafana docs are added
- **THEN** they SHALL cover authoring in the browser harness or VS Code,
  authoring schema-backed `*.mapper.tv.yaml` with harness suggestions, creating
  bundles with canonical suffixes, mounting a bundle root into Grafana,
  selecting bundles, validating YAML inside Grafana, inspecting discovered
  topology objects, using mapper starter PromQL, mapping TopoViewer object
  IDs/labels to Prometheus labels, checking mapping coverage, injecting
  telemetry, observing visual changes, interacting with the panel, and
  troubleshooting

#### Scenario: Harness Is The Mapper Authoring Surface

- **WHEN** users need to create or correct `*.mapper.tv.yaml`
- **THEN** the browser harness or VS Code harness SHALL be the primary authoring
  surface
- **AND** Grafana SHALL validate and explain mapper/runtime state, but SHALL NOT
  be the only place where users discover mapper syntax or valid values.

#### Scenario: Production-Grade Grafana Docs Exist

- **WHEN** Phase 4 is considered ready for early adopters
- **THEN** docs SHALL include a five-minute happy path, bring-your-YAML path,
  mounted-bundle Docker path, mapper authoring guide, mapper reference,
  Prometheus label guide, panel options guide, mapping coverage guide,
  troubleshooting guide, and production-boundary explanation
- **AND** each major workflow SHALL state expected result and what to inspect.

#### Scenario: Failure Classes Are Documented

- **WHEN** telemetry does not change the rendered topology
- **THEN** docs and diagnostics SHALL help distinguish source loading failure,
  YAML parse failure, topology validation failure, mapper schema failure,
  unsupported overlay key, no query data, wrong frame shape, unmatched telemetry,
  stale object ID, duplicate mapping, ambiguous endpoint matching, version
  mismatch, and lab startup failure.

#### Scenario: Phase 4 Must Pass Production Gate Before Phase 5

- **WHEN** Phase 4 implementation appears feature-complete
- **THEN** it SHALL still rerun live Phase 4 Grafana smoke after the final
  mounted-bundle manifest and source-diagnostic changes
- **AND** it SHALL pass full `npm run ci`
- **AND** generated/build outputs SHALL be reviewed before commit
- **AND** Phase 4 SHALL be archived before Phase 5 implementation starts

### Requirement: Phase 5 Containerlab Telemetry Lab

TopoViewer SHALL introduce Containerlab only after the local Grafana mounted
bundle and mapper workflow is stable with deterministic telemetry.

#### Scenario: Containerlab Replaces Synthetic Telemetry After Mapper Stability

- **WHEN** Containerlab work is proposed
- **THEN** mounted bundle loading, mapper schema validation, mapper coverage,
  PromQL starters, and runtime overlays SHALL already work locally
- **AND** `implement-grafana-panel-phase-4` SHALL already be archived after its
  production readiness gate
- **AND** Containerlab SHALL be added as a separate local lab command/profile
  rather than as a dependency of the deterministic synthetic lab
- **AND** real lab telemetry SHALL still flow through `*.mapper.tv.yaml`
  instead of through hard-coded panel behavior
- **AND** the first Containerlab slice SHALL focus on link state and
  bidirectional utilization before broad NOC dashboard scope
- **AND** routing adjacency and node health overlays SHALL be deferred unless
  the selected lab exposes stable metrics without custom TopoViewer-specific
  telemetry normalization
- **AND** public production support SHALL wait for a pinned TopoViewer Grafana
  panel artifact and a fresh-checkout smoke using that artifact

#### Scenario: Containerlab Is An Advanced Proof

- **WHEN** Containerlab docs are published
- **THEN** they SHALL present Containerlab as an advanced real-telemetry proof
  after the synthetic mounted-bundle flow
- **AND** they SHALL include expected metric flow, expected screenshots, and
  inspection points in Prometheus, Grafana query frames, mapper coverage, and
  the rendered TopoViewer panel
- **AND** they SHALL NOT make Containerlab the first required adoption path.

### Requirement: Codespaces Is Decoupled From Grafana Roadmap

TopoViewer SHALL track Codespaces as a repo-wide development environment, not
as a Grafana-specific delivery phase.

#### Scenario: Codespaces Scope Lives In A Separate Change

- **WHEN** Codespaces work is proposed
- **THEN** the scope SHALL live under
  `openspec/changes/define-codespaces-dev-environment/`
- **AND** it SHALL cover MkDocs, Zensical, browser harness, synthetic Grafana,
  and Containerlab Grafana surfaces together
- **AND** the Grafana roadmap SHALL only define Grafana plugin and telemetry
  behavior, not the cloud development environment
