## MODIFIED Requirements

### Requirement: Canvas-first product shell

Studio SHALL make the topology canvas the primary workspace and SHALL organize
authoring around Add, contextual Properties, and Mapper rather than exposing
implementation-oriented product modes.

#### Scenario: Open an existing project

- **WHEN** a user opens a valid project
- **THEN** the rendered topology occupies the primary workspace
- **AND** Add, Properties, and Mapper are available from one left workspace
- **AND** topology and stylesheet YAML are available from Properties Code
- **AND** mapper YAML is available from Mapper Code

#### Scenario: Select an object

- **WHEN** a user selects an object outside Mapper
- **THEN** Properties opens for that selection
- **AND** Visual exposes compatible topology and appearance controls
- **AND** Code keeps topology and stylesheet source available

#### Scenario: Select the canvas

- **WHEN** a user clicks empty canvas outside Mapper
- **THEN** Properties opens canvas settings
- **AND** viewport settings do not require a separate workspace

#### Scenario: Work in Mapper

- **WHEN** Mapper is active and the user changes canvas selection
- **THEN** Mapper remains active
- **AND** the selection becomes the mapper target where compatible

#### Scenario: Complete creation

- **WHEN** object or edge creation completes successfully
- **THEN** Studio selects the created object
- **AND** opens its contextual Properties

#### Scenario: Use a narrow viewport

- **WHEN** Studio is used at the documented minimum viewport width
- **THEN** the canvas remains usable
- **AND** the contextual workspace becomes an accessible overlay
- **AND** project and command semantics remain unchanged

### Requirement: Coherent production application shell

TopoViewer Studio SHALL use one Studio-owned Material UI theme with native
light and dark color schemes while keeping rendered topology content
design-system neutral.

#### Scenario: Follow the operating system

- **WHEN** the appearance preference is System
- **THEN** Studio uses the operating-system light or dark preference
- **AND** responds to a later operating-system scheme change

#### Scenario: Override the operating system

- **WHEN** the user chooses Light or Dark
- **THEN** Studio applies that scheme independently of the operating system
- **AND** persists the choice through `StudioHost`
- **AND** browser and VS Code hosts restore equivalent behavior

#### Scenario: Open Studio with a saved preference

- **WHEN** Studio starts with a stored appearance preference
- **THEN** application chrome does not render in the wrong scheme before
  applying that preference

#### Scenario: Render Studio controls

- **WHEN** Studio opens in either host
- **THEN** normal controls and surfaces use the shared MUI component and theme
  layer
- **AND** feature modules do not own a competing palette or raw control family

#### Scenario: Preserve renderer independence

- **WHEN** an adopter imports the public TopoViewer renderer
- **THEN** Material UI is not required as a peer dependency
- **AND** exported diagram appearance does not inherit Studio Material chrome

## ADDED Requirements

### Requirement: Theme-aware viewport preferences

Studio SHALL distinguish theme-owned canvas colors from user-customized canvas
colors without writing either state to project source.

#### Scenario: Use default canvas colors

- **WHEN** background or grid color follows the theme
- **THEN** it resolves from the effective MUI light or dark scheme
- **AND** changes when the effective scheme changes

#### Scenario: Customize a canvas color

- **WHEN** a user explicitly sets a valid background or grid color
- **THEN** Studio preserves that custom value across theme changes and reloads

#### Scenario: Reset a canvas color

- **WHEN** a user resets a custom background or grid color
- **THEN** the property returns to theme ownership

#### Scenario: Migrate legacy preferences

- **WHEN** Studio reads historical default dark canvas values
- **THEN** it migrates them to theme ownership
- **AND** preserves non-default valid colors as custom values
- **AND** does not modify topology, stylesheet, or mapper YAML
