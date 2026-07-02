## ADDED Requirements

### Requirement: Root entries are intentionally classified

TopoViewer SHALL maintain a documented root-directory policy that classifies
visible root entries as public metadata, source tree, repository config,
documentation config, automation, planning, generated output, dependency output,
local cache, or private/dev-only state.

#### Scenario: Standard public repo files remain visible

- **WHEN** a contributor reviews the root directory
- **THEN** standard public files such as `README.md`, `LICENSE`,
  `CHANGELOG.md`, `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`, and
  `CODEOWNERS` SHALL remain visible at root
- **AND** they SHALL NOT be moved only to reduce root entry count

#### Scenario: Ignore coverage drives local artifact cleanup

- **WHEN** a contributor sees local-only root entries such as `.artifacts/`,
  `.cache/`, `.venv-*`, `site/`, `.DS_Store`, `node_modules/`, or
  `topoviewer-changes.patch`
- **THEN** the repo SHALL document that these are local/generated artifacts
- **AND** the documentation SHALL identify whether each artifact is ignored by
  repository `.gitignore`, `.git/info/exclude`, global ignore, or not ignored
- **AND** entries already covered by repository `.gitignore` SHALL be treated as
  already covered and optional local deletion, not primary cleanup work
- **AND** unignored generated/local artifacts SHALL either be added to
  repository `.gitignore` or explicitly documented as intentionally visible
- **AND** deleting generated artifacts locally SHALL NOT remove source-of-truth
  project data

#### Scenario: Config relocation is conservative

- **WHEN** root config files are considered for relocation
- **THEN** the change SHALL prove the owning tool supports the new path
- **AND** GitHub Actions and local commands SHALL continue to use that config
- **AND** relocation SHALL NOT happen merely to reduce visual clutter

### Requirement: Root npm scripts expose a small stable contract

TopoViewer SHALL reduce the root npm script surface so common users and
maintainers see a stable command contract rather than every internal helper.

#### Scenario: Public commands remain simple

- **WHEN** a user reads README or local development docs
- **THEN** the advertised command set SHALL focus on install, build, test,
  lint, docs preview/build, Grafana demo startup, Containerlab bundle build,
  package check, and full CI
- **AND** internal helper scripts SHALL NOT be promoted as normal user commands

#### Scenario: Internal commands remain reachable

- **WHEN** an internal command alias is removed from root `package.json`
- **THEN** the underlying capability SHALL remain reachable through a
  dispatcher, workspace command, direct script invocation, or maintainer docs
- **AND** the command removal SHALL NOT delete the automation capability

#### Scenario: CI commands remain stable

- **WHEN** GitHub Actions run
- **THEN** they SHALL use stable root commands or documented dispatcher forms
- **AND** the script simplification SHALL NOT change the meaning of CI lanes,
  docs builds, package checks, security checks, or publish preflights

#### Scenario: Protected aliases survive the first cleanup pass

- **WHEN** the first script-surface cleanup is implemented
- **THEN** aliases used by CI, public docs, lab docs, or public-readiness checks
  SHALL remain unless all references and assertions are migrated in the same
  patch
- **AND** protected aliases SHALL include `ci:*`, `dependency:advisories`,
  `go:vulncheck`, `security:health-report`, `install:check`,
  `install:check:mkdocs`, `artifact:check`, `artifact:check:docs`,
  `artifact:check:package`, `check:object-reference`, `examples:audit`,
  `check:public-readiness`, `test:hostile-content`, `dist:mkdocs`,
  `wheel:mkdocs`, `inspect:mkdocs`, `docs:preview`, `vscode:harness`,
  README-advertised commands, package-README-advertised commands,
  published-doc-advertised commands, lab-doc-advertised commands,
  maintainer-doc-advertised commands,
  `grafana:lab:*`, and documented `grafana:clab:*` commands

#### Scenario: Public surfaces keep working

- **WHEN** root scripts are simplified
- **THEN** the supported public surfaces SHALL keep their documented commands
  or receive atomically updated replacement commands
- **AND** this SHALL include React package build/test, MkDocs, Zensical, browser
  harness, Grafana Docker Compose demo, Grafana Containerlab demo, npm publish
  preflight, PyPI publish preflight, security workflow, and full CI

### Requirement: Script migration is reference-driven

TopoViewer SHALL migrate script aliases only after checking all live
references.

#### Scenario: Removing a script alias

- **WHEN** a root npm script alias is removed
- **THEN** live references in GitHub Actions, README, docs, package READMEs,
  labs, helper scripts, and active OpenSpec changes SHALL be updated first
- **AND** archived OpenSpec files MAY remain unchanged as historical records
- **AND** an exact-name repository search SHALL prove no live reference remains
  outside archived OpenSpec history

#### Scenario: Temporary compatibility aliases

- **WHEN** immediate removal would break external docs, release workflows, or
  known user commands
- **THEN** the alias MAY remain temporarily
- **AND** the maintainer docs SHALL identify it as compatibility or legacy
  rather than the preferred command form

#### Scenario: Readiness checks are migrated atomically

- **WHEN** a script name asserted by `scripts/check-public-readiness.mjs` is
  changed or removed
- **THEN** the readiness checker, GitHub workflows, and related docs SHALL be
  updated in the same patch
- **AND** `ci:public-readiness` behavior SHALL remain equivalent

### Requirement: Command taxonomy is documented

TopoViewer SHALL document the final command taxonomy for users and maintainers.

#### Scenario: README stays concise

- **WHEN** README lists local commands
- **THEN** it SHALL include only the common public commands needed for normal
  development, docs preview, Grafana demo, package check, and CI
- **AND** it SHALL NOT become a complete internal script catalog

#### Scenario: Maintainer docs carry advanced commands

- **WHEN** a maintainer needs advanced commands for generated content, release
  artifact checks, API reports, security scans, benchmarks, or lab diagnostics
- **THEN** maintainer docs SHALL describe the relevant dispatcher or script
  entrypoint
- **AND** the documentation SHALL explain which commands are public, CI,
  maintainer, lab, or internal helper commands

### Requirement: Cleanup is validated

TopoViewer SHALL validate root and script cleanup before archiving the change.

#### Scenario: Root cleanup validation

- **WHEN** the change is ready to archive
- **THEN** the implementation SHALL provide a before/after root and script
  inventory
- **AND** ignored local-only artifacts SHALL remain untracked

#### Scenario: Script cleanup validation

- **WHEN** script simplification is complete
- **THEN** representative public commands, CI lane commands, docs commands,
  package checks, and advertised Grafana commands SHALL pass
- **AND** full `npm run ci` SHALL pass before archive
- **AND** workflow-referenced publish/security commands SHALL pass or be
  covered by an equivalent CI lane before archive

#### Scenario: Long-running commands are validated safely

- **WHEN** validating service-style commands such as `docs:preview`,
  `vscode:harness`, `grafana:lab:up`, or `grafana:clab:up`
- **THEN** validation SHALL use a controlled start, probe, and stop workflow or
  an existing smoke command
- **AND** validation SHALL NOT leave preview servers, Docker Compose services,
  or Containerlab containers running

#### Scenario: First-pass reduction is compatibility-first

- **WHEN** the first cleanup pass is complete
- **THEN** the script count SHALL be materially lower than the 115-script
  baseline
- **AND** reaching the long-term 20-30 script target SHALL NOT be required
  until protected aliases are safely migrated
