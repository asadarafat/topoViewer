# Stabilize CI And Docs Test Strategy

## Why

TopoViewer now has enough moving pieces that a locally successful run can still
leave uncertainty about GitHub Actions:

- `npm run ci` is a long monolithic local and remote command;
- root `package.json` has many overlapping commands for sync, docs, preview,
  build, test, package, and validation workflows;
- GitHub has separate `CI` and `Docs` workflows with overlapping build work;
- MkDocs, Zensical, browser harness, npm package assets, and example catalogs
  are generated from canonical content;
- Playwright tests depend on local dev servers, browser timing, viewport
  geometry, generated `site/**` output, and React Flow lifecycle behavior;
- docs deployment can succeed or fail independently from package/runtime CI;
- local developer state can include running servers, cached browsers, generated
  files, and different Python/Node toolchains.

Recent failures showed several different classes of problems:

- schema validation failed remotely because the examples catalog schema did not
  allow existing harness metadata;
- generated expected metadata was incomplete for harness fixtures;
- a docs embed failed because attention/aggregation state hid the path being
  focused;
- a browser assertion was brittle because it assumed one SVG path formatting
  style;
- a harness undo/redo assertion depended on transient status text rather than
  durable YAML state.

Those are not all the same kind of "flaky CI". Some are true correctness gaps,
some are generated-artifact drift, and some are test-design problems. The test
strategy should make those differences explicit so failures are faster to
classify, reproduce, and fix.

## What Changes

Investigate and implement a production-grade test strategy for GitHub `CI` and
`Docs` reliability:

- define a failure taxonomy for local/remote differences;
- split the monolithic CI sequence into observable lanes with the same commands
  available locally;
- investigate and simplify the `npm run *` command surface so command names,
  mutating behavior, local preview behavior, and CI behavior are predictable;
- add environment and artifact diagnostics so remote failures carry enough
  evidence to reproduce locally;
- harden Playwright server, timing, and assertion patterns;
- make generated-content validation explicit and check-only where possible;
- add Docs workflow smoke coverage for MkDocs, Zensical, and harness published
  artifacts;
- document a triage workflow for remote-only failures.

The desired end state is not "retry until green". The desired end state is:

- local commands match GitHub behavior closely;
- npm scripts have a clear taxonomy and do not contain surprising side effects;
- remote failures name the failing lane and preserve useful artifacts;
- tests assert durable user-visible state, not transient UI implementation
  details;
- docs deployment verifies both static output and live TopoViewer hydration;
- generated projections cannot drift silently.

## Capabilities

### New Capabilities

- `ci-failure-taxonomy`: documented classification for schema drift, generated
  artifact drift, environment drift, Playwright timing, browser rendering,
  docs publishing, and real product regressions.
- `ci-observable-lanes`: locally runnable CI lanes that map one-to-one to
  GitHub steps.
- `npm-command-contract`: documented script taxonomy, mutation rules, aliases,
  and environment behavior for root and workspace npm commands.
- `ci-environment-reporting`: Node/npm/Python/Playwright/browser/OS/version
  metadata emitted in local and GitHub runs.
- `generated-artifact-contract`: deterministic checks for generated docs,
  examples, MkDocs assets, Zensical assets, and package artifacts.
- `docs-smoke-validation`: browser or static smoke validation for MkDocs,
  Zensical, and harness pages before GitHub Pages deployment.
- `playwright-flake-hardening`: test rules for server isolation, stable
  selectors, durable assertions, screenshots/traces, and no hidden retries.

## Impact

- `.github/workflows/ci.yml` should expose more granular steps or call
  granular npm scripts instead of one opaque `Run CI` step.
- `.github/workflows/docs.yml` should use the same docs build/smoke command
  available locally and should upload useful failure artifacts.
- `scripts/ci.mjs` may become an orchestrator over named lanes rather than the
  only runnable CI surface.
- `package.json` script names may be simplified so `sync:*` writes,
  `check:*` never writes, `build:*` builds artifacts, `test:*` runs tests, and
  `ci:*` composes check-only or intentionally generated release gates.
- `package.json` may add commands such as:
  - `ci:quality`
  - `ci:schemas`
  - `ci:build`
  - `ci:docs`
  - `ci:test:topoviewer`
  - `ci:test:harness`
  - `ci:package`
  - `ci:remote-parity`
- Redundant aliases such as overlapping docs build names and fast/full variants
  should be audited before removal, with compatibility aliases retained only
  when they reduce user confusion.
- Playwright configs may change to avoid server reuse in `CI=true`, isolate
  ports, and retain consistent traces/screenshots/videos on failure.
- Docs validation scripts may add live smoke checks against built `site/**`
  output for MkDocs, Zensical, and harness.
- Contributor docs should explain which command to run for a given changed
  area and how to reproduce a GitHub-only failure.

## Non-Goals

- Do not hide real regressions with broad retries.
- Do not make GitHub Pages deploy from unvalidated generated output.
- Do not remove `npm run ci`; keep it as the full local gate.
- Do not rename or remove heavily used local commands without either a
  compatibility alias or a clear migration note.
- Do not introduce external CI providers.
- Do not require cloud AI, browser services, or non-local test infrastructure.
- Do not make docs tests depend on the public GitHub Pages site; validate the
  built artifact before deployment.
