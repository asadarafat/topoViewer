# Studio Product Contract Delta

## MODIFIED Requirements

### Requirement: Coherent production application shell

TopoViewer Studio SHALL use one Studio-owned Material UI theme and component
layer for application controls while keeping rendered topology content
design-system neutral.

#### Scenario: Render Studio controls

- **WHEN** Studio opens in the browser or VS Code host
- **THEN** buttons, icon buttons, fields, selects, switches, tabs, menus,
  popovers, dialogs, accordions, and tooltips use the shared Material control
  layer
- **AND** both hosts expose equivalent interaction, density, focus, and theme
  behavior
- **AND** feature modules do not implement competing raw control families

#### Scenario: Preserve renderer independence

- **WHEN** an adopter imports the public TopoViewer renderer
- **THEN** Material UI is not required as a peer dependency
- **AND** exported diagram appearance does not inherit Studio Material chrome

### Requirement: Measured visual quality

Studio SHALL treat visual consistency, responsive layout, focus, contrast,
loading, empty, error, disabled, and destructive states as tested product
behavior.

#### Scenario: Review representative states

- **WHEN** visual evidence is captured at desktop, narrow, light, dark, forced
  colors, and reduced-motion settings
- **THEN** controls do not overlap or truncate incoherently
- **AND** field density remains scannable
- **AND** dialogs, menus, and popovers remain inside the viewport
