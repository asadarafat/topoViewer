# Studio Style Authoring Delta

## ADDED Requirements

### Requirement: Basic and YAML style workspace

Studio SHALL expose exactly `Basic` and `YAML` modes inside the Style workspace.
Both modes SHALL edit one candidate `stylesheet.yaml` source and SHALL NOT keep
an independent Basic style model.

#### Scenario: Edit in Basic and continue in YAML

- **WHEN** an author changes a supported style field in Basic and switches to
  YAML before applying it
- **THEN** the YAML editor shows the same candidate change
- **AND** switching modes does not change selection, pan, zoom, or viewport
- **AND** switching modes does not Apply or Revert the candidate

#### Scenario: Edit in YAML and continue in Basic

- **WHEN** an author makes a valid YAML change to a Basic-compatible field and
  switches to Basic
- **THEN** the Basic control reflects the candidate effective value
- **AND** fields represented by advanced YAML remain preserved without being
  flattened into Basic controls

#### Scenario: Open Style without a selection

- **WHEN** no styleable object is selected
- **THEN** Basic shows an actionable empty state
- **AND** YAML remains available for direct stylesheet authoring

### Requirement: Object-specific stylesheet authoring

New object-specific Basic edits SHALL use exact-ID stylesheet selectors. Studio
SHALL preserve the public inline topology style contract and SHALL NOT silently
migrate or weaken an existing inline winner.

#### Scenario: Style one object without an inline override

- **WHEN** an author changes a Basic field for one selected node, link, path,
  region, shape, callout, text object, or link direction
- **THEN** Studio creates or updates a compatible exact-ID stylesheet rule
- **AND** uses the existing selector grammar, such as
  `node[id = "router-1"]`
- **AND** does not modify `topology.yaml`

#### Scenario: Encounter an inline topology winner

- **WHEN** the selected field is won by an inline topology style
- **THEN** Basic identifies that inline source
- **AND** does not claim an exact-ID stylesheet edit can override it
- **AND** offers source navigation or an explicit migration action

#### Scenario: Move an inline override explicitly

- **WHEN** an author confirms moving supported inline fields to the stylesheet
- **THEN** one atomic undoable command creates or updates the exact-ID rule and
  removes only those inline fields
- **AND** unrelated topology, stylesheet comments, and values remain unchanged

### Requirement: Same-kind bulk style editing

Basic SHALL support multiple selected objects only when every selection has the
same compatible style target.

#### Scenario: Inspect mixed values

- **WHEN** selected objects of one target have different effective values
- **THEN** the applicable Basic field displays `Mixed`
- **AND** no source is mutated merely by inspecting it

#### Scenario: Apply one value to selected objects

- **WHEN** an author commits a Basic value for a same-kind selection
- **THEN** Studio creates or updates one exact-ID rule per selected object in one
  candidate transaction
- **AND** does not infer a reusable semantic selector

#### Scenario: Select incompatible object kinds

- **WHEN** a selection contains different style targets
- **THEN** Basic reports that bulk style editing is unavailable
- **AND** YAML remains available

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

#### Scenario: Discover with question mark

- **WHEN** an author types an unquoted standalone `?` in a recognized style key
  or value position
- **THEN** Studio removes the helper token and opens the applicable completion
- **AND** question marks in comments, quoted strings, block scalars, and URLs
  remain unchanged

## MODIFIED Requirements

### Requirement: Complete generated style controls

Studio SHALL make common applicable style fields editable in Basic and SHALL
make every public style field discoverable through YAML completion, hover,
diagnostics, source navigation, or a reviewed specialized Basic editor.

#### Scenario: Inspect common fields

- **WHEN** one compatible object or same-kind selection is active
- **THEN** Basic shows grouped, task-oriented controls derived from canonical
  metadata
- **AND** uses human-readable labels while keeping raw property names searchable
- **AND** omits incompatible and low-frequency fields

#### Scenario: Search common fields

- **WHEN** an author searches Basic fields
- **THEN** Studio searches Basic-compatible labels, canonical names,
  descriptions, groups, and aliases
- **AND** does not reveal advanced-only fields in Basic

#### Scenario: Edit a nested contract

- **WHEN** a compatible nested style such as `nodeLayout` is selected
- **THEN** Studio renders its supported nested fields as one coherent group
- **AND** enforces parent conditions and value compatibility
- **AND** preserves unknown nested keys during unrelated edits

#### Scenario: Reach a less-common field

- **WHEN** a field is not available in Basic
- **THEN** YAML completion and hover make the compatible public field
  discoverable
- **AND** Studio does not require a duplicate UI metadata list

### Requirement: Effective style provenance

Studio SHALL explain how each effective candidate style value was resolved and
where an edit will be written.

#### Scenario: Inspect an inherited value

- **WHEN** defaults or one or more matching stylesheet rules contribute to a
  Basic field
- **THEN** Studio displays the effective value and winning source
- **AND** source navigation reveals the exact rule/property when available

#### Scenario: Inspect an overridden value

- **WHEN** inline or runtime state overrides a candidate stylesheet value
- **THEN** Studio reports the final winner without presenting the losing value as
  active
- **AND** preserves inspectable contributor order

#### Scenario: Remove an object-specific stylesheet value

- **WHEN** an author resets a Basic value written by Studio
- **THEN** Studio removes only that value from the exact-ID rule
- **AND** removes the rule if its style mapping becomes empty
- **AND** reveals the next inherited effective value

### Requirement: Lossless structured editing

Studio's Basic and YAML style paths SHALL preserve comments, ordering, scalar
style, unknown fields, and untouched source ranges wherever the requested
operation does not require normalization.

#### Scenario: Edit one existing scalar

- **WHEN** a Basic control changes one existing stylesheet scalar
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

## REMOVED Requirements

### Requirement: Attribute-first style cascade authoring

**Reason**: The active parent OpenSpec still describes a three-column
`Default | Rule | This object` matrix, but baseline `f8071f9` no longer implements
that UI. The stale requirement also conflicts with the simpler Basic/YAML
workflow and stylesheet-only default editing boundary.

**Migration**: Basic exposes common selected-object controls backed by exact-ID
stylesheet rules. YAML exposes the complete ordered stylesheet and reusable
selector rules. Existing inline styles remain supported through provenance and
explicit migration.
