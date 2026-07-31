# studio-production-readiness Specification

## Purpose
Define the measurable performance, accessibility, security, design-system,
cross-host, cross-browser, and support-evidence gates for Studio releases.
## Requirements
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

Studio SHALL enforce versioned performance budgets for loading, shared source
editing, rendering, direct manipulation, contextual drawers, generated forms,
and output bundles.

#### Scenario: Build the initial browser entry

- **WHEN** the production Studio bundle is built
- **THEN** its initial compressed entry remains within the approved Studio
  budget
- **AND** Monaco, sample telemetry tools, heavy asset tools, dialogs, archive
  codecs, and export encoders remain outside the initial chunk

#### Scenario: Build browser test artifacts

- **WHEN** browser, parity, or performance tests build Studio with a root asset
  base
- **THEN** the build writes to an ignored test-only artifact directory
- **AND** does not replace the GitHub Pages artifact under `site/studio`
- **AND** a subsequent docs smoke resolves every Studio chunk beneath
  `/topoviewer/studio/` without relying on command order

#### Scenario: Open Split

- **WHEN** a desktop author opens the default 25/75 Split layout
- **THEN** loading Monaco does not recreate the project session or renderer
- **AND** layout resize changes presentation geometry without serializing YAML
  or invoking native host operations

#### Scenario: Drag in a dense graph

- **WHEN** the representative 1,000-node/2,500-link fixture is rendered and one
  node is dragged with alignment assistance enabled
- **THEN** no blank canvas or unbounded memory growth occurs
- **AND** p95 frame time and long-task counts remain within the approved budget
- **AND** pointer movement does not serialize the complete YAML document

#### Scenario: Change a contextual field

- **WHEN** a user searches or switches among all applicable style or mapper
  fields
- **THEN** response time stays within the approved Inspector and mapper budgets
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

Studio SHALL preserve recoverable source and a usable preview when optional
editors, drawers, exporters, persistence, validation, or host operations fail.

#### Scenario: Monaco or mapper tooling fails to load

- **WHEN** a lazy optional module throws during load or render
- **THEN** an error boundary contains the failure
- **AND** raw source recovery or the real preview remains usable
- **AND** retry is available where appropriate

#### Scenario: Recover after interruption

- **WHEN** the application closes after a valid dirty edit but before explicit
  save
- **THEN** the next session offers the bounded recovery snapshot
- **AND** restores workbench preferences independently from project source
- **AND** never promotes an invalid draft over the last valid recoverable source

#### Scenario: Save or export fails

- **WHEN** a save or export operation fails
- **THEN** Studio retains dirty state, source content, and preview
- **AND** reports a retryable actionable error

### Requirement: Material UI-owned Studio styling

Studio SHALL use MUI as the single owner of normal application controls,
surfaces, color schemes, typography, spacing, and interaction states.

#### Scenario: Add or change Studio UI styling

- **WHEN** a maintainer changes Studio presentation
- **THEN** standard UI uses MUI components, props, and semantic tokens first
- **AND** both native MUI light and dark color schemes remain available
- **AND** component geometry uses `sx` or centralized Studio tokens
- **AND** authored CSS remains limited to third-party or generated DOM

#### Scenario: Validate theme ownership

- **WHEN** CI inspects Studio source
- **THEN** it requires one theme provider and both MUI color schemes
- **AND** rejects unapproved application color literals, raw interactive
  controls, direct storage access, duplicate stylesheet ownership, and MUI
  implementation-class selectors

### Requirement: Cross-host and cross-browser verification

Studio SHALL verify YAML-first authoring and normal light and dark appearance in
browser and Wails desktop hosts.

#### Scenario: Run the golden authoring journey

- **WHEN** the shared journey creates, selects, edits source, edits Visual
  properties, maps telemetry, saves, reloads, recovers, and exports a project
- **THEN** navigator, Source/Split/Preview, Properties, canvas settings, and
  Mapper transitions are deterministic
- **AND** the portable project remains equivalent across browser and Wails

#### Scenario: Review visual regressions

- **WHEN** visual tests run
- **THEN** screenshots cover source navigation, topology source, stylesheet
  candidate, mapper source, real preview, Add, object Properties, canvas
  Properties, Mapper Visual, project dialogs, toolbar, desktop, narrow, normal
  light, and normal dark
- **AND** overlap, truncation, blank output, low contrast, duplicate editors, or
  obsolete rail chrome blocks release

#### Scenario: Verify appearance and layout persistence

- **WHEN** System, Light, Dark, Source, Split, Preview, and divider choices are
  exercised
- **THEN** browser and Wails restore equivalent preferences
- **AND** changing appearance or layout leaves project source byte-for-byte
  unchanged

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

### Requirement: Verified style-authoring workflow

Studio SHALL treat Visual/Code synchronization, source preservation, contextual
assistance, candidate preview, and style-draft recovery as release-blocking
behavior.

#### Scenario: Run the style acceptance journey

- **WHEN** the browser and VS Code parity suites select node, link, region, and
  annotation targets and edit them through Visual and Code
- **THEN** compatible controls, candidate source, preview, Apply, Revert, Save,
  reload, and export behave equivalently
- **AND** existing stylesheet fixtures render identically after no-op editing

#### Scenario: Verify source preservation

- **WHEN** fixtures contain comments, blank lines, quoted scalars, block scalars,
  aliases, unknown keys, CSS variables, and ordered rules
- **THEN** targeted Visual edits preserve every unrelated source range
- **AND** any unavoidable normalization is explicit and reviewed

#### Scenario: Verify contextual editor behavior

- **WHEN** completion and `?` discovery are exercised in property, value,
  selector, comment, string, block-scalar, and URL contexts
- **THEN** only the valid contexts are modified
- **AND** suggested properties and values remain target-compatible

### Requirement: Bounded candidate performance

Style candidate processing SHALL remain responsive on the representative dense
Studio fixture and SHALL retain existing lazy-load and bundle budgets.

#### Scenario: Type in YAML on a dense project

- **WHEN** an author types continuously with 1,000 nodes and representative links
- **THEN** validation is debounced and stale results cannot replace newer state
- **AND** the canvas keeps its last valid projection, selection, pan, and zoom
- **AND** Monaco remains outside the initial application chunk

#### Scenario: Change Visual controls repeatedly

- **WHEN** an author uses color, number, select, switch, or slider controls
- **THEN** candidate YAML is mutated at bounded transaction points
- **AND** pointer movement does not serialize the full project document

### Requirement: Accessible style authoring

Visual and Code style representations SHALL meet the existing Studio WCAG 2.2 AA target.

#### Scenario: Author styles with a keyboard and screen reader

- **WHEN** an author navigates mode tabs, grouped fields, completion,
  diagnostics, Apply, Revert, Code-owned source navigation, and inline migration
- **THEN** focus order, names, values, errors, source state, and outcomes are
  perceivable without pointer input or color-only meaning
- **AND** mode switches restore a predictable focus target

#### Scenario: Use constrained visual settings

- **WHEN** Studio runs at its documented narrow width, 200 percent zoom, forced
  colors, or reduced motion
- **THEN** the Style workspace remains operable without incoherent overlap
- **AND** the canvas remains available and selected content is not obscured

### Requirement: Rams-oriented product review

Studio SHALL evaluate the YAML-first shell against explicit usefulness,
understandability, restraint, honesty, durability, thoroughness, and efficiency
criteria.

#### Scenario: Review the completed redesign

- **WHEN** maintainers perform the final UI review
- **THEN** project source and preview are the obvious primary surfaces
- **AND** routine source editing, creation, selection, visual editing, canvas
  configuration, and mapper targeting have one obvious path
- **AND** visible saved, candidate, invalid, conflict, recovery, and export
  statuses match real application state
- **AND** no redundant workspace rail, editor, parser, renderer, control family,
  palette, or persistent shell remains
