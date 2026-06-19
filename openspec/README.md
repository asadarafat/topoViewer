# OpenSpec Planning

This directory holds durable engineering plans for TopoViewer.

OpenSpec is used here as a lightweight project structure, not as a runtime dependency. Active design and implementation plans live under `openspec/changes/<change-id>/`; implemented plans move to `openspec/archive/<date>-<change-id>/`.

Current active plans:

- `changes/implement-declarative-node-shapes/` - declarative node shape style support.
- `changes/make-camelcase-canonical-style-keys/` - make camelCase the canonical public style key casing.

Archived plans:

- `archive/2026-06-19-implement-topology-attention-engine/` - implemented topology attention engine SDD/TDD plan.

## Artifact Model

Each change follows the OpenSpec spec-driven shape:

- `proposal.md` - why the change exists and what capabilities it introduces.
- `specs/<capability>/spec.md` - requirements and scenarios.
- `design.md` - technical design decisions and trade-offs.
- `tasks.md` - test-first implementation checklist.

Keep public product docs high level. Put implementation detail, sequencing, acceptance criteria, and test strategy here.
