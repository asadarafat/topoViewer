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

### Requirement: Candidate stylesheet lifecycle

Studio SHALL distinguish the applied project stylesheet from one temporary
candidate stylesheet used by Visual and Code style authoring.

#### Scenario: Preview a valid candidate

- **WHEN** the candidate stylesheet validates successfully
- **THEN** the canvas renders that candidate immediately
- **AND** Studio identifies it as an unapplied style draft
- **AND** the applied project source remains unchanged until Apply or Save

#### Scenario: Preserve an invalid candidate

- **WHEN** candidate YAML has syntax, schema, semantic, or security errors
- **THEN** Studio retains the exact invalid text and exposes source diagnostics
- **AND** disables Apply
- **AND** renders the latest valid candidate rather than blanking the canvas

#### Scenario: Apply a candidate

- **WHEN** an author applies a valid dirty candidate
- **THEN** Studio commits one undoable stylesheet source replacement
- **AND** rebases candidate state to the new applied source revision
- **AND** does not persist the whole project unless Save is requested

#### Scenario: Revert a candidate

- **WHEN** an author reverts a dirty candidate
- **THEN** Visual and Code return to the current applied stylesheet
- **AND** the project source and canvas selection remain unchanged

#### Scenario: Save with a valid candidate

- **WHEN** an author saves while a valid candidate is dirty
- **THEN** Studio applies the candidate and persists the resulting project as one
  user operation
- **AND** does not silently omit the previewed style changes

#### Scenario: Save with an invalid candidate

- **WHEN** an author saves while the candidate is invalid
- **THEN** Studio blocks persistence of that candidate
- **AND** focuses or links to the Style diagnostics
- **AND** retains both the invalid text and last valid project

#### Scenario: Leave the Edit workspace

- **WHEN** an author closes Edit or switches workspace within the same project
- **THEN** Studio preserves the candidate and its diagnostics
- **AND** reopening Edit restores the same Visual/Code representation and draft

#### Scenario: Replace the project or stylesheet externally

- **WHEN** a dirty candidate would be invalidated by project replacement or an
  external stylesheet revision
- **THEN** Studio requires Apply, Revert, or explicit discard
- **AND** never silently rebases or loses candidate text

### Requirement: Candidate state remains portable and host-neutral

Candidate style state SHALL be owned by Studio and SHALL behave equivalently in
browser and VS Code hosts.

#### Scenario: Recover after interruption

- **WHEN** bounded recovery captures a project with a dirty or invalid style
  candidate
- **THEN** Studio can restore candidate text separately from the last valid
  applied project
- **AND** no host promotes invalid candidate text to authoritative source

#### Scenario: Export before applying

- **WHEN** an author exports while a candidate remains unapplied
- **THEN** Studio requires the same valid Apply semantics used by Save
- **AND** exported consumers receive one canonical stylesheet, not hidden draft
  state

### Requirement: Studio canonical identity editing

Studio SHALL expose `id` as the primary editable identity and `labels.name` as
an optional visible alias. It SHALL NOT expose generic `name` as a competing
object field.

#### Scenario: Rename from Visual mode

- **WHEN** an author edits the selected object's ID
- **THEN** Studio previews affected references, applies the semantic rename
  atomically, keeps the new object selected, and creates one undo entry

#### Scenario: Rename from Code mode

- **WHEN** an author changes an ID scalar in topology YAML
- **THEN** Studio offers the same reference-safe refactor or reports dangling
  references rather than applying a partially valid document

#### Scenario: Edit the visible alias

- **WHEN** an author sets `labels.name`
- **THEN** only display content changes and graph references remain unchanged

### Requirement: Studio stylesheet ownership

Studio SHALL create and edit persistent appearance only in stylesheet YAML.

#### Scenario: Create or duplicate an object

- **WHEN** a palette item or duplicated object includes appearance
- **THEN** topology receives only canonical object facts and stylesheet receives
  the corresponding rule in the same transaction

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
