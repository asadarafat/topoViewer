## ADDED Requirements

### Requirement: TVDS-aligned public core exports

The package root SHALL export safe compilation, accessibility descriptions,
theme tokens, status normalization and legend data, viewport reduction,
interaction presets, and layout-provider APIs with ESM, CJS, and declaration
compatibility.

#### Scenario: Consume new APIs from a packed package

- **WHEN** an ESM or CommonJS fixture installs the packed package
- **THEN** every documented TVDS-aligned API resolves from the package root
- **AND** TypeScript resolves the corresponding declarations

#### Scenario: Preserve current consumers

- **WHEN** an existing consumer uses `compileTopoGraph`, `TopoViewer`, manual,
  force, or CLOS layout, or imports the package stylesheet
- **THEN** it continues to build and run without a source migration

### Requirement: Additive tree layout schema

The published topology schema and runtime validator SHALL accept `tree` layout
with the same option names and constraints as the public TypeScript contract.

#### Scenario: Validate tree layout YAML

- **WHEN** a topology declares supported tree direction and spacing values
- **THEN** JSON Schema validation and runtime validation both accept it

#### Scenario: Reject invalid tree options

- **WHEN** a topology declares an unsupported direction or invalid spacing
- **THEN** schema and runtime validation reject the same field

### Requirement: Package-owned theme validation

The package gate SHALL validate that core renderer CSS uses approved theme
tokens and that packed CSS contains both light and dark token definitions.

#### Scenario: Run package validation

- **WHEN** local or remote package CI executes
- **THEN** the theme-ownership check runs before packing
- **AND** failure identifies the file and unowned literal
