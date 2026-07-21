## ADDED Requirements

### Requirement: Measured workflow improvement

Studio SHALL establish a reproducible Harness baseline before implementation
and SHALL demonstrate measurable improvement in the primary authoring journey
before public cutover.

#### Scenario: Record the baseline

- **WHEN** implementation begins
- **THEN** maintainers record gesture count, elapsed time, errors, bundle size,
  startup, dense render, drag, drop-to-visible, commit, persistence, and round-
  trip behavior using documented fixtures and hardware
- **AND** transient reports are stored under `.artifacts/topoviewer-studio/`

#### Scenario: Evaluate the primary journey

- **WHEN** Studio reaches feature parity
- **THEN** the same two-node, style, mapper, YAML recovery, and export journey is
  measured against the baseline
- **AND** any regression or waived metric has an explicit rationale before
  cutover

### Requirement: Interaction and bundle budgets

Studio SHALL enforce versioned performance budgets for loading, rendering,
direct manipulation, generated forms, and output bundles.

#### Scenario: Build the initial browser entry

- **WHEN** the production Studio bundle is built
- **THEN** its initial compressed entry does not exceed the accepted Harness
  baseline
- **AND** Monaco, sample telemetry tools, heavy asset tools, and export encoders
  remain outside the initial chunk

#### Scenario: Drag in a dense graph

- **WHEN** the representative 1,000-node/2,500-link fixture is rendered and one
  node is dragged with alignment assistance enabled
- **THEN** no blank canvas or unbounded memory growth occurs
- **AND** p95 frame time and long-task counts remain within the approved budget
- **AND** pointer movement does not serialize the complete YAML document

#### Scenario: Change an Inspector field

- **WHEN** a user searches or switches among all applicable style fields
- **THEN** response time stays within the approved Inspector budget
- **AND** only subscribers affected by the edit rerender materially

### Requirement: Accessible authoring workflow

Studio SHALL target WCAG 2.2 AA and SHALL provide keyboard and assistive-
technology equivalents for every primary pointer workflow.

#### Scenario: Author without a pointer

- **WHEN** a user operates Studio with a keyboard
- **THEN** they can create, place, select, connect, edit, move, layer, undo,
  validate, save, and export objects
- **AND** focus order and restoration remain predictable

#### Scenario: Use a screen reader

- **WHEN** selection, validation, command completion, or an error changes
- **THEN** the relevant object, action, and outcome are announced
- **AND** canvas state is not communicated by color alone

#### Scenario: Use zoom or reduced motion

- **WHEN** a user applies 200 percent browser zoom, high-contrast preferences,
  or reduced motion
- **THEN** controls remain reachable and text does not overlap or truncate
  critical information
- **AND** nonessential animation is reduced

### Requirement: Untrusted-input security

Studio SHALL treat YAML, Markdown, labels, SVG, images, mapper data, telemetry,
archives, and workspace paths as untrusted and SHALL apply canonical sanitizers,
limits, and host boundaries.

#### Scenario: Import a hostile bundle

- **WHEN** an archive contains traversal paths, excessive compression, excessive
  files, oversized content, unsupported MIME types, or executable SVG content
- **THEN** Studio rejects or safely isolates the affected content
- **AND** no file escapes the chosen root
- **AND** no script or remote reference executes

#### Scenario: Load hostile YAML or telemetry

- **WHEN** YAML expansion, document size, mapper expressions, or telemetry
  cardinality exceeds configured limits
- **THEN** processing is bounded and the operation fails safely
- **AND** the last valid project remains recoverable

#### Scenario: Run in a VS Code webview

- **WHEN** Studio runs in VS Code
- **THEN** the adapter enforces nonce-based CSP, trusted resource roots,
  workspace trust, and typed message validation

### Requirement: Failure containment and recovery

Studio SHALL preserve recoverable source and a usable canvas when optional
editors, exporters, persistence, validation, or host operations fail.

#### Scenario: Monaco or mapper tooling fails to load

- **WHEN** a lazy optional module throws during load or render
- **THEN** an error boundary contains the failure
- **AND** the canvas and other authoring controls remain usable
- **AND** retry or raw-source recovery is available where appropriate

#### Scenario: Recover after interruption

- **WHEN** the application closes after a valid dirty edit but before explicit
  save
- **THEN** the next session offers the bounded recovery snapshot
- **AND** never promotes an invalid draft over the last valid recoverable source

#### Scenario: Save or export fails

- **WHEN** a save or export operation fails
- **THEN** Studio retains dirty state and source content
- **AND** reports a retryable actionable error

### Requirement: Material UI-owned Studio styling

Studio SHALL use Material UI as the owner of normal application controls,
surfaces, typography, spacing, and interaction states rather than maintaining a
parallel component system in authored CSS.

#### Scenario: Add or change Studio UI styling

- **WHEN** a maintainer changes shell, palette, canvas, inspector, Edit, Mapper,
  export, or shared-control presentation
- **THEN** standard UI uses MUI props and defaults first
- **AND** component-local product geometry uses `sx`
- **AND** repeated geometry uses the centralized Studio token contract
- **AND** authored CSS is limited to generated or third-party DOM that cannot
  receive MUI props or `sx`, plus bespoke palette preview graphics
- **AND** the theme retains MUI's default dark palette without component
  `styleOverrides`

#### Scenario: Add exceptional authored CSS

- **WHEN** React Flow, TopoViewer, Monaco, or a bespoke preview requires authored
  CSS
- **THEN** one deterministic manifest imports every stylesheet exactly once
- **AND** palette values use MUI CSS variables and repeated geometry uses shared
  Studio variables
- **AND** CSS does not select `.Mui*` implementation classes
- **AND** CI rejects missing imports, duplicate selectors, unowned Studio
  selectors, hardcoded palette colors, persistent interaction-state colors,
  totals above 350 lines, 60 rules, or 200 declarations, and files above 180
  lines

#### Scenario: Remove a Studio component or exceptional state

- **WHEN** its final source owner is removed
- **THEN** CI rejects any remaining `.studio-*` selector for that component or
  state unless the class is an explicitly declared dynamic variant

### Requirement: Cross-host and cross-browser verification

Studio SHALL pass a shared behavioral contract in browser and VS Code hosts and
shall verify the browser workflow in Chromium, Firefox, and WebKit.

#### Scenario: Run the golden authoring journey

- **WHEN** the shared Playwright journey runs in each supported browser and host
- **THEN** it creates nodes and a link, edits common and progressively disclosed
  style fields, builds a mapper rule, recovers invalid YAML, uses undo/redo,
  reloads, exports, and re-
  imports successfully
- **AND** the exported bundle renders in a runtime consumer fixture

#### Scenario: Review visual regressions

- **WHEN** visual tests run
- **THEN** screenshots cover desktop and narrow viewports, light and dark themes,
  labels, regions, helper lines, selection, dialogs, and dense graph output
- **AND** blank output and incoherent overlap are release-blocking failures

### Requirement: Staged Studio support evidence

Studio SHALL use separate Beta Preview and Supported promotion gates, and SHALL
state which product surface each label covers.

#### Scenario: Promote Browser Studio to Beta Preview

- **WHEN** maintainers propose the browser product as Beta Preview
- **THEN** Chromium authoring, production-build golden journey, security,
  accessibility, persistence/recovery, portable export, performance budget,
  documentation, visual regression, and deployed-route smoke gates pass
- **AND** current desktop Chrome and Edge are named as the primary browser scope
- **AND** Firefox/WebKit and directory-access fallback behavior are documented
- **AND** Studio internals and the VS Code host retain their separate Internal
  and Experimental labels

#### Scenario: Promote Studio to Supported

- **WHEN** maintainers propose Browser Studio as supported
- **THEN** every requirement has linked evidence and no unchecked closeout task
- **AND** independent adopter evidence covers the primary authoring workflows
- **AND** two release cycles have completed without data-loss, blank-canvas,
  unrecoverable persistence, or host-parity regression
- **AND** known limitations and rollback guidance are documented

#### Scenario: A gate remains incomplete

- **WHEN** any required security, accessibility, performance, reliability,
  parity, or CI gate fails
- **THEN** Studio retains its current support label
- **AND** the failed change is not released until the gate passes
- **AND** the retired Harness is not silently restored as a second writable
  authoring application
