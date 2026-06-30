# Release Artifact Guardrails Evidence

Date: 2026-06-30

This note records the implemented artifact and dependency guardrails for the
public-adoption-readiness change. It is evidence for the release-artifact
integrity tasks, not a final production-ready sign-off.

## Implemented Checks

| Guardrail | Implementation | CI wiring |
| --- | --- | --- |
| npm package artifact autopsy | `scripts/check-release-artifacts.mjs --scope package` runs `npm pack --workspace topoviewer --dry-run --json --ignore-scripts`, validates required files, validates a package file allowlist, and scans text artifacts for local paths, private markers, private-key markers, stale URLs, and generated junk. | `npm run ci:package` after `npm run pack:check`. |
| Grafana plugin artifact autopsy | The same script validates `packages/grafana-topoviewer-panel/dist` as the release-zip staging directory: required `plugin.json`, `module.js`, logo, exactly one backend executable, plugin metadata, docs URL, allowlisted files, and denylisted text/path leakage. | `npm run ci:package` after `npm run grafana:panel:build`. |
| docs artifact autopsy | `scripts/check-release-artifacts.mjs --scope docs` scans the generated `site/` tree when present, validates key published routes, and rejects local/private references and generated junk. | `npm run ci:docs` after docs build, Zensical build, harness build, redirects, and docs smoke. |
| promotional media/public docs guardrail | The artifact script scans README, docs, package READMEs, `packages/topoviewer/docs`, and `docs/assets` so public content cannot reference local `.artifacts` media paths or checked-in junk such as `.DS_Store`. | `npm run ci:package` and `npm run ci:docs`. |
| npm dependency advisory triage | `scripts/check-dependency-advisories.mjs` keeps production `npm audit --omit=dev --audit-level=moderate` blocking and validates full-audit findings against the dependency-risk ledger. New package names or unexpected vulnerable install paths fail. | `npm run ci:public-readiness` and `.github/workflows/security.yml`. |
| security health report | `scripts/write-security-health-report.mjs` writes `.artifacts/security-health/security-health-report.md` with last run metadata, scanner job results, open findings, owners, and triage state. | `.github/workflows/security.yml` uploads `security-health-report` after dependency, secret, container, and OSV jobs. |

## Current Validation

Commands run locally under Node 24:

```bash
npm run dependency:advisories
npm run ci:public-readiness
npm run ci:package
npm run docs:build:fast
TOPOVIEWER_ZENSICAL_SKIP_VIEWER_BUILD=1 npm run zensical:build
npm run vscode:harness:build
npm run pages:redirects
npm run docs:smoke
npm run artifact:check:docs
```

Observed result:

- production npm audit is clean;
- full npm audit has six documented temporary Grafana transitive/dev-plugin
  findings and no untriaged findings;
- npm package artifact autopsy passed for 344 packed files;
- Grafana plugin artifact autopsy passed for 12 staged files;
- MkDocs wheel inspection passed;
- generated docs site smoke passed for MkDocs, Zensical, and the browser
  harness;
- generated docs artifact autopsy passed for 710 generated files.

`npm run ci:docs` was also run before commit and stopped at the generated-output
cleanliness gate because this change intentionally has uncommitted generated
projection files. That gate is expected to pass after these projections are
committed.

## Deliberate Remaining Work

- Grafana artifact signing, checksum guidance, SBOM policy, and version matrix
  remain separate release-readiness tasks.
- Package install dry-runs for public install commands remain open.
- Hostile-content and mounted-bundle abuse corpora remain open.
