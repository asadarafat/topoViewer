# OpenSpec Planning

This directory holds durable engineering plans for TopoViewer.

OpenSpec is used here as a lightweight project structure, not as a runtime dependency. Long-lived design and implementation plans live under `openspec/changes/<change-id>/` until they are implemented and archived.

Current active plans:

- `changes/implement-topology-attention-engine/` - topology attention engine SDD/TDD plan.

## Artifact Model

Each change follows the OpenSpec spec-driven shape:

- `proposal.md` - why the change exists and what capabilities it introduces.
- `specs/<capability>/spec.md` - requirements and scenarios.
- `design.md` - technical design decisions and trade-offs.
- `tasks.md` - test-first implementation checklist.

Keep public product docs high level. Put implementation detail, sequencing, acceptance criteria, and test strategy here.
