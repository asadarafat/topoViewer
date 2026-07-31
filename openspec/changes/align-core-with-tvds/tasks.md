## 1. Contract And Scope

- [x] 1.1 Validate proposal, capability deltas, design, and sequential tasks
- [x] 1.2 Add canonical logical-topology ownership and non-goal documentation
- [x] 1.3 Record baseline API, package, accessibility, theme-literal, and embed
  behavior evidence before implementation

Baseline on `5ec3f30`: the 1,442-line core stylesheet contains 114 color
literal occurrences and 93 unique literals; only dark root/parity token sets
exist. `compileTopoGraph` throws on invalid or oversized input. Compiled ARIA
labels identify object kind/name and edge endpoints but omit normalized status.
React Flow native node/edge focus and keyboard movement are enabled by default.
Embed zoom thresholds are private to `embed.tsx`. Layout validation accepts
only `manual`, `force`, and `clos`. The baseline core unit suite passes 41 files
and 278 tests.

## 2. Accessibility And Render States

- [x] 2.1 Add failing unit tests for safe compilation diagnostics, semantic
  accessibility names, and empty-state classification
- [x] 2.2 Add failing React/Playwright tests for keyboard traversal, default and
  custom empty/error fallbacks, and diagnostic callbacks
- [x] 2.3 Implement the non-throwing compiler result by wrapping authoritative
  validation, limits, and compilation
- [x] 2.4 Implement semantic node/edge descriptions, default fallbacks, and the
  renderer error boundary while preserving native React Flow accessibility
- [x] 2.5 Run focused unit, type, and Playwright evidence before continuing

## 3. Theme And Token Contract

- [x] 3.1 Add failing tests for typed light/dark/system themes, overrides,
  packed CSS definitions, and unowned color detection
- [x] 3.2 Implement public theme tokens and renderer color-mode props
- [x] 3.3 Consolidate core CSS onto one token source and the 4 px chrome spacing
  scale without changing authored topology style ownership
- [x] 3.4 Add the core theme-ownership check to package and repository CI
- [x] 3.5 Run focused visual, CSS ownership, build, and package checks

## 4. Status And TVDS Lint Profile

- [x] 4.1 Add failing tests for alias precedence, status descriptions,
  deterministic legend output, non-color cues, and literal contrast warnings
- [x] 4.2 Implement the canonical severity resolver and legend builder
- [x] 4.3 Reuse semantic status from compiled accessibility output
- [x] 4.4 Implement opt-in `tvds` lint rules without changing default lint output
- [x] 4.5 Run focused compiler, lint, mapper compatibility, and type tests

## 5. Shared Drilldown Controller

- [x] 5.1 Add failing reducer tests for expansion, collapse, no-op behavior,
  invalid threshold normalization, and hysteresis
- [x] 5.2 Implement the pure public viewport reducer and types
- [x] 5.3 Replace embed-private threshold logic with the shared reducer
- [x] 5.4 Run reducer, embed interaction, and renderer parity evidence

## 6. Layout Providers And Tree Layout

- [x] 6.1 Add failing tests for provider dispatch, unknown providers,
  deterministic trees, direction transforms, disconnected graphs, and cycles
- [x] 6.2 Implement the provider interface and route manual, force, and CLOS
  behavior through the built-in registry without output drift
- [x] 6.3 Implement the deterministic tree provider and bounded options
- [x] 6.4 Update runtime validation, JSON Schema, authoring metadata, and examples
- [x] 6.5 Run layout unit, schema, semantic, API, and benchmark smoke evidence

## 7. Contextual Interaction Presets

- [x] 7.1 Add failing contract tests for runtime, guided-authoring, and
  rapid-authoring presets
- [x] 7.2 Implement immutable public presets and adopt them in representative
  direct React and Studio paths where equivalent local flags exist
- [x] 7.3 Run authoring interaction and host parity tests

## 8. Documentation And Consumer Contracts

- [x] 8.1 Document safe rendering, accessibility, themes, status/legends,
  drilldown, tree layout, interaction presets, and geographic non-scope
- [x] 8.2 Add or update representative canonical examples without duplicating
  generated documentation sources
- [x] 8.3 Update package API reports and packed ESM/CJS/type fixtures
- [x] 8.4 Synchronize generated docs and verify MkDocs, Zensical, embed, Studio,
  and Grafana consumption boundaries

## 9. Verification And Adversarial Review

- [x] 9.1 Run focused core unit and Playwright suites
- [ ] 9.2 Run schema, semantic, type, API, package, render-parity, and docs gates
- [ ] 9.3 Run full local CI and fix every regression
- [ ] 9.4 Review accessibility, security, performance, backwards compatibility,
  theme ownership, provider determinism, and cross-surface duplication
- [ ] 9.5 Re-run affected gates after review fixes and reconcile every task with
  observable evidence
- [ ] 9.6 Archive only after a clean committed tree passes full CI
