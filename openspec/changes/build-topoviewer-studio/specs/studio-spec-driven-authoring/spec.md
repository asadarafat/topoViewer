## ADDED Requirements

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

Studio SHALL make every applicable public style field discoverable and editable
through Basic, Advanced, All, or reviewed raw-YAML fallback behavior.

#### Scenario: Inspect Basic fields

- **WHEN** an object is selected and Basic is active
- **THEN** Studio shows the task-oriented default fields compatible with that
  object
- **AND** omits low-frequency fields without making them unavailable

#### Scenario: Search all fields

- **WHEN** a user searches in All fields
- **THEN** Studio searches canonical names, labels, descriptions, groups, and
  aliases
- **AND** displays every compatible public field with its effective value

#### Scenario: Edit a nested contract

- **WHEN** a compatible nested style such as `nodeLayout` is selected
- **THEN** Studio renders its nested fields as one coherent group
- **AND** enforces parent conditions and value compatibility
- **AND** preserves unknown nested keys during unrelated edits

### Requirement: Customizable Basic and Advanced profiles

Users SHALL be able to promote, demote, hide, and reorder authoring fields
without changing the runtime schema or project bundle.

#### Scenario: Promote a field

- **WHEN** a user promotes an Advanced field to Basic
- **THEN** Studio stores a sparse versioned preference override
- **AND** the field appears in Basic for the applicable object kinds
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

#### Scenario: Use an unsupported future field

- **WHEN** imported YAML contains a field unknown to the installed Studio
  version
- **THEN** Studio preserves it
- **AND** identifies it as unsupported rather than deleting or silently
  coercing it

### Requirement: Effective style provenance

Studio SHALL explain how each effective style value was resolved and where an
edit will be written.

#### Scenario: Inspect an overridden value

- **WHEN** multiple defaults, selector rules, object values, or runtime states
  contribute to a field
- **THEN** the Inspector displays the winning value and source
- **AND** makes overridden contributors and source locations inspectable

#### Scenario: Edit a shared rule

- **WHEN** a user chooses to edit an existing selector rule
- **THEN** Studio previews the number and identities of affected objects
- **AND** writes to that rule only after the scope is clear

#### Scenario: Create an object-specific override

- **WHEN** a user deliberately chooses selected-object scope
- **THEN** Studio creates or updates the canonical object-specific representation
- **AND** does not imply the change updated a reusable policy

### Requirement: Lossless structured editing

Studio's structured editors SHALL preserve comments, ordering, scalar style,
unknown fields, and untouched source ranges wherever the requested operation
does not require normalization.

#### Scenario: Edit one known field

- **WHEN** a user changes one known field through the Inspector
- **THEN** unrelated comments, unknown keys, and ordering remain unchanged
- **AND** the source diff is limited to the intended edit and required syntax

#### Scenario: Require normalization

- **WHEN** an edit cannot preserve the source representation safely
- **THEN** Studio previews the normalization diff and reason
- **AND** requires confirmation before rewriting the affected scope

