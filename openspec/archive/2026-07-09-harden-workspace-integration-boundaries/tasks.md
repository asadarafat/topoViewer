## Sequencing Rule

Complete tasks in order. Do not check a phase until its command or source
evidence exists. Keep transient reports under `.artifacts/`, not this change.

## 0. Audit And Baseline

- [x] 0.1 Confirm the TopoViewer tracked worktree is clean
- [x] 0.2 Inventory local repositories and preserve unrelated dirty worktrees
- [x] 0.3 Map package, host-adapter, docs, Grafana, and lab ownership
- [x] 0.4 Record direct cross-package source imports
- [x] 0.5 Run the existing dependency check and confirm it misses the imports

## 1. Define The Public Integration Boundary

- [x] 1.1 Define the additive shared exports owned by `topoviewer`
- [x] 1.2 Define package-name-only imports for application adapters
- [x] 1.3 Define build-time alias, CSS, runtime, and external-lab assumptions
- [x] 1.4 Define enforcement and compatibility requirements

## 2. Implement Core Ownership

- [x] 2.1 Export shared viewport UI and types from `topoviewer`
- [x] 2.2 Export the shared authoring helper-line policy
- [x] 2.3 Export pure layer selection helpers required by consumers
- [x] 2.4 Add focused public-integration API unit coverage
- [x] 2.5 Regenerate and review the public API report

## 3. Migrate Consumers

- [x] 3.1 Replace Harness direct core source imports with `topoviewer` imports
- [x] 3.2 Replace the direct core stylesheet import with
      `topoviewer/style.css`
- [x] 3.3 Confirm Grafana continues to consume only package exports
- [x] 3.4 Confirm MkDocs continues to consume only built embed assets

## 4. Enforce Boundaries

- [x] 4.1 Add error-level dependency rules against cross-package source imports
- [x] 4.2 Run dependency and cycle checks
- [x] 4.3 Add or retain evidence that public package imports remain allowed

## 5. Document Architecture And Operations

- [x] 5.1 Update the canonical architecture page with package and runtime flow
- [x] 5.2 Update the monorepo page for all four package/application boundaries
- [x] 5.3 Document external lab artifact ownership and security assumptions
- [x] 5.4 Refresh local handoff paths and active-change state
- [x] 5.5 Sync and review generated docs

## 6. Verification

- [x] 6.1 Run public API and focused core unit checks
- [x] 6.2 Run Harness unit, typecheck, and build checks
- [x] 6.3 Run docs lint/build checks
- [x] 6.4 Run full local `npm run ci`; before commit, confirm the orchestrator
      stops only at the intentional generated-projection cleanliness gate and
      run every substantive lane independently
- [x] 6.5 Confirm the tracked diff does not include ignored external repositories
- [x] 6.6 Record remaining risks and follow-up migrations

## Verification Record

- `npm run ci` reached the generated-doc cleanliness gate because the reviewed
  canonical and projected documentation changes are not committed yet.
- Quality, schemas, workspace builds, docs builds and smoke checks, renderer
  parity, core and Harness tests, performance smoke, package/wheel checks,
  hostile-content tests, dependency advisories, and Go vulnerability checks
  passed independently.
- The tracked TopoViewer diff contains no path from `.donotpush/`,
  `.artifacts/`, `_eda-playground`, or `nokia-sp-mv-network`.
