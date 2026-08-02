## 1. Architecture And Baseline

- [x] 1.1 Audit the existing core attention schema/runtime, Studio command and session boundaries, Project Source disclosure pattern, browser/Wails host ownership, and active OpenSpec changes; confirm that the core reducer and lazy Studio manager are the bounded owners.
- [x] 1.2 Validate the proposal, design, and capability deltas with `openspec validate add-studio-attention-authoring --strict` before production changes.
- [x] 1.3 Run and record the existing focused core authoring, Studio Project Source/layer, browser interaction, and bundle-budget checks as the behavioral baseline.

## 2. Test-First Contracts

- [x] 2.1 Add core unit tests for immutable focus updates, advanced-clause preservation, reference validation, deterministic aggregate IDs, link-grouping validation, summary projection, and complete policy removal; record the expected missing-contract failure.
- [x] 2.2 Add Studio capability tests for one-command attention mutations, selection preservation, invalid-draft rejection, error reporting, and undo/redo; record the expected missing-capability failure.
- [x] 2.3 Add Playwright tests for Attention discovery, focus from canvas selection, aggregate and link-grouping workflows, YAML navigation, explicit removal, invalid-draft protection, and keyboard/accessibility behavior; record the expected missing-UI failure.

## 3. Core Attention Authoring

- [x] 3.1 Implement the pure typed attention reducer in the core authoring boundary with validation, deterministic cleanup, structural preservation, and no input mutation.
- [x] 3.2 Implement the compact attention summary projection used by authoring consumers without duplicating schema or runtime rules.
- [x] 3.3 Export the additive contract through `topoviewer/authoring/attention`, synchronize API reports, and pass focused core unit, type, lint, and package-boundary checks.

## 4. Studio Command Integration

- [x] 4.1 Implement one Studio attention capability that evaluates actions against the latest valid snapshot and emits at most one top-level `attention` upsert/remove command.
- [x] 4.2 Wire the capability through the Studio controller and workspace boundary while preserving selection, recovery, diagnostics, invalid drafts, and host neutrality.
- [x] 4.3 Pass focused capability tests proving deterministic errors and complete undo/redo across the browser-owned session.

## 5. Visual Attention Workflow

- [x] 5.1 Add an explicit singleton Attention row under Project Source with status, disclosure, source navigation, and no misleading collection Add affordance.
- [x] 5.2 Add a lazy Material UI Attention manager for focus IDs/modes and click focus, including compatible canvas-selection shortcuts and visible advanced-clause reporting.
- [x] 5.3 Add region/parent aggregate authoring with valid selection affordances, deterministic group listing, initial expansion, click expansion, and removal.
- [x] 5.4 Add parallel-link grouping controls for enablement, threshold, keys, selector, and click expansion while preserving viewport clauses in YAML.
- [x] 5.5 Add explicit complete-policy removal confirmation, invalid-draft mutation guards, accessible labels/status, dense-project memoization, and browser/Wails shared behavior.
- [x] 5.6 Add the lazy Attention feature to Studio bundle-budget enforcement and pass focused unit, browser, accessibility, interaction, and initial-chunk checks.

## 6. Documentation And Generated Projections

- [x] 6.1 Update the canonical Studio authoring guide to explain Attention discovery, focus, aggregation, parallel-link grouping, advanced YAML ownership, invalid drafts, and undo/redo.
- [x] 6.2 Synchronize generated MkDocs and Zensical projections and verify navigation, links, code examples, and dark/light rendering where affected.

## 7. Completion Evidence

- [x] 7.1 Run affected package type, lint, unit, browser, accessibility, build, API-report, bundle-budget, docs, and desktop-host checks; fix all regressions.
- [ ] 7.2 Run the full local CI gate on a clean committed tree, record exact results under the change, and perform a skeptical architecture, DRY, compatibility, security, and diff review.
- [ ] 7.3 Re-run strict OpenSpec validation, reconcile every task with evidence, update public support wording if required, and archive only after remote CI is green and no required work remains.

## 8. Project-Level Placement Refinement

- [x] 8.1 Amend and strictly validate the architecture and workbench contract so Attention is owned by Project Source View policies, not Topology Outline or per-object state.
- [x] 8.2 Add failing unit and browser coverage for the shared selection projection, View policies placement, Properties shortcuts, manager reveal, and absence of duplicated global controls.
- [x] 8.3 Extract one Studio selection projection consumed by both the full Attention manager and contextual Properties commands.
- [x] 8.4 Move the singleton manager to View policies and wire controlled disclosure through the workspace so Properties can reveal it on desktop and mobile.
- [x] 8.5 Add bounded Properties shortcuts for replace/add/remove focus and valid region/parent aggregation through the existing Attention capability.
- [x] 8.6 Update canonical and generated Studio guidance, then pass focused type, lint, unit, browser, accessibility, bundle, and documentation checks.
- [x] 8.7 Perform a final ownership, DRY, accessibility, invalid-draft, browser/Wails parity, and diff review before reconciling this refinement's tasks.
