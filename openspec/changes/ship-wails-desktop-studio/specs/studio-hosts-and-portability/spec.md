## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Thin VS Code adapter

**Reason**: The unpublished experimental extension is replaced by the dedicated
Wails desktop host.

**Migration**: Use Browser Studio or install the platform-specific Desktop
Studio artifact. Portable TopoViewer source files require no conversion.
