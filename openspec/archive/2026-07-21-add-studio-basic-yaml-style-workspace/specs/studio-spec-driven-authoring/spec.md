# Studio Style Authoring Delta

## ADDED Requirements

### Requirement: Unified Visual and Code Edit workspace

Studio SHALL expose one contextual `Edit` workspace with exactly `Visual` and
`Code` representations. The switch SHALL use segmented mode controls rather
than document-tab styling. The workspace SHALL combine topology-property and
appearance authoring in the UI while preserving topology, stylesheet, and
mapper YAML as independent source documents and ownership boundaries.

#### Scenario: Select an object

- **WHEN** an author selects a styleable object on the canvas
- **THEN** Studio opens `Edit > Visual`
- **AND** shows the object's topology fields and appearance controls in one
  scrollable workspace
- **AND** selecting empty canvas opens the Viewport workspace instead

#### Scenario: Edit in Visual and continue in Code

- **WHEN** an author changes a supported style field in Visual and switches to
  Code before applying it
- **THEN** the stylesheet editor shows the same candidate change
- **AND** switching modes does not change selection, pan, zoom, or viewport
- **AND** switching modes does not Apply or Revert the candidate

#### Scenario: Edit in Code and continue in Visual

- **WHEN** an author makes a valid stylesheet change to a Visual-compatible
  field and switches to Visual
- **THEN** the Visual control reflects the candidate effective value
- **AND** fields represented only in source remain preserved without being
  flattened into Visual controls

#### Scenario: Open Style without a selection

- **WHEN** no styleable object is selected
- **THEN** Visual shows an actionable empty state
- **AND** Code remains available for direct document authoring

#### Scenario: Switch project documents in Code

- **WHEN** an author opens `Edit > Code`
- **THEN** Studio uses file tabs labelled with the project's actual topology,
  stylesheet, and available mapper document paths
- **AND** reveals the selected object in topology source or its matching style
  rule in stylesheet source when available
- **AND** invalid YAML remains editable while the canvas keeps the last valid
  projection

#### Scenario: Keep source with its owning workflow

- **WHEN** an author needs topology or stylesheet YAML
- **THEN** Studio provides it through `Edit > Code`
- **WHEN** an author needs mapper YAML
- **THEN** Studio provides it through `Mapper > Code`
- **AND** Studio does not expose a second global source workspace
- **AND** a source-normalizing mutation uses a focused review dialog before it
  is committed

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

## MODIFIED Requirements

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
