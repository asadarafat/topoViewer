## REMOVED Requirements

### Requirement: Canvas-first product shell

**Reason**: A canvas-first shell hides the portable YAML bundle behind
feature-local Code modes and conflicts with TopoViewer's topology-as-code
positioning.

**Migration**: Use the YAML-first product shell. The real canvas remains
continuously available in Split and Preview, while Add, contextual Properties,
and Mapper Visual move into one preview-local drawer.

## ADDED Requirements

### Requirement: YAML-first product shell

Studio SHALL make the portable YAML bundle a first-class workspace and SHALL
render the real topology beside it without forking authoring by destination.

#### Scenario: Open an existing project

- **WHEN** a user opens a valid project
- **THEN** project source, a shared YAML editor, and the real topology preview
  are immediately discoverable
- **AND** Split defaults to a 25/75 source/preview allocation on desktop
- **AND** Add, contextual Properties, canvas settings, and Mapper Visual are
  available from the preview

#### Scenario: Select an object

- **WHEN** a user selects an object outside pinned Mapper context
- **THEN** Properties opens for that selection
- **AND** Visual exposes compatible topology and appearance controls
- **AND** source remains present or one layout command away

#### Scenario: Select the canvas

- **WHEN** a user selects empty preview outside pinned Mapper context
- **THEN** Properties opens canvas and interaction settings
- **AND** source document state remains unchanged

#### Scenario: Work in Mapper

- **WHEN** Mapper Visual is pinned and the user changes preview selection
- **THEN** Mapper remains active
- **AND** the selection becomes the mapper target where compatible
- **AND** mapper YAML remains available in the shared source editor

#### Scenario: Complete creation

- **WHEN** object or edge creation completes successfully
- **THEN** Studio selects the created object
- **AND** opens its contextual Properties
- **AND** the committed source is visible in the shared editor

#### Scenario: Use a narrow viewport

- **WHEN** Studio is used at the documented minimum viewport width
- **THEN** source and preview remain separately reachable
- **AND** project source and contextual Properties use accessible temporary
  surfaces
- **AND** project and command semantics remain unchanged

### Requirement: One visible source of authoring truth

Studio SHALL present topology, stylesheet, mapper, assets, and generated
projections as one project without introducing a second writable model.

#### Scenario: Compare source and preview

- **WHEN** source or direct manipulation changes the project
- **THEN** both views derive from the same authoritative session and command
  history
- **AND** no wireframe preview, hidden form state, or destination-specific model
  becomes authoritative

#### Scenario: Keep invalid source editable

- **WHEN** a source draft is invalid
- **THEN** source displays the exact draft and diagnostics
- **AND** preview honestly displays the last valid projection
- **AND** Studio identifies that distinction to the author
