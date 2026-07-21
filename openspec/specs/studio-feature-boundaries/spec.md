# studio-feature-boundaries Specification

## Purpose
TBD - created by archiving change stabilize-core-studio-boundaries. Update Purpose after archive.
## Requirements
### Requirement: Published Core Consumption

Studio SHALL consume core through declared package exports and SHALL prove at
least one required build against the packed npm artifact.

#### Scenario: Normal Studio build resolves core

- **WHEN** the repository builds Studio through its supported root command
- **THEN** Vite SHALL resolve `topoviewer` through package exports rather than aliases to core source

#### Scenario: Packed package incompatibility fails CI

- **WHEN** Studio depends on an API missing or malformed in the packed package
- **THEN** the packed-core compatibility lane SHALL fail before browser tests

### Requirement: Enforced Feature Dependency Direction

Studio SHALL enforce application composition over feature public APIs, and
feature implementation modules SHALL NOT import application controller modules.

#### Scenario: Feature imports application implementation

- **WHEN** a Studio feature imports from `src/app` or an application controller helper
- **THEN** the dependency-boundary check SHALL fail with the offending path

#### Scenario: Host concern enters a feature

- **WHEN** browser, VS Code, filesystem, or persistence implementation details bypass a host or session contract
- **THEN** the dependency-boundary check SHALL fail

### Requirement: Narrow Canvas Contract

The canvas feature SHALL receive a cohesive immutable model and action contract
instead of dozens of unrelated application props.

#### Scenario: Canvas state changes

- **WHEN** canvas selection, viewport, authoring mode, or presentation state changes
- **THEN** the canvas SHALL receive the change through its declared model
- **AND** unrelated project or panel implementation state SHALL not be part of the canvas contract

#### Scenario: Canvas command runs

- **WHEN** the user drags, connects, selects, resizes, aligns, or opens a canvas action
- **THEN** the canvas SHALL invoke a declared feature action
- **AND** canvas implementation code SHALL not call application controller helpers directly

### Requirement: Feature-Owned Studio Capabilities

Project/session, canvas, style, mapper, viewport, and export behavior SHALL have
named owners with narrow state projections and command interfaces.

#### Scenario: Root controller composes features

- **WHEN** Studio initializes
- **THEN** the root application controller SHALL compose feature capabilities
- **AND** SHALL not duplicate their domain logic

#### Scenario: Feature state updates

- **WHEN** one feature updates local or projected state
- **THEN** unrelated feature consumers SHALL not be forced to receive the complete root controller state

### Requirement: Authoring Journey Verification

Studio SHALL verify complete user tasks in addition to isolated control and
mutation behavior.

#### Scenario: Core authoring journeys run

- **WHEN** the required browser lane executes
- **THEN** it SHALL cover link creation/editing, multi-select alignment, region movement/resizing, visual styling, and project export/reopen
- **AND** each journey SHALL assert the resulting YAML or project state

#### Scenario: Stable product chrome is reviewed

- **WHEN** visual regression checks run
- **THEN** stable palette, Inspector, mapper, dialog, and toolbar states SHALL be captured at documented viewports

### Requirement: Measured Studio Payload

Studio SHALL keep heavy optional workflows behind lazy boundaries and enforce a
ratcheted initial bundle budget based on reproducible measurements.

#### Scenario: First paint excludes optional features

- **WHEN** Studio first loads
- **THEN** Monaco, export implementation, and mapper analysis UI SHALL remain outside the initial entry when not required for first paint

#### Scenario: Bundle regression occurs

- **WHEN** the measured initial gzip payload exceeds the checked budget and tolerance
- **THEN** local and CI budget checks SHALL fail with the measured artifact

#### Scenario: Interaction performance remains stable

- **WHEN** code splitting or state-boundary changes are applied
- **THEN** existing startup, drag, Inspector, mapper, memory, and dense-graph budgets SHALL not regress
