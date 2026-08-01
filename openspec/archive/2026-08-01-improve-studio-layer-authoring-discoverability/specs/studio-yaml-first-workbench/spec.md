## ADDED Requirements

### Requirement: Discoverable layer authoring in Project Source

Studio SHALL present layer authoring as an explicit Topology Outline capability
inside Project Source while preserving `topology.yaml` as the authoritative
owner of layer definitions and membership.

#### Scenario: Discover collapsed layer authoring

- **WHEN** Project Source renders the Topology Outline
- **THEN** Layers shows its layer count, an Add action, and an explicit
  expand/collapse affordance
- **AND** the layer manager remains collapsed until requested
- **AND** no duplicate Layers control appears on the canvas toolbar

#### Scenario: Expand layers without navigating source

- **WHEN** the author expands or collapses Layers
- **THEN** only the layer manager disclosure state changes
- **AND** the active source document, source range, selection, and project YAML
  remain unchanged

#### Scenario: Navigate to layer source

- **WHEN** the author chooses View YAML from the expanded layer manager
- **THEN** Studio opens `topology.yaml` at `graph.layers`
- **AND** does not mutate the project

#### Scenario: Name a layer before creation

- **WHEN** the author chooses Add
- **THEN** Studio opens a Material UI form requiring a meaningful layer name
- **AND** previews the deterministic collision-safe layer ID
- **AND** canceling the form creates no command, source change, or history entry

#### Scenario: Confirm layer creation

- **WHEN** the author confirms a valid layer name
- **THEN** Studio recomputes and commits one canonical layer-creation plan from
  the latest valid project snapshot
- **AND** selects the newly created layer for contextual inspection
- **AND** the new definition is represented in `topology.yaml`

#### Scenario: Show layer usage

- **WHEN** the expanded manager lists a layer
- **THEN** it shows the number of graph and diagram objects that reference that
  layer
- **AND** the count updates after membership, creation, or deletion commands

#### Scenario: Protect an invalid source draft

- **WHEN** the active project contains an invalid unapplied source draft
- **THEN** layer actions that mutate project YAML are disabled
- **AND** expansion, source navigation, selection, and view-only visibility do
  not discard or overwrite the draft
