# Public Adoption Readiness Report

Date: 2026-07-01

## Recommendation

Go for early-adopter review and archive this OpenSpec. The repo now has a live
npm package, a `v0.1.0` prerelease, a first-screen install/render/embed path, a
non-network curated example, explicit MkDocs Python publication deferral, a
documented pre-1.0 API/Node compatibility boundary, full local `npm run ci`
evidence, pushed GitHub CI/Docs/Security/CodeQL evidence, and visual evidence
for the docs conversion path.

## Completed Evidence

| Area | Evidence |
| --- | --- |
| Product entry point and README | `README.md`, `packages/topoviewer/content/pages/_fragments/*`, `docs/assets/topoviewer-yaml-to-graph-collage.png` |
| V0.1 adoption audit alignment | `audit.md`, `proposal.md`, `tasks.md` section 25, `specs/public-adoption-readiness/spec.md`, `spec-traceability.md` |
| Docs conversion audit alignment | `audit.md`, `tasks.md` section 26, `specs/public-adoption-readiness/spec.md`, `spec-traceability.md` |
| Closeout gate integration | `tasks.md` section 27, `specs/public-adoption-readiness/spec.md`, `spec-traceability.md` |
| First public npm install | `evidence/manual-publish-readiness.md`, `evidence/adoption-baseline-2026-07-01.md`, `README.md`, `packages/topoviewer/README.md` |
| API/Node compatibility boundary | `evidence/public-api-stability-target.md`, `evidence/node-compatibility-decision.md`, `packages/topoviewer/content/pages/reference/typescript-api.md`, `packages/topoviewer/content/pages/reference/compatibility.md` |
| MkDocs Python package deferral | `evidence/mkdocs-python-package-decision.md`, `packages/topoviewer/content/pages/embed/mkdocs.md`, `scripts/check-install-commands.mjs` |
| Non-network curated example | `evidence/demo-gallery-backlog.md`, `packages/topoviewer/content/examples/integration/kubernetes-service-map/`, `packages/topoviewer/content/pages/examples/examples-gallery.md` |
| Docs visual review | `evidence/docs-visual-review-2026-07-01.md`, `.artifacts/public-adoption-visual-review/` local screenshots |
| MkDocs/Zensical live viewport path fix | `packages/mkdocs-topoviewer/mkdocs_topoviewer/plugin.py`, `scripts/sync-zensical-docs.mjs`, `evidence/docs-visual-review-2026-07-01.md` |
| Canonical docs/reference split | `evidence/docs-reference-split.md`, `packages/topoviewer/content/pages/stylesheet-reference.md`, `packages/topoviewer/content/pages/topology-model.md` |
| Harness mapper authoring | `packages/vscode-topoviewer/src/webview/mapperRuleBuilder.ts`, `packages/vscode-topoviewer/tests/harness.spec.ts` |
| Grafana mounted bundle contract | `evidence/grafana-mounted-bundle-contract.md`, `evidence/grafana-phase-4-smoke.md` |
| Performance and accessibility | `evidence/performance-budget-evidence.md`, `packages/topoviewer/tests/fixtures/accessibility-runtime.html` |
| Promo local recording | `evidence/promo-recording-evidence.md` |
| Renderer parity | `evidence/render-parity-evidence.md`, `.artifacts/render-parity/` local screenshots |
| Security and abuse resistance | `evidence/security-surface-inventory.md`, `evidence/backend-security-hardening.md`, `evidence/validation-run-2026-06-30.md` |
| Validation run | `evidence/validation-run-2026-06-30.md`, `evidence/validation-run-2026-07-01.md` |

## Passed Validation

```bash
npm run docs:lint
npm run docs:build:fast
TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD=1 npm run zensical:build
npm run docs:smoke
npm run vscode:harness:build
npm run render:parity
npm run render:parity
npm run ci
npm run ci:public-readiness
git diff --check
git push origin development
```

Additional targeted checks listed in `evidence/validation-run-2026-06-30.md`
and `evidence/validation-run-2026-07-01.md` also passed.

## Deferred Gates

| Gate | Decision | Owner |
| --- | --- | --- |
| Hosted promo video upload | Deprecated before implementation. The release media path is collage-first, using `docs/assets/topoviewer-yaml-to-graph-collage.png`; generated video/GIF/MP4 files remain local-only review artifacts. | Maintainer |
| Rendered GitHub README media verification | Verify the checked-in collage renders from the pushed GitHub README. Hosted animated playback is not a release gate. | Maintainer |

## Remote Closeout

Pushed head `d7e403ff5c37ac4704e21b35d84595691e9f87cc` passed:

| Workflow | Run ID | Result |
| --- | --- | --- |
| CI | `28533414204` | success |
| Docs | `28533414225` | success |
| Security | `28533414677` | success |
| CodeQL | `28533414070` | success |

## Accepted Risk

- Grafana SDK advisories remain documented temporary dev/tooling risks. The
  production audit is clean, and the risk ledger blocks undocumented advisories.
- `site/`, `.artifacts/`, package `dist/`, and Grafana plugin build outputs are
  local/generated artifacts and are not committed.

## Remaining Decision

The repo is substantially better for early-adopter review. Archive this
OpenSpec and continue future hardening through focused follow-up changes rather
than keeping this umbrella change open.
