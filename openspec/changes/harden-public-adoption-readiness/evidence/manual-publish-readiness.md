# Manual Publish And Install Readiness Evidence

Date: 2026-06-30

This note records the public package install and manual npm publishing guardrails.

## Implemented Checks

| Guardrail | Implementation | Result |
| --- | --- | --- |
| Canonical install command | `scripts/check-install-commands.mjs` scans public docs for `npm install ... topoviewer` drift and requires the canonical command: `npm install topoviewer @xyflow/react react react-dom`. | Implemented. |
| Local tarball install dry-run | The same script builds `packages/topoviewer`, packs a local tarball with `npm pack --ignore-scripts`, installs it into a temporary consumer app with React, React DOM, and React Flow peers, then verifies ESM, CommonJS, CSS, and schema exports. | `npm run install:check` passed. |
| CI package lane | `scripts/ci.mjs` runs `npm run install:check` in the package lane before artifact checks. | Implemented. |
| Manual-only npm publish workflow | `.github/workflows/npm-publish.yml` is triggered only by `workflow_dispatch`, defaults to dry-run, requires an explicit version and dist-tag, runs `npm run ci`, re-runs release package gates, and uses npm provenance. | Implemented. |
| No push/PR publish guard | `scripts/check-public-readiness.mjs` fails if a workflow containing `npm publish` is triggered by `push` or `pull_request`, lacks dry-run/provenance/token/dist-tag controls, or omits release gates. | Implemented. |
| First package feedback intake | `.github/ISSUE_TEMPLATE/package_release_feedback.yml` captures install command, package version, package manager, Node version, and expected/actual behavior. | Implemented. |

## Manual Publish Contract

The public npm package name is `topoviewer`.

The first release should use `next` unless maintainers explicitly decide that
the stable public package contract is ready for `latest`.

The manual workflow requires:

- committed package version matching the workflow input;
- `npm run ci`;
- `npm run install:check`;
- `npm run artifact:check:package`;
- `npm run dependency:advisories`;
- npm provenance via `--provenance`;
- explicit npm dist-tag;
- `NPM_TOKEN` only for a real non-dry-run publish.

## Current Validation

Commands run locally under Node 24:

```bash
npm run install:check
npm run ci:public-readiness
```

Observed result:

- local tarball consumer install passed;
- ESM and CommonJS imports passed;
- CSS and schema export resolution passed;
- public-readiness guardrails passed.

The actual npm upload remains a maintainer decision. Normal push, pull request,
docs, and scheduled workflows validate but do not publish.
