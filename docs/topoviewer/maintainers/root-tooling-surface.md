# Root Tooling Surface

The repository root should look intentional. It is allowed to contain public
metadata, source roots, docs configuration, lab scaffolding, and automation.
It should not look like a local machine snapshot.

## Root Entry Policy

Keep these classes visible at the root:

| Class | Examples | Policy |
|---|---|---|
| Public metadata | `README.md`, `LICENSE`, `CHANGELOG.md`, `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`, `CODEOWNERS` | Keep at root. These are standard public repository entrypoints. |
| Workspace metadata | `package.json`, `package-lock.json`, `.npmrc`, `.node-version`, `.nvmrc` | Keep at root. They define the install/runtime contract. |
| Source roots | `packages/`, `docs/`, `labs/`, `scripts/` | Keep at root. They are first-class project areas. |
| Automation/config | `.github/`, `mkdocs.yml`, `zensical.toml`, `.dependency-cruiser.cjs`, `.jscpd.json`, `.oxlintrc.json` | Keep unless a dedicated change proves relocation support in local tooling and CI. |
| Planning | `openspec/` | Keep at root for now. Active plans are not public support claims. |

Do not move files only to reduce the number of root entries. Move them only
when the owning tool supports the new path and CI proves parity.

## Local Artifacts

The cleanup rule is ignore-coverage first:

1. classify the visible local entry;
2. check whether repo `.gitignore` covers it;
3. add repo ignore coverage only for generated/local entries that are project-wide;
4. leave contributor-specific ignores in the contributor environment unless the repo has chosen a shared policy.

Current repo-level ignored local artifacts:

| Entry | Why ignored |
|---|---|
| generated review artifacts directory | screenshots, videos, reports, bundles, and review artifacts |
| `.agents/` | local agent state |
| `.cache/` | generated local caches |
| private handoff state | local-only notes, skills, and private workspace material |
| `.vscode/` | local editor state |
| `.venv*/` | Python virtual environments |
| `site/` | generated documentation output |
| `node_modules/` | npm dependency output |
| `.DS_Store` | macOS local artifact |
| `topoviewer-changes.patch` | local transfer patch |

Deleting these locally must not remove source-of-truth project data. The normal
recovery path is to reinstall dependencies or rebuild generated outputs.

## Command Contract

The root `package.json` is the public command surface. Keep it small enough to
scan, but do not break existing CI, publish, security, docs, or lab surfaces.

Stable user and maintainer commands:

| Command | Use |
|---|---|
| `npm run ci` | full local gate matching the GitHub lane order |
| `npm run build` | build packages and runtime surfaces |
| `npm run lint` | full static gate |
| `npm test` | renderer package tests |
| `npm run docs:preview` | production-like local preview for MkDocs, Zensical, and harness |
| `npm run docs:build` | focused MkDocs build |
| `npm run pack:check` | npm package dry-run inspection |
| `npm run grafana:clab:up` / `npm run grafana:clab:down` | start or stop the Containerlab Grafana panel lab |
| `npm run grafana:clab:bundle` | build the standalone Containerlab Grafana panel bundle |

Protected command families:

| Family | Rule |
|---|---|
| `ci:*` | Keep while GitHub workflows and readiness checks call exact aliases. |
| publish/security checks | Keep exact aliases asserted by `scripts/check-public-readiness.mjs`. |
| docs/lab commands in public docs | Keep or migrate atomically with generated docs and smoke validation. |
| long-running preview/lab commands | Validate with start/probe/stop, not as normal blocking commands. |

## Dispatchers

Domain dispatchers hold internal subcommands without promoting every helper as
a root alias:

| Dispatcher | Examples |
|---|---|
| `npm run docs -- <command>` | `setup`, `build`, `build:fast`, `preview`, `preview:fast`, `clean`, `zensical:build` |
| `npm run sync -- <command>` | `docs`, `docs-site`, `zensical-docs`, `zensical-assets`, `mkdocs` |
| `npm run grafana -- <command>` | `panel:build`, `clab:up`, `clab:restart`, `clab:traffic:start` |
| `npm run lint -- --only <target>` | `code-health`, `ts`, `test-types`, `deps`, `cpd`, `cpd-report` |

Prefer dispatchers for narrow maintainer helpers. Keep root aliases for
commands that are public, repeatedly used in CI, or part of release/publish
preflight.

## Migration Rule

Before removing a root alias:

1. search exact command references outside `openspec/archive/**`;
2. update live docs, workflows, helper messages, and generated projections;
3. keep compatibility aliases if removal would break a supported surface;
4. validate the affected surface;
5. run `npm run ci` before archiving the cleanup.

If validation finds a removed alias still used by a public surface, restore the
alias or migrate that surface in the same patch before continuing.
