# OpenSpec Planning

This directory holds durable engineering plans for TopoViewer.

OpenSpec is used here as a lightweight project structure, not as a runtime dependency. Active design and implementation plans live under `openspec/changes/<change-id>/`; implemented plans move to `openspec/archive/<date>-<change-id>/`.

Current active plans:

- `changes/define-netbox-integration-roadmap/` - planned NetBox feasibility, use cases, first integration shape, and roadmap wording constraints.
- `changes/define-opsmill-infrahub-integration-roadmap/` - planned OpsMill/Infrahub feasibility, use cases, first integration shape, and roadmap wording constraints.
- `changes/define-grafana-integration-roadmap/` - planned Grafana feasibility, use cases, first integration shape, and roadmap wording constraints.
- `changes/define-vscode-integration-roadmap/` - planned VS Code feasibility, use cases, first integration shape, and roadmap wording constraints.

Current studies:

- None.

Archived plans:

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
