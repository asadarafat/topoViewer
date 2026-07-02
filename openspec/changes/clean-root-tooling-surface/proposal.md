## Why

TopoViewer's root directory and root `package.json` currently expose too much
internal machinery. The repository is technically capable, but the first
impression is closer to a private engineering workspace than a clean public
product repository.

Current observations:

- the visible root contains required public files, source directories,
  repo-level configs, generated/local directories, and private/dev-only
  directories all at the same level;
- visible local artifacts such as `.artifacts/`, `.cache/`, `.venv-*`, `site/`,
  `.DS_Store`, and `topoviewer-changes.patch` are mixed between already ignored
  entries and entries that may still need repo-level ignore coverage;
- the root `package.json` exposes 115 scripts, including many internal
  one-off, CI-lane, Grafana, docs, sync, benchmark, and release helper aliases;
- GitHub Actions, README snippets, docs, lab docs, and helper scripts reference
  many of those aliases, so deleting scripts without a migration plan would
  break automation.

This change makes the root surface intentional: public files stay visible,
local artifacts are clearly classified, and the npm command surface becomes a
small stable command contract with internal commands routed through dispatcher
tools or maintainer docs.

## What Changes

Define and implement a root/tooling cleanup plan:

- classify every root entry as public repo metadata, source tree, config,
  generated output, local-only artifact, or private/dev-only state;
- document which visible local artifacts are already covered by repo
  `.gitignore`, and focus cleanup work on generated/local entries that are not
  covered yet;
- keep standard public files at root, including `README.md`, `LICENSE`,
  `CHANGELOG.md`, `SECURITY.md`, `SUPPORT.md`, `CONTRIBUTING.md`, and
  `CODEOWNERS`;
- keep required source and automation directories at root: `packages/`,
  `docs/`, `labs/`, `scripts/`, `.github/`, and `openspec/`;
- keep root config files in place unless each relocation is proven compatible
  with the owning tool and CI;
- reduce root npm scripts from the current broad internal alias set to a
  smaller public/maintainer command contract;
- preserve CI behavior by migrating workflows to stable scripts or dispatcher
  forms before removing aliases;
- make the first cleanup pass compatibility-first: keep heavily referenced
  public, CI, security, docs, and lab aliases unless every reference and
  readiness assertion is migrated in the same patch;
- update README and maintainer docs so users see a small command set and
  maintainers can still discover advanced commands.

## Capabilities

### New Capabilities

- `root-tooling-surface`: clean root directory policy, npm script taxonomy,
  script migration strategy, and validation gates for a public-friendly
  repository surface.

## Impact

- Root `package.json` script surface.
- GitHub Actions references to root scripts.
- README local development commands.
- Maintainer/tooling documentation.
- `.gitignore` and local artifact cleanup guidance.
- No renderer, schema, package runtime, docs rendering, Grafana runtime, or
  public API behavior changes are required by this change.

## Non-Goals

- Removing standard public repository files.
- Moving `mkdocs.yml`, `zensical.toml`, or root tool configs without proving
  tool support and CI parity.
- Moving `openspec/` out of root in this change.
- Deleting ignored local artifacts from every contributor machine.
- Removing internal automation capabilities.
- Breaking existing GitHub Actions, release workflows, docs builds, or Grafana
  lab commands.
