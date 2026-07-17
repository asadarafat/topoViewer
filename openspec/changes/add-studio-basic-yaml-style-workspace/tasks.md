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

- [x] 1.1 Add failing unit tests for clean, valid dirty, invalid dirty, latest
  valid preview, Apply, Revert, source revision, and stale validation generation
- [x] 1.2 Define framework-independent candidate stylesheet types and state
  transitions without importing React, Monaco, MUI, or host APIs
- [x] 1.3 Extract a pure non-mutating candidate evaluator from existing YAML
  parsing/projection validation and preserve source-mapped diagnostics
- [x] 1.4 Implement candidate initialization, replacement, immediate structured
  mutation, debounced raw-text validation, stale-result rejection, and Revert
- [x] 1.5 Implement recovery serialization that keeps candidate text separate
  from the last valid applied project
- [x] 1.6 Measure candidate evaluation on small and 1,000-node fixtures and set a
  reviewed debounce/budget without moving Monaco into the initial bundle
- [x] 1.7 **Exit gate:** candidate state, diagnostics, recovery, source revision,
  performance, and no-applied-source-mutation tests pass

## 2. Loss-Aware Stylesheet Mutations

- [x] 2.1 Add failing tests for updating an existing scalar, inserting a field,
  creating/reusing/removing an exact-ID rule, and preserving comments, blank
  lines, scalar style, aliases, unknown keys, CRLF, and rule order
- [x] 2.2 Implement exact-ID selector resolution for every style target using
  only the existing selector grammar
- [x] 2.3 Implement candidate field set/unset and empty-rule cleanup through the
  existing parsed YAML/CST mutation boundary
- [x] 2.4 Implement one atomic same-kind multi-object candidate mutation without
  inferred common selectors
- [x] 2.5 Add explicit inline-winner detection and one atomic inline-to-stylesheet
  migration command that changes no unrelated source
- [x] 2.6 Return normalization-required results for unsafe structural edits and
  never normalize candidate YAML silently
- [x] 2.7 **Exit gate:** complete round-trip corpus, exact-ID, bulk, migration,
  normalization, and semantic-render-equivalence tests pass

## 3. Shared Style Workspace State

- [x] 3.1 Add failing React tests proving Basic and YAML consume one candidate,
  switching modes preserves draft/selection/viewport, and closing Style retains it
- [x] 3.2 Add a narrow Style workspace controller/subscription boundary that owns
  candidate state per project and exposes derived values without broad app rerenders
- [x] 3.3 Feed the canvas the latest valid candidate projection while retaining
  transient drag/selection/viewport state
- [x] 3.4 Implement one fixed candidate status/footer with Apply and Revert and no
  duplicate canvas action bar
- [x] 3.5 Implement Apply as one undoable stylesheet replacement and rebase the
  candidate after successful commit
- [x] 3.6 Integrate valid candidate Apply-before-Save/export, invalid candidate
  blocking, workspace retention, project-switch resolution, and external-change
  resolution in browser and VS Code host flows
- [x] 3.7 **Exit gate:** controller, canvas stability, Apply/Revert, Save/export,
  recovery, conflict, undo, browser-host, and VS Code-host tests pass

## 4. Basic Mode

- [x] 4.1 Add failing component/browser tests for node, link, region, shape,
  callout, text, path, link direction, no selection, same-kind mixed values, and
  mixed-kind selection
- [x] 4.2 Replace the object-only Attribute/Value panel with a fixed Basic/YAML
  header and grouped, collapsible Basic field body using existing MUI controls
- [x] 4.3 Generate Basic availability, groups, labels, descriptions, controls,
  defaults, constraints, aliases, and search from canonical metadata only
- [x] 4.4 Implement typed color, number, enum, boolean, text, icon, list, and
  nested controls with validation, inherited values, reset, and stable focus
- [x] 4.5 Bind single-object Basic edits to exact-ID candidate rules and display
  effective value and stylesheet/inline/runtime provenance accurately
- [x] 4.6 Implement same-kind mixed values and one candidate transaction per
  committed bulk edit; keep mixed-kind Basic unavailable
- [x] 4.7 Implement source navigation and explicit inline migration without
  inventing rule IDs or exposing unsupported scope options
- [x] 4.8 Remove superseded object-only matrix/profile UI only after its required
  capabilities and tests are covered by Basic or YAML
- [x] 4.9 **Exit gate:** Basic target compatibility, source ownership, no-browse-
  mutation, mixed values, accessibility, keyboard, and screenshot tests pass

## 5. Embedded YAML Mode

- [x] 5.1 Add failing unit tests for cursor context in root, stylesheet sequence,
  selector, style key, style value, comment, quoted string, block scalar, and URL
- [x] 5.2 Extract reusable Monaco editor registration so owned Code editors
  share theme, diagnostics, focus, and disposal behavior
- [x] 5.3 Implement cursor-path and nearest-rule target inference against the
  candidate YAML source
- [x] 5.4 Implement target-compatible property completion excluding existing
  mapping keys, plus metadata-driven value and project-icon completion
- [x] 5.5 Implement supported selector completion from current topology IDs,
  labels, and data without changing selector grammar
- [x] 5.6 Implement hover documentation and candidate source-mapped diagnostics
  from canonical metadata and validation
- [x] 5.7 Implement context-safe `?` property/value discovery and prove comments,
  quoted strings, block scalars, and URLs remain byte-identical
- [x] 5.8 Implement Go to matching rule, search, explicit format-with-warning, and
  source reveal while preserving selection and viewport
- [x] 5.9 Keep Monaco dynamically imported only after YAML activation and contain
  editor load/render failure without losing Basic or canvas access
- [x] 5.10 **Exit gate:** completion, values, selectors, hover, diagnostics, `?`,
  source reveal, lazy-load, error-boundary, and mode-synchronization tests pass
- [x] 5.11 Audit root, fixed mapping, dynamic icon, sequence-item, nested-style,
  and protected-source completion coverage against the installed stylesheet
  schema and canonical style metadata
- [x] 5.12 Implement missing root, `layout`, `layout.clos`, `limits`, `toggles`,
  `labelFields`, custom-icon, and nested `nodeLayout` cursor contexts in one
  bounded Style YAML assistance path
- [x] 5.13 Add schema-parity unit coverage and real Monaco `?` interaction tests
  for custom SVG icons, layout policy, and nested card-layout fields
- [x] 5.14 Update canonical Studio documentation and synchronize projections
- [x] 5.15 Re-run Studio unit, type, browser, lint, docs, and diff-cleanliness
  gates after the complete context expansion

## 6. Responsive, Accessibility, And Performance Hardening

- [x] 6.1 Implement reviewed Basic and YAML widths/resizing at desktop and
  constrained Studio breakpoints without page-level overflow or canvas reset
- [x] 6.2 Verify keyboard and screen-reader operation for modes, grouped fields,
  mixed values, completion, diagnostics, source navigation, migration, Apply,
  and Revert
- [x] 6.3 Verify dark, light, forced-colors, 200-percent zoom, reduced-motion,
  loading, empty, invalid, conflict, and error states with Playwright evidence
- [x] 6.4 Measure candidate typing, Basic control commit, selection switching,
  rerender count, memory, and 1,000-node canvas stability against Phase 0
- [x] 6.5 Verify initial/lazy bundle budgets and absence of duplicate Monaco,
  YAML, React, MUI, or renderer chunks
- [x] 6.6 **Exit gate:** accessibility, visual, dense-canvas, interaction,
  memory, and bundle gates pass or have an explicit reviewed waiver

## 7. Documentation And Cross-Surface Contract

- [x] 7.1 Update canonical Studio documentation for Basic/YAML styling,
  object-specific stylesheet rules, candidate lifecycle, inline migration,
  completion, diagnostics, and limitations without documenting implementation UI
  that is not shipped
- [x] 7.2 Update architecture, source ownership, recovery, accessibility,
  performance, security, and browser/VS Code host guidance
- [x] 7.3 Synchronize generated docs and verify the exported stylesheet renders
  identically in core React, MkDocs, Zensical, static embed, and Grafana fixtures
- [x] 7.4 **Exit gate:** canonical docs, generated projections, links, snippets,
  and cross-surface render parity checks pass

## 8. Final Validation And Closeout

- [x] 8.1 Run `openspec validate add-studio-basic-yaml-style-workspace --strict`
- [x] 8.2 Run focused core metadata/selector/provenance/session tests, Studio unit,
  typecheck, boundaries, Material, build, browser, accessibility, parity, and
  performance checks and fix every regression
- [x] 8.3 Run full local `npm run ci` on the resulting tree and record command
  results; do not push without explicit user approval
- [x] 8.4 Review final Basic node/link/region, YAML completion, invalid draft,
  mixed selection, inline migration, narrow, and dense-project screenshots
- [x] 8.5 Record remaining risks, rollback procedure, and evidence index; check
  every task only when its evidence exists
- [ ] 8.6 Keep the completed change active until `build-topoviewer-studio`
  establishes baseline Studio specs; archive only after clean committed-tree and
  remote validation requirements are independently satisfied

## 9. Unified Contextual Edit Workspace

- [x] 9.1 Update the active specification and design before implementation so
  Properties and Style merge only at the UI boundary; retain separate topology
  and stylesheet source ownership
- [x] 9.2 Replace the rail with `Objects | Edit | Viewport | Mapper`, route object
  selection to `Edit > Visual`, and route empty-canvas selection to Viewport
- [x] 9.3 Add MUI-native Visual topology/appearance sections and embedded Code
  file authoring with last-valid canvas isolation
- [x] 9.4 Keep Visual selection-scoped through exact-ID candidate mutations,
  remove selector/match-preview and YAML navigation controls from Visual, keep
  reusable selectors in Code, and add focused unit/browser coverage
- [x] 9.5 Update canonical Studio documentation for the unified Edit workflow,
  source ownership, Visual/Code boundary, and `View more`, then synchronize
  projections
- [x] 9.6 Run Studio typecheck, unit tests, focused workspace/YAML/accessibility
  browser tests, core type generation, and visual review; fix every regression
- [ ] 9.7 Run the full local repository CI gate only after 9.6 passes; keep the
  work uncommitted and unpushed until the user reviews the UI

## 10. Visual And Code Information Hierarchy

- [x] 10.1 Replace the user-facing Basic/YAML hierarchy in the active
  specification and design with a distinct `Visual | Code` representation
  switch and file-tab contract before implementation
- [x] 10.2 Implement a native MUI segmented representation switch, contextual
  Visual sections, and a dynamic Edit/Code panel heading
- [x] 10.3 Label Code tabs with actual topology, stylesheet, and available
  mapper project paths and preserve document-specific Apply/Revert behavior
- [x] 10.4 Remove the footer filename pseudo-tab and retire the duplicate global
  source workspace after owned Code paths cover each document
- [x] 10.5 Update canonical documentation and migrate focused tests to the new
  representation and document semantics
- [x] 10.6 Run strict OpenSpec validation, Studio typecheck/unit/build, focused
  workspace/YAML/accessibility browser tests, and visual review in sequence

## 11. Dense Production Edit Workspace

- [x] 11.1 Record the approved dense Visual hierarchy, property-row contract,
  bounded common-field list, source action, scroll ownership, and candidate
  footer behavior in the active specification and design before implementation
- [x] 11.2 Add a shared MUI-native property-row primitive and render topology
  identity, ID, position, and layer membership without the nested Advanced form
- [x] 11.3 Flatten Appearance into compact two-column fields, keep descriptions
  accessible, bound the default field list, suppress routine provenance rows,
  and compress the clean candidate footer
- [x] 11.4 Update canonical documentation and focused browser tests with
  measurable density, one-scroll-owner, source-command, and candidate-state
  assertions
- [x] 11.5 Run strict OpenSpec validation, Studio typecheck/unit/build, focused
  browser and accessibility tests, visual review at quarter/half widths,
  Material ownership, dependency boundaries, docs lint, and diff checks

## 12. Single Source-Editing Ownership

- [x] 12.1 Update the active contract so `Edit > Code` owns topology and
  stylesheet YAML, `Mapper > Code` owns mapper YAML, and no global source
  workspace remains
- [x] 12.2 Remove the source-workspace command, drawer, resize state, duplicate
  editor lifecycle, dead CSS, and source-navigation buttons
- [x] 12.3 Preserve normalization safety through a focused MUI review dialog and
  route Mapper Visual source actions into Mapper Code
- [x] 12.4 Migrate canonical documentation and focused tests to the owned Code
  paths, then synchronize generated documentation
- [x] 12.5 Run strict OpenSpec validation, Studio typecheck/unit/build, focused
  browser/accessibility tests, docs checks, and diff checks in sequence
