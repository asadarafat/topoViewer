# TopoViewer Studio Implementation Plan

Execute this checklist strictly from top to bottom. A numbered phase MUST NOT
start until the preceding phase's exit gate is checked. Check a task only after
its named diff, command output, test, screenshot, trace, or review supplies the
evidence. Keep transient evidence under `.artifacts/topoviewer-studio/`; do not
commit recordings, traces, benchmark output, or screenshots unless a later task
promotes a reviewed asset into documentation.

## 0. Baseline And Product Acceptance

- [x] 0.1 Record the reference machine, OS, Node 24 version, browser versions,
  viewport, CPU throttling policy, and measurement commands in
  `.artifacts/topoviewer-studio/baseline/environment.md`
- [x] 0.2 Inventory every current Harness workflow and map it to `reuse`, `move`,
  `replace`, or `remove-with-rationale` in a parity matrix
- [x] 0.3 Inventory all authoring/session/UI code in `vscode-topoviewer`, record
  imports and owners, and identify every deep or circular dependency that must
  be removed
- [x] 0.4 Record desktop and narrow Harness screenshots for empty project,
  populated project, selected node/link/region/path, style editing, mapper
  editing, invalid YAML, layers, settings, and export
- [x] 0.5 Record a primary baseline journey: create a project, create two nodes,
  connect them, style one node, add one mapper rule, recover invalid YAML, save,
  export, and re-import
- [x] 0.6 Measure primary-journey elapsed time, gesture count, modal count,
  invalid actions, and user-visible error count
- [x] 0.7 Measure initial/lazy compressed bundle sizes, startup, 1,000-node and
  2,500-link render, pan/zoom, repeated drag with helper lines, drop-to-visible,
  drag-stop commit, and Inspector responsiveness
- [x] 0.8 Capture current browser and VS Code save, reload, invalid-draft,
  external-change, corruption, and recovery behavior
- [x] 0.9 Build round-trip fixtures covering comments, ordering, quoted scalars,
  block scalars, anchors, aliases, unknown fields, extension keys, CRLF, mapper
  constructs, and assets
- [x] 0.10 Add a lossless YAML mutation spike using the repository's structured
  YAML parser and prove a one-field edit preserves every untouched fixture byte
  or records the smallest justified normalization
- [x] 0.11 Add a command/session spike proving 1,000 pointer updates produce zero
  YAML serializations and drag stop produces one source mutation, validation,
  persistence request, and undo item
- [x] 0.12 Review the Studio product promise with the baseline journey and record
  explicit acceptance criteria, deliberate Harness removals, and non-goals
- [x] 0.13 **Exit gate:** approve the parity matrix, baseline report, YAML spike,
  command spike, and quantified product acceptance criteria before scaffolding
  the Studio package

## 1. Architecture And Public Contracts

- [x] 1.1 Write Architecture Decision Records for repository ownership,
  dependency direction, Studio host boundary, source/session authority, command
  transactions, metadata ownership, and Harness migration
- [x] 1.2 Scaffold a contract-only private `packages/topoviewer-studio` workspace
  with Node 24, TypeScript project references, unit tests, and explicit package
  exports; application and browser build code remain Phase 2
- [x] 1.3 Define the minimal serializable `StudioHost` capability types, typed
  errors, revision/conflict model, asset requests, export requests, preferences,
  and host events
- [x] 1.4 Define the `StudioProject`, `StudioSession`, valid projection, invalid
  draft, source revision, dirty state, recovery snapshot, and migration types
- [x] 1.5 Define command, transaction, coalescing, undo/redo, cancellation, and
  selection-restoration contracts independent of React
- [x] 1.6 Define canonical style and mapper authoring metadata types without
  importing UI components into `topoviewer`
- [x] 1.7 Define built-in and user authoring profile types, sparse overrides,
  versioning, migration, reset, and target applicability
- [x] 1.8 Define export and destination packaging contracts as read-only
  projections of one canonical project
- [x] 1.9 Add dependency-boundary tests that prohibit `topoviewer` importing
  Studio/host code and prohibit Studio feature modules importing host globals
- [x] 1.10 Add API report fixtures for every contract intended to cross a package
  boundary and mark internal React components non-public
- [x] 1.11 Review contracts against browser, VS Code, MkDocs, Zensical, React,
  Grafana, and static export without adding destination-specific source fields
- [x] 1.12 **Exit gate:** pass contract type tests, dependency-boundary checks,
  API review, and architecture review before package implementation

## 2. Studio Package And Build Boundary

- [x] 2.1 Extend the contract-only `packages/topoviewer-studio` workspace with its
  React/Vite application build, lint integration, and browser test setup while
  retaining `private: true` and no publish configuration
- [x] 2.2 Add root-level focused commands for Studio typecheck, lint, unit tests,
  browser build, Playwright, accessibility, benchmark, and bundle budget without
  expanding the default contributor command surface unnecessarily
- [x] 2.3 Create explicit package entry points for the browser application, host
  contract, and test host; prohibit deep imports through package exports
- [x] 2.4 Enforce direct UI imports and keep Monaco/YAML tooling, mapper sample
  analysis, asset tooling, and image/archive exporters out of the initial entry;
  later feature phases must integrate them only through measured dynamic imports
- [x] 2.5 Add an application error boundary and a minimal in-memory host that can
  open a valid fixture without persistence
- [x] 2.6 Publish a development-only `/studio/` route while preserving
  `/harness/` unchanged
- [x] 2.7 Add build artifact inspection for unexpected host APIs, duplicate React,
  duplicate renderer code, source maps, initial chunks, and accidental package
  publication files
- [x] 2.8 **Exit gate:** run Studio typecheck, lint, unit smoke, production build,
  package-boundary checks, and route smoke with both `/studio/` and `/harness/`
  working

## 3. Canonical Authoring Metadata

- [x] 3.1 Write failing completeness tests that enumerate every public style key
  and mapper schema field and require an authoring disposition
- [x] 3.2 Extend `topoviewer` style metadata with group, Basic/Advanced level,
  order, control hint, conditional visibility, conflicts, examples, nested path,
  and specialized-editor identity
- [x] 3.3 Derive field type, targets, accepted values, and defaults from existing
  runtime schema/default facts rather than copying them
- [x] 3.4 Define specialized-editor contracts only for fields where generic
  controls are insufficient, including geometry, selectors, icons/assets,
  dash arrays, and nested layout contracts
- [x] 3.5 Generate mapper authoring metadata from the canonical mapper schema and
  add reviewed UI metadata without creating a second mapper contract
- [x] 3.6 Add metadata validation for duplicate paths, impossible conditions,
  invalid groups, missing descriptions, incompatible controls, stale aliases,
  and target/style mismatches
- [x] 3.7 Expose pure searchable metadata and profile-resolution APIs from
  `topoviewer` without React dependencies
- [x] 3.8 Reuse canonical metadata in YAML assist and generated field reference
  inputs to prove it is not Studio-only duplication
- [x] 3.9 Generate a coverage report showing 100 percent disposition for public
  style and mapper fields and zero undocumented duplicates
- [x] 3.10 **Exit gate:** pass schema/default/metadata drift tests and review the
  generated coverage report before building Inspector controls

## 4. Lossless Document Session

- [x] 4.1 Write session tests for load, valid projection, invalid draft isolation,
  revision, dirty state, source ranges, and multi-document project state
- [x] 4.2 Implement topology, stylesheet, and mapper YAML syntax-tree ownership in
  one framework-independent session
- [x] 4.3 Implement path-targeted syntax-tree edits that preserve comments,
  ordering, scalar style, line endings, unknown keys, and valid aliases
- [x] 4.4 Implement explicit normalization detection and a reviewable diff result
  for edits that cannot be lossless
- [x] 4.5 Implement incremental schema/semantic diagnostics mapped to source
  ranges while retaining the last valid renderer projection
- [x] 4.6 Implement deterministic source-to-semantic and semantic-to-source IDs so
  selection and diagnostics survive safe edits
- [x] 4.7 Implement mapper and stylesheet edits through the same document session,
  not separate mutable stores
- [x] 4.8 Run the complete round-trip corpus and add property/fuzz tests for
  unrelated-field preservation and parser failure containment
- [x] 4.9 Measure parse, projection, targeted mutation, and validation cost on
  small and dense fixtures; record thresholds for later budgets
- [x] 4.10 **Exit gate:** all round-trip, invalid-draft, fuzz, source-range, and
  normalization-review tests pass with no silent data loss

## 5. Command And History Core

- [x] 5.1 Write failing command tests for execute, undo, redo, cancellation,
  composition, atomic failure, selection restoration, and source diff summaries
- [x] 5.2 Move pure graph-semantic mutations from `vscode-topoviewer` into their
  approved core or Studio owner with existing tests preserved
- [x] 5.3 Implement a typed command dispatcher over the document session
- [x] 5.4 Implement transactions and coalescing for pointer gestures, text input,
  sliders, number steppers, color controls, resize, and multi-object operations
- [x] 5.5 Separate transient canvas interaction state from committed project state
  and expose narrow selector subscriptions
- [x] 5.6 Add bounded history, memory accounting, history summaries, and recovery
  serialization without storing redundant complete documents per pointer move
- [x] 5.7 Add invariant checks that failed commands do not leave partial YAML,
  semantic projection, selection, persistence, or history mutations
- [x] 5.8 Benchmark 1,000 pointer updates and representative bulk commands against
  the phase 0 spike
- [x] 5.9 **Exit gate:** command invariants, gesture coalescing, history memory,
  undo/redo, and no-pointer-serialization tests pass

## 6. Canvas-First Vertical Slice

- [x] 6.1 Write a Playwright test for the first vertical slice: open blank Studio,
  drag one node from palette, select it, edit its name, undo, redo, save, reload
- [x] 6.2 Implement the responsive shell with canvas, resizable contextual
  workspace, selection-aware Inspector, status area, and owned Code views
- [x] 6.3 Mount the current `TopoViewer` renderer through a narrow canvas bridge and
  subscribe only to the valid semantic projection and transient interaction
  selectors it needs
- [x] 6.4 Implement a minimal searchable node palette with pointer and keyboard
  drag/place paths
- [x] 6.5 Implement deterministic node creation, default physical layer placement,
  post-drop selection, and one-transaction undo
- [x] 6.6 Implement the first generated Basic Inspector fields for identity,
  position, shape, dimensions, icon, label, and color using canonical metadata
- [x] 6.7 Implement coherent Saved, Modified, Saving, Invalid Draft, Conflict, and
  Recovery status without template-specific state
- [x] 6.8 Add desktop/narrow, light/dark, zoom, error-boundary, and blank-output
  visual tests for the vertical slice
- [x] 6.9 Compare the vertical slice gesture count and elapsed time with the
  baseline node workflow
- [x] 6.10 **Exit gate:** the browser vertical slice passes unit, Playwright,
  accessibility smoke, visual review, reload, and primary interaction budget

## 7. Direct Graph CRUD

- [x] 7.1 Write tests for drag creation of node, link, path entry point, region,
  shape, callout, image/icon asset, and user preset templates
- [x] 7.2 Implement deterministic ID/name generation and per-object compatible
  default layers without hiding existing objects
- [x] 7.3 Implement React Flow native connection affordances, clear source/target
  feedback, any supported endpoint handling, and graph-semantic validation
- [x] 7.4 Implement normalized link creation that renders consistently regardless
  of drag direction while preserving semantically directed links
- [x] 7.5 Implement move, resize, duplicate, clipboard, delete, nudge, align,
  distribute, marquee, context menu, and bulk actions through commands
- [x] 7.6 Implement helper-line and snap settings in the shared viewport settings
  control and ensure disabling them removes their interaction cost
- [x] 7.7 Ensure graph shortcuts never conflict with Monaco, text inputs, selects,
  dialogs, or host shortcuts
- [x] 7.8 Add two-node and dense-node repeated-drag tests for jitter, jumps, blank
  viewport, lost position, helper-line flapping, and one-commit semantics
- [x] 7.9 Add accessible names, tooltips, keyboard equivalents, and announcements
  for every CRUD action
- [x] 7.10 **Exit gate:** all object CRUD except the dedicated path/region phase
  passes behavior, keyboard, visual, and interaction-performance tests

## 8. Paths, Regions, Layers, And Annotations

- [x] 8.1 Write graph-theory tests for reachable paths, multiple traversals,
  unreachable endpoints, loose/explicit network paths, and preservation of links
- [x] 8.2 Implement path authoring over existing graph connectivity with
  deterministic traversal selection or explicit user choice
- [x] 8.3 Implement direct region creation, non-overlap placement, membership
  preview, drop-to-contain, group movement, resize, collapse/expand, and release
- [x] 8.4 Define and test valid region nesting separately from accidental region
  overlap
- [x] 8.5 Implement shape and callout creation in the annotations layer while
  preserving their existing schema location and renderer semantics
- [x] 8.6 Implement layer creation, rename, reorder, visibility, membership, and
  deletion with safe handling of referenced objects
- [x] 8.7 Implement separate overlay visibility for physical-port and bandwidth
  annotations without abusing topology-layer visibility
- [x] 8.8 Add visual tests for no incoherent node/region/label overlap in curated
  authoring fixtures and for region labels remaining recoverable after collapse
- [x] 8.9 **Exit gate:** graph semantics, region/group behavior, annotations,
  layers, and overlay tests pass without deleting or hiding unrelated links

## 9. Complete Style Inspector And Provenance

- [x] 9.1 Write generated-form contract tests for every style value type, nested
  object, condition, target kind, unset/default behavior, and specialized editor
- [x] 9.2 Implement a common-field list and complete searchable disclosure with
  grouping, bounded rendering where measured necessary, and stable focus
- [x] 9.3 Implement generic accessible controls and reviewed specialized editors
  using canonical metadata
- [x] 9.4 Implement user main-list/View-More promotion, hide, reorder, reset,
  version, and profile migration as contextual preferences independent of
  project YAML
- [x] 9.5 Add core style-resolution provenance that reports winner, source range,
  overridden contributors, default origin, and runtime contribution
- [x] 9.6 Implement Inspector provenance display and explicit edit scopes for
  selected-object override, existing rule, and new reusable rule
- [x] 9.7 Preview affected object count and identities before committing shared
  selector-rule edits
- [x] 9.8 Preserve unsupported future fields and offer raw YAML navigation instead
  of deleting or coercing them
- [x] 9.9 Measure complete-field search, selection switching, color/slider interaction,
  rerender count, and history coalescing against approved budgets
- [x] 9.10 Add screenshot coverage for node, card layout, link, link direction,
  endpoint labels, path, region, shape, callout, graph, and layer style groups
- [x] 9.11 **Exit gate:** 100 percent style-field disposition, provenance, scope,
  profile, round-trip, accessibility, and Inspector-performance tests pass

## 10. Telemetry Mapper Workspace

- [x] 10.1 Write mapper metadata completeness tests and round-trip fixtures for
  compact rules, canonical mappings, identity, transforms, states, formatting,
  priorities, diagnostics, and unknown extensions
- [x] 10.2 Implement mapper enable/create/remove through explicit commands while
  keeping mapper optional
- [x] 10.3 Implement Basic mapper rule creation for node/link/path/region/graph and
  directional-link metrics
- [x] 10.4 Implement Advanced and All mapper controls from canonical metadata,
  including reviewed raw-YAML fallback for any unsupported construct
- [x] 10.5 Reuse target-compatible style Inspector controls for mapper default and
  state styles; prohibit incompatible style fields
- [x] 10.6 Implement bounded local sample ingestion for Grafana data-frame JSON,
  Prometheus-like samples, and documented generic records without network fetch
- [x] 10.7 Implement metric discovery and drag-to-object rule proposals with
  inferred labels, explicit ambiguity resolution, matched-object preview, and
  no silent commit
- [x] 10.8 Implement resolved, unresolved, ambiguous, duplicate, ignored, and
  invalid coverage diagnostics linked to rules and objects
- [x] 10.9 Move mapper parsing/evaluation to a worker or chunked task when measured
  sample size would block interaction
- [x] 10.10 Validate generated mapper output against existing Grafana panel
  fixtures without starting Grafana
- [x] 10.11 Add Playwright coverage for create rule, advanced edit, state style,
  sample inference, ambiguity, coverage, YAML edit, undo, reload, and export
- [x] 10.12 **Exit gate:** 100 percent mapper-field disposition, round-trip,
  inference, coverage, target-style, performance, and Grafana-fixture tests pass

## 11. YAML, Diagnostics, And Change Review

- [x] 11.1 Write tests for lazy Monaco loading, per-document tabs, source ranges,
  invalid drafts, apply/revert, diff review, and focus-safe shortcuts
- [x] 11.2 Keep topology and stylesheet YAML in `Edit > Code` and mapper YAML in
  `Mapper > Code`; do not expose a duplicate global source workspace
- [x] 11.3 Integrate schema-aware completion, hover, accepted values, examples,
  object IDs, selector facts, and mapper facts from canonical metadata
- [x] 11.4 Implement syntax and semantic diagnostics that navigate to source and
  correlate with canvas objects without changing the valid projection
- [x] 11.5 Implement explicit invalid-draft apply/revert and normalization diff
  review using the coherent project state model
- [x] 11.6 Add canvas-to-source and source-to-canvas navigation while preserving
  focus and selection
- [x] 11.7 Keep human-readable command summaries in the undoable command history
  without exposing a second source/history panel
- [x] 11.8 Verify Monaco and YAML assistance remain outside the initial bundle and
  failures remain contained by the owning Code workspace boundary
- [x] 11.9 **Exit gate:** YAML/diagnostic behavior, source round trip, lazy bundle,
  focus, keyboard, and failure-containment tests pass

## 12. Browser Persistence And Project Lifecycle

- [x] 12.1 Write browser-host tests for IndexedDB create/open/save/autosave,
  atomicity, quota, corruption, migration, recovery retention, and reset
- [x] 12.2 Implement versioned IndexedDB project storage with content hashes,
  source revisions, bounded snapshots, and atomic commits
- [x] 12.3 Restrict safe local-storage helpers to small versioned UI preferences and
  add a static guard against direct local-storage writes
- [x] 12.4 Implement new, open archive, recent projects, rename, duplicate, delete,
  explicit save, and recovery workflows without modal-heavy routine behavior
- [x] 12.5 Implement optional File System Access API folder integration behind host
  capability detection and explicit permission
- [x] 12.6 Implement deterministic archive import/export as the cross-browser
  fallback, including assets and supported Studio metadata
- [x] 12.7 Implement project-version migration with pre-migration backup and tested
  forward migration; do not add an unreviewed downgrade path
- [x] 12.8 Add crash/reload, invalid-draft, quota, corruption, and interrupted-
  write Playwright tests
- [x] 12.9 **Exit gate:** browser lifecycle and recovery tests pass in Chromium,
  Firefox, and WebKit with no project data stored directly in local storage

## 13. Preview, Presentation, And Export

- [x] 13.1 Write exporter contract tests proving outputs read one session snapshot
  and cannot mutate project source
- [x] 13.2 Implement distraction-free presentation mode over the same canvas and
  restore the exact authoring selection/viewport on exit
- [x] 13.3 Implement deterministic topology, stylesheet, mapper, asset, and bundle
  archive export with manifest hashes and version metadata
- [x] 13.4 Implement PNG and SVG export with explicit dimensions, background,
  theme, font readiness, asset validation, and output-size limits
- [x] 13.5 Implement copyable MkDocs and static/Zensical snippets that reference
  the canonical exported files
- [x] 13.6 Implement Grafana bundle packaging and mapper/source validation without
  making Grafana a separate authoring mode
- [x] 13.7 Add export error isolation, cancel/progress behavior, worker/lazy
  loading where measured, and retry without losing dirty state
- [x] 13.8 Render each exported bundle in core browser, MkDocs, Zensical, React,
  and Grafana consumer fixtures and compare semantic graph hashes
- [x] 13.9 **Exit gate:** presentation restoration, deterministic exports,
  consumer compatibility, security limits, and lazy bundle tests pass

## 14. VS Code Host And Shared Host Conformance

- [x] 14.1 Write a host conformance suite covering load, save, preferences, assets,
  export, typed failures, revisions, watch events, and conflict decisions
- [x] 14.2 Implement the VS Code host adapter for workspace reads/writes, atomic
  saves, URI translation, assets, exports, preferences, and reporting
- [x] 14.3 Implement nonce-based CSP, typed webview message validation, trusted
  roots, workspace trust, file count/size limits, and no implicit remote content
- [x] 14.4 Implement external-change handling: clean refresh and dirty-session
  inspect-diff, keep-draft, or reload-disk decisions
- [x] 14.5 Mount the same Studio application in the extension and delete migrated
  UI/session implementations instead of retaining parallel copies
- [x] 14.6 Run the golden browser authoring journey against the VS Code test host
  and real extension harness
- [x] 14.7 Verify extension activation, webview bundle size, startup, file watch,
  save conflict, reload recovery, and workspace trust budgets
- [x] 14.8 **Exit gate:** browser and VS Code pass the shared host contract and
  golden journey with no Studio deep import of VS Code internals

## 15. Security Hardening

- [x] 15.1 Update the threat model for browser and VS Code Studio trust
  boundaries, assets, archives, YAML, mapper samples, exports, and host messages
- [x] 15.2 Add adversarial fixtures for path traversal, symlink escape where
  applicable, archive bombs, excess files, oversized files, hostile MIME/data
  URLs, decompression ratios, and malformed manifests
- [x] 15.3 Add hostile SVG, Markdown, image, YAML alias expansion, mapper
  expression, telemetry-cardinality, and renderer-limit tests
- [x] 15.4 Enforce import/export quotas, canonical paths, allowed MIME types, image
  dimensions, SVG sanitization, no implicit network fetch, and bounded parsing
- [x] 15.5 Fuzz YAML/session commands, archive manifests, host messages, mapper
  samples, and metadata conditions with crash and timeout assertions
- [x] 15.6 Run dependency advisory, license, provenance, secret, static-analysis,
  hostile-content, and package-artifact checks for the new package
- [x] 15.7 Conduct a manual abuse review with CSP violations, corrupt persistence,
  rapid command sequences, malformed drops, and repeated failed imports
- [x] 15.8 Record residual security assumptions, host responsibilities, and
  unsupported trusted-content modes
- [x] 15.9 **Exit gate:** all automated security checks and manual abuse review
  pass, or Studio remains blocked from public cutover

## 16. Accessibility And UX Review

- [x] 16.1 Define the keyboard map and focus model for palette, canvas, handles,
  Inspector, drawers, dialogs, layers, presentation, and exports
- [x] 16.2 Implement keyboard-equivalent choose/place, connect, move, resize,
  region membership, context action, and mapper workflows
- [x] 16.3 Implement screen-reader announcements for selection, placement,
  connection validity, command result, diagnostics, save state, and errors
- [x] 16.4 Verify accessible names, descriptions, error associations, target
  sizes, tooltips, and no color-only state across generated and custom controls
- [x] 16.5 Test 200 percent zoom, narrow viewport, keyboard-only, reduced motion,
  high contrast, light/dark themes, and long translated-like labels
- [x] 16.6 Run automated accessibility tests on every major state in Chromium and
  perform documented VoiceOver and keyboard workflow reviews on macOS
- [x] 16.7 Resolve all critical/serious findings and record justified lower-
  severity residual findings with owners
- [x] 16.8 **Exit gate:** WCAG 2.2 AA target workflows and manual assistive-
  technology review pass before performance freeze

## 17. Performance, Scale, And Bundle Freeze

- [x] 17.1 Convert phase 0 measurements into versioned CI budgets with stable
  fixtures, warm-up, sample count, variance policy, and JSON output
- [x] 17.2 Profile Studio startup and remove request waterfalls, duplicate code,
  eager Monaco/mapper/export dependencies, broad context rerenders, and
  expensive barrel imports
- [x] 17.3 Profile active drag with 2, 100, and 1,000 nodes and fix helper-line,
  snap, label-layout, selector, persistence, and validation work outside the
  interaction-critical path
- [x] 17.4 Profile complete common/expanded metadata forms and add memoized
  selectors or virtualization only where measurement justifies them
- [x] 17.5 Profile mapper sample ingestion and coverage at documented small,
  typical, and maximum cardinalities; move blocking work off the main thread
- [x] 17.6 Add memory-leak checks for repeated open/close, import, undo history,
  Monaco drawer, mapper samples, exports, and route transitions
- [x] 17.7 Enforce initial and lazy compressed chunk budgets for Studio and VS
  Code webview and report before/after deltas in CI
- [x] 17.8 Run the full performance suite repeatedly on the reference runner and
  investigate variance rather than accepting a single favorable result
- [x] 17.9 Record approved budgets and any explicit waiver with owner, rationale,
  expiration, and follow-up task
- [x] 17.10 **Exit gate:** interaction, startup, Inspector, mapper, memory, dense
  graph, and bundle budgets pass without subjective exceptions

## 18. Parity, Documentation, And CI Integration

- [x] 18.1 Complete the Harness parity matrix with evidence links for every
  workflow and resolve all unapproved gaps
- [x] 18.2 Run the golden authoring journey in browser Chromium/Firefox/WebKit,
  VS Code, and a narrow viewport with traces retained as CI artifacts on failure
- [x] 18.3 Add Studio checks to the fastest appropriate CI jobs with path filters,
  caching, fail-fast quality checks, and a full required integration lane
- [x] 18.4 Add generated-content and dependency-boundary guards so docs, metadata,
  examples, and package ownership cannot drift
- [x] 18.5 Add canonical user docs under nav-aligned physical paths for first
  project, palette/direct manipulation, progressive style disclosure, style
  provenance, YAML recovery, mapper authoring, browser projects, VS Code, export,
  security, accessibility, troubleshooting, and migration
- [x] 18.6 Remove page-local “Next Steps” blocks and rely on the canonical nav in
  accordance with the repository documentation contract
- [x] 18.7 Add a curated Studio use case that demonstrates one bundle in Harness
  comparison, Studio, MkDocs/Zensical, and Grafana packaging without presenting
  separate authoring wizards
- [x] 18.8 Update README and project-status language only to the delivered support
  level; keep Studio experimental until promotion gates pass
- [x] 18.9 Synchronize canonical docs projections and run nav/physical-structure,
  broken-link, live-viewport, screenshot, and generated-content checks
- [x] 18.10 Run focused package checks, `npm run ci`, strict OpenSpec validation,
  docs builds, and both authoring routes on a clean committed worktree
- [x] 18.11 Push the reviewed commits and monitor every required remote check;
  fix regressions before continuing rather than marking them as follow-up
- [x] 18.12 **Exit gate:** parity, docs, local CI, remote CI, generated projections,
  and support-status review pass

## 19. Preview Release And Harness Cutover

- [x] 19.1 Publish Studio as an opt-in experimental route with a feedback path and
  no redirect from `/harness/`
- [x] 19.1.1 Record maintainer-submitted preview findings #85-#92 as internal
  product feedback without counting them as independent adoption cohorts
- [x] 19.1.2 Remediate the internal preview findings for parallel links, callout
  leaders, Inspector ownership/density, direct Layers access, and canonical
  palette families with focused regression evidence
- [x] 19.1.3 Re-run Studio quality, browser, accessibility, performance, bundle,
  docs, and strict OpenSpec gates before requesting independent preview sessions
- [x] 19.1.4 Record maintainer-submitted preview findings #93-#95 for Inspector
  field density, standards-based tabs, and visual node templates without
  counting them as independent adoption cohorts
- [x] 19.1.5 Remediate findings #93-#95 at the shared Inspector, starter-template,
  and core authoring boundaries with focused regression evidence
- [x] 19.1.6 Re-run Studio quality, browser, accessibility, API, integration,
  bundle-budget, docs, and strict OpenSpec gates after the remediation
- [x] 19.1.7 Record the maintainer preview finding that the current object-first
  Style Inspector hides ordered selector rules and makes the stylesheet cascade
  difficult to author; retain the Cytoscape Desktop recording as local baseline
  evidence under `.artifacts/`
- [x] 19.1.8 Add failing pure and browser tests for selector suggestions, all-rule
  discovery, rule create/rename/duplicate/reorder/delete, object overrides,
  effective provenance, no-selection rule authoring, undo, and YAML ownership
- [x] 19.1.9 Implement selector-first cascade controls using canonical
  `topoviewer` metadata and pure selector helpers; keep reusable rules in
  `stylesheet.yaml`, individual overrides in `topology.yaml`, and do not add a
  redundant write-both mutation
- [x] 19.1.10 Capture desktop and narrow Playwright evidence for reusable-rule,
  object-override, combined-cascade, empty-selection, and destructive-rule
  states; resolve overlap, truncation, focus, and contrast failures
- [x] 19.1.11 Run focused core/Studio unit, type, browser, accessibility,
  source-preservation, performance, API, content, and strict OpenSpec checks for
  the selector-cascade remediation before resuming independent preview task 19.2
- [x] 19.1.12 Record the maintainer finding that separate reusable-rule and
  object-override modes make attribute styling too convoluted; retain the
  Cytoscape Desktop Default/Mapping/Bypass matrix recording under `.artifacts/`
  as local interaction evidence without copying its implementation
- [x] 19.1.13 Add browser and accessibility tests for an attribute-first
  Default/Selector/Bypass matrix, base-rule creation, selector editing, bypass
  editing, inheritance, no-selection behavior, and canonical YAML ownership
- [x] 19.1.14 Replace the style-layer mode switch with a generated attribute
  matrix while retaining compact selector lifecycle controls, typed editors,
  effective provenance, field profiles, undo, and source preservation
- [x] 19.1.15 Capture desktop and narrow visual evidence, resolve density,
  overflow, focus, and contrast defects, then rerun focused unit, type, browser,
  accessibility, performance, API, content, and strict OpenSpec gates
- [x] 19.1.16 Add failing interaction, ownership, keyboard, and visual tests for a
  vertical workspace rail whose Topo, Style, Viewport, and Mapper
  tabs control one left panel while object facts remain separately owned
- [x] 19.1.17 Move Style, Viewport, and Mapper into the left workspace without
  duplicating editor state; make the style matrix primary and move selector
  lifecycle controls into the expanded Selector cell
- [x] 19.1.18 Capture desktop and constrained visual evidence for all four rail
  states, verify focus and state retention, then rerun focused type, unit,
  browser, accessibility, performance, content, and strict OpenSpec gates
- [x] 19.1.19 Move the workspace rail to the leftmost application column, keep
  the active workspace immediately to its right, and verify that visual, DOM,
  keyboard, desktop, and constrained-width ordering remain aligned
- [x] 19.1.20 Remove the permanent right properties column, add Object to the
  shared left workspace, preserve palette repetition and active Style,
  Viewport, or Mapper intent across selection, and capture ownership, geometry,
  accessibility, desktop, and constrained-width evidence
- [x] 19.1.21 Remove the Style Basic/All mode switch, keep common attributes in
  the main matrix, place less-common attributes behind View More, make search
  cover the complete contract, and verify profile persistence, accessibility,
  performance, documentation, and strict OpenSpec evidence
- [x] 19.1.22 Derive Style and Mapper object kind from canvas selection, replace
  manual target selectors with read-only context, clarify reusable-rule and
  selected-object scope labels, and prove that opening an editor does not mutate
  YAML before value commit
- [x] 19.1.23 Move path-routing semantics into the active Path workflow,
  consolidate helper-line and snap behavior as one alignment-assistance choice,
  and move fixed canvas dimensions and presentation overrides behind advanced
  disclosure
- [x] 19.1.24 Replace Mapper Basic/Advanced/All modes with one common rule form,
  View More, and complete search; create `mapper.yaml` transactionally with the
  first rule and move whole-file export/removal into contextual actions
- [x] 19.1.25 Remove persistent mode styling from immediate palette commands,
  move generated IDs, exact coordinates, and source ownership behind advanced
  actions, and retain accessible precision editing and copy-ID support
- [x] 19.1.26 Update canonical docs and OpenSpec, capture desktop and constrained
  evidence, then run focused type, unit, browser, accessibility, performance,
  content, and strict OpenSpec gates for the complete workflow simplification
- [x] 19.1.27 Replace the 4,160-line global Studio stylesheet with one
  deterministic manifest and bounded app, feature, and shared-UI stylesheets;
  remove unowned selectors and enforce MUI theme, manifest, ownership, and
  500-line limits in CI
- [x] 19.1.28 Run Studio typecheck, focused core and Studio unit tests, shell,
  theme, inspector, Mapper, accessibility browser tests, production build,
  strict OpenSpec validation, and diff checks after the stylesheet split
- [x] 19.1.29 Replace the stylesheet-split ownership model with an explicit
  MUI-first contract: MUI defaults own standard UI, `sx` owns component-local
  geometry, centralized tokens own repeated dimensions, and authored CSS is an
  exception for generated DOM and bespoke previews
- [x] 19.1.30 Migrate shell, panels, forms, dialogs, menus, property rows,
  palette layout, Edit, Viewport, and Mapper presentation from custom CSS into
  MUI primitives, props, and `sx`; retain only React Flow, TopoViewer, Monaco,
  and palette-preview CSS
- [x] 19.1.31 Enforce direct PostCSS-backed budgets and ownership checks for 350
  total lines, 60 rules, 200 declarations, 180 lines per file, duplicate
  selectors, `.Mui*` selectors, palette literals, theme `styleOverrides`, and
  class-name-derived button variants
- [x] 19.1.32 Run Studio theme, Material ownership, type, unit, browser,
  accessibility, production build, strict OpenSpec, and diff checks; inspect
  desktop and narrow Edit, Viewport, Mapper, menu, dialog, and color-picker
  states before accepting the MUI-first migration
- [x] 19.2 Record the maintainer-directed Studio cutover, current ownership,
  import reachability, public references, rollback boundary, and known support
  limitations before deleting the legacy application
- [x] 19.3 Add failing checks for the Studio-only Pages artifact, `/harness/`
  redirect, absent Harness runtime assets, and release-version-bound README
  screenshot metadata
- [x] 19.4 Remove the legacy Harness React tree, duplicate webview helpers,
  fixture API, Vite configuration, Playwright suite, CI lane, performance
  budget, and obsolete root commands; retain only reachable Studio/host code
- [x] 19.5 Replace active Harness fixture terminology in current application and
  generated code without rewriting historical changelog or archived evidence
- [x] 19.6 Make Studio the public authoring CTA, remove duplicate Harness guides,
  update support/security/architecture/maintainer docs, and retain a migration
  note plus tested `/harness/` compatibility redirect
- [x] 19.7 Add deterministic Playwright capture for every maintained
  documentation screenshot across Studio Visual, Studio Code, MkDocs,
  Zensical, and Grafana; add catalog, manifest, freshness, and release-drift
  gates; document the release workflow; and update the canonical README
- [x] 19.8 Synchronize README, MkDocs, Zensical, examples, generated fixtures,
  and Pages output; prove no active product or support page advertises Harness
- [x] 19.9 Run focused unit, Studio browser, VS Code host, docs build/smoke,
  redirect, screenshot, dead-code, duplicate-code, artifact, and strict OpenSpec
  checks; inspect both README screenshots at their authored resolution
- [x] 19.9.1 Audit Studio promotion evidence and separate Browser Studio Beta
  Preview, internal Studio modules, Experimental VS Code host, and later
  Supported gates without claiming maintainer feedback as independent adoption
- [x] 19.9.2 Fix the built-in SVG color contract, expose the complete trusted
  Nokia icon catalog in visual authoring, materialize newly selected icons into
  portable stylesheet YAML, and add focused unit/browser regression evidence
- [x] 19.9.3 Add a complete golden authoring journey against the production Vite
  artifact and a post-deployment Studio smoke workflow
- [x] 19.9.4 Add a deterministic visual baseline for SVG color resolution, enforce
  fast unit performance budgets in required CI, and schedule the three-pass
  browser performance suite with retained evidence
- [x] 19.9.5 Update canonical support, compatibility, architecture, and Studio
  documentation for the scoped Browser Studio Beta Preview and synchronize all
  generated projections
- [x] 19.9.6 Run focused type, unit, browser, production-artifact, docs,
  performance, workflow, and strict OpenSpec checks for the Beta Preview diff
- [x] 19.10 **Exit gate:** run full local CI on a clean committed tree, then push
  and monitor remote CI and Pages only with explicit user approval

## 20. Closeout And Archive

- [x] 20.1 Confirm every requirement in all six Studio delta specs has linked
  implementation and test evidence
- [x] 20.2 Confirm every task above is checked sequentially and no skipped task is
  hidden by a broad later check
- [x] 20.3 Record final architecture, package ownership, host contract, deployment
  flow, security assumptions, performance budgets, operational notes, and handoff
- [x] 20.4 Record remaining non-blocking risks with severity, owner, target release,
  and explicit reason they do not violate a production exit gate
- [x] 20.5 Run `openspec validate build-topoviewer-studio --strict`
- [x] 20.6 Run the full local CI gate on a clean committed tree and record the
  commit SHA and result
- [x] 20.7 Push and monitor all required remote CI and deployment checks at that
  exact SHA
- [x] 20.8 Archive `build-topoviewer-studio` only after tasks 20.1-20.7 pass and
  update `openspec/README.md` in the same closeout change
