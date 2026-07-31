## 1. Audit And Baseline

- [x] 1.1 Audit core, Studio session, command, renderer, mapper, export, host,
  browser, and Wails ownership boundaries
- [x] 1.2 Compare the approved wireframe with the production shell and record
  which behavior is presentation versus canonical runtime contract
- [x] 1.3 Audit active OpenSpec changes and confirm no overlapping YAML-first
  workbench implementation exists
- [x] 1.4 Capture current focused unit, browser shell, accessibility, bundle,
  and desktop golden-journey baselines under `.artifacts/`

## 2. Contract And Architecture

- [x] 2.1 Define the YAML-first product, spec-driven authoring, mapper, and
  production-readiness deltas
- [x] 2.2 Define canonical ownership, state transitions, document lifecycles,
  renderer reuse, responsive behavior, and failure boundaries in `design.md`
- [x] 2.3 Update Studio architecture decisions to supersede the canvas-first
  rail without weakening session, command, host, or renderer boundaries
- [x] 2.4 Strictly validate the complete OpenSpec change before implementation

## 3. Test-First Workbench Evidence

- [x] 3.1 Add unit tests for Source/Split/Preview preference normalization,
  legacy preference migration, 25/75 default, and divider bounds
- [x] 3.2 Add unit tests for topology, stylesheet-candidate, mapper, and missing-
  mapper source presentation models
- [x] 3.3 Add browser tests for persistent project source, one shared Monaco
  editor, and the default 25/75 real-preview split
- [x] 3.4 Add browser tests for document switching, dirty/invalid/candidate
  state, context help, diagnostics, Apply, Revert, and source navigation
- [x] 3.5 Add browser tests for Add, object Properties, canvas Properties,
  compatible/mixed multi-selection, and pinned Mapper drawers
- [x] 3.6 Add browser tests for browser project lifecycle, assets, layers,
  problems, normalization, conflict, recovery, presentation, and export reachability
- [x] 3.7 Run the focused tests before implementation and record the expected
  failures caused by the absent YAML-first shell
- [x] 3.8 Add and run fail-first browser coverage for the approved context bar,
  preview-local controls, overlay drawers, project-source filtering, and
  collapsible five-view session dock
- [x] 3.9 Add and run fail-first unit and browser coverage proving that valid
  unapplied topology and mapper source survives recovery without editor-owned
  state
- [x] 3.10 Add and run fail-first unit and browser coverage for desktop Project
  Source visibility, navigator section order, persistent Authoring, concurrent
  Properties, and narrow-drawer serialization
- [x] 3.11 Add and run fail-first browser coverage for compact control-owned
  labels, helper text, and unchanged Properties commit behavior
- [x] 3.12 Add and run fail-first browser coverage for project-source section
  dividers, the split Monaco toolbar/status chrome, and form-consistent
  Appearance search
- [x] 3.13 Add and run fail-first browser coverage for uniform source rows,
  actionable asset disclosure, shared source chrome fill, and Mapper form
  controls
- [x] 3.14 Add and run fail-first browser and desktop ownership coverage for
  navigator terminology, shared semantic icons, the mirrored source toggle,
  and canonical Studio brand assets

## 4. Shared Source Workspace

- [x] 4.1 Implement the typed workbench layout and preference model without
  project or document state
- [x] 4.2 Implement a shared source-document presentation adapter for topology,
  stylesheet candidate, mapper, and absent mapper
- [x] 4.3 Implement one lazy MUI/Monaco source workspace with search, context
  help, diagnostics, Apply, Revert, failure fallback, and range navigation
- [x] 4.4 Keep applied-invalid drafts, transient source drafts, and stylesheet
  candidates in their explicit session owners and prove the source workspace
  owns no duplicate buffer
- [x] 4.5 Implement Source, Split, and Preview controls and a pointer/keyboard
  divider with a 25/75 default and bounded persistence

## 5. Production Shell Composition

- [x] 5.1 Implement the MUI project-source navigator for documents, assets,
  layers, problems, and project state
- [x] 5.2 Compose project source, shared editor, and the existing
  `CanvasSurface` without an alternate preview
- [x] 5.3 Move Add into the one preview-local contextual drawer and preserve
  palette, presets, drag/drop, edge modes, and self-contained asset insertion
- [x] 5.4 Move Properties Visual and canvas Properties into the drawer and make
  every source action target the shared editor
- [x] 5.5 Move Mapper Visual into the drawer while keeping mapper YAML in the
  shared source editor
- [x] 5.6 Preserve graph, layer, node, link, linkDirection, path, region, shape,
  callout, text, and multi-selection context
- [x] 5.7 Make preview fit, toolbars, drawers, and presentation use the
  unobscured preview rectangle
- [x] 5.8 Remove the old workspace rail, right dock, and embedded duplicate Code
  representations after parity tests pass
- [x] 5.9 Expose the desktop Project Source toggle, place Authoring directly
  below Workspace, persist independent Authoring visibility, support concurrent
  desktop Properties, and keep preview controls outside both visible drawer
  insets
- [x] 5.10 Replace redundant Properties label/editor rows with compact
  control-owned MUI form labels without changing generated-field ownership
- [x] 5.11 Add MUI section dividers, move source utility commands above Monaco,
  and align Appearance search with generated form controls
- [x] 5.12 Remove competing navigator row borders, normalize optional-document
  metadata, hide empty assets, harmonize source chrome, and migrate Mapper
  fields to the shared MUI form contract
- [x] 5.13 Centralize navigator/palette semantic icons, align outline
  terminology, mirror the source toggle, and integrate canonical browser,
  header, and Wails identity assets

## 6. Contract Wiring

- [x] 6.1 Wire source edits, direct manipulation, identity rename, deletion
  cleanup, undo, redo, selection, and source ranges through existing commands
- [x] 6.2 Wire viewport preferences and layer visibility/definition ownership
  without writing view state into project source
- [x] 6.3 Wire project create/open/folder/archive/rename/duplicate/delete/reset
  and dirty-candidate guards through `StudioHost`
- [x] 6.4 Wire bounded asset operations, previews, sanitizer errors, presets,
  and template declarations through existing host/security capabilities
- [x] 6.5 Wire diagnostics, invalid drafts, normalization review, command
  errors, external conflicts, recovery, and problem navigation
- [x] 6.6 Wire save, autosave, export formats/progress/results, presentation,
  appearance, feedback, and command search
- [x] 6.7 Verify browser and Wails frontends mount the same public Studio app
  without host-specific feature UI

## 7. Responsive, Accessible, And Material UI Behavior

- [x] 7.1 Implement desktop and constrained layouts using MUI theme, spacing,
  typography, and semantic colors only
- [x] 7.2 Implement temporary source and contextual drawers at narrow widths
  without horizontal page overflow
- [x] 7.3 Implement deterministic keyboard order, divider semantics, focus
  restoration, announcements, tooltips, and non-color state cues
- [x] 7.4 Verify 200 percent zoom, forced colors, reduced motion, light, dark,
  loading, empty, disabled, error, and destructive states
- [x] 7.5 Pass Material ownership, theme, typography, spacing, and architecture
  checks without new exceptions

## 8. Performance And Failure Containment

- [x] 8.1 Preserve lazy Monaco, Mapper, dialogs, archive, assets, and export
  boundaries and update bundle budgets only with measured justification
- [x] 8.2 Verify layout resize and preview selection do not reconstruct the
  session/controller or invoke source serialization
- [x] 8.3 Verify source typing, candidate validation, drawer switching, and
  direct manipulation remain bounded on representative projects
- [x] 8.4 Run 1,000-node preview, drag, memory, source, Inspector, mapper, and
  blank-canvas performance checks
- [x] 8.5 Exercise forced Monaco, mapper, export, persistence, asset, and host
  failures and prove unrelated source/preview recovery
- [x] 8.6 Isolate browser, parity, and performance test builds from the
  deployable `site/studio` artifact and prove docs smoke remains order
  independent

## 9. Documentation And Generated Evidence

- [x] 9.1 Update `packages/topoviewer-studio/ARCHITECTURE.md` and contributor
  guidance with the YAML-first ownership and workbench state model
- [x] 9.2 Update canonical Studio product and use-case documentation without
  exposing wireframe implementation detail
- [x] 9.3 Synchronize generated MkDocs/Zensical content and audit navigation and
  links
- [x] 9.4 Replace Studio release screenshots with real browser and Wails
  YAML-first product states using the canonical topology bundle
- [x] 9.5 Update screenshot freshness metadata and release automation coverage

## 10. Validation And Closeout

- [x] 10.1 Run focused unit, browser shell, source, style, mapper, CRUD,
  persistence, export, security, and host-conformance tests
- [x] 10.2 Run Studio typecheck, build, production browser, accessibility,
  parity, Material, theme, boundary, and bundle checks
- [x] 10.3 Run desktop frontend tests, Go tests, generated-binding checks, build,
  artifact inspection, and golden journey
- [x] 10.4 Run full local `npm ci` and `npm run ci` on a clean committed tree
- [x] 10.5 Perform adversarial review for duplicate state, parser/renderer
  duplication, lost YAML, stale candidate, host leakage, accessibility,
  performance, and rollback
- [x] 10.6 Strictly validate and archive only after every task has evidence,
  remote CI and desktop artifact jobs pass, and remaining risks are recorded
- [x] 10.7 Run focused unit, browser, typecheck, Material, and strict OpenSpec
  verification for Project Source and independent Authoring behavior
- [x] 10.8 Run focused Properties, accessibility, typecheck, Material, and
  strict OpenSpec verification for compact generated form controls
- [x] 10.9 Run focused navigator, shared-source, Properties, accessibility,
  typecheck, Material, visual, and strict OpenSpec verification for the
  workbench hierarchy refinement
- [x] 10.10 Run focused navigator, mapper, accessibility, typecheck, Material,
  visual, and strict OpenSpec verification for uniform source and form
  refinement
- [x] 10.11 Run focused workbench, desktop ownership, accessibility, typecheck,
  build, Material, light/dark visual, and strict OpenSpec verification for the
  semantic icon and Studio identity refinement
