## REMOVED Requirements

### Requirement: Workspace ownership rail

**Reason**: A permanent feature rail makes source one nested mode among
implementation categories and duplicates navigation that the project-source
tree can express directly.

**Migration**: Use the persistent project-source navigator for documents,
assets, layers, and problems. Use one preview-local contextual drawer for Add,
Properties, canvas settings, and Mapper Visual.

### Requirement: Unified Visual and Code Edit workspace

**Reason**: Embedding Code under Properties and Mapper creates multiple routes
to the same YAML and makes the portable bundle secondary.

**Migration**: Use one shared source editor for topology, stylesheet, and mapper
YAML. Keep Visual controls in the contextual drawer and connect every source
navigation action to that editor.

## ADDED Requirements

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
