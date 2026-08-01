# studio-spec-driven-authoring Specification

## Purpose
Define metadata-driven visual and YAML authoring so Studio exposes the complete
TopoViewer style contract without duplicating schema or runtime semantics.
## Requirements
### Requirement: Canonical authoring metadata

The `topoviewer` package SHALL own canonical metadata for every public style
field, including type, target compatibility, default, description, grouping,
authoring level, ordering, conditional visibility, and control hints.

#### Scenario: Add a public style field

- **WHEN** a new public style field is added to the runtime contract
- **THEN** CI requires corresponding canonical authoring metadata
- **AND** the field is renderable by a generic typed control or an explicitly
  reviewed specialized editor
- **AND** Studio does not require a second manually synchronized field registry

#### Scenario: Consume metadata outside Studio

- **WHEN** schema assistance, docs generation, or another pure consumer needs
  field facts
- **THEN** it imports the canonical metadata from `topoviewer`
- **AND** it does not import Studio UI or host code

### Requirement: Complete generated style controls

Studio SHALL make common applicable style fields editable in Visual and SHALL
make every public style field discoverable through Code completion, hover,
diagnostics, source navigation, or a reviewed specialized Visual editor.

#### Scenario: Inspect common fields

- **WHEN** one compatible object or same-kind selection is active
- **THEN** Visual shows grouped, task-oriented controls derived from canonical
  metadata
- **AND** uses human-readable labels while keeping raw property names searchable
- **AND** omits incompatible and low-frequency fields

#### Scenario: Search common fields

- **WHEN** an author searches Visual fields
- **THEN** Studio searches Visual-compatible labels, canonical names,
  descriptions, groups, and aliases
- **AND** keeps advanced fields hidden until the author chooses `View more`

#### Scenario: Reveal less-common fields

- **WHEN** an author chooses `View more`
- **THEN** Studio expands the same metadata-driven list with applicable
  less-common fields
- **AND** does not introduce a separate Advanced authoring mode

#### Scenario: Edit a nested contract

- **WHEN** a compatible nested style such as `nodeLayout` is selected
- **THEN** Studio renders its supported nested fields as one coherent group
- **AND** enforces parent conditions and value compatibility
- **AND** preserves unknown nested keys during unrelated edits

#### Scenario: Reach a less-common field

- **WHEN** a field is not available in Visual
- **THEN** Code completion and hover make the compatible public field
  discoverable
- **AND** Studio does not require a duplicate UI metadata list

### Requirement: Customizable main-field profile

Users SHALL be able to add fields to the main list, move them behind View More,
hide them, and reorder authoring fields without changing the runtime schema or
project bundle. These infrequent controls SHALL remain behind a contextual
field menu rather than occupying every field row.

#### Scenario: Add a field to the main list

- **WHEN** a user promotes a less-common field to the main list
- **THEN** Studio stores a sparse versioned preference override
- **AND** the field appears without opening View More for the applicable object
  kinds
- **AND** exported topology and stylesheet files remain unchanged

#### Scenario: Reset authoring preferences

- **WHEN** a user resets a field profile
- **THEN** Studio removes the user override and restores the shipped profile
- **AND** does not remove project style values

#### Scenario: Migrate profile metadata

- **WHEN** canonical field metadata changes between compatible versions
- **THEN** Studio migrates valid overrides
- **AND** reports removed or incompatible overrides without blocking the project

### Requirement: Typed and usable controls

Generated forms SHALL use controls appropriate to the field semantics and SHALL
support validation, unset, reset-to-default, and explicit-value behavior.

#### Scenario: Edit a constrained value

- **WHEN** metadata defines an enum, range, color, asset, selector, boolean,
  number, list, or nested object
- **THEN** Studio presents an appropriate accessible control
- **AND** validates before commit
- **AND** explains accepted values and errors using canonical metadata

#### Scenario: Open field actions

- **WHEN** a user opens a generated field's action menu
- **THEN** each action remains legible on one line within the available
  Inspector or viewport width
- **AND** the menu does not inherit the icon trigger's fixed dimensions
- **AND** disabled and focused actions remain distinguishable

#### Scenario: Use an unsupported future field

- **WHEN** imported YAML contains a field unknown to the installed Studio
  version
- **THEN** Studio preserves it
- **AND** identifies it as unsupported rather than deleting or silently
  coercing it

### Requirement: Effective style provenance

Studio SHALL show the effective candidate value in Visual and keep detailed
source inspection in Code.

#### Scenario: Inspect an inherited value

- **WHEN** defaults or one or more matching stylesheet rules contribute to a
  Visual field
- **THEN** Studio displays the effective value
- **AND** does not add rule provenance or source-navigation controls to each
  Visual property row
- **AND** Code remains the complete ordered stylesheet representation

#### Scenario: Inspect an overridden value

- **WHEN** inline or runtime state overrides a candidate stylesheet value
- **THEN** Studio reports the final winner without presenting the losing value as
  active
- **AND** preserves inspectable contributor order

#### Scenario: Remove an object-specific stylesheet value

- **WHEN** an author resets a Visual value written by Studio
- **THEN** Studio removes only that value from the exact-ID rule
- **AND** removes the rule if its style mapping becomes empty
- **AND** reveals the next inherited effective value

### Requirement: Attribute-first style cascade authoring

Studio SHALL expose common appearance attributes for the current compatible
selection in Visual while keeping the complete ordered stylesheet and reusable
selector authoring in Code. Visual SHALL write object-specific policy through
exact-ID stylesheet rules and SHALL NOT expose a `Default | Rule | This object`
matrix or create persistent inline topology style.

#### Scenario: Edit the current selection

- **WHEN** an author changes an appearance attribute in Visual
- **THEN** Studio creates or updates compatible exact-ID stylesheet rules for
  the selected objects
- **AND** leaves topology source unchanged
- **AND** presents mixed values without inferring a reusable selector

#### Scenario: Author reusable policy

- **WHEN** an author needs a reusable selector rule or rule ordering control
- **THEN** the author uses Edit > Code
- **AND** the complete public selector grammar and stylesheet source remain
  available without a second visual rule builder

#### Scenario: Inspect the cascade

- **WHEN** defaults, matching rules, or runtime state contribute to a field
- **THEN** Visual shows the effective value for the current selection
- **AND** Code remains the authoritative ordered representation of authored
  rules

#### Scenario: Open Visual without a compatible selection

- **WHEN** no compatible object is selected
- **THEN** Visual shows an actionable empty state
- **AND** Code remains available for stylesheet authoring

### Requirement: Lossless structured editing

Studio's Visual and Code style paths SHALL preserve comments, ordering, scalar
style, unknown fields, and untouched source ranges wherever the requested
operation does not require normalization.

#### Scenario: Edit one existing scalar

- **WHEN** a Visual control changes one existing stylesheet scalar
- **THEN** the candidate diff is limited to that scalar range
- **AND** unrelated comments, blank lines, rules, unknown keys, and ordering are
  byte-preserved

#### Scenario: Insert an object-specific rule

- **WHEN** an exact-ID rule or field must be inserted
- **THEN** Studio performs the smallest supported scoped YAML insertion
- **AND** retains all unrelated rule order and source formatting

#### Scenario: Require normalization

- **WHEN** an edit cannot preserve the source representation safely
- **THEN** Studio reports the proposed normalization and reason
- **AND** requires confirmation instead of silently rewriting the candidate

### Requirement: Complete color authoring controls

Every canonical color-valued style field SHALL expose a visual color picker and
an exact textual CSS-value editor from the same schema-driven field metadata.

#### Scenario: Edit a hex color

- **WHEN** an author changes a color through the visual well
- **THEN** Studio commits the selected `#RRGGBB` value
- **AND** the text field and preview update without an Apply step

#### Scenario: Preserve a complex CSS color

- **WHEN** a field contains RGB(A), a named color, or a CSS variable
- **THEN** the visual color control remains available
- **AND** Studio preserves the exact textual value until the author explicitly
  changes it
- **AND** validation reports invalid text without silently replacing it

#### Scenario: Cover all color metadata

- **WHEN** canonical style metadata adds a new field with `dataType: color`
- **THEN** Studio renders the shared color field automatically
- **AND** no feature-local color-control change is required

### Requirement: Dense Visual property workspace

Studio SHALL render Visual as a compact, MUI-native property workspace rather
than a stack of independent settings forms. The representation switch,
selection context, section structure, property controls, and candidate state
SHALL remain visually distinct without duplicating source navigation.

#### Scenario: Inspect a selected object at the default workspace width

- **WHEN** one styleable object is selected at the default quarter-width panel
- **THEN** Visual shows compact selection context, common topology facts, and at
  least eight common appearance fields in the first desktop viewport
- **AND** property names occupy a stable left column while controls align in a
  stable right column
- **AND** descriptions remain available through accessible help rather than
  permanently consuming a property row

#### Scenario: Navigate the flattened property hierarchy

- **WHEN** the author expands Topology or Appearance
- **THEN** Studio uses compact section headers and one property-body scrollbar
- **AND** does not nest an additional Advanced accordion around ID and position
- **AND** source access is an icon command in the Topology section header rather
  than a full-width `Edit topology YAML` button

#### Scenario: Browse common and less-common appearance fields

- **WHEN** Visual opens without a style search
- **THEN** Studio shows a bounded metadata-derived set of common scalar fields
- **AND** keeps nested and remaining fields behind `View more`
- **AND** searching discovers compatible fields regardless of their default
  visibility

#### Scenario: Show candidate actions only when relevant

- **WHEN** the candidate stylesheet is clean
- **THEN** the footer renders as a compact status strip
- **AND** Apply and Revert consume no visible layout space
- **WHEN** the candidate becomes dirty, invalid, or validating
- **THEN** the same footer reveals the applicable actions without moving the
  Visual/Code switch or selection context

### Requirement: Object-specific stylesheet authoring

New object-specific Visual edits SHALL use exact-ID stylesheet selectors. Studio
SHALL preserve the public inline topology style contract and SHALL NOT silently
migrate or weaken an existing inline winner.

#### Scenario: Style one object without an inline override

- **WHEN** an author changes a Visual field for one selected node, link, path,
  region, shape, callout, text object, or link direction
- **THEN** Studio creates or updates a compatible exact-ID stylesheet rule
- **AND** uses the existing selector grammar, such as
  `node[id = "router-1"]`
- **AND** does not modify `topology.yaml`

#### Scenario: Keep reusable selector authoring in Code

- **WHEN** an author is using Edit > Visual
- **THEN** Studio exposes controls only for the selected compatible objects
- **AND** does not expose selector construction, match preview, or YAML/source
  navigation actions
- **WHEN** the author needs a reusable selector rule
- **THEN** the author switches to Edit > Code and edits `stylesheet.yaml`

#### Scenario: Encounter an inline topology winner

- **WHEN** the selected field is won by an inline topology style
- **THEN** Visual shows one object-level inline-style notice
- **AND** does not claim an exact-ID stylesheet edit can override it
- **AND** offers one explicit `Move all` migration action without a source or
  YAML navigation action

#### Scenario: Move an inline override explicitly

- **WHEN** an author confirms moving supported inline fields to the stylesheet
- **THEN** one atomic undoable command creates or updates the exact-ID rule and
  removes only those inline fields
- **AND** unrelated topology, stylesheet comments, and values remain unchanged

### Requirement: Same-kind bulk style editing

Visual SHALL support multiple selected objects only when every selection has the
same compatible style target.

#### Scenario: Inspect mixed values

- **WHEN** selected objects of one target have different effective values
- **THEN** the applicable Visual field displays `Mixed`
- **AND** no source is mutated merely by inspecting it

#### Scenario: Apply one value to selected objects

- **WHEN** an author commits a Visual value for a same-kind selection
- **THEN** Studio creates or updates one exact-ID rule per selected object in one
  candidate transaction
- **AND** does not infer a reusable semantic selector

#### Scenario: Select incompatible object kinds

- **WHEN** a selection contains different style targets
- **THEN** Visual reports that bulk style editing is unavailable
- **AND** Code remains available

### Requirement: Contextual stylesheet YAML intelligence

The embedded stylesheet editor SHALL derive completion, accepted values, hover
documentation, and diagnostics from the cursor's YAML context and canonical
style metadata.

#### Scenario: Complete a style property

- **WHEN** the cursor is inside a rule's `style` mapping
- **THEN** Studio infers the target from that rule's selector
- **AND** suggests only compatible properties not already present in that mapping
- **AND** Ctrl+Space opens the same completion list

#### Scenario: Complete a style value

- **WHEN** the cursor is at a known enum, boolean, icon, color, number, or other
  constrained style value
- **THEN** Studio offers values and documentation compatible with that field
- **AND** icon completion uses the candidate project's icon registry

#### Scenario: Complete a selector

- **WHEN** the cursor is in a rule's selector value
- **THEN** Studio offers only the existing selector grammar and facts from the
  current topology
- **AND** does not introduce a new selector language

#### Scenario: Complete stylesheet document structure

- **WHEN** the cursor is at the stylesheet root or inside `layout`,
  `layout.clos`, `limits`, `icons`, `labelFields`, or a `toggles` item
- **THEN** Studio offers the fixed fields and constrained values defined by the
  installed stylesheet schema
- **AND** excludes fields already present in the current mapping
- **AND** custom icon IDs remain user-defined while their child fields are
  discoverable
- **AND** nested style contracts such as `nodeLayout.icon` and
  `nodeLayout.content` derive completion from canonical style metadata

#### Scenario: Discover with question mark

- **WHEN** an author types an unquoted standalone `?` in a recognized
  stylesheet-structure, style-key, or value position
- **THEN** Studio removes the helper token and opens the applicable completion
- **AND** question marks in comments, quoted strings, block scalars, and URLs
  remain unchanged

### Requirement: Identity-aware authoring metadata

Studio SHALL derive identity fields, alias selectors, validation, and assistance
from the canonical core contract.

#### Scenario: Suggest a visible alias selector

- **WHEN** a selected object has `labels.name: Client`
- **THEN** Studio suggests `node[labels.name = "Client"]` and previews all matches

#### Scenario: Keep topology code free of appearance

- **WHEN** an author requests a style change in Visual mode
- **THEN** Studio updates stylesheet source and leaves topology source unchanged

### Requirement: Project-source workspace ownership

Studio SHALL expose documents and project structure in a persistent source
navigator and SHALL use one shared Monaco workspace for all YAML documents.

#### Scenario: Switch source documents

- **WHEN** an author selects topology, stylesheet, or mapper in project source
- **THEN** the shared editor opens the actual project path and its current draft
  state
- **AND** file switching preserves selection, preview viewport, undo history,
  and valid uncommitted state

#### Scenario: Inspect document state

- **WHEN** topology or mapper has an invalid draft or stylesheet has a dirty or
  invalid candidate
- **THEN** the navigator and editor expose the correct state without conflating
  draft, candidate, applied, and saved semantics

#### Scenario: Navigate project structure

- **WHEN** a user navigates documents, assets, layers, or problems with pointer,
  keyboard, touch, or assistive technology
- **THEN** controls expose accessible tree/list semantics and visible selection
- **AND** browsing does not mutate YAML

### Requirement: Contextual Visual authoring

Studio SHALL keep Visual controls selection-driven in one preview-local drawer
and SHALL connect them to canonical topology, stylesheet, mapper, and viewport
owners.

#### Scenario: Edit object facts and appearance

- **WHEN** an author changes a supported topology or appearance field in
  Properties
- **THEN** topology facts commit through topology source
- **AND** appearance commits through the stylesheet candidate
- **AND** no persistent style leaks into topology source

#### Scenario: Read and edit compact generated fields

- **WHEN** Properties exposes an editable scalar, selectable value, or
  validation result
- **THEN** the MUI control owns one visible field label and its associated
  helper or error text
- **AND** Properties does not repeat the same field as a separate adjacent
  label-and-editor row
- **AND** keyboard, pointer, and assistive-technology users retain the same
  commit, reset, and validation behavior

#### Scenario: Filter appearance attributes consistently

- **WHEN** an author filters generated Appearance attributes
- **THEN** the search control uses the same labeled outlined MUI field
  presentation and gutter as adjacent property controls
- **AND** search, clear, Escape, and field-filtering behavior remain unchanged

#### Scenario: Edit mapper fields with the shared form contract

- **WHEN** Mapper exposes rule creation or generated scalar fields
- **THEN** editable MUI controls own their visible labels and associated helper
  or error text
- **AND** Mapper does not repeat those fields as detached label-and-editor rows
- **AND** boolean, color, reset, keyboard commit, validation, and source
  navigation behavior remain unchanged

#### Scenario: Reveal a Visual field in source

- **WHEN** an author invokes a source operation from Properties or Mapper
- **THEN** Studio opens the owning document and exact available range in the
  shared editor
- **AND** does not mount another Monaco instance in the drawer

#### Scenario: Browse Visual without mutating source

- **WHEN** an author opens Add, Properties, Mapper, View more, provenance, or an
  asset preview
- **THEN** Studio creates no YAML change until an explicit value or command is
  committed

### Requirement: Shared source and Visual synchronization

Studio SHALL keep the source editor and generated Visual controls synchronized
through the authoritative session and stylesheet candidate.

#### Scenario: Edit in Visual and inspect source

- **WHEN** an author commits a Visual topology, style, or mapper value
- **THEN** the owning source buffer reflects the same change
- **AND** source navigation can reveal the changed range

#### Scenario: Edit source and inspect Visual

- **WHEN** an author applies a valid source change represented by a generated
  Visual control
- **THEN** that control reflects the effective value
- **AND** source-only and unknown fields remain preserved

#### Scenario: Resolve an invalid source draft

- **WHEN** the active source document is invalid
- **THEN** incompatible Visual mutations are disabled with an explanation
- **AND** unrelated valid documents and preview operations remain available

### Requirement: Contextual YAML assistance command

Studio SHALL expose one context-help command backed by the canonical YAML
assist provider rather than a separate field registry or help model.

#### Scenario: Request help on a documented field

- **WHEN** the cursor is on a documented topology, stylesheet, or mapper field
  and the author invokes context help
- **THEN** Monaco shows the field documentation supplied by the existing hover
  contract
- **AND** editor focus remains in the active document

#### Scenario: Request help at an insertion point

- **WHEN** no documented field is active and the author invokes context help
- **THEN** Monaco shows completion compatible with the active document and
  cursor context
- **AND** does not suggest fields owned by an incompatible object or document

#### Scenario: Consume help in either Studio host

- **WHEN** Browser Studio or Desktop Studio invokes context help
- **THEN** both hosts use the same Studio editor and assist implementation
- **AND** neither host owns duplicate schema or completion metadata
