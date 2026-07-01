# Finalize Public Adoption Readiness Closeout

## Why

`harden-public-adoption-readiness` has local implementation evidence, but two
gates intentionally require a reviewed committed tree: full `npm run ci` without
generated-output drift and archive of the hardening change after validation.

## What Changes

- Commit the reviewed hardening patch set.
- Run full `npm run ci` from the committed tree.
- Push and verify remote CI/Docs.
- Archive `openspec/changes/harden-public-adoption-readiness` only after clean
  local/remote validation and any remaining promo-video hosting decision.

## Out Of Scope

- Adding more adoption-readiness scope unless validation reveals a concrete
  blocker.
- Publishing npm packages or Grafana plugins.
