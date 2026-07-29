## MODIFIED Requirements

### Requirement: Untrusted-input security

Studio SHALL treat YAML, Markdown, labels, SVG, images, mapper data, telemetry,
archives, and project paths as untrusted and SHALL apply canonical sanitizers,
limits, and host boundaries.

#### Scenario: Import a hostile bundle

- **WHEN** an archive contains traversal paths, excessive compression,
  excessive files, oversized content, unsupported MIME types, or executable SVG
  content
- **THEN** Studio rejects or safely isolates the affected content
- **AND** no file escapes the chosen root
- **AND** no script or remote reference executes

#### Scenario: Load hostile YAML or telemetry

- **WHEN** YAML expansion, document size, mapper expressions, or telemetry
  cardinality exceeds configured limits
- **THEN** processing is bounded and the operation fails safely
- **AND** the last valid project remains recoverable

#### Scenario: Run in the desktop webview

- **WHEN** Studio runs in Wails
- **THEN** the adapter exposes only bounded typed host operations
- **AND** absolute paths remain inside Go
- **AND** native response and event payloads are validated before use

### Requirement: Cross-host and cross-browser verification

Studio SHALL verify contextual authoring and normal light and dark appearance
in browser and desktop hosts.

#### Scenario: Run the golden authoring journey

- **WHEN** the shared journey creates, selects, edits, maps, saves, reloads, and
  exports a project
- **THEN** Add, Properties, Canvas Properties, and Mapper transitions are
  deterministic
- **AND** the portable project remains equivalent across hosts

#### Scenario: Persist a direct canvas move

- **WHEN** a user drags a positioned object and releases it
- **THEN** the canvas remains at the released position without a snap-back
- **AND** the authoritative topology source contains the released coordinates
- **AND** recovery, save, and reload preserve the same coordinates across
  Browser and Desktop Studio

#### Scenario: Review visual regressions

- **WHEN** visual tests run
- **THEN** screenshots cover Add, object Properties, Canvas Properties, Mapper,
  dialogs, toolbar, Monaco, desktop, narrow, normal light, and normal dark
- **AND** overlap, truncation, blank output, low contrast, or stale
  four-workspace chrome blocks release

#### Scenario: Verify appearance persistence

- **WHEN** System, Light, and Dark choices are exercised
- **THEN** each host restores the chosen preference
- **AND** switching appearance leaves project source byte-for-byte unchanged

### Requirement: Staged Studio support evidence

Studio SHALL use separate Beta Preview and Supported promotion gates, and SHALL
state which product surface each label covers.

#### Scenario: Retain Browser Studio Beta Preview

- **WHEN** maintainers publish the browser product
- **THEN** Chromium authoring, production-build golden journey, security,
  accessibility, persistence/recovery, portable export, performance budget,
  documentation, visual regression, and deployed-route smoke gates pass
- **AND** current desktop Chrome and Edge are named as the primary browser scope
- **AND** Firefox, WebKit, and directory-access fallback behavior are documented

#### Scenario: Promote Desktop Studio to Beta Preview

- **WHEN** maintainers propose a desktop artifact as Beta Preview
- **THEN** host conformance, save/recovery/conflict, native startup, package
  inspection, security, Monaco, export, and platform dependency gates pass
- **AND** the supported operating systems and architectures are named exactly
- **AND** unsigned or unnotarized public artifacts are excluded

#### Scenario: Promote a Studio surface to Supported

- **WHEN** maintainers propose Browser Studio or Desktop Studio as supported
- **THEN** every requirement for that surface has linked evidence and no
  unchecked closeout task
- **AND** independent adopter evidence covers the primary authoring workflows
- **AND** two release cycles have completed without data loss, blank canvas,
  unrecoverable persistence, or host-parity regression
- **AND** known limitations and rollback guidance are documented

#### Scenario: A gate remains incomplete

- **WHEN** any required security, accessibility, performance, reliability,
  parity, package, or CI gate fails
- **THEN** the affected Studio surface retains its current support label
- **AND** the failed change is not released until the gate passes
- **AND** no retired authoring surface is silently restored

### Requirement: Verified style-authoring workflow

Studio SHALL treat Visual/Code synchronization, source preservation,
contextual assistance, candidate preview, and style-draft recovery as
release-blocking behavior.

#### Scenario: Run the style acceptance journey

- **WHEN** the browser and desktop parity suites select node, link, region, and
  annotation targets and edit them through Visual and Code
- **THEN** compatible controls, candidate source, preview, Apply, Revert, Save,
  reload, and export behave equivalently
- **AND** existing stylesheet fixtures render identically after no-op editing

#### Scenario: Verify source preservation

- **WHEN** fixtures contain comments, blank lines, quoted scalars, block
  scalars, aliases, unknown keys, CSS variables, and ordered rules
- **THEN** targeted Visual edits preserve every unrelated source range
- **AND** any unavoidable normalization is explicit and reviewed

#### Scenario: Verify contextual editor behavior

- **WHEN** completion and `?` discovery are exercised in property, value,
  selector, comment, string, block-scalar, and URL contexts
- **THEN** only the valid contexts are modified
- **AND** suggested properties and values remain target-compatible
