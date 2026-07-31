## MODIFIED Requirements

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
