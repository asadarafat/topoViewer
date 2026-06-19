## ADDED Requirements

### Requirement: Canonical public style key casing

TopoViewer SHALL use `camelCase` as the canonical public casing for style keys across TypeScript APIs and Stylesheet YAML.

#### Scenario: TypeScript style objects use canonical keys

- **WHEN** a caller creates a TopoViewer document or stylesheet object in TypeScript
- **THEN** public examples, exported types, and supported style key documentation SHALL use `camelCase` style keys
- **AND** the TypeScript authoring model SHALL not require `kebab-case` keys

#### Scenario: Stylesheet YAML uses canonical keys

- **WHEN** a user authors a `stylesheet.yaml`
- **THEN** first-party docs and examples SHALL show `camelCase` style keys as the preferred form
- **AND** generated reference pages SHALL use `camelCase` in primary topology and stylesheet source examples

#### Scenario: Primary docs avoid mixed casing

- **WHEN** a style key table lists supported keys
- **THEN** the primary key column SHALL list canonical `camelCase` keys
- **AND** the table SHALL NOT list `kebab-case` alternatives
- **AND** docs SHALL NOT present aliases as supported TopoViewer authoring syntax

### Requirement: Non-canonical key rejection

TopoViewer SHALL reject non-canonical style keys instead of normalizing them silently.

#### Scenario: Kebab-case style keys are rejected

- **WHEN** a stylesheet or object style uses a `kebab-case` style key
- **THEN** validation or semantic lint SHALL report it as unsupported
- **AND** the renderer SHALL NOT rely on implicit kebab-to-camel normalization

#### Scenario: Foreign dialects translate before rendering

- **WHEN** an importer accepts Cytoscape, CSS-like, or other foreign style syntax
- **THEN** that importer SHALL translate foreign keys into canonical `camelCase` TopoViewer style keys before producing a TopoViewer document
- **AND** the renderer SHALL receive canonical TopoViewer style keys only

#### Scenario: Existing first-party examples are swept

- **WHEN** this change is implemented
- **THEN** first-party examples, docs, and fixtures SHALL be updated from kebab-case style keys to canonical `camelCase`
- **AND** no migration alias table SHALL be required for first-party examples

### Requirement: Examples and generated docs use canonical casing

TopoViewer SHALL keep first-party examples aligned with the canonical casing rule.

#### Scenario: Example style fixtures use camelCase

- **WHEN** example stylesheet fixtures are added or regenerated
- **THEN** style keys SHALL use `camelCase`

#### Scenario: No alias examples

- **WHEN** generated reference examples are published
- **THEN** they SHALL NOT demonstrate kebab-case style keys as accepted TopoViewer syntax

### Requirement: Active implementation plans use canonical casing

OpenSpec changes SHALL use canonical `camelCase` style keys in public examples and requirements.

#### Scenario: Node polygon points are canonical camelCase

- **WHEN** the declarative node shape plan documents custom polygon points
- **THEN** the canonical authoring key SHALL be `shapePolygonPoints`
- **AND** `shape-polygon-points` SHALL NOT be accepted as a TopoViewer style key

## MODIFIED Requirements

### Requirement: Stylesheet schema discoverability

TopoViewer SHALL make canonical style keys the only supported style-key completion surface.

#### Scenario: Schema descriptions list canonical keys only

- **WHEN** an editor or validator exposes stylesheet schema help
- **THEN** canonical `camelCase` keys SHALL be listed as the preferred keys
- **AND** kebab-case style keys SHALL NOT be listed as accepted alternatives
