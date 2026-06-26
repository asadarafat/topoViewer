# CI And Docs Test Strategy Requirements

## Requirement: Failure Classification

TopoViewer SHALL classify CI and Docs failures before implementation changes are
made.

#### Scenario: Product regression

- Given a GitHub failure reproduces locally with the same command
- And the failure reflects invalid output, invalid schema, missing behavior, or
  incorrect rendered state
- When the failure is triaged
- Then it SHALL be classified as a product regression
- And the fix SHALL include product or fixture changes plus regression coverage

#### Scenario: Generated artifact drift

- Given canonical content and generated projections differ
- When CI runs generated-content validation
- Then CI SHALL fail before browser tests
- And the failure SHALL name the stale generated file and canonical source path

#### Scenario: Brittle assertion

- Given a test fails because it asserted transient text, exact SVG formatting,
  or unnecessarily tight pixel geometry
- When the test is corrected
- Then the replacement assertion SHALL target durable behavior or explicitly
  documented tolerance

## Requirement: Local And Remote Command Parity

TopoViewer SHALL expose locally runnable commands that map to GitHub CI and
Docs steps.

#### Scenario: Full local gate

- Given a developer runs `npm run ci`
- When the command completes successfully under Node.js 24
- Then it SHALL cover quality, schema validation, semantic validation, builds,
  TopoViewer browser tests, harness browser tests, packaging, MkDocs, Zensical,
  and required smoke benchmarks

#### Scenario: Targeted local reproduction

- Given a GitHub failure occurs in a named lane
- When a developer runs the matching local command
- Then the command SHALL execute the same validation scope used by GitHub for
  that lane

#### Scenario: Remote parity mode

- Given a failure only appears on GitHub
- When a developer runs `npm run ci:remote-parity`
- Then local execution SHALL use GitHub-like behavior for `CI=true`, server
  reuse, generated directories, and environment reporting

## Requirement: NPM Command Contract

TopoViewer SHALL define and enforce a predictable npm command contract.

#### Scenario: Mutating sync command

- Given a command name starts with `sync:`
- When the command succeeds
- Then it MAY update generated projections or copied assets
- And the updated paths SHALL be deterministic from canonical source files

#### Scenario: Check-only command

- Given a command name starts with `check:`, `validate:`, `test:`, or `ci:`
- When the command succeeds
- Then it SHALL NOT leave generated source or projection file changes as a
  normal success path

#### Scenario: Ambiguous alias

- Given two npm commands perform substantially the same workflow
- When the command audit is implemented
- Then the preferred command SHALL be documented
- And any retained alias SHALL either be documented as compatibility or
  deprecated with a clear migration path

#### Scenario: Node version enforcement

- Given a root command builds, tests, validates, or packages TypeScript output
- When the command starts
- Then it SHALL enforce Node.js 24 or fail with a clear message

#### Scenario: Preview server command

- Given a command starts a local preview server
- When the required port is already occupied
- Then it SHALL fail with a clear message instead of silently choosing an
  unexpected URL

## Requirement: GitHub Workflow Observability

GitHub workflows SHALL expose meaningful failure boundaries.

#### Scenario: CI workflow failure

- Given the GitHub `CI` workflow fails
- When the run is inspected in GitHub Actions
- Then the failed step SHALL identify the lane, such as quality, schemas,
  generated artifacts, build, TopoViewer tests, harness tests, package, docs,
  or performance smoke

#### Scenario: Docs workflow failure

- Given the GitHub `Docs` workflow fails
- When the run is inspected in GitHub Actions
- Then the failed step SHALL identify whether MkDocs build, Zensical build,
  harness build, docs smoke, or Pages upload/deploy failed

#### Scenario: Failure artifacts

- Given a browser or docs smoke failure occurs on GitHub
- When the run completes
- Then the workflow SHALL upload traces, screenshots, and relevant generated
  output needed to diagnose the failure

## Requirement: Browser Test Stability

Playwright tests SHALL avoid known local/remote flake sources.

#### Scenario: CI server isolation

- Given Playwright runs under `CI=true`
- When the web server starts
- Then it SHALL not reuse an existing local server
- And it SHALL verify that the served app belongs to the current checkout

#### Scenario: Durable UI assertion

- Given a test validates undo/redo behavior
- When the assertion is evaluated
- Then it SHALL assert durable YAML state and command state
- And it SHALL NOT rely only on a transient status message

#### Scenario: SVG route assertion

- Given a test validates multi-segment edge routing
- When the assertion examines SVG path output
- Then it SHALL tolerate valid SVG command formatting differences
- And it SHALL verify the route behavior rather than exact path string spacing

#### Scenario: Zensical hydration

- Given a Zensical page contains a TopoViewer live viewport
- When the built page is opened in a browser
- Then the viewport SHALL hydrate without requiring manual browser refresh

## Requirement: Docs Deployment Gate

Docs deployment SHALL validate the built artifact before GitHub Pages deploy.

#### Scenario: MkDocs built-site smoke

- Given MkDocs has built `site/**`
- When docs smoke validation runs
- Then at least one representative TopoViewer MkDocs embed SHALL load topology,
  stylesheet, and rendered graph content successfully

#### Scenario: Zensical built-site smoke

- Given Zensical has built `site/docs/zensical/**`
- When docs smoke validation runs
- Then at least one representative TopoViewer Zensical embed SHALL load
  topology, stylesheet, and rendered graph content successfully

#### Scenario: Harness built-site smoke

- Given the browser harness has built under `site/harness/**`
- When docs smoke validation runs
- Then the harness shell SHALL load and expose the fixture index

## Requirement: Retry Policy

Retries SHALL not hide real regressions.

#### Scenario: Required CI test

- Given a test is required for CI
- When it fails once
- Then the default behavior SHALL be failure without silent retry

#### Scenario: Temporary diagnostic retry

- Given a known flaky browser issue has an explicit tracking task
- When a temporary retry is used
- Then the first failure SHALL preserve trace, screenshot, console output, and
  environment report
- And the retry SHALL be documented as temporary
