# studio-product-contract Specification

## Purpose
Define Studio's portable authoring model, product workflow, project lifecycle,
support boundary, and relationship to other TopoViewer rendering surfaces.
## Requirements
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

### Requirement: Single public authoring application

Studio SHALL be the only deployed TopoViewer authoring application after the
maintainer-approved cutover.

#### Scenario: Open the primary authoring route

- **WHEN** a user follows the public authoring CTA
- **THEN** the browser opens `/studio/`
- **AND** Studio owns project creation, visual editing, code editing, mapper
  authoring, persistence, and export

#### Scenario: Follow a retired Harness link

- **WHEN** a user opens the historical `/harness/` URL
- **THEN** the site redirects to `/studio/`
- **AND** no Harness JavaScript application or duplicate authoring state loads

#### Scenario: Inspect repository ownership

- **WHEN** maintainers audit browser and VS Code authoring entries
- **THEN** both mount the shared Studio application
- **AND** no legacy Harness React tree, host adapter, fixture API, build, test
  lane, or public support claim remains

### Requirement: Release-bound documentation screenshots

The repository SHALL generate every raster screenshot used by maintained
documentation from real product surfaces and SHALL bind its reviewed metadata
to the package release version.

#### Scenario: Prepare a release version

- **WHEN** the repository package version changes
- **THEN** the screenshot freshness check fails until maintainers run the
  documented capture command and review every generated documentation image
- **AND** Studio Visual, Studio Code, MkDocs, Zensical, Grafana, and the
  promotional collage render the same canonical topology bundle
- **AND** the manifest records the matching version, canonical source hashes,
  capture environment, surface, scenario, dimensions, paths, and content hashes

#### Scenario: Publish an npm or PyPI package

- **WHEN** either trusted-publishing workflow reaches its release gates
- **THEN** it rebuilds the product surfaces and regenerates all documentation
  screenshots before publication
- **AND** any difference from the reviewed Git assets blocks publication and is
  uploaded as a workflow artifact

#### Scenario: Run ordinary CI

- **WHEN** CI validates generated content
- **THEN** it checks screenshot integrity and documentation references without
  rewriting image assets
- **AND** malformed, missing, stale, unexpectedly small, or uncatalogued raster
  images fail the lane with an actionable command

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
