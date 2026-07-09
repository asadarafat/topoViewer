# Workspace Integration Boundaries

## ADDED Requirements

### Requirement: Package Consumers Use Explicit Contracts

TopoViewer application adapters SHALL consume shared renderer behavior through
the `topoviewer` package entry point or documented package subpaths.

#### Scenario: Harness consumes shared viewport behavior

- **WHEN** the Harness renders shared viewport settings or helper-line behavior
- **THEN** its source imports renderer capabilities from `topoviewer`
- **AND** it imports shared host-integration helpers from
  `topoviewer/integration`
- **AND** it imports renderer CSS from `topoviewer/style.css`
- **AND** it does not import files under `packages/topoviewer/src/**` directly

### Requirement: Dependency Direction Is Enforced

Repository linting SHALL fail when one application package imports another
package's private source tree.

#### Scenario: Direct source import is introduced

- **WHEN** VS Code/Harness or Grafana source imports
  `packages/topoviewer/src/**` directly
- **THEN** the dependency boundary check fails with an actionable rule name

#### Scenario: Public package import is used

- **WHEN** an adapter imports an exported value or type from `topoviewer`
- **THEN** dependency validation accepts the import

### Requirement: External Labs Remain Artifact Consumers

TopoViewer runtime code SHALL NOT depend on an external lab checkout.

#### Scenario: Upstream telemetry lab consumes TopoViewer

- **WHEN** an upstream-candidate lab adds the TopoViewer panel
- **THEN** it consumes a built plugin artifact and mounted YAML bundle
- **AND** no external checkout path is embedded in TopoViewer application code

### Requirement: Architecture Documentation Matches The Repository

Maintainer documentation SHALL describe the core renderer, VS Code/Harness,
MkDocs plugin, Grafana panel, and Containerlab lab with explicit ownership and
runtime boundaries.

#### Scenario: Maintainer evaluates a change

- **WHEN** a maintainer reads the architecture and monorepo pages
- **THEN** the owning package and allowed dependency direction are explicit
- **AND** production security responsibilities are separated from lab defaults
