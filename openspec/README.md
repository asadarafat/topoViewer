# OpenSpec Planning

This directory holds durable engineering plans for TopoViewer.

OpenSpec is used here as a lightweight project structure, not as a runtime dependency. Active design and implementation plans live under `openspec/changes/<change-id>/`; implemented plans move to `openspec/archive/<date>-<change-id>/`.

Active plans are not public support claims. Treat `openspec/changes/**` as
engineering intent until the change is implemented, validated, archived, and
reflected in public docs with an explicit support-status label.

Current active plans:
- `changes/define-codespaces-dev-environment/` - planned Codespaces developer environment that can run local MkDocs, Zensical, TopoViewer Studio, Grafana lab, and Containerlab-Grafana workflows from a fresh cloud workspace.
- `changes/define-netbox-integration-roadmap/` - planned NetBox feasibility, use cases, first integration shape, and roadmap wording constraints.
- `changes/define-opsmill-infrahub-integration-roadmap/` - planned OpsMill/Infrahub feasibility, use cases, first integration shape, and roadmap wording constraints.
- `changes/restore-studio-yaml-authoring-discoverability/` - restoring visible, shared schema-aware Monaco context help across topology, stylesheet, and mapper Code workspaces while preserving lazy loading and browser/VS Code host parity.

Current studies:

- None.

Archived plans:

- `archive/2026-07-28-revamp-studio-material-workspace/` - implemented the
  Dieter Rams and Material UI Studio revamp with native Light/Dark appearance,
  contextual Add/Properties/Mapper navigation, theme-aware viewport
  preferences, and measured visual, accessibility, and performance validation.
- `archive/2026-07-21-adopt-canonical-object-identity/` - implemented canonical
  `id` identity, optional `labels.name` aliases, strict topology/stylesheet
  ownership, deterministic style specificity, loss-aware `0.1` to `0.2`
  migration, and atomic cross-document Studio rename behavior.
- `archive/2026-07-21-add-studio-basic-yaml-style-workspace/` - implemented one
  loss-aware stylesheet candidate shared by `Edit > Visual` and `Edit > Code`,
  exact-ID selection editing, contextual YAML intelligence, a dense MUI property
  workspace, source-preserving Apply/Revert, and measured accessibility and
  performance gates.
- `archive/2026-07-21-harden-studio-material-authoring/` - implemented the
  Material UI Studio control system, standalone text objects, schema-driven
  color controls, shared object resizing, direct label editing, and measured
  browser/VS Code parity without coupling Material UI to the core renderer.
- `archive/2026-07-21-build-topoviewer-studio/` - implemented the browser
  Studio Beta Preview with a portable, lossless authoring model; a typed shared
  host contract; direct canvas manipulation; metadata-driven style and mapper
  controls; persistence and export workflows; measured production gates; and
  retirement of the legacy browser authoring surface.
- `archive/2026-07-21-stabilize-core-studio-boundaries/` - implemented
  explicit core package artifacts and consumer contracts, one-way Studio
  feature boundaries, packed-package verification, lazy optional workspaces,
  and evidence-gated interaction performance.
- `archive/2026-07-09-add-canvas-native-graph-authoring/` - implemented
  canvas-native browser authoring with tool palette, click-to-create,
  drag-to-connect, direct geometry edits, regions, annotations, marquee
  selection, clipboard, alignment, documentation, and CRUD permutation
  coverage while keeping TopoViewer YAML as the source of truth.
- `archive/2026-07-09-harden-workspace-integration-boundaries/` - implemented
  explicit `topoviewer/integration` ownership, migrated authoring consumers away
  from sibling source imports, enforced dependency direction, and documented
  application, adapter, deployment, and security boundaries.
- `archive/2026-07-06-harden-react-performance-surface/` - implemented React authoring-surface performance hardening with lazy Monaco/YAML authoring, MUI import boundaries, authoring/webview bundle budgets, profiled `WebviewApp` state splits, safe browser storage helpers, focused validation, and CI coverage.
- `archive/2026-07-06-add-helper-lines/` - implemented React Flow style helper-line interaction for draggable TopoViewer objects, including runtime-only API, pure alignment geometry, optional live snapping, viewport-correct overlays, browser/Grafana integration boundaries, evidence-gated implementation, and full validation.
- `archive/2026-07-05-add-global-label-collision-layout/` - implemented deterministic label placement across node, node meta, region, edge, endpoint, and link-direction labels, including link-direction styling contract hardening, auto-placement and collision-policy style keys, dense CLOS/Grafana docs, screenshot coverage, focused checks, and full CI validation.
- `archive/2026-07-05-add-card-node-layout/` - implemented ergonomic `nodeLayout.type: card` support for round-rectangle nodes with schema/compiler/renderer/YAML assist coverage, card shell badge/status behavior, Turbo-style examples, cross-surface screenshots, focused tests, renderer parity, docs lint, and full CI validation evidence.
- `archive/2026-07-03-speed-up-ci-feedback-loop/` - implemented measured CI timing instrumentation, remote public-readiness dedupe, split GitHub CI feedback lanes, branch concurrency cancellation, failure artifacts per lane, and remote validation showing CI reduced from 687s to 449s without removing package, docs, security, or public-readiness coverage.
- `archive/2026-07-02-clean-root-tooling-surface/` - implemented first-pass root cleanup with repo-level local artifact ignore coverage, maintainer root-shape documentation, docs/sync/Grafana/lint dispatchers, safe internal alias reduction from 115 to 96 root scripts, generated Zensical nav sync, and full local CI validation.
- `archive/2026-07-01-harden-public-adoption-readiness/` - implemented public repository and documentation hardening for the `0.1.0` early-adopter path, including npm publication, README/docs conversion path, curated examples, renderer parity, mapper authoring ergonomics, security guardrails, artifact autopsy, and remote CI/Docs/Security/CodeQL verification.
- `archive/2026-07-01-publish-promo-video-hosted-asset/` - deprecated before implementation because the public README should favor the checked-in YAML-to-graph collage while generated video/GIF/MP4 files remain local-only review artifacts.
- `archive/2026-07-01-harden-link-direction-lanes/` - implemented production hardening for direction lane geometry, physical parallel-link behavior, direction-specific interaction, attention, mapper coverage, mounted-bundle examples, and cross-surface parity.
- `archive/2026-06-29-add-link-direction-lanes/` - implemented Phase 1 directional lane primitive for bidirectional telemetry on one physical link, including `link.directions`, `linkDirection` selectors, straight shared-corridor rendering, marker trimming, parent-label avoidance, mapper overlays, docs, and examples.
- `archive/2026-06-28-implement-grafana-panel-phase-4-production-hardening/` - implemented mounted-bundle production defaults, explicit fixture compatibility dashboards, refresh-driven bundle reloads, editable local dashboards, and final Phase 4 readiness hardening.
- `archive/2026-06-28-implement-grafana-panel-phase-4/` - implemented mounted bundle and mapper foundation for `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml` Grafana workflows.
- `archive/2026-06-28-implement-grafana-panel-phase-3/` - implemented Grafana runtime interaction state for pan, zoom, selection, focus, and dragged node position persistence.
- `archive/2026-06-28-implement-grafana-panel-phase-2/` - implemented local Grafana/Prometheus weathermap vertical slice with deterministic synthetic telemetry.
- `archive/2026-06-28-implement-grafana-panel-phase-1/` - implemented first Grafana executable slice with panel package scaffold, canonical fixture parity, fixture selector, generated fixture projection, and pinned local Grafana smoke.
- `archive/2026-06-27-centralize-style-defaults-registry/` - implemented canonical style defaults metadata so runtime, docs, schema checks, semantic lint, YAML assist, and authoring metadata use the same style key/default contract.
- `archive/2026-06-27-make-default-node-shape-rectangle/` - implemented rectangle as the default node shape, aspect-locked square/circle validation, shared body box sizing, docs, YAML assist, examples, and CI validation.
- `archive/2026-06-27-make-docs-production-grade/` - implemented production-grade documentation IA, guides, complete references, richer examples, integration handbooks, docs quality gates, full CI validation, and visual MkDocs/Zensical review.
- `archive/2026-06-27-restore-renderer-surface-parity/` - implemented shared composition, viewport scale, shape semantics, region bounds, CSS geometry isolation, and renderer parity checks so browser, MkDocs, and Zensical surfaces render the same topology/style YAML consistently.
- `archive/2026-06-26-stabilize-ci-docs-test-strategy/` - implemented observable, deterministic CI/Docs test strategy hardening for local/GitHub parity, generated artifacts, Playwright stability, command taxonomy, stress policy, and Pages validation.
- `archive/2026-06-26-normalize-public-docs-url-layout/` - implemented lowercase public repository/Pages URL contract and combined MkDocs, Zensical, and browser deployment layout.
- `archive/2026-06-26-make-content-root-canonical/` - implemented single editable `packages/topoviewer/content/**` source root with generated docs/example projections, canonical "Topology as Code" product messaging, and duplicate fixture cleanup.
- `archive/2026-06-26-implement-graph-clos-layout-directive/` - implemented generic, inference-driven CLOS graph layout directive with multi-stage support and optional stage/group hints.
- `archive/2026-06-26-add-label-z-index-style-control/` - implemented canonical `labelZIndex` style control for independent label draw order across dense topology views.
- `archive/2026-06-21-improve-vscode-yaml-authoring-intelligence/` - implemented semantic Inspect simplification, schema-derived Monaco YAML suggestions, selected-object style rule discovery, and exhaustive style key/value regression coverage.
- `archive/2026-06-21-improve-vscode-style-value-editor/` - implemented type-aware Inspect style value editor for enum, boolean, number, color, and text style values.
- `archive/2026-06-20-define-vscode-integration-roadmap/` - implemented experimental VS Code extension package, browser authoring use cases, and release-boundary wording constraints.
- `archive/2026-06-20-publish-visual-product-story/` - implemented visual first impression, before/after demo, Why TopoViewer section, integration roadmap, and real network demo page.
- `archive/2026-06-20-add-region-label-placement/` - implemented explicit region label anchors, margins, validation, docs, and examples.
- `archive/2026-06-20-enhance-node-style-controls/` - implemented practical node styling for labels, borders, outlines, underlays, icon fit, aggregate badges, and status markers.
- `archive/2026-06-20-enhance-edge-style-controls/` - implemented practical edge styling for arrows, labels, endpoint spacing, routing, gradients, and interaction flags.
- `archive/2026-06-20-implement-parallel-zensical-docs/` - implemented parallel Zensical documentation build and GitHub Pages publishing.
- `archive/2026-06-19-implement-declarative-node-shapes/` - implemented declarative node shape style support.
- `archive/2026-06-19-make-camelcase-canonical-style-keys/` - implemented canonical camelCase style key casing.
- `archive/2026-06-19-implement-topology-attention-engine/` - implemented topology attention engine SDD/TDD plan.

## Artifact Model

Each change follows the OpenSpec spec-driven shape:

- `proposal.md` - why the change exists and what capabilities it introduces.
- `specs/<capability>/spec.md` - requirements and scenarios.
- `design.md` - technical design decisions and trade-offs.
- `tasks.md` - test-first implementation checklist.

Keep public product docs high level. Put implementation detail, sequencing, acceptance criteria, and test strategy here.
