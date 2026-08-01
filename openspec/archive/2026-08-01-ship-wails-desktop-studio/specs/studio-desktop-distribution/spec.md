## ADDED Requirements

### Requirement: Dedicated desktop Studio

TopoViewer SHALL ship the existing Studio authoring application through a
Wails v2 desktop host without forking the topology, stylesheet, mapper, or
authoring model.

#### Scenario: Open Desktop Studio

- **WHEN** a user starts the desktop application
- **THEN** it mounts the same Studio application and public package contracts
  used by Browser Studio
- **AND** canvas, Properties, Monaco, Mapper, history, recovery, and export
  behavior do not depend on VS Code

#### Scenario: Render a dense project

- **WHEN** Desktop Studio opens the representative dense fixture
- **THEN** pointer-time graph rendering remains in the existing React renderer
- **AND** native host communication does not occur on pointer movement
- **AND** existing Studio performance budgets remain applicable

### Requirement: Platform-native release artifacts

The desktop release SHALL build a platform-specific artifact for each supported
operating system from one source tree and MUST NOT claim that one executable
runs unchanged across operating systems.

#### Scenario: Build a desktop release

- **WHEN** the release matrix completes
- **THEN** it produces a macOS application bundle, a Windows executable or
  installer, and a Linux executable or package
- **AND** each artifact records its operating system, architecture, version,
  checksum, and support status

#### Scenario: Build for macOS architectures

- **WHEN** the macOS release is prepared
- **THEN** Intel and Apple Silicon binaries are combined into one universal
  application bundle
- **AND** public distribution requires signing and notarization evidence

#### Scenario: Build for an additional architecture

- **WHEN** Windows arm64 or Linux arm64 is enabled
- **THEN** it is published as a separate architecture-specific artifact
- **AND** it passes the same host and startup smoke contract as the primary
  artifact

### Requirement: Pinned stable desktop runtime

The desktop application SHALL build with an exact stable Wails v2 dependency
and MUST NOT use Wails v3 while it remains pre-release.

#### Scenario: Verify desktop dependencies

- **WHEN** CI inspects the desktop Go module and build commands
- **THEN** the Wails module and generator resolve to the same exact stable v2
  version
- **AND** the desktop prerequisite gate requires Go 1.25 or newer
- **AND** no unbounded `latest` or Wails v3 dependency controls a release build

### Requirement: Native project workflow

Desktop Studio SHALL use native dialogs to create or approve local project
roots, select assets, and choose export destinations.

#### Scenario: Start without a recent project

- **WHEN** Desktop Studio starts with no approved recent directory
- **THEN** it opens a recoverable untitled starter project without writing to an
  arbitrary filesystem location
- **AND** first Save asks the user to choose an empty project directory
- **AND** folder approval, initial source persistence, recovery migration, and
  recent-project promotion complete through one native operation

#### Scenario: First save cannot complete

- **WHEN** the user cancels first Save or validation, staging, installation,
  recovery migration, or lifecycle persistence fails
- **THEN** the opaque project remains an untitled authority with its dirty
  project and recovery state intact
- **AND** the destination is not promoted as the recent project
- **AND** a retry does not require recovering from a half-bound frontend state

#### Scenario: Choose a non-empty first-save destination

- **WHEN** a user chooses a directory that already contains files during first
  Save
- **THEN** Desktop Studio returns a typed conflict without replacing content
- **AND** directs existing bundles through Open Folder

#### Scenario: Open an existing project folder

- **WHEN** a user chooses a directory containing canonical topology and
  stylesheet files
- **THEN** Desktop Studio validates and loads the bundle
- **AND** remembers the approved directory according to the documented recent
  project policy

#### Scenario: Reject an invalid project folder

- **WHEN** a user chooses a directory that cannot be validated as a canonical
  TopoViewer bundle
- **THEN** Desktop Studio keeps the current project, dirty state, and canvas
  unchanged
- **AND** does not promote the rejected directory as the recent project
- **AND** releases the temporary filesystem authority created for validation

#### Scenario: Cancel a native dialog

- **WHEN** a user cancels project, asset, or export selection
- **THEN** the host returns a typed cancelled result
- **AND** the current project, dirty state, and canvas remain unchanged

### Requirement: Confined desktop filesystem authority

The desktop host SHALL keep absolute filesystem paths inside Go and SHALL
permit frontend operations only within a user-approved project root.

#### Scenario: Read a project

- **WHEN** the frontend requests project content
- **THEN** the Go host resolves only canonical relative paths below the approved
  root
- **AND** rejects traversal, absolute paths, symbolic links, escaped real paths,
  oversized files, and excessive file cardinality

#### Scenario: Receive malformed native data

- **WHEN** a native binding or event returns an invalid payload
- **THEN** the desktop adapter rejects it as a typed host failure
- **AND** does not pass unchecked data into the Studio session

#### Scenario: Report a host failure

- **WHEN** Desktop Studio logs or reports a filesystem failure
- **THEN** normal diagnostics omit absolute user paths and source content
- **AND** retain enough typed context for an actionable error

### Requirement: Recoverable multi-file persistence

Desktop Studio SHALL detect revision conflicts before writing and SHALL
coordinate source-file writes with staging, rollback, and cleanup.

#### Scenario: Save an unchanged disk revision

- **WHEN** a valid dirty project is saved against its loaded directory revision
- **THEN** all source documents are staged before replacement
- **AND** the host returns the revision read from the completed disk state
- **AND** Studio becomes saved only after that result

#### Scenario: Save after an external change

- **WHEN** disk content changed after the project was loaded
- **THEN** the host returns a typed conflict without replacing any source file
- **AND** Studio retains the dirty project and offers the existing conflict
  workflow

#### Scenario: A replacement fails

- **WHEN** one staged file cannot replace its target
- **THEN** the host restores prior targets where possible
- **AND** removes temporary files on a best-effort basis
- **AND** returns a typed actionable failure without reporting the project as
  saved

#### Scenario: Rollback cannot restore prior content

- **WHEN** a replacement fails and the filesystem also prevents one prior
  target from being restored
- **THEN** the host MUST retain any confirmed prior-content backup
- **AND** remove remaining staging files on a best-effort basis
- **AND** report whether rollback succeeded and whether recovery material was
  retained
- **AND** Studio MUST keep the project dirty

### Requirement: Desktop recovery and external changes

Desktop Studio SHALL persist bounded recovery data outside the project bundle
and SHALL distinguish self-writes from external filesystem changes.

#### Scenario: Recover after interruption

- **WHEN** Desktop Studio closes after a valid dirty edit
- **THEN** reopening the same project offers the newer bounded recovery snapshot
- **AND** does not overwrite disk source until the user saves

#### Scenario: Observe an external edit

- **WHEN** a project file changes outside Studio while the session is clean
- **THEN** the host emits one debounced external-change event with the new
  revision
- **AND** Studio follows the existing safe reload behavior

#### Scenario: Observe Studio's own save

- **WHEN** the filesystem watcher reports files written by the active Studio
  save
- **THEN** the host suppresses the self-generated event
- **AND** no false external-conflict prompt appears

### Requirement: Explicit platform runtime contract

Desktop documentation and packages SHALL state native runtime requirements
instead of describing every artifact as fully static.

#### Scenario: Install on Windows

- **WHEN** the application starts without a suitable WebView2 runtime
- **THEN** the supported installer or executable follows the documented
  bootstrap strategy
- **AND** reports an actionable failure if installation cannot complete

#### Scenario: Install on Linux

- **WHEN** the Linux package is installed
- **THEN** its metadata or documentation declares the compatible GTK and
  WebKit2GTK ABI dependencies
- **AND** the release smoke runs against the documented minimum environment

#### Scenario: Install on macOS

- **WHEN** a user downloads the public macOS artifact
- **THEN** it is a signed and notarized application bundle
- **AND** unsigned development artifacts are not labeled Supported

### Requirement: Desktop release verification

The repository SHALL block desktop promotion on host conformance, native
startup, package inspection, and security evidence.

#### Scenario: Change desktop-owned code

- **WHEN** a pull request changes the desktop host, frontend, bindings, or
  packaging
- **THEN** CI runs Go tests, TypeScript tests, binding drift, frontend build,
  host conformance, security checks, and a Linux Wails compile or smoke
- **AND** uploads relevant failure artifacts

#### Scenario: Publish a desktop release

- **WHEN** maintainers publish Desktop Studio
- **THEN** native platform jobs build from the release commit
- **AND** verify checksums, package metadata, startup, the golden authoring
  journey, and signing state applicable to that platform
