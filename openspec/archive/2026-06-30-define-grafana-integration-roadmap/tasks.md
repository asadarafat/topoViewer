## 1. Roadmap Refactor

- [x] 1.1 Split Grafana integration into explicit phases
- [x] 1.2 Keep this change as the roadmap and sequencing contract
- [x] 1.3 Move implementation detail into phase files
- [x] 1.4 Make Phase 1 the first executable slice
- [x] 1.5 Decouple Codespaces into the repo-wide `define-codespaces-dev-environment` OpenSpec

## 2. Phase 1: Panel Package And Harness Fixture Parity

- [x] 2.1 Define `packages/grafana-topoviewer-panel` package shape
- [x] 2.2 Define panel package build command and plugin metadata
- [x] 2.3 Define `harnessFixtureCatalog.ts` using browser-harness-compatible fixture discovery
- [x] 2.4 Define generated lab fixture projection from canonical harness fixtures
- [x] 2.5 Define `grafana:lab:list-fixtures` and `grafana:lab:sync-fixtures`
- [x] 2.6 Define Grafana fixture selector based on canonical harness fixture index
- [x] 2.7 Define Phase 1 smoke tests for all harness fixtures
- [x] 2.8 Define detailed Phase 1 assertions for `layered-network` and `clos-2spine-4leaf`

## 3. Phase 2: Prometheus Weathermap Vertical Slice

- [x] 3.1 Define pinned Grafana and Prometheus lab versions
- [x] 3.2 Define local Grafana/Prometheus/injector Docker Compose shape
- [x] 3.3 Define telemetry injector API and initial metrics
- [x] 3.4 Define `link-failure` and `healthy` injector scenarios
- [x] 3.5 Define telemetry rule contract for link utilization and link down state
- [x] 3.6 Define PromQL used by the Grafana weathermap panel
- [x] 3.7 Define Phase 2 smoke test from injector mutation to rendered link update
- [x] 3.8 Define artifact output under `.artifacts/grafana-lab/`

## 4. Phase 3: Interaction State

- [x] 4.1 Define runtime interaction state shape
- [x] 4.2 Define panel options for interaction enablement and persistence
- [x] 4.3 Define node drag and position override merge order
- [x] 4.4 Define reset behavior for position overrides
- [x] 4.5 Define telemetry refresh behavior while user interaction state exists
- [x] 4.6 Define Phase 3 tests for drag persistence and telemetry refresh non-race

## 5. Phase 4: Mounted Bundle Source And Mapper Foundation

- [x] 5.1 Define the generic SVG-first panel workflow ergonomics benchmark and why TopoViewer must not copy it
- [x] 5.2 Define mounted bundle source workflow for `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml`
- [x] 5.3 Define topology-native TopoViewer mapper behavior for IDs, labels, data, starter PromQL, and coverage diagnostics
- [x] 5.4 Define generic mapper-driven overlay adapters for node, link, path, region, layer, and graph targets
- [x] 5.5 Define mapping coverage and diagnostics before dedicated operational dashboards
- [x] 5.6 Defer polished node health, service path, and routing adjacency playbooks to follow-up implementation specs
- [x] 5.7 Define end-to-end authoring-to-Grafana-to-telemetry documentation
- [x] 5.8 Define object identity mapping docs for TopoViewer IDs/labels to Prometheus labels
- [x] 5.9 Define troubleshooting docs for source loading, YAML parsing, mapping, metric, refresh, version, and lab startup issues
- [x] 5.10 Define Phase 4 production readiness gate before archive or Phase 5 implementation
- [x] 5.11 Define mounted bundles as the production Grafana source and fixture mode as dev/demo/CI compatibility
- [x] 5.12 Define that `grafana:lab:up` must not require fixture sync/check for production-shaped mounted bundle startup
- [x] 5.13 Define early-adopter adoption gaps and explicitly reject maintainer-demo ergonomics as sufficient
- [x] 5.14 Define production-grade documentation requirements for quick start, bring-your-YAML, mapper authoring, Prometheus binding, mapping coverage, interaction behavior, and troubleshooting
- [x] 5.15 Define the harness as the primary mapper authoring surface and Grafana as the runtime validation surface
- [x] 5.16 Define screenshot-backed expected results and fresh-checkout validation as part of the adoption gate

## 6. Phase 5: Containerlab Telemetry Lab

- [x] 6.1 Define local Containerlab telemetry lab preconditions
- [x] 6.2 Define Containerlab-to-Prometheus-to-Grafana data flow
- [x] 6.3 Define narrow telemetry scope for link state, utilization, adjacency, and node health
- [x] 6.4 Define local start/destroy, mounted bundle, mapper coverage, and artifact acceptance criteria
- [x] 6.5 Keep Containerlab separate from the deterministic synthetic lab until Phase 4 is stable
- [x] 6.6 Define Phase 5 as blocked until Phase 4 production readiness and production hardening pass and are archived
- [x] 6.7 Record Phase 5 current status: local/upstream-candidate implementation exists, release-mode plugin artifact and fresh-checkout smoke remain before public production support
- [x] 6.8 Define Containerlab documentation as an advanced real-telemetry proof, not the first required adoption path
- [x] 6.9 Define Containerlab docs expectations for Prometheus, Grafana frames, mapper coverage, rendered overlays, and screenshots

## 7. Early-Adopter Ergonomics And Documentation

- [x] 7.1 Integrate the brutal adoption-gap audit into `openspec/changes/harden-public-adoption-readiness/audit.md`
- [x] 7.2 Define the first successful user journey from TopoViewer YAML to Grafana runtime overlay
- [x] 7.3 Define documentation as a product gate, not post-implementation polish
- [x] 7.4 Define explicit failure classes that docs and diagnostics must cover
- [x] 7.5 Define status language for experimental, lab, production-shaped, unsigned, signed, and supported Grafana states
- [x] 7.6 Define that public docs must not require source-code reading or monorepo-internal knowledge
- [x] 7.7 Record concrete static scrutiny findings: checked-in lab `.env`, anonymous Admin, unsigned plugin loading, broad port exposure risk, missing signed artifact story, audit advisories, and security test gaps
- [x] 7.8 Define a penetration-style test matrix for backend resources, mounted bundles, YAML, SVG, mapper templates, roles, storage, dependencies, and artifacts
- [x] 7.9 Define that lab-insecure defaults must be loudly labeled and must not be copy-paste production guidance

## 8. Validation

- [x] 8.1 Review `design.md` against all phase files
- [x] 8.2 Review `specs/grafana-integration-roadmap/spec.md` against phased implementation order
- [x] 8.3 Review Phase 1 scope to ensure it is buildable without Prometheus
- [x] 8.4 Review Phase 2 scope to ensure it is a narrow weathermap slice
- [x] 8.5 Review docs requirements for the full authoring-to-telemetry workflow
- [x] 8.6 Review the phase lifecycle: implement phase, validate, archive, create next phase spec, update roadmap only when findings require it
- [x] 8.7 Confirm Codespaces scope moved to `openspec/changes/define-codespaces-dev-environment/`
- [x] 8.8 Review early-adopter ergonomics requirements against Phase 4 and Phase 5 boundaries
- [x] 8.9 Run a static scrutiny pass over Grafana/lab/docs/security surfaces and record findings in the audit
- [x] 8.10 Run advisory checks and record that npm audit currently needs triage before production claims
