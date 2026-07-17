## ADDED Requirements

### Requirement: One portable authoring model

TopoViewer Studio SHALL author one portable bundle containing topology,
stylesheet, optional mapper, and optional asset documents. The authoring model
MUST NOT fork according to the intended runtime surface.

#### Scenario: Start without choosing a destination

- **WHEN** a user creates a Studio project
- **THEN** Studio opens the same canvas-first authoring workspace regardless of
  whether the bundle will later be used by MkDocs, Zensical, React, Grafana, or
  an export workflow
- **AND** no destination wizard is required

#### Scenario: Reuse one bundle across surfaces

- **WHEN** a valid Studio bundle is exported
- **THEN** supported consumers can use the same topology and stylesheet files
- **AND** consumers that do not use telemetry can ignore the optional mapper
  without requiring an authoring fork

### Requirement: Canvas-first product shell

Studio SHALL make the topology canvas the primary workspace and SHALL present
object creation, selection, and direct manipulation ahead of implementation
details such as raw YAML or fixture controls.

#### Scenario: Open an existing project

- **WHEN** a user opens a valid project
- **THEN** the rendered topology occupies the primary workspace
- **AND** the object palette and selection-aware Inspector are immediately
  available
- **AND** topology and stylesheet YAML are available from `Edit > Code`
- **AND** mapper YAML and telemetry tooling are available from Mapper without a
  duplicate global source workspace

#### Scenario: Use a narrow viewport

- **WHEN** Studio is used at the documented minimum viewport width
- **THEN** the canvas remains usable
- **AND** palette and Inspector controls move into accessible panels without
  changing the project or command semantics

### Requirement: Selection-driven editing

Studio SHALL derive Inspector content from the current selection and SHALL keep
routine edits close to the selected object.

#### Scenario: Select one object

- **WHEN** a user selects a node, link, path, region, shape, or callout
- **THEN** the Inspector displays fields and actions compatible with that object
- **AND** the user can edit its identity, relationships, data, and applicable
  visual policy without navigating to a separate product mode

#### Scenario: Select multiple objects

- **WHEN** a user selects multiple objects
- **THEN** Studio exposes compatible bulk actions and shared editable fields
- **AND** it does not imply that incompatible fields will be applied

### Requirement: Clear project state

Studio SHALL expose one coherent project state model for source validity,
unsaved changes, save progress, and external conflicts.

#### Scenario: Make a valid edit

- **WHEN** a command changes a valid project
- **THEN** Studio reports the project as modified
- **AND** saving the authoritative source returns it to saved state

#### Scenario: Make an invalid YAML draft

- **WHEN** a user introduces invalid YAML
- **THEN** Studio reports the draft as invalid
- **AND** continues rendering the last valid semantic projection
- **AND** clearly offers correction or revert without conflating that action
  with reverting a template or an unrelated saved project

### Requirement: Preview and export are projections

Studio SHALL treat preview, presentation, documentation snippets, Grafana
packaging, and image exports as projections of the current project. These
projections MUST NOT become independent writable models.

#### Scenario: Preview a target surface

- **WHEN** a user opens a destination preview
- **THEN** Studio renders or packages the current authoritative bundle
- **AND** closing the preview returns to the same authoring state
- **AND** the preview does not create hidden destination-specific topology data

### Requirement: Reversible Harness migration

Studio SHALL coexist with the current Browser Harness until documented parity,
quality, and migration gates pass.

#### Scenario: Publish Studio before cutover

- **WHEN** Studio is first deployed
- **THEN** it is available from a separate `/studio/` route
- **AND** `/harness/` remains available as a comparison and rollback surface

#### Scenario: Cut over the public authoring route

- **WHEN** every production-readiness and parity task is complete
- **THEN** the public authoring CTA and route may move to Studio in a dedicated
  reviewable change
- **AND** the old shell is removed only after a documented rollback period
