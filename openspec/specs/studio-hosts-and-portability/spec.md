# studio-hosts-and-portability Specification

## Purpose
Define the typed host boundary that keeps Studio authoring behavior portable
across browser and desktop hosts while making persistence, lifecycle, and
security ownership explicit.
## Requirements
### Requirement: Explicit Studio host boundary

The Studio application SHALL access persistence, project files, assets,
exports, preferences, lifecycle events, and host reporting only through a typed
host interface.

#### Scenario: Use a Studio feature module

- **WHEN** a Studio feature needs host capability
- **THEN** it calls the typed Studio host contract
- **AND** does not import Wails bindings, Node filesystem objects, browser
  persistence globals, or host message envelopes directly

#### Scenario: Host operation fails

- **WHEN** a host operation rejects or is unavailable
- **THEN** Studio receives a typed actionable error
- **AND** preserves the dirty project and offers a valid recovery or fallback

### Requirement: Browser project persistence

The browser host SHALL persist project content and recovery data in a versioned
IndexedDB store with atomic writes and bounded retention.

#### Scenario: Reload a modified browser project

- **WHEN** a user reloads after a valid autosaved edit
- **THEN** Studio restores the latest recoverable project and its source files
- **AND** distinguishes recovery state from an explicit user save or export

#### Scenario: Persistence is corrupt or over quota

- **WHEN** IndexedDB data is corrupt, migration fails, or quota is exhausted
- **THEN** Studio keeps recoverable source available where possible
- **AND** offers export, reset, or retry actions
- **AND** does not blank the application or silently discard the project

#### Scenario: Store a preference

- **WHEN** Studio stores a small UI preference
- **THEN** it uses a safe versioned helper
- **AND** direct unguarded `localStorage.setItem` calls are prohibited
- **AND** project source and telemetry samples are not stored in local storage

### Requirement: Portable browser file workflow

The browser host SHALL support deterministic bundle import/export everywhere
and MAY support explicit folder access through the File System Access API where
available.

#### Scenario: Use a browser without folder APIs

- **WHEN** native folder access is unavailable
- **THEN** users can still import and export the complete project as files or a
  deterministic archive
- **AND** no project capability depends exclusively on a Chromium-only API

#### Scenario: Export and re-import

- **WHEN** a user exports a valid project and imports it into a clean Studio
  instance
- **THEN** topology, stylesheet, mapper, assets, comments, and supported project
  metadata round-trip according to the documented contract

### Requirement: Consumer-independent bundle output

Studio SHALL export standards-compliant TopoViewer source files that do not
depend on Studio, a host runtime, or a destination-specific private field.

#### Scenario: Render an exported bundle

- **WHEN** a Studio-exported bundle is loaded by a supported core runtime,
  MkDocs, Zensical, React, or Grafana fixture
- **THEN** the consumer renders the same semantic topology and applicable style
- **AND** no Studio package or project database is required at runtime

### Requirement: Deterministic destination packaging

Documentation snippets, Grafana bundle packages, images, and archives SHALL be
generated from the current project by deterministic, validated exporters.

#### Scenario: Generate a MkDocs snippet

- **WHEN** a user requests a MkDocs example
- **THEN** Studio produces a snippet referencing the exported canonical files
- **AND** does not duplicate or rewrite the topology into a MkDocs-only model

#### Scenario: Generate a Grafana bundle

- **WHEN** a user requests Grafana packaging
- **THEN** Studio validates source and mapper requirements
- **AND** packages canonical topology, stylesheet, mapper, and assets
- **AND** reports missing requirements without changing the authoring model

### Requirement: Thin desktop adapter

The desktop application SHALL own Wails transport, native lifecycle,
filesystem, preferences, recovery storage, file watching, dialogs, and
packaging while mounting the shared Studio application.

#### Scenario: Open Studio on desktop

- **WHEN** the Wails application opens a valid TopoViewer directory
- **THEN** it mounts the shared Studio application through `StudioHost`
- **AND** canvas, Properties, mapper, YAML, history, and export behavior pass
  the shared host conformance suite

#### Scenario: Detect an external file change

- **WHEN** disk content changes while the Studio session is clean
- **THEN** the desktop host reloads or offers the documented safe refresh
  behavior
- **AND** when the session is dirty, it offers keep-draft and reload-disk
  choices without silently overwriting either side

#### Scenario: Use native host capabilities

- **WHEN** Studio requests a folder, asset, export, clipboard, preference, or
  recovery operation
- **THEN** the desktop adapter translates the request through generated Wails
  bindings
- **AND** native runtime types do not escape into Studio feature modules
