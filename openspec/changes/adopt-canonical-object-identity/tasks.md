## 1. Audit And Baseline

- [x] 1.1 Record existing entity fields, display fallback, selector support,
  schema permissiveness, Studio rename behavior, and dirty worktree boundaries.
- [x] 1.2 Add failing core and Studio tests for canonical display, strict topology
  ownership, exact-ID precedence, semantic rename, and the recorded duplicate-
  rename workflow.

## 2. Core Contract

- [x] 2.1 Add canonical addressable-entity types using `id` plus optional
  `labels.name`; preserve specialized content fields.
- [x] 2.2 Make display-label resolution use `labels.name` then `id` consistently
  across renderer, accessibility, controls, attention, and authoring metadata.
- [x] 2.3 Implement deterministic selector specificity and align style
  provenance with runtime application order.
- [x] 2.4 Make version `0.2` topology schemas and runtime validators reject
  generic object `name`, generic object `label`, inline `style`, `icon`, and
  callout leader appearance while retaining structural geometry.

## 3. Migration

- [x] 3.1 Implement a pure loss-aware `0.1` to `0.2` bundle migration for names,
  aliases, inline appearance, icons, and callout leader policy.
- [x] 3.2 Add conflict diagnostics and an explicit repository migration command;
  prove idempotence and rendered parity with fixtures.

## 4. Semantic Rename

- [x] 4.1 Implement the shared typed reference index and rename-impact report in
  `packages/topoviewer` with linear-time tests.
- [x] 4.2 Implement a core semantic rename plan covering topology, attention,
  exact-ID selectors, and supported mapper references without replacing free text.
- [x] 4.3 Add a Studio source-batch API that applies topology, stylesheet, and
  mapper mutations to cloned sources, validates once, and commits all or none.

## 5. Studio UX And Authoring

- [x] 5.1 Replace generic name editing with primary ID editing and optional
  `labels.name` editing in Visual mode, including collision and impact feedback.
- [x] 5.2 Route Code-mode ID changes through the semantic refactor and expose
  structured dangling-reference diagnostics and quick fixes.
- [x] 5.3 Remove topology inline-style creation/migration controls; make palette,
  duplication, presets, Format Painter, and Visual style editing write stylesheet
  rules only.
- [x] 5.4 Preserve selection, one-step undo/redo, keyboard behavior,
  accessibility, and latest-valid preview across a rename transaction.

## 6. Repository Migration And Documentation

- [x] 6.1 Migrate canonical examples, fixtures, labs, starter projects, and docs
  sources to version `0.2` without relying on runtime compatibility migration.
- [x] 6.2 Regenerate schemas, object references, MkDocs/Zensical projections, and
  document ID tracing, alias use, strict topology ownership, migration, and
  external telemetry implications.

## 7. Verification

- [x] 7.1 Run focused core unit/schema/semantic tests and Studio unit/browser
  journeys, including the recorded duplicate-and-rename workflow.
- [x] 7.2 Measure migration and rename behavior on a representative 1,000-node
  bundle and keep it within existing interaction budgets.
- [ ] 7.3 Run package builds, lint, docs parity, MkDocs/Zensical browser checks,
  Grafana package tests, security checks, and full `npm run ci`; fix fallout.
- [ ] 7.4 Review the final diff for unrelated changes, validate this OpenSpec
  change strictly, record remaining external-integration risks, then archive only
  after every task and required remote gate is complete.
