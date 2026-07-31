# core-package-contract Specification

## Purpose
TBD - created by archiving change stabilize-core-studio-boundaries. Update Purpose after archive.
## Requirements
### Requirement: Explicit Module Contract

The `topoviewer` package SHALL expose unambiguous runtime and declaration files
for every supported JavaScript entry point.

#### Scenario: ESM consumer resolves the renderer

- **WHEN** an ESM TypeScript consumer imports `topoviewer`
- **THEN** runtime JavaScript and matching ESM declarations SHALL resolve
- **AND** package lint and type-resolution checks SHALL report no module-kind ambiguity

#### Scenario: CommonJS consumer resolves supported entries

- **WHEN** a CommonJS consumer requires a supported JavaScript entry
- **THEN** the package SHALL resolve an explicit `.cjs` artifact and matching declarations
- **AND** the consumer SHALL NOT execute an ESM file through `require()`

#### Scenario: Browser embed remains a script contract

- **WHEN** a static host loads the documented browser embed
- **THEN** the IIFE SHALL register the documented browser global
- **AND** the host SHALL NOT require a Node module loader

### Requirement: Capability Entry Boundaries

The core package SHALL expose renderer, authoring, integration, security, and
static-export capabilities through explicit public entries with shared build
policy.

#### Scenario: Static export is not eager renderer work

- **WHEN** a consumer imports and renders `TopoViewer` without exporting an image
- **THEN** image and PDF implementation dependencies SHALL NOT execute in the renderer path
- **AND** existing root export functions SHALL remain source-compatible through lazy wrappers

#### Scenario: Export entry is consumed directly

- **WHEN** an application imports `topoviewer/export`
- **THEN** the documented image and PDF APIs and their declarations SHALL resolve

### Requirement: Lean Published Artifact

The npm artifact SHALL contain only runtime assets, schemas, licenses, package
metadata, and consumer documentation required to use the package.

#### Scenario: Documentation source is excluded

- **WHEN** `npm pack` inspects the core package
- **THEN** `content/pages` SHALL NOT be included
- **AND** package size and entry count SHALL remain within checked budgets

#### Scenario: Package README is canonical

- **WHEN** repository documentation is synchronized
- **THEN** the npm-facing README SHALL be generated or validated against the canonical README fragment
- **AND** examples SHALL use the current identity and stylesheet-ownership contracts

### Requirement: Packed Consumer Verification

Core compatibility SHALL be proven from the packed npm artifact rather than
only from workspace source resolution.

#### Scenario: Consumer fixture passes

- **WHEN** the package verification lane runs
- **THEN** ESM, CommonJS, SSR, TypeScript, CSS/schema, and minimal bundler fixtures SHALL pass

#### Scenario: Runtime matrix is enforced

- **WHEN** CI verifies documented Node and React compatibility
- **THEN** every supported combination SHALL install and execute the focused consumer fixture
- **AND** unsupported combinations SHALL not be advertised

### Requirement: Public Stability Tiers

The package SHALL document which entries are supported, advanced, browser-only,
or internal so that API-report enforcement matches consumer expectations.

#### Scenario: Consumer chooses an entry

- **WHEN** a consumer reviews the TypeScript API documentation
- **THEN** each public entry SHALL have an explicit stability classification
- **AND** unexported internal files SHALL not be documented as supported deep imports

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
