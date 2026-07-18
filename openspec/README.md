# OpenSpec Planning

This directory holds durable engineering plans for TopoViewer.

OpenSpec is used here as a lightweight project structure, not as a runtime dependency. Active design and implementation plans live under `openspec/changes/<change-id>/`; implemented plans move to `openspec/archive/<date>-<change-id>/`.

Active plans are not public support claims. Treat `openspec/changes/**` as
engineering intent until the change is implemented, validated, archived, and
reflected in public docs with an explicit support-status label.

Current active plans:
- `changes/adopt-canonical-object-identity/` - implementation of canonical
  `id` identity, optional `labels.name` aliases, strict topology/stylesheet
  ownership, loss-aware `0.1` migration, and atomic cross-document Studio
  rename behavior.
- `changes/add-studio-basic-yaml-style-workspace/` - implementation of one
  loss-aware candidate stylesheet shared by Studio Basic controls and contextual
  YAML authoring, with exact-ID rules, latest-valid preview, Apply/Revert,
  recovery, accessibility, and measured dense-project gates.
- `changes/harden-studio-material-authoring/` - production hardening for the
  Material UI Studio surface, standalone text objects, schema-driven color
  controls, shared resizing, direct double-click editing, and measured
  browser/VS Code parity.
- `changes/build-topoviewer-studio/` - planned production-grade, canvas-first
  TopoViewer authoring product with drag-to-create workflows, complete
  specification-driven style and mapper controls, lossless YAML editing, shared
  browser/VS Code behavior, measured production gates, and a reversible Harness
  migration.
- `changes/define-codespaces-dev-environment/` - planned Codespaces developer environment that can run local MkDocs, Zensical, browser harness, Grafana lab, and Containerlab-Grafana workflows from a fresh cloud workspace.
- `changes/define-netbox-integration-roadmap/` - planned NetBox feasibility, use cases, first integration shape, and roadmap wording constraints.
- `changes/define-opsmill-infrahub-integration-roadmap/` - planned OpsMill/Infrahub feasibility, use cases, first integration shape, and roadmap wording constraints.

Current studies:

- None.

Archived plans:

- `archive/2026-07-09-add-canvas-native-graph-authoring/` - implemented
  canvas-native Harness authoring with tool palette, click-to-create,
  drag-to-connect, direct geometry edits, regions, annotations, marquee
  selection, clipboard, alignment, documentation, and CRUD permutation
  coverage while keeping TopoViewer YAML as the source of truth.
- `archive/2026-07-09-harden-workspace-integration-boundaries/` - implemented
  explicit `topoviewer/integration` ownership, migrated Harness consumers away
  from sibling source imports, enforced dependency direction, and documented
  application, adapter, deployment, and security boundaries.
- `archive/2026-07-09-stabilize-harness-drag-feedback/` - implemented smooth
  drag feedback with frame-scheduled helper lines, stable commit-time snapping,
  final-position persistence, and browser-level regression coverage.
- `archive/2026-07-06-harden-react-performance-surface/` - implemented React authoring-surface performance hardening with lazy Monaco/YAML authoring, MUI import boundaries, Harness/webview bundle budgets, profiled `WebviewApp` state splits, safe browser storage helpers, focused validation, and CI coverage.
- `archive/2026-07-06-add-helper-lines/` - implemented React Flow style helper-line interaction for draggable TopoViewer objects, including runtime-only API, pure alignment geometry, optional live snapping, viewport-correct overlays, browser harness/Grafana integration boundaries, evidence-gated implementation, and full validation.
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
- `archive/2026-06-28-implement-grafana-panel-phase-1/` - implemented first Grafana executable slice with panel package scaffold, canonical harness fixture parity, fixture selector, generated fixture projection, and pinned local Grafana smoke.
- `archive/2026-06-27-centralize-style-defaults-registry/` - implemented canonical style defaults metadata so runtime, docs, schema checks, semantic lint, YAML assist, and harness metadata use the same style key/default contract.
- `archive/2026-06-27-make-default-node-shape-rectangle/` - implemented rectangle as the default node shape, aspect-locked square/circle validation, shared body box sizing, docs, YAML assist, examples, and CI validation.
- `archive/2026-06-27-make-docs-production-grade/` - implemented production-grade documentation IA, guides, complete references, richer examples, integration handbooks, docs quality gates, full CI validation, and visual MkDocs/Zensical review.
- `archive/2026-06-27-restore-renderer-surface-parity/` - implemented shared composition, viewport scale, shape semantics, region bounds, CSS geometry isolation, and renderer parity checks so harness, MkDocs, and Zensical render the same topology/style YAML consistently.
- `archive/2026-06-26-stabilize-ci-docs-test-strategy/` - implemented observable, deterministic CI/Docs test strategy hardening for local/GitHub parity, generated artifacts, Playwright stability, command taxonomy, stress policy, and Pages validation.
- `archive/2026-06-26-normalize-public-docs-url-layout/` - implemented lowercase public repository/Pages URL contract and combined MkDocs, Zensical, and harness deployment layout.
- `archive/2026-06-26-make-content-root-canonical/` - implemented single editable `packages/topoviewer/content/**` source root with generated docs/example projections, canonical "Topology as Code" product messaging, and duplicate fixture cleanup.
- `archive/2026-06-26-implement-graph-clos-layout-directive/` - implemented generic, inference-driven CLOS graph layout directive with multi-stage support and optional stage/group hints.
- `archive/2026-06-26-add-label-z-index-style-control/` - implemented canonical `labelZIndex` style control for independent label draw order across dense topology views.
- `archive/2026-06-25-harden-vscode-harness-authoring-ux/` - implemented browser harness and VS Code authoring UX hardening for real PNG export, schema-backed YAML assist, reliable keyboard behavior, candidate/apply editing, durable diagnostics, and remote CI validation.
- `archive/2026-06-21-improve-vscode-yaml-authoring-intelligence/` - implemented semantic Inspect simplification, schema-derived Monaco YAML suggestions, selected-object style rule discovery, and exhaustive style key/value regression coverage.
- `archive/2026-06-21-improve-vscode-style-value-editor/` - implemented type-aware Inspect style value editor for enum, boolean, number, color, and text style values.
- `archive/2026-06-21-improve-vscode-harness-workspace-persistence/` - implemented browser harness template/custom topology persistence and YAML copy workflow.
- `archive/2026-06-21-fix-vscode-harness-panel-alignment/` - implemented harness rail, panel, tab, and editor alignment fixes from the UI audit.
- `archive/2026-06-21-improve-vscode-harness-relationship-authoring/` - implemented explicit Connection/Path authoring, relationship editing, node-position persistence, Inspect sync, editor diagnostics, and Playwright coverage.
- `archive/2026-06-21-improve-vscode-harness-ui/` - implemented resizable canvas-first harness layout, compact Build/Inspect/YAML/Attention/Layers authoring rail, structured object insertion, Attention editing, fixtures, and Playwright coverage.
- `archive/2026-06-20-define-vscode-integration-roadmap/` - implemented experimental VS Code extension package, browser harness, use cases, and release-boundary wording constraints.
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
