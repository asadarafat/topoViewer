# Closeout

## Verification

- The implementation candidate is commit
  `56fed2daac8a630e49edcee509e56e6d71f12bdd`.
- `npm run ci` passed from a clean install and committed tree in 14m34.1s.
- Exact-SHA remote validation passed in
  [CI](https://github.com/asadarafat/topoviewer/actions/runs/29866375095),
  [Studio](https://github.com/asadarafat/topoviewer/actions/runs/29866375068),
  [Docs](https://github.com/asadarafat/topoviewer/actions/runs/29866375131),
  [Security](https://github.com/asadarafat/topoviewer/actions/runs/29866375709),
  [CodeQL](https://github.com/asadarafat/topoviewer/actions/runs/29866375781),
  and [Dependabot](https://github.com/asadarafat/topoviewer/actions/runs/29866468183).
- Strict OpenSpec validation and an isolated sequential archive simulation
  passed. The simulated merge added 10 requirements and modified 4.
- The prerequisite Studio baseline is archived at
  `openspec/archive/2026-07-21-build-topoviewer-studio/`.
- The final Visual/Code workflow was reviewed iteratively, and archive execution
  was explicitly approved on 2026-07-21.

## Remaining Risks

- Reusable selector authoring remains a Code workflow. This is intentional, but
  less discoverable than selection-scoped Visual editing.
- Exact-ID rules can grow large stylesheets. Rule reuse and empty-rule cleanup
  limit the growth but do not replace deliberate selector design.
- Source edits that cannot preserve YAML formatting still require an explicit
  normalization decision.
- Candidate and project dirty states remain separate and depend on clear status
  labels during conflict resolution.
- Dense-project and 1,000-node evidence covers the supported budget, not
  arbitrary graph sizes.

## Rollback

Revert the archive commit and its canonical-spec merge, then restore this change
under `openspec/changes/`. Runtime rollback does not require data conversion:
the stylesheet YAML remains authoritative and portable.
