# Public Adoption Readiness Report

Date: 2026-07-01

## Recommendation

Go for local review. No-go for archiving or public release until the remaining
post-review gates below are completed. The repo is now shaped like a serious
`0.1.0` early-adopter release candidate, but it is still blocked from public
launch until npm installability, first-screen focus, demo-gallery breadth,
public API hardening, and Node compatibility decisions are closed.

## Completed Evidence

| Area | Evidence |
| --- | --- |
| Product entry point and README | `README.md`, `packages/topoviewer/content/pages/_fragments/*`, `docs/assets/topoviewer-yaml-to-graph-collage.png` |
| V0.1 adoption audit alignment | `audit.md`, `proposal.md`, `tasks.md` section 25, `specs/public-adoption-readiness/spec.md`, `spec-traceability.md` |
| Canonical docs/reference split | `evidence/docs-reference-split.md`, `packages/topoviewer/content/pages/stylesheet-reference.md`, `packages/topoviewer/content/pages/topology-model.md` |
| Harness mapper authoring | `packages/vscode-topoviewer/src/webview/mapperRuleBuilder.ts`, `packages/vscode-topoviewer/tests/harness.spec.ts` |
| Grafana mounted bundle contract | `evidence/grafana-mounted-bundle-contract.md`, `evidence/grafana-phase-4-smoke.md` |
| Performance and accessibility | `evidence/performance-budget-evidence.md`, `packages/topoviewer/tests/fixtures/accessibility-runtime.html` |
| Promo local recording | `evidence/promo-recording-evidence.md` |
| Renderer parity | `evidence/render-parity-evidence.md`, `.artifacts/render-parity/` local screenshots |
| Security and abuse resistance | `evidence/security-surface-inventory.md`, `evidence/backend-security-hardening.md`, `evidence/validation-run-2026-06-30.md` |
| Validation run | `evidence/validation-run-2026-06-30.md` |

## Passed Validation

```bash
npm run docs:lint
npm run docs:build:fast
TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD=1 npm run zensical:build
npm run docs:smoke
npm run vscode:harness:build
npm run render:parity
npm run render:parity
npm run ci:public-readiness
git diff --check
```

Additional targeted checks listed in `evidence/validation-run-2026-06-30.md`
also passed.

## Deferred Gates

| Gate | Decision | Owner |
| --- | --- | --- |
| Hosted promo video upload | Deferred to `openspec/changes/publish-promo-video-hosted-asset` because durable GitHub media upload requires review and public hosting after publication. | Maintainer |
| Rendered GitHub README video playback | Deferred to `openspec/changes/publish-promo-video-hosted-asset` because it requires a pushed branch and GitHub-rendered README. | Maintainer |
| V0.1 public product launch focus | Tasks 25.4-25.18 remain open: first-screen simplification, secondary-surface demotion, npm publish or explicit adoption block, `v0.1.0` release, badges, demo gallery, API hardening, Node compatibility, adoption baseline, and later `1.0.0` gate. | Maintainer |
| Full `npm run ci` clean pass | Not run to completion in this dirty review worktree because generated-output guards intentionally fail until the generated outputs are committed. Run after review commit. | Maintainer |
| Archive `harden-public-adoption-readiness` | Not archived in this patch. Archive only after full clean CI and the deferred hosted-video checks are complete or explicitly accepted. | Maintainer |

## Accepted Risk

- Grafana SDK advisories remain documented temporary dev/tooling risks. The
  production audit is clean, and the risk ledger blocks undocumented advisories.
- `site/`, `.artifacts/`, package `dist/`, and Grafana plugin build outputs are
  local/generated artifacts and are not committed.

## Remaining Decision

The repo is substantially better for early-adopter review, but it is not yet a
public-release green light. The next decision is whether to commit this patch
set, continue tasks 25.4-25.18, run full `npm run ci` from the committed tree,
then complete the hosted promo video follow-up.
