# core-topology-experience Specification

## Purpose
TBD - created by archiving change align-core-with-tvds. Update Purpose after archive.
## Requirements
### Requirement: Logical-topology ownership boundary

The core package SHALL own semantic logical topology, layout in Cartesian graph
space, visual policy, attention, accessibility, and interaction primitives.
It SHALL NOT claim geographic projection, map tiles, coordinate navigation, or
application chrome as base-package capabilities.

#### Scenario: Render a logical topology

- **WHEN** a host supplies graph objects and a supported Cartesian layout
- **THEN** the core validates, compiles, and renders the topology
- **AND** the same semantic object identities remain available to every host

#### Scenario: Require a geographic view

- **WHEN** a product needs latitude/longitude projection or map navigation
- **THEN** documentation identifies that behavior as a host or optional adapter
  responsibility
- **AND** the base package does not add a map SDK or hidden projection behavior

### Requirement: Non-throwing compilation and explicit render states

The package SHALL expose a non-throwing compile operation with a discriminated
success or failure result while retaining the existing throwing compiler. The
React renderer SHALL present accessible empty, filtered-empty, and error states
without replacing host-owned loading behavior.

#### Scenario: Compile a valid document safely

- **WHEN** a consumer passes a valid document to the safe compiler
- **THEN** it receives a success result containing the compiled graph
- **AND** no diagnostic is reported as an error

#### Scenario: Compile an invalid or oversized document safely

- **WHEN** schema validation, semantic compilation, or renderer limits fail
- **THEN** the safe compiler returns a failure result with stable diagnostics
- **AND** it does not throw to the consumer

#### Scenario: Render a graph with no objects

- **WHEN** the effective topology has no renderable objects
- **THEN** the renderer exposes an accessible empty state
- **AND** the host may replace that state through a documented fallback prop

#### Scenario: Filter all objects from a non-empty graph

- **WHEN** the source graph has objects but the active layers hide all of them
- **THEN** the renderer distinguishes the state as filtered-empty
- **AND** the state tells assistive technology that filters removed the view

#### Scenario: Rendering fails after compilation

- **WHEN** an unexpected renderer error reaches the package boundary
- **THEN** a package error boundary presents an accessible fallback
- **AND** invokes the host diagnostic callback without exposing a raw stack

### Requirement: Semantic and keyboard-accessible graph output

Nodes and edges SHALL remain keyboard focusable through React Flow's native
accessibility contract. Their accessible names SHALL include full object
identity and relevant semantic status, and edge names SHALL identify both
endpoints. Visual truncation SHALL NOT truncate accessible names.

#### Scenario: Traverse graph objects without a pointer

- **WHEN** keyboard accessibility is enabled and the user tabs through a graph
- **THEN** focus reaches nodes and edges in the rendered topology
- **AND** native selection and arrow-key movement remain available when the
  corresponding editing behavior is enabled

#### Scenario: Announce operational state

- **WHEN** a node or edge has normalized status or severity
- **THEN** its accessible name includes that status
- **AND** the status remains understandable without relying only on color

#### Scenario: Announce a link

- **WHEN** an edge receives focus
- **THEN** its accessible name identifies its source and target objects
- **AND** includes the link status when present

### Requirement: Typed core theme contract

The package SHALL expose typed light and dark theme tokens and allow a host to
select `light`, `dark`, or `system` color mode with optional token overrides.
The default remains backward-compatible dark mode. Renderer chrome spacing
SHALL use a documented 4 px scale, and package CSS SHALL source owned colors
from theme variables rather than scattered literals.

#### Scenario: Select a built-in theme

- **WHEN** a host selects light or dark color mode
- **THEN** renderer chrome, labels, controls, and React Flow integration use
  the corresponding package tokens
- **AND** authored topology stylesheet colors remain untouched

#### Scenario: Follow the operating-system theme

- **WHEN** a host selects system color mode
- **THEN** the package follows `prefers-color-scheme`
- **AND** preserves explicit host token overrides in both modes

#### Scenario: Add an unowned core color literal

- **WHEN** package validation scans renderer chrome CSS
- **THEN** a color literal outside the approved token declaration boundary
  fails the package theme-ownership check

### Requirement: Normalized status and legend semantics

The core SHALL normalize static topology status and mapper-compatible severity
onto one public semantic scale and expose deterministic legend data. Static
topology compilation SHALL not mutate topology identity or embed runtime values
into source YAML.

#### Scenario: Normalize equivalent status values

- **WHEN** an object declares a supported status or severity alias
- **THEN** the resolver returns one canonical severity
- **AND** static and mapped values produce the same semantic legend entry

#### Scenario: Build a legend

- **WHEN** a compiled graph contains one or more canonical statuses
- **THEN** the legend builder returns unique entries in deterministic severity
  order with labels and non-color cues

#### Scenario: Lint against TVDS guidance

- **WHEN** a consumer opts into the TVDS lint profile
- **THEN** the linter warns about status rules that rely only on color and
  literal foreground/background pairs with insufficient contrast
- **AND** default lint behavior remains backward compatible

### Requirement: Shared attention viewport controller

The package SHALL expose a pure viewport reducer for zoom-driven aggregate
expansion and collapse. The reducer SHALL apply hysteresis deterministically,
and the embed adapter SHALL consume the same public logic available to direct
React hosts.

#### Scenario: Cross the expansion threshold

- **WHEN** zoom rises above the configured expansion threshold
- **THEN** the reducer expands eligible aggregate groups once

#### Scenario: Hover near a threshold

- **WHEN** zoom changes inside the configured hysteresis band
- **THEN** the reducer preserves the current expansion state
- **AND** does not flicker between expanded and collapsed states

#### Scenario: Use an embed or direct host

- **WHEN** equivalent state, policy, and zoom are passed through either surface
- **THEN** both surfaces resolve the same expanded group IDs

### Requirement: Contextual connection presets

The package SHALL export named runtime, guided-authoring, and rapid-authoring
interaction presets. Runtime SHALL expose no authoring handles, guided
authoring SHALL expose shape-aware handles, and rapid authoring SHALL use the
full-node connection target.

#### Scenario: Configure a host from a preset

- **WHEN** a host applies one named preset to `TopoViewer`
- **THEN** it receives a compatible set of draggable, connectable, selection,
  and connection-handle properties
- **AND** does not reconstruct those flags locally

### Requirement: Deterministic layout provider contract

The package SHALL route non-manual layout through named deterministic layout
providers and SHALL include `manual`, `force`, `clos`, and `tree` providers.
Tree layout SHALL support direction and spacing options, produce stable output,
and handle disconnected or cyclic input without hanging.

#### Scenario: Lay out a rooted tree

- **WHEN** a document selects tree layout for a directed hierarchy
- **THEN** roots, descendants, and disconnected components receive stable
  Cartesian positions in the configured direction

#### Scenario: Repeat tree layout

- **WHEN** the same graph and options are compiled repeatedly
- **THEN** every node receives the same position

#### Scenario: Encounter a cycle

- **WHEN** the graph contains a directed cycle
- **THEN** the provider terminates and positions every node exactly once
- **AND** preserves deterministic ordering for the cycle fallback

#### Scenario: Request an unknown layout provider

- **WHEN** a document names a layout provider not registered by the package
- **THEN** validation or compilation reports a stable diagnostic
- **AND** does not silently run force layout
