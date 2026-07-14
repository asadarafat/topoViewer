# Basic And YAML Style Workspace Implementation Plan

Execute this checklist strictly from top to bottom. A phase MUST NOT begin until
the preceding exit gate is checked. Check a task only after its named test,
command output, artifact, screenshot, or reviewable diff supplies evidence.
Keep transient evidence under `.artifacts/studio-style-workspace/` and do not
commit screenshots, traces, recordings, or benchmark output.

## 0. Baseline And Contract Freeze

- [x] 0.1 Record baseline `f8071f9` Style panel, source drawer, candidate,
  Save, external-change, browser-host, and VS Code-host ownership in
  `.artifacts/studio-style-workspace/baseline.md`
- [x] 0.2 Capture the current object-only Attribute/Value node, link, region,
  no-selection, invalid stylesheet, and source-drawer states at 1600x900
- [x] 0.3 Record current Style gesture count, Studio initial/lazy bundle sizes,
  1,000-node selection response, stylesheet parse/validation time, and existing
  focused test commands
- [x] 0.4 Normalize `.artifacts/specs-style.md` to one non-duplicated reference
  copy and correct examples to `stylesheet`, supported selectors, and no rule ID
- [x] 0.5 Prove the current inline-style precedence, exact-ID selector behavior,
  YAML source preservation, invalid-draft isolation, and host save behavior with
  existing tests or new characterization tests
- [x] 0.6 **Exit gate:** strict OpenSpec validation passes and baseline evidence
  identifies commit `f8071f9` rather than stale planning UI

## 1. Candidate Stylesheet Contract

- [ ] 1.1 Add failing unit tests for clean, valid dirty, invalid dirty, latest
  valid preview, Apply, Revert, source revision, and stale validation generation
- [ ] 1.2 Define framework-independent candidate stylesheet types and state
  transitions without importing React, Monaco, MUI, or host APIs
- [ ] 1.3 Extract a pure non-mutating candidate evaluator from existing YAML
  parsing/projection validation and preserve source-mapped diagnostics
- [ ] 1.4 Implement candidate initialization, replacement, immediate structured
  mutation, debounced raw-text validation, stale-result rejection, and Revert
- [ ] 1.5 Implement recovery serialization that keeps candidate text separate
  from the last valid applied project
- [ ] 1.6 Measure candidate evaluation on small and 1,000-node fixtures and set a
  reviewed debounce/budget without moving Monaco into the initial bundle
- [ ] 1.7 **Exit gate:** candidate state, diagnostics, recovery, source revision,
  performance, and no-applied-source-mutation tests pass

## 2. Loss-Aware Stylesheet Mutations

- [ ] 2.1 Add failing tests for updating an existing scalar, inserting a field,
  creating/reusing/removing an exact-ID rule, and preserving comments, blank
  lines, scalar style, aliases, unknown keys, CRLF, and rule order
- [ ] 2.2 Implement exact-ID selector resolution for every style target using
  only the existing selector grammar
- [ ] 2.3 Implement candidate field set/unset and empty-rule cleanup through the
  existing parsed YAML/CST mutation boundary
- [ ] 2.4 Implement one atomic same-kind multi-object candidate mutation without
  inferred common selectors
- [ ] 2.5 Add explicit inline-winner detection and one atomic inline-to-stylesheet
  migration command that changes no unrelated source
- [ ] 2.6 Return normalization-required results for unsafe structural edits and
  never normalize candidate YAML silently
- [ ] 2.7 **Exit gate:** complete round-trip corpus, exact-ID, bulk, migration,
  normalization, and semantic-render-equivalence tests pass

## 3. Shared Style Workspace State

- [ ] 3.1 Add failing React tests proving Basic and YAML consume one candidate,
  switching modes preserves draft/selection/viewport, and closing Style retains it
- [ ] 3.2 Add a narrow Style workspace controller/subscription boundary that owns
  candidate state per project and exposes derived values without broad app rerenders
- [ ] 3.3 Feed the canvas the latest valid candidate projection while retaining
  transient drag/selection/viewport state
- [ ] 3.4 Implement one fixed candidate status/footer with Apply and Revert and no
  duplicate canvas action bar
- [ ] 3.5 Implement Apply as one undoable stylesheet replacement and rebase the
  candidate after successful commit
- [ ] 3.6 Integrate valid candidate Apply-before-Save/export, invalid candidate
  blocking, workspace retention, project-switch resolution, and external-change
  resolution in browser and VS Code host flows
- [ ] 3.7 **Exit gate:** controller, canvas stability, Apply/Revert, Save/export,
  recovery, conflict, undo, browser-host, and VS Code-host tests pass

## 4. Basic Mode

- [ ] 4.1 Add failing component/browser tests for node, link, region, shape,
  callout, text, path, link direction, no selection, same-kind mixed values, and
  mixed-kind selection
- [ ] 4.2 Replace the object-only Attribute/Value panel with a fixed Basic/YAML
  header and grouped, collapsible Basic field body using existing MUI controls
- [ ] 4.3 Generate Basic availability, groups, labels, descriptions, controls,
  defaults, constraints, aliases, and search from canonical metadata only
- [ ] 4.4 Implement typed color, number, enum, boolean, text, icon, list, and
  nested controls with validation, inherited values, reset, and stable focus
- [ ] 4.5 Bind single-object Basic edits to exact-ID candidate rules and display
  effective value and stylesheet/inline/runtime provenance accurately
- [ ] 4.6 Implement same-kind mixed values and one candidate transaction per
  committed bulk edit; keep mixed-kind Basic unavailable
- [ ] 4.7 Implement source navigation and explicit inline migration without
  inventing rule IDs or exposing unsupported scope options
- [ ] 4.8 Remove superseded object-only matrix/profile UI only after its required
  capabilities and tests are covered by Basic or YAML
- [ ] 4.9 **Exit gate:** Basic target compatibility, source ownership, no-browse-
  mutation, mixed values, accessibility, keyboard, and screenshot tests pass

## 5. Embedded YAML Mode

- [ ] 5.1 Add failing unit tests for cursor context in root, stylesheet sequence,
  selector, style key, style value, comment, quoted string, block scalar, and URL
- [ ] 5.2 Extract reusable Monaco editor registration so embedded Style YAML and
  the global source drawer share theme, diagnostics, focus, and disposal behavior
- [ ] 5.3 Implement cursor-path and nearest-rule target inference against the
  candidate YAML source
- [ ] 5.4 Implement target-compatible property completion excluding existing
  mapping keys, plus metadata-driven value and project-icon completion
- [ ] 5.5 Implement supported selector completion from current topology IDs,
  labels, and data without changing selector grammar
- [ ] 5.6 Implement hover documentation and candidate source-mapped diagnostics
  from canonical metadata and validation
- [ ] 5.7 Implement context-safe `?` property/value discovery and prove comments,
  quoted strings, block scalars, and URLs remain byte-identical
- [ ] 5.8 Implement Go to matching rule, search, explicit format-with-warning, and
  source reveal while preserving selection and viewport
- [ ] 5.9 Keep Monaco dynamically imported only after YAML activation and contain
  editor load/render failure without losing Basic or canvas access
- [ ] 5.10 **Exit gate:** completion, values, selectors, hover, diagnostics, `?`,
  source reveal, lazy-load, error-boundary, and mode-synchronization tests pass

## 6. Responsive, Accessibility, And Performance Hardening

- [ ] 6.1 Implement reviewed Basic and YAML widths/resizing at desktop and
  constrained Studio breakpoints without page-level overflow or canvas reset
- [ ] 6.2 Verify keyboard and screen-reader operation for modes, grouped fields,
  mixed values, completion, diagnostics, source navigation, migration, Apply,
  and Revert
- [ ] 6.3 Verify dark, light, forced-colors, 200-percent zoom, reduced-motion,
  loading, empty, invalid, conflict, and error states with Playwright evidence
- [ ] 6.4 Measure candidate typing, Basic control commit, selection switching,
  rerender count, memory, and 1,000-node canvas stability against Phase 0
- [ ] 6.5 Verify initial/lazy bundle budgets and absence of duplicate Monaco,
  YAML, React, MUI, or renderer chunks
- [ ] 6.6 **Exit gate:** accessibility, visual, dense-canvas, interaction,
  memory, and bundle gates pass or have an explicit reviewed waiver

## 7. Documentation And Cross-Surface Contract

- [ ] 7.1 Update canonical Studio documentation for Basic/YAML styling,
  object-specific stylesheet rules, candidate lifecycle, inline migration,
  completion, diagnostics, and limitations without documenting implementation UI
  that is not shipped
- [ ] 7.2 Update architecture, source ownership, recovery, accessibility,
  performance, security, and browser/VS Code host guidance
- [ ] 7.3 Synchronize generated docs and verify the exported stylesheet renders
  identically in core React, MkDocs, Zensical, static embed, and Grafana fixtures
- [ ] 7.4 **Exit gate:** canonical docs, generated projections, links, snippets,
  and cross-surface render parity checks pass

## 8. Final Validation And Closeout

- [ ] 8.1 Run `openspec validate add-studio-basic-yaml-style-workspace --strict`
- [ ] 8.2 Run focused core metadata/selector/provenance/session tests, Studio unit,
  typecheck, boundaries, Material, build, browser, accessibility, parity, and
  performance checks and fix every regression
- [ ] 8.3 Run full local `npm run ci` on the resulting tree and record command
  results; do not push without explicit user approval
- [ ] 8.4 Review final Basic node/link/region, YAML completion, invalid draft,
  mixed selection, inline migration, narrow, and dense-project screenshots
- [ ] 8.5 Record remaining risks, rollback procedure, and evidence index; check
  every task only when its evidence exists
- [ ] 8.6 Keep the completed change active until `build-topoviewer-studio`
  establishes baseline Studio specs; archive only after clean committed-tree and
  remote validation requirements are independently satisfied
