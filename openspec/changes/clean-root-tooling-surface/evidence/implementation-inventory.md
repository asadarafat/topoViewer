# Implementation Inventory

## Root Entry Baseline

Tracked entries retained at root:

| Entry | Classification | Decision |
|---|---|---|
| `.github/` | GitHub automation | Keep |
| `.gitignore` | repository ignore policy | Keep |
| `.node-version`, `.nvmrc`, `.npmrc` | runtime/install hints | Keep |
| `.dependency-cruiser.cjs`, `.jscpd.json`, `.oxlintrc.json` | tool config | Keep |
| `CHANGELOG.md`, `LICENSE`, `README.md`, `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`, `CODEOWNERS` | public metadata | Keep |
| `package.json`, `package-lock.json` | npm workspace root | Keep |
| `docs/`, `mkdocs.yml`, `zensical.toml` | documentation source/config | Keep |
| `packages/` | package workspaces | Keep |
| `labs/` | lab/demo workflows | Keep |
| `scripts/` | automation implementation | Keep |
| `openspec/` | durable engineering plans | Keep |

Visible local/generated entries and repo ignore coverage after implementation:

| Entry | Ignore source | Decision |
|---|---|---|
| `.artifacts/` | repo `.gitignore` | already covered |
| `.agents/` | repo `.gitignore` | added repo-level coverage |
| `.cache/` | repo `.gitignore` | added repo-level coverage |
| `.donotpush/` | repo `.gitignore` | already covered |
| `.vscode/` | repo `.gitignore` | added repo-level coverage instead of relying on `.git/info/exclude` |
| `.venv-docs/`, `.venv-zensical/` | repo `.gitignore` via `.venv*/` | already covered |
| `site/` | repo `.gitignore` | already covered |
| `node_modules/` | repo `.gitignore` | already covered |
| `.DS_Store` | repo `.gitignore` | already covered |
| `topoviewer-changes.patch` | repo `.gitignore` | already covered |

No ignored local artifact deletion is committed by this change.

## Script Inventory

Baseline root script count: 115.

First-pass root script count after implementation: 96.

The first pass intentionally keeps protected aliases used by GitHub workflows,
public-readiness checks, published docs, package READMEs, lab docs, and
maintainer docs.

Script count by prefix after implementation:

| Prefix | Count |
|---|---:|
| unprefixed | 10 |
| api | 2 |
| artifact | 3 |
| benchmark | 5 |
| check | 4 |
| ci | 13 |
| dense | 1 |
| dependency | 1 |
| dist | 1 |
| docs | 8 |
| examples | 1 |
| go | 1 |
| grafana | 20 |
| inspect | 2 |
| install | 2 |
| mkdocs | 1 |
| pack | 1 |
| pages | 1 |
| render | 1 |
| security | 1 |
| sync | 6 |
| test | 3 |
| validate | 3 |
| vscode | 2 |
| wheel | 1 |
| zensical | 2 |

## Protected Workflow Commands

GitHub workflow commands retained:

- `artifact:check:package`
- `ci`
- `ci:build`
- `ci:docs`
- `ci:env`
- `ci:generated`
- `ci:package`
- `ci:perf:smoke`
- `ci:public-readiness`
- `ci:quality`
- `ci:schemas`
- `ci:test:harness`
- `ci:test:topoviewer`
- `dependency:advisories`
- `dist:mkdocs`
- `go:vulncheck`
- `inspect:mkdocs`
- `install:check`
- `security:health-report`
- `wheel:mkdocs`

## Readiness-Asserted Commands

Commands asserted by `scripts/check-public-readiness.mjs` are retained:

- `artifact:check`
- `artifact:check:docs`
- `artifact:check:package`
- `check:object-reference`
- `check:public-readiness`
- `ci:public-readiness`
- `dependency:advisories`
- `examples:audit`
- `go:vulncheck`
- `install:check`
- `install:check:mkdocs`
- `security:health-report`
- `test:hostile-content`

The checker also validates workflow usage for `ci:public-readiness`,
`dependency:advisories`, `go:vulncheck`, and security/reporting commands.

## Dispatcher Coverage

New compatibility dispatchers:

| Dispatcher | Retained functionality |
|---|---|
| `npm run docs -- <command>` | docs setup/build/serve/preview/clean/smoke/lint plus focused Zensical commands |
| `npm run sync -- <command>` | generated content, docs-site, examples, Zensical docs/assets, MkDocs assets |
| `npm run grafana -- <command>` | Grafana fixture, panel, Docker Compose lab, Containerlab lab, rules, traffic commands |
| `npm run lint -- --only <target>` | focused code-health, TypeScript lint, dependency, type-test, and duplicate-code gates |

Removed root aliases are either moved behind a dispatcher, inlined into a
parent command, or reachable through direct script/workspace invocation.

## Removed Root Aliases

Removed aliases with no remaining live exact `npm run ...` references outside
`openspec/archive/**`:

- `clean`
- `sync:zensical-assets`
- `sync:zensical-docs`
- `sync:docs-site`
- `grafana:clab:restart`
- `validate:vscode-harness-build`
- `promo:record`
- `promo:record:check`
- `benchmark:clos:local`
- `lint:code-health`
- `lint:ts`
- `typecheck:tests`
- `lint:deps`
- `lint:circular`
- `lint:cpd`
- `lint:cpd:report`
- `test:headed`
- `transfer:bundle`
- `docs:setup`
- `docs:preview:fast`
- `docs:clean`
- `zensical:setup`

## Validation Performed

- `git diff --check`
- `npm run docs -- --help`
- `npm run sync -- --help`
- `npm run grafana -- --help`
- `npm run lint -- --help`
- `npm run ci -- --list`
- `npm run grafana -- fixtures:check`
- `npm run sync -- check:content`
- `npm run docs -- lint`
- `npm run check:content`
- `npm run docs:lint`
- `npm run check:public-readiness`
- `npm run lint -- --only code-health,ts,test-types,deps,cpd`
- `npm run ci -- --lane quality`
- `npm run ci -- --lane schemas`
- `npm run install:check`
- `npm run artifact:check:package`

All npm checks above were run with Node `v24.12.0`.

Full `npm run ci` was attempted. It stopped in `ci:generated` because this
change intentionally adds new generated docs projections that are still
uncommitted in the current worktree:

- `docs/topoviewer/maintainers/root-tooling-surface.md`
- `packages/topoviewer/docs/maintainers/root-tooling-surface.md`

That full-CI/archive gate should be rerun after the change is committed or in a
clean review branch.
