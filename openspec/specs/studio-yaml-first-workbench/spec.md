# studio-yaml-first-workbench Specification

## Purpose
TBD - created by archiving change adopt-yaml-first-studio-workbench. Update Purpose after archive.
## Requirements
### Requirement: YAML-first workbench structure

Studio SHALL present the portable project source as a first-class workspace
beside the real TopoViewer preview rather than hiding YAML inside a feature
panel.

The desktop composition SHALL follow the approved YAML-first wireframe:

- one compact product and command header;
- one default-visible, author-toggleable project-source navigator;
- one context bar containing breadcrumb, Source/Split/Preview, and validity;
- one shared source editor beside one real preview;
- one preview-local Edit/Inspect and search row;
- one explicitly controlled Authoring drawer plus one contextual
  Properties/Mapper drawer on desktop; and
- one collapsible Problems/Changes/Selection/History/Host session dock above
  the status bar.

These are distinct interaction levels and SHALL NOT be flattened into one tab
strip or duplicated across multiple panels.

#### Scenario: Open an existing desktop project

- **WHEN** Studio opens a valid project at a desktop viewport
- **THEN** a default-visible project-source navigator lists topology, stylesheet,
  optional mapper, assets, layers, and problems
- **AND** the selected YAML document opens in the shared Monaco source pane
- **AND** the real TopoViewer preview occupies the remaining primary workspace

#### Scenario: Toggle the desktop project-source navigator

- **WHEN** the author hides or shows Project Source from the desktop header
- **THEN** the navigator visibility changes without mutating project source,
  selection, source drafts, preview state, or history
- **AND** the control exposes its current expanded state accessibly
- **AND** the visibility preference is restored through `StudioHost`

#### Scenario: Filter and navigate project source

- **WHEN** the author filters the project-source navigator
- **THEN** matching files, assets, topology outline entries, and authoring
  entries remain discoverable
- **AND** Authoring appears directly below Workspace before the topology
  outline
- **AND** choosing a topology outline entry opens the owning source range
- **AND** filtering never mutates project source

#### Scenario: Distinguish project-source sections

- **WHEN** Workspace, Authoring, and Topology outline are visible together
- **THEN** MUI dividers visibly separate each adjacent section
- **AND** the dividers do not create another navigation level or alter
  keyboard order

#### Scenario: Keep project-source rows actionable and uniform

- **WHEN** the project-source navigator presents source and authoring entries
- **THEN** document rows keep one-line geometry and optional state appears as
  trailing metadata rather than a second line
- **AND** authoring entries do not add local borders that compete with section
  dividers
- **AND** an empty asset collection does not render an inert asset control
- **AND** a populated asset collection has an explicit disclosure affordance
  and preserves on-demand asset preview behavior

#### Scenario: Use one navigator and palette icon language

- **WHEN** Project Source and the Authoring object palette are available
- **THEN** the Object drawer entry uses the Material UI vertical-split icon
- **AND** Topology outline names canonical `graph.links` objects Edges and
  diagram geometry Shapes
- **AND** Regions and Shapes use the same semantic icons in Topology outline
  and their Authoring palette previews
- **AND** the Project Source visibility icon is mirrored across its vertical
  axis to represent the left-owned navigator
- **AND** these presentation labels and icons do not rename or mutate YAML keys

#### Scenario: Present canonical Studio identity

- **WHEN** Studio opens in the browser or Wails shell
- **THEN** the compact product header uses the canonical TopoViewer mark
- **AND** the browser document and desktop application use canonical logo
  assets for their platform identity
- **AND** the identity remains legible in native light and dark schemes
- **AND** branding does not replace the accessible TopoViewer Studio product
  name

#### Scenario: Open the default split layout

- **WHEN** no saved workbench preference exists
- **THEN** Studio opens Split with the source pane at 25 percent and preview at
  75 percent of the resizable workbench
- **AND** the divider can be adjusted by pointer and keyboard between documented
  bounds
- **AND** resizing does not mutate project source or rebuild the document
  session

#### Scenario: Change workbench layout

- **WHEN** an author selects Source, Split, or Preview
- **THEN** exactly the requested source and preview surfaces remain visible
- **AND** source draft, selection, canvas viewport, undo history, and contextual
  drawer state remain intact
- **AND** the preference is restored through `StudioHost`

#### Scenario: Inspect the desktop hierarchy

- **WHEN** Studio opens at the reference desktop viewport
- **THEN** project identity and commands occupy the header
- **AND** Source, Split, and Preview occupy the context bar rather than the
  header or source navigator
- **AND** preview mode, preview search, and source-linked counts occupy the
  preview-local row
- **AND** project session details occupy the collapsible bottom dock

#### Scenario: Open a contextual authoring surface

- **WHEN** the author opens Authoring, Properties, or Mapper
- **THEN** Authoring may remain open at the preview's left edge while exactly
  one of Properties or Mapper occupies the right edge
- **AND** the source and preview column allocation does not change
- **AND** preview-local floating controls remain outside the visible contextual
  surface
- **AND** closing the surface restores focus to its invoking control

#### Scenario: Constrain contextual drawers at a narrow viewport

- **WHEN** Studio cannot preserve a usable preview with two contextual drawers
- **THEN** Authoring, Properties, and Mapper serialize through one visible
  contextual surface
- **AND** opening one closes the previously visible drawer
- **AND** below the responsive desktop breakpoint that surface uses one
  temporary modal MUI drawer

#### Scenario: Review project session details

- **WHEN** the author opens Problems, Changes, Selection, History, or Host
- **THEN** the dock shows state derived from the authoritative session,
  dispatcher, selection, and host
- **AND** collapsing the dock retains the selected dock view and project state

### Requirement: Shared source-document workspace

Studio SHALL use one schema-aware source-editor component for topology,
stylesheet, and mapper while preserving each document's authoritative
lifecycle.

#### Scenario: Edit valid topology source

- **WHEN** an author edits topology YAML and applies a valid draft
- **THEN** the authoritative session commits the topology source through one
  explicit command
- **AND** preview updates from the resulting semantic projection
- **AND** unrelated comments, formatting, ordering, and unknown fields remain
  preserved

#### Scenario: Preserve valid unapplied source

- **WHEN** an author changes valid topology or mapper YAML without applying it
- **THEN** Studio identifies the document and project as containing an
  unapplied source draft
- **AND** document switching, layout switching, autosave recovery, browser
  reload, and host-backed project transitions preserve the exact text
- **AND** the editor component is not a second source-of-truth owner
- **AND** preview continues to use the last applied semantic projection

#### Scenario: Edit invalid topology or mapper source

- **WHEN** an author introduces invalid topology or mapper YAML
- **THEN** Monaco retains the exact draft with diagnostics
- **AND** preview keeps the last valid semantic projection
- **AND** the author can correct or revert the draft without losing unrelated
  project state

#### Scenario: Edit stylesheet source

- **WHEN** an author changes stylesheet YAML
- **THEN** the shared editor updates the existing stylesheet candidate
- **AND** a valid candidate previews immediately without changing applied
  project source
- **AND** Apply, Revert, Save, recovery, and export retain the canonical
  candidate lifecycle

#### Scenario: Request source assistance

- **WHEN** the author requests completion, hover, `?` discovery, search, or
  context help in any source document
- **THEN** the shared Monaco editor uses canonical TopoViewer authoring metadata
- **AND** provides only context-compatible assistance
- **AND** remains outside the initial application chunk until source is shown

#### Scenario: Separate source commands from editor status

- **WHEN** an existing YAML document is open in the shared source workspace
- **THEN** search, context help, selection-aware navigation when applicable,
  and format commands appear in a compact MUI toolbar above Monaco
- **AND** validation state, dirty resolution, and cursor position remain in a
  separate status row below Monaco
- **AND** the command toolbar and status row use the same theme-owned surface
  fill
- **AND** moving the controls does not change their commands, keyboard access,
  or document ownership

#### Scenario: Open a missing mapper

- **WHEN** the project has no mapper document
- **THEN** the navigator identifies mapper as optional
- **AND** selecting it offers creation through the existing mapper command
- **AND** merely browsing the source does not mutate the project

### Requirement: Source-linked real preview

Studio SHALL render source through the public TopoViewer renderer and SHALL NOT
maintain an alternate preview object model.

#### Scenario: Change source and inspect preview

- **WHEN** a valid source or stylesheet-candidate change affects the graph
- **THEN** the existing `CanvasSurface` renders the new authoritative projection
- **AND** uses the same compiler, style resolution, labels, attention, layers,
  regions, paths, annotations, and assets as other TopoViewer surfaces

#### Scenario: Manipulate preview directly

- **WHEN** an author creates, connects, drags, resizes, renames, groups, or
  deletes an object in preview
- **THEN** existing Studio capabilities commit explicit source mutations
- **AND** the shared source editor reflects the committed YAML
- **AND** high-frequency pointer movement does not serialize YAML or call the
  host

#### Scenario: Navigate between source and preview

- **WHEN** an author reveals a selected object in source
- **THEN** Studio selects the owning document and source range in the shared
  editor
- **WHEN** an author moves the source cursor onto a known semantic object
- **THEN** Studio updates inspectable selection context without creating a
  mutation

### Requirement: Contextual visual authoring drawer

Studio SHALL provide exactly one preview-local drawer for Add, Properties,
canvas settings, or Mapper Visual and SHALL not embed a second source editor in
that drawer.

#### Scenario: Select one semantic object

- **WHEN** an author selects a graph layer, node, link, link direction, path,
  region, shape, callout, or text object outside Mapper
- **THEN** Properties opens with controls compatible with that selection
- **AND** topology facts and appearance remain owned by their respective YAML
  documents
- **AND** any source command navigates the shared editor

#### Scenario: Select multiple objects

- **WHEN** an author selects compatible or mixed objects
- **THEN** Properties reports the exact selection and exposes only valid common
  fields and bulk actions
- **AND** incompatible fields remain disabled with an actionable explanation
- **AND** a bulk mutation commits as one transaction

#### Scenario: Select empty canvas

- **WHEN** an author selects the preview pane
- **THEN** Properties shows viewport and interaction settings
- **AND** layer visibility remains view state while layer definitions and
  membership remain topology source

#### Scenario: Add an object

- **WHEN** an author opens Add and inserts a built-in or saved template
- **THEN** the existing palette capability creates a self-contained valid
  object transaction
- **AND** selects the result
- **AND** opens contextual Properties without hiding source

#### Scenario: Keep Mapper context

- **WHEN** Mapper Visual is pinned and canvas selection changes
- **THEN** Mapper remains open
- **AND** derives the compatible target from shared selection
- **AND** unsupported or mixed selection produces an explicit state

#### Scenario: Keep Authoring open while inspecting preview objects

- **WHEN** Authoring is open on desktop and the author selects an object or
  empty canvas in the preview
- **THEN** Authoring remains open while shared selection still updates
- **AND** contextual Properties opens alongside it
- **AND** either drawer can be closed independently
- **AND** Authoring visibility is restored through `StudioHost`

### Requirement: Complete project contract wiring

The YAML-first workbench SHALL keep project, asset, validation, recovery,
normalization, export, presentation, and host contracts reachable without
duplicating their implementation.

#### Scenario: Manage projects

- **WHEN** the active host supports project catalog or directory projects
- **THEN** create, open, open folder, open archive, rename, duplicate, delete,
  and reset operations invoke the existing typed lifecycle boundary
- **AND** dirty stylesheet candidate and recovery guards run before replacement

#### Scenario: Manage assets and presets

- **WHEN** an author browses assets or inserts an asset-backed template
- **THEN** Studio uses bounded host asset operations and canonical sanitizers
- **AND** templates include required declarations atomically
- **AND** missing or unsafe references are reported without executing content

#### Scenario: Validate and resolve problems

- **WHEN** project diagnostics, invalid drafts, normalization review, external
  change, or a command error exists
- **THEN** the workbench exposes the true state and an actionable operation
- **AND** problem navigation opens the owning source and range
- **AND** the last valid recoverable project remains available

#### Scenario: Export or present

- **WHEN** an author exports a bundle, image, documentation snippet, or Grafana
  artifact or enters presentation
- **THEN** the operation projects the current authoritative bundle
- **AND** valid pending stylesheet candidate handling matches Save
- **AND** failure retains dirty source and reports a typed retryable result

### Requirement: Host-neutral responsive workbench

Studio SHALL mount the same YAML-first application in browser and Wails hosts
and SHALL adapt layout without moving persistence or platform behavior into UI
features.

#### Scenario: Run in browser and desktop

- **WHEN** the golden authoring journey runs in browser and Wails Studio
- **THEN** source, preview, selection, Visual, mapper, save, reload, recovery,
  conflict, and export semantics are equivalent
- **AND** each host owns only its allowed persistence and platform operations

#### Scenario: Use a constrained viewport

- **WHEN** the viewport cannot show navigator, source, preview, and contextual
  drawer together
- **THEN** source and contextual content become accessible MUI drawers or
  exclusive layouts
- **AND** preview remains reachable
- **AND** the page has no incoherent horizontal overflow or obscured controls

#### Scenario: Contain an optional-surface failure

- **WHEN** Monaco, Mapper, export, asset preview, or a host operation fails
- **THEN** its boundary reports the failure and recovery action
- **AND** unrelated project source and preview remain usable

### Requirement: Accessible and measurable workbench

The YAML-first workbench SHALL meet existing Studio accessibility, Material
ownership, visual, bundle, and interaction budgets.

#### Scenario: Author with keyboard and assistive technology

- **WHEN** an author navigates project source, document layouts, divider,
  Monaco, preview, drawers, validation, save, and export without a pointer
- **THEN** focus order, labels, selected state, errors, and outcomes are
  perceivable and deterministic
- **AND** canvas state is not communicated by color alone

#### Scenario: Review light and dark visual states

- **WHEN** production screenshots run at desktop, narrow, light, dark, 200
  percent zoom, forced colors, and reduced motion
- **THEN** source and preview remain legible
- **AND** controls do not overlap or truncate incoherently
- **AND** no obsolete workspace rail or duplicate editor is visible

#### Scenario: Exercise a dense project

- **WHEN** source, preview, and a contextual drawer are used with the
  representative 1,000-node project
- **THEN** initial bundle, source typing, drawer response, drag, memory, and
  frame-time budgets pass
- **AND** preview never blanks because a panel or source layout changes

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
