# Validation Run Evidence

Date: 2026-06-30

## Passed

```bash
npm run docs:lint
npm run check:object-reference
npm run examples:audit
npm run docs:build:fast
TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD=1 npm run zensical:build
npm run vscode:harness:build
npm run pages:redirects
npm run docs:smoke
npm run render:parity
npm run test:hostile-content
npm --workspace grafana-topoviewer-panel run test
npm run api:check
npm run artifact:check:docs
npm run dependency:advisories
npm run go:vulncheck
npm run security:health-report
npm run check:public-readiness
npm run ci:public-readiness
git diff --check
```

## Notes

- `npm run render:parity` passed for harness, MkDocs, and Zensical representative fixtures with `0.0000` visual diff.
- `npm run render:parity` was rerun twice after hardening parity page navigation and passed both runs.
- `npm run ci:public-readiness` passed after the parity hardening. It covered docs lint, object reference drift, curated examples, renderer parity, hostile content, npm pack dry-run, install dry-run, Grafana plugin build/artifact checks, dependency advisories, Go vulnerability checks, security health report generation, and public readiness guardrails.
- `git diff --check` passed.
- `npm run ci:docs` was started but stopped at the generated-asset drift guard because `packages/mkdocs-topoviewer/mkdocs_topoviewer/assets/topoviewer-embed.css` changed after `sync:mkdocs-assets`. That generated asset is intentionally part of the current patch set and should pass the guard after the patch is committed or the guard is run in a clean checkout.
- Full `npm run ci` remains a final gate because the current worktree intentionally contains uncommitted implementation and generated-output changes.
