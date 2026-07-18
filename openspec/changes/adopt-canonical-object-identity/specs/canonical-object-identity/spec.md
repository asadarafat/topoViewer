## ADDED Requirements

### Requirement: Canonical object identity

Every addressable topology and diagram object SHALL use one required unique
`id` as its canonical key and default rendered text.

#### Scenario: Render an object without an alias

- **WHEN** an object has `id: client-pe05` and no `labels.name`
- **THEN** every TopoViewer surface renders `client-pe05` as its object label

#### Scenario: Render a duplicated visible alias

- **WHEN** multiple objects have different IDs and `labels.name: Client`
- **THEN** each object retains its unique ID while rendering `Client`

### Requirement: Alias selectors

The selector engine and authoring metadata SHALL support `labels.name` like any
other scalar semantic label.

#### Scenario: Style objects sharing an alias

- **WHEN** a stylesheet uses `node[labels.name = "Client"]`
- **THEN** all matching nodes receive the rule and unrelated nodes do not

### Requirement: Atomic semantic ID rename

Changing an object ID SHALL update all known bundle references, validate the
final bundle once, and commit all affected source documents atomically.

#### Scenario: Rename a referenced node

- **WHEN** an author renames `client-a` to `client-b`
- **THEN** link endpoints, paths, regions, parents, diagram attachments,
  attention references, exact-ID selectors, and static mapper references point
  to `client-b` in one undoable transaction

#### Scenario: Reject an invalid rename

- **WHEN** the new ID is empty, already exists, or leaves an invalid final bundle
- **THEN** no source document is changed

#### Scenario: Preserve human content

- **WHEN** an ID changes and free text or `labels.name` contains the old value
- **THEN** that content remains unchanged unless it is a registered reference

### Requirement: Strict topology ownership

Canonical topology entity schemas SHALL reject persistent visual policy fields,
including generic `style`, `icon`, and callout leader style declarations.

#### Scenario: Reject inline object appearance

- **WHEN** a version `0.2` topology object contains `style` or `icon`
- **THEN** schema and runtime validation identify the exact object and field

#### Scenario: Preserve structural geometry

- **WHEN** an object contains position, size, rotation, pins, handles, or
  structural relationships allowed for its kind
- **THEN** those topology fields remain valid

### Requirement: Deterministic style precedence

Exact-ID stylesheet rules SHALL override semantic and kind rules regardless of
their source position, while equal-specificity rules preserve source order.

#### Scenario: Preserve an object override

- **WHEN** a broad rule follows an exact-ID rule in source order
- **THEN** the exact-ID values still win for the targeted object

### Requirement: Loss-aware legacy migration

TopoViewer SHALL provide a deterministic migration from version `0.1` or
unversioned documents into the canonical version `0.2` contract.

#### Scenario: Migrate legacy names and appearance

- **WHEN** a legacy object has `name`, generic `label`, `style`, or `icon`
- **THEN** migration creates `labels.name` and exact-ID stylesheet policy without
  changing the rendered result

#### Scenario: Report an alias conflict

- **WHEN** legacy `name` and `labels.name` contain different values
- **THEN** migration reports the conflict instead of silently discarding a value
