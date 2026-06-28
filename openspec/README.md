# OpenSpec Planning

This directory holds durable engineering plans for TopoViewer.

OpenSpec is used here as a lightweight project structure, not as a runtime dependency. Active design and implementation plans live under `openspec/changes/<change-id>/`; implemented plans move to `openspec/archive/<date>-<change-id>/`.

Current active plans:

- `changes/define-netbox-integration-roadmap/` - planned NetBox feasibility, use cases, first integration shape, and roadmap wording constraints.
- `changes/define-opsmill-infrahub-integration-roadmap/` - planned OpsMill/Infrahub feasibility, use cases, first integration shape, and roadmap wording constraints.
- `changes/define-grafana-integration-roadmap/` - phased Grafana feasibility roadmap covering panel/harness parity, Prometheus weathermap, interactive runtime state, mounted bundle mapper foundation, Containerlab telemetry, and later Codespaces portability.
- `changes/implement-grafana-panel-phase-1/` - planned first Grafana executable slice: panel package scaffold, canonical harness fixture parity, fixture selector, generated fixture projection, and pinned local Grafana smoke.
- `changes/implement-grafana-panel-phase-2/` - local Grafana/Prometheus weathermap vertical slice with deterministic synthetic telemetry.
- `changes/implement-grafana-panel-phase-3/` - Grafana runtime interaction state for pan, zoom, selection, focus, and dragged node positions.
- `changes/implement-grafana-panel-phase-4/` - mounted bundle and mapper foundation for `*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml` workflows.
- `changes/implement-grafana-containerlab-phase-5/` - planned Containerlab telemetry lab that reuses the mounted bundle mapper workflow.

Current studies:

- None.

Archived plans:

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
