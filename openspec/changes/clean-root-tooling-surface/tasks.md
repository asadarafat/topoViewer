## 1. Baseline Inventory

- [x] 1.1 Record tracked root entries and classify each as public metadata, source tree, config, docs, automation, or planning
- [x] 1.2 Record visible local root entries and classify each as repo-ignored, contributor-ignored, globally ignored, unignored generated output, unignored dependency output, unignored local cache, or unignored private/dev-only state
- [x] 1.3 Record current root script count and group scripts by prefix/category
- [x] 1.4 Record every live reference to root npm scripts in GitHub Actions, README, docs, package READMEs, labs, and scripts
- [x] 1.5 Exclude archived OpenSpec history from migration requirements while keeping it searchable
- [x] 1.6 Generate a protected-alias reference matrix for every workflow command, every readiness-asserted command, every published-doc command, every package README command, every lab-doc command, and every maintainer-doc command
- [x] 1.7 Record whether each visible local-only root entry is ignored by repo `.gitignore`, `.git/info/exclude`, global ignore, or not ignored
- [x] 1.8 Generate a workflow-command matrix for every `npm run ...` used by `.github/workflows/**`
- [x] 1.9 Generate a readiness-command matrix for every script asserted by `scripts/check-public-readiness.mjs`
- [x] 1.10 Generate a public-doc command matrix for commands advertised in README, package READMEs, lab docs, generated public docs, canonical content pages, and maintainer docs

## 2. Root Directory Policy

- [x] 2.1 Add maintainer documentation that explains the intended root directory shape
- [x] 2.2 Document cleanup action only for generated/local root entries that are not covered by repo `.gitignore`; mark already ignored entries such as `.DS_Store`, `.artifacts/`, `.venv-*`, `site/`, `node_modules/`, and `topoviewer-changes.patch` as already covered and optional local deletion
- [x] 2.3 Document private/local-only entries such as `.agents/`, `.cache/`, and `.vscode/`
- [x] 2.4 Keep tracked standard public files at root
- [x] 2.5 Keep `mkdocs.yml`, `zensical.toml`, root tool configs, and `openspec/` in place unless a later dedicated change proves relocation safety
- [x] 2.6 Add or update `.gitignore` only if the baseline finds unignored generated/local artifacts; do not add private/editor directories unless the repo intentionally treats them as repo-wide generated/private state
- [x] 2.7 Do not change contributor-local `.git/info/exclude` assumptions; document repo-level ignore policy only

## 3. Script Taxonomy And Target Contract

- [x] 3.1 Define the root public command set in maintainer docs
- [x] 3.2 Define CI lane command policy: prefer `npm run ci -- --lane <lane>` unless a `ci:*` alias is kept for workflow readability
- [x] 3.3 Define docs command policy for preview, build, lint, smoke, and sync
- [x] 3.4 Define Grafana command policy for Docker Compose lab, Containerlab lab, bundle, smoke, rules, and traffic
- [x] 3.5 Define check/release command policy for install, artifact, API, dependency, security, and public-readiness checks
- [x] 3.6 Mark protected first-pass aliases as retained unless all workflows, docs, helper messages, generated projections, and readiness assertions are migrated atomically
- [x] 3.7 Define first-pass success as a material script-count reduction from 115, not necessarily the long-term 20-30 script target
- [x] 3.8 Mark all workflow-command, readiness-command, README-advertised, package-README-advertised, published-doc-advertised, lab-doc-advertised, and maintainer-doc-advertised aliases as retained for the first implementation pass unless migrated atomically

## 4. Compatibility-Preserving Dispatcher Implementation

- [x] 4.1 Add or extend a docs dispatcher for docs preview/build/lint/smoke/sync workflows
- [x] 4.2 Add or extend a Grafana dispatcher for lab, Containerlab, bundle, smoke, rules, and traffic workflows
- [x] 4.3 Add or extend a sync/check dispatcher only if it reduces script count without hiding important public commands
- [x] 4.4 Add `--help` or clear invalid-command output for every dispatcher
- [x] 4.5 Ensure dispatchers call existing scripts and preserve existing environment-variable behavior
- [x] 4.6 Keep compatibility aliases for protected commands during the first implementation pass
- [x] 4.7 If a protected alias is intentionally migrated, update `scripts/check-public-readiness.mjs` in the same patch
- [x] 4.8 After adding dispatchers but before deleting aliases, run a compatibility checkpoint for existing public, CI, docs, publish, security, harness, and lab commands

## 5. Reference Migration

- [x] 5.1 Update GitHub Actions to use the stable root commands or dispatcher forms
- [x] 5.2 Update README command snippets only where the public command contract changes
- [x] 5.3 Update docs and package READMEs for migrated command names
- [x] 5.4 Update lab docs and helper script messages for migrated command names
- [x] 5.5 Update public-readiness checks if they assert old script names
- [x] 5.6 Keep temporary compatibility aliases only where removing them would break external docs or release workflows
- [x] 5.7 Update canonical content first, then regenerate generated docs projections
- [x] 5.8 Before removing any alias, run `rg` for that exact script name and prove no live reference remains outside archived OpenSpec history
- [x] 5.9 Do not migrate workflow or readiness aliases unless the equivalent workflow/readiness check passes in the same patch

## 6. Script Surface Reduction

- [x] 6.1 Remove root aliases that are internal-only and have no live references after migration
- [x] 6.2 Keep root aliases that are documented public entrypoints, GitHub Actions entrypoints, or common maintainer commands
- [x] 6.3 Confirm root script count is materially lower than the current 115 scripts
- [x] 6.4 Generate a before/after command inventory in this change for review
- [x] 6.5 Defer aggressive reduction to the long-term 20-30 script target unless protected aliases have been safely migrated
- [x] 6.6 Verify removed aliases are not asserted by `scripts/check-public-readiness.mjs`
- [x] 6.7 Verify removed aliases are not used by GitHub publish workflows, security workflow, docs workflow, package README files, lab docs, or generated public docs
- [x] 6.8 Keep alias removal in small chunks grouped by command family, with validation after each chunk
- [x] 6.9 Stop alias deletion immediately if validation finds a removed alias still used by a public surface, then restore the alias or migrate the surface atomically before continuing

## 7. Validation

- [x] 7.1 Run `npm run ci -- --list`
- [ ] 7.2 Run representative lanes through the final CI interface: env, quality, docs, package, and public-readiness
- [ ] 7.3 Run public finite commands: `npm run build`, `npm test`, `npm run lint`, and `npm run pack:check`
- [ ] 7.4 Run README-advertised validation commands: `npm run validate:schemas`, `npm run validate:semantics`, `npm run docs:build`, and `npm run docs:smoke`
- [ ] 7.5 Run publish/security/readiness finite commands still referenced by workflows or readiness checks: `npm run install:check`, `npm run install:check:mkdocs`, `npm run artifact:check`, `npm run artifact:check:docs`, `npm run artifact:check:package`, `npm run check:object-reference`, `npm run examples:audit`, `npm run check:public-readiness`, `npm run test:hostile-content`, `npm run dependency:advisories`, `npm run go:vulncheck`, `npm run security:health-report`, `npm run wheel:mkdocs`, and `npm run inspect:mkdocs`
- [ ] 7.6 If `docs:preview` behavior changes, start it in a controlled background process, probe MkDocs/Zensical/Harness URLs, and stop it
- [ ] 7.7 Validate Grafana Docker Compose commands that remain advertised with the matching smoke/down sequence
- [ ] 7.8 Validate Containerlab commands only with preflight/smoke/start-probe-stop behavior, and confirm no lab containers remain running
- [ ] 7.9 Run `npm run vscode:harness` only with controlled start/probe/stop if harness server behavior or command routing changes
- [x] 7.10 Search for removed script names and verify no live references remain outside archived OpenSpec history
- [ ] 7.11 Run `npm run ci`
- [ ] 7.12 Archive only after the root is clean, script inventory is reduced, docs are updated, all public/CI/docs/publish/security/harness/Grafana surfaces still work, protected aliases are either retained or atomically migrated, and CI passes
