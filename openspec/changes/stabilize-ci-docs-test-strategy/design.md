# Design

## Current System

### Local Gate

The root `npm run ci` command currently runs:

1. `sync:docs`
2. `lint`
3. `validate:schemas`
4. `validate:semantics`
5. package builds
6. MkDocs asset sync
7. MkDocs build
8. TopoViewer unit and Playwright tests
9. VS Code harness Playwright tests
10. VS Code harness build
11. attention smoke benchmark
12. npm pack check
13. MkDocs wheel build and inspection
14. Zensical build and validation

That is valuable as a full local release gate, but it is too opaque for GitHub
triage because the workflow exposes it as one `Run CI` step.

### GitHub Workflows

`CI` runs Node 24 and Python 3.12, installs Chromium, then runs `npm run ci`.

`Docs` independently builds package/plugin assets, generates docs, builds
MkDocs, builds Zensical, builds the browser harness, and deploys `site/**` to
GitHub Pages.

The two workflows intentionally overlap. The risk is that they can drift in
command order, generated assets, environment setup, or validation depth.

### Browser Tests

Current Playwright coverage includes:

- TopoViewer package interactions and workbench rendering;
- MkDocs documented examples served from built `site/**`;
- VS Code browser harness authoring workflows.

The browser tests already provide strong coverage, but several assertions are
susceptible to local/remote differences:

- transient status text;
- exact geometry relationships with very tight tolerance;
- SVG path text formatting;
- initial hydration timing;
- server reuse and stale local dev servers.

### NPM Command Surface

The root `package.json` currently exposes useful but overlapping command
families:

- development and preview:
  - `dev`
  - `vscode:harness`
  - `docs:serve`
  - `docs:preview`
  - `zensical:serve`
- sync and generated projections:
  - `sync:content`
  - `sync:docs`
  - `sync:examples`
  - `sync:mkdocs-assets`
  - `sync:zensical-docs`
  - `sync:zensical-assets`
- check and validation:
  - `check:content`
  - `check:examples`
  - `validate:schemas`
  - `validate:semantics`
  - `validate:zensical`
  - `validate:vscode-harness-build`
- build:
  - `build`
  - `docs:build`
  - `docs:build:fast`
  - `mkdocs:build`
  - `zensical:build`
  - `vscode:harness:build`
- test:
  - `test`
  - `test:vscode-harness`
  - `test:headed`
  - `test:all`
- package and release checks:
  - `pack:check`
  - `wheel:mkdocs`
  - `inspect:wheel`

This command surface is serviceable for a fast-moving repo, but it is not yet
ideal for production-grade CI and contributor use. The main risks are:

- command names do not always reveal whether they mutate files;
- `docs:build`, `mkdocs:build`, and fast variants overlap;
- CI and Docs workflows manually compose commands differently;
- preview/serve commands and test commands have different port and server reuse
  expectations;
- generated assets can be rebuilt as a side effect of commands whose name reads
  like validation;
- root commands and workspace commands are both legitimate, which can confuse
  the correct entry point.

## Failure Taxonomy

Every CI or Docs failure should be classified before changing code.

### 1. Product Regression

The renderer, compiler, schema, harness, docs adapter, or examples are wrong.

Signal:

- failure reproduces locally with the same command;
- semantic validation reports real errors;
- browser failure reflects missing user-visible behavior.

Response:

- fix product code or fixture;
- add or tighten a regression test;
- avoid weakening assertions.

### 2. Generated Artifact Drift

Canonical content and generated projections disagree.

Examples:

- `packages/topoviewer/content/**` changed but generated
  `packages/topoviewer/examples/**` or `docs/topoviewer/**` was not updated;
- built MkDocs embed assets differ from committed plugin assets;
- Zensical generated docs/assets are stale.

Response:

- make the generator/check command fail deterministically;
- prefer check-only validation in CI after generation boundaries are clear;
- emit exact source and projection paths in failure messages.

### 3. Environment Drift

Local and GitHub use different Node, npm, Python, Playwright, Chromium,
operating system, fonts, or environment variables.

Response:

- require Node 24 everywhere;
- emit an environment report in local and GitHub runs;
- pin Python/Zensical expectations where the repo already does so;
- include Playwright browser version in logs.

### 4. Server Orchestration Drift

Tests attach to the wrong local server, stale server, wrong port, or partially
hydrated dev server.

Response:

- set `reuseExistingServer: false` under `CI=true`;
- use explicit ports per suite;
- fail fast when expected server content is not the current repo;
- log server URL and commit/build marker at test start.

### 5. Browser Timing Or Hydration Drift

The test checks the page before React Flow, MkDocs embed, Zensical lifecycle, or
Monaco is ready.

Response:

- wait on durable DOM state, not arbitrary timeouts;
- expose readiness markers when useful;
- add Zensical lifecycle smoke checks that validate first render without manual
  browser refresh.

### 6. Brittle Assertion

The assertion checks implementation formatting instead of durable behavior.

Examples:

- exact SVG path string spacing;
- transient undo/redo status text;
- pixel-perfect geometry when the behavior only needs containment;
- class names not part of the user contract.

Response:

- assert durable state: YAML content, rendered object count, selected object,
  visible labels, graph semantics, accessibility labels, or bounding boxes with
  documented tolerance;
- keep visual snapshots only for stable, intentionally reviewed surfaces.

### 7. Resource Or Performance Flake

The test is correct but the runner is slow or constrained.

Response:

- define performance budgets by suite;
- keep stress tests outside per-push CI unless they are bounded smoke tests;
- collect timing metrics and traces before changing thresholds.

### 8. Command Contract Drift

An npm script name, side effect, or composition differs from developer
expectation or GitHub workflow behavior.

Examples:

- a command named `validate:*` writes generated files;
- a GitHub workflow repeats a command sequence that differs from local `npm run
  ci`;
- two commands do nearly the same thing but one skips build steps and one does
  not;
- a local command reuses a server while remote tests require isolation.

Response:

- define a command taxonomy;
- rename or add aliases only after documenting compatibility impact;
- make mutating and check-only commands explicit;
- make CI call the same named commands that developers run locally.

## Recommended Test Strategy

## Recommended NPM Command Strategy

The command surface should be treated as part of the product's engineering
contract. A contributor should be able to infer a command's side effects from
its prefix.

### Command Taxonomy

Recommended root-level taxonomy:

```text
dev:*       long-running local development servers
serve:*     long-running preview servers for built/generated docs
sync:*      mutates generated projections or copied assets
check:*     check-only validation; must not write files
build:*     creates local build artifacts
test:*      runs tests; may start isolated test servers
ci:*        GitHub-parity lanes and full gates
pack:*      npm/package distribution checks
wheel:*     Python wheel distribution checks
clean:*     removes generated local artifacts
```

The existing command names do not need to be churned immediately, but each
should be audited and assigned to one of these categories. Ambiguous commands
should either be renamed or wrapped by clearer aliases.

### Mutation Rules

The repo should enforce a simple rule:

- `sync:*` commands MAY write files.
- `build:*` commands MAY write build artifacts.
- `serve:*` and `dev:*` commands MAY prepare local generated artifacts before
  starting servers.
- `check:*`, `validate:*`, `test:*`, and `ci:*` commands MUST NOT leave
  unstaged source/projection mutations as a normal success path.

If a `ci:*` lane needs generated files, it should either:

1. run a sync step first and then run a check step that fails on drift; or
2. run a pure check command directly.

Do not let CI silently repair generated output and then pass.

### Alias And Compatibility Policy

Aliases are useful only when they reduce confusion.

Recommended audit decisions:

- keep `npm run ci` as the full gate;
- keep `npm run docs:preview` as the local two-server docs preview command;
- consider making `mkdocs:build` an alias with an explicit deprecation comment,
  because `docs:build` is the clearer public command;
- keep `docs:build:fast` and `docs:preview:fast` only if their skip behavior is
  documented in command help or contributor docs;
- keep workspace-specific commands where they are implementation details, but
  prefer root commands in user-facing documentation.

### Environment Rules

Every root command that builds, tests, validates, or packages TypeScript output
should enforce Node 24 either directly or through a shared wrapper.

Commands that rely on Python should print the selected Python executable and
version in the environment report. Zensical and MkDocs virtualenv behavior
should remain deterministic and local to the repo.

### Server And Port Rules

Preview commands should fail clearly when their fixed ports are occupied,
because users need stable URLs:

- MkDocs: `127.0.0.1:8001`
- Zensical: `127.0.0.1:8002`
- harness: Vite's configured harness port

Test commands should not depend on those preview ports. Under `CI=true`, they
should use isolated Playwright-managed servers and avoid reusing existing
servers.

### Command Help

Add a lightweight command catalog for contributors. It should answer:

- "I changed YAML examples. What do I run?"
- "I changed renderer code. What do I run?"
- "I changed docs styling. What do I run?"
- "I changed GitHub workflow or npm commands. What do I run?"
- "I see a remote-only failure. How do I reproduce it locally?"

This can live in contributor docs, package docs, or generated development docs,
but the command source of truth remains `package.json`.

### Layer 1: Fast Pure Validation

Purpose: catch deterministic schema, lint, type, and generated-content issues
without browsers.

Commands should be locally runnable and GitHub-visible:

```text
npm run ci:quality
npm run ci:schemas
npm run ci:generated
```

Coverage:

- `require-node24`;
- lint/code-health/dependency/copy-paste checks;
- TypeScript type checks;
- schema validation;
- semantic validation;
- content projection check;
- no generated projection drift.

Recommendation:

- make this the first CI lane;
- fail before installing Playwright browsers if possible;
- print exact stale-file commands.

### Layer 2: Build And Package Validation

Purpose: catch package, embed, MkDocs plugin, wheel, and harness build
regressions.

Commands:

```text
npm run ci:build
npm run ci:package
```

Coverage:

- `npm run build`;
- `sync:mkdocs-assets`;
- `vscode:harness:build`;
- `pack:check`;
- `wheel:mkdocs`;
- `inspect:wheel`.

Recommendation:

- emit package sizes and key asset hashes;
- keep build commands identical between local and GitHub;
- avoid mutating committed outputs after check-only gates unless the workflow
  explicitly validates the mutation.

### Layer 3: Runtime Browser Tests

Purpose: validate the TopoViewer runtime and documented examples as rendered
DOM, not just YAML.

Command:

```text
npm run ci:test:topoviewer
```

Coverage:

- unit tests;
- package interaction tests;
- workbench test;
- MkDocs documented example tests against built `site/**`.

Recommendations:

- keep example tests driven from the generated catalog;
- assert durable behavior and semantic DOM state;
- use data attributes for public test contracts where class names are too
  implementation-specific;
- set Playwright server reuse to `false` when `CI=true`;
- keep traces and screenshots on failure.

### Layer 4: Harness Browser Tests

Purpose: validate the authoring workflow and Monaco/YAML/canvas sync.

Command:

```text
npm run ci:test:harness
```

Coverage:

- fixture loading;
- YAML authoring intelligence;
- relationship authoring;
- undo/redo durable YAML state;
- node position persistence;
- diagnostics;
- theme and responsive layout.

Recommendations:

- never assert only transient status strip text;
- assert durable YAML and enabled/disabled command state;
- keep Monaco readiness waits explicit;
- persist traces/screenshots for remote failures.

### Layer 5: Docs Build And Smoke

Purpose: validate the thing GitHub Pages will deploy.

Command:

```text
npm run ci:docs
```

Coverage:

- MkDocs strict build;
- Zensical build;
- browser harness static build;
- static artifact inspection;
- live smoke test against `site/`:
  - MkDocs home loads;
  - a representative MkDocs TopoViewer embed hydrates;
  - Zensical route `/topoViewer/zensical/` loads;
  - a representative Zensical embed hydrates without manual refresh;
  - `/topoViewer/harness/` loads the browser harness shell and fixture index.

Recommendations:

- make `Docs` workflow call this command instead of hand-repeating command
  order;
- upload `site/` or a compact failure artifact when smoke fails;
- only deploy Pages after smoke passes.

### Layer 6: Performance Smoke

Purpose: prevent severe regressions without turning stress tests into flaky
per-push gates.

Command:

```text
npm run ci:perf:smoke
```

Coverage:

- current 1k-node attention smoke benchmark;
- optional bounded browser render timing for one dense fixture.

Recommendations:

- keep 10k stress outside required per-push CI;
- run stress in a scheduled or manual workflow;
- record timing metrics as artifacts before enforcing tighter budgets.

## GitHub Workflow Shape

Recommended `CI` job steps:

```text
Environment report
Install Node dependencies
Install Chromium
ci:quality
ci:schemas
ci:generated
ci:build
ci:test:topoviewer
ci:test:harness
ci:package
ci:perf:smoke
ci:docs
Upload failure artifacts
```

This can remain one job initially to avoid artifact passing complexity, but it
should not remain one opaque `Run CI` step.

Recommended `Docs` job:

```text
Environment report
Install dependencies
ci:docs
Upload Pages artifact
Deploy Pages
```

The docs workflow should not have a hand-maintained command sequence that
diverges from local docs CI.

## Local Command Strategy

Keep `npm run ci` as the full gate. Add targeted commands so developers can
run the smallest relevant check:

```text
npm run ci:quality
npm run ci:schemas
npm run ci:generated
npm run ci:build
npm run ci:test:topoviewer
npm run ci:test:harness
npm run ci:docs
npm run ci:package
npm run ci:perf:smoke
npm run ci:remote-parity
```

`ci:remote-parity` should set GitHub-like environment variables locally:

```text
CI=true
NODE_ENV=test
```

It should avoid reusing existing servers, use clean generated directories, and
print the same environment report.

## Playwright Standards

### Server Isolation

Playwright configs should use:

```js
reuseExistingServer: !process.env.CI
```

For local development, reuse is convenient. For GitHub, reuse can hide stale
servers or wrong repo state.

### Readiness

Tests should wait for durable readiness:

- `.topoviewer-embed[data-topoviewer-mounted="true"]` or equivalent if added;
- expected node/edge counts;
- Monaco model and diagnostics ready;
- Zensical lifecycle hook completed.

Avoid relying on fixed sleeps except as a last step after a durable event.

### Assertions

Prefer:

- YAML document content;
- visible object counts;
- selected object IDs;
- generated `data-*` attributes intentionally exposed for tests;
- bounding boxes with named tolerances;
- browser console errors filtered with an explicit allowlist.

Avoid:

- exact internal SVG path formatting;
- transient toast/status strings as the only assertion;
- arbitrary timeout increases without a root cause;
- broad retries that hide failures.

### Retries

Default stance: no hidden retries for required CI.

Allowed exception:

- one retry may be used only if the first failure preserves trace, screenshot,
  console log, and environment report, and the flaky condition has an open
  tracked task.

Retries are diagnostic, not a substitute for fixing the test.

## Artifact Strategy

On GitHub failure, upload:

- Playwright traces and screenshots;
- generated `site/**` subset relevant to docs failures;
- `.artifacts/wheels` metadata when wheel inspection fails;
- environment report;
- command-lane log summary;
- generated content drift report when applicable.

Do not upload huge stress fixtures unless the failing lane needs them.

## Investigation Method

Before implementation, perform an audit and record:

- last 10 `CI` and `Docs` runs on `development`;
- failure stage and root cause for each failed run;
- whether each failure reproduces locally with Node 24 and `CI=true`;
- whether generated files were stale;
- whether the test asserted transient state;
- whether the failure had enough artifacts to debug without rerunning.

The audit should produce a short table in the change or a linked study file,
then the implementation should target the observed classes.

## Acceptance Criteria

The change is complete when:

- local and GitHub workflows use the same named CI/docs commands;
- GitHub shows meaningful failed steps instead of only `Run CI`;
- generated-content drift is caught before browser tests;
- Docs workflow validates MkDocs, Zensical, and harness deploy artifacts before
  Pages deploy;
- Playwright configs isolate servers in CI;
- at least the known recent failure classes have regression coverage or
  documented guardrails;
- contributor docs explain which targeted command to run and how to triage
  remote-only failures;
- `npm run ci` passes under Node 24;
- latest GitHub `CI` and `Docs` workflows pass after implementation.
