## ADDED Requirements

### Requirement: OpsMill Infrahub feasibility baseline

TopoViewer SHALL treat OpsMill Infrahub as a feasible graph-native integration
candidate, not as a currently supported integration.

Research anchors:

- [Infrahub overview](https://docs.infrahub.app/overview)
- [Infrahub GraphQL](https://docs.infrahub.app/development-resources/graphql/overview)
- [Infrahub Python SDK](https://docs.infrahub.app/python-sdk/introduction)
- [Infrahub branches](https://docs.infrahub.app/branches/overview)
- [Infrahub transformations](https://docs.infrahub.app/transformations/overview)
- [Infrahub artifacts](https://docs.infrahub.app/artifacts/overview)

#### Scenario: Infrahub roadmap status is accurate

- **WHEN** the public integration roadmap mentions OpsMill or Infrahub
- **THEN** it SHALL mark the integration as feasibility, planned, or
  exploratory unless a working adapter exists
- **AND** it SHALL NOT claim Infrahub integration is supported

#### Scenario: Infrahub feasibility is graph-native

- **WHEN** the roadmap explains why Infrahub integration is feasible
- **THEN** it SHALL frame Infrahub as a schema-driven graph source that maps
  naturally to TopoViewer nodes, links, regions, paths, and metadata
- **AND** it SHALL avoid assuming one fixed Infrahub schema

### Requirement: Infrahub first integration shape

TopoViewer SHALL prefer an in-platform OpsMill/Infrahub extension or artifact
workflow before any external export workflow.

#### Scenario: First Infrahub integration is scoped as an in-platform extension

- **WHEN** Infrahub integration work is planned
- **THEN** the first shape SHALL be:

```text
Infrahub extension/artifact workflow -> schema-aware mapping profile -> TopoViewer view or published artifact
```

- **AND** the integration SHALL fit Infrahub branches, transforms, artifacts,
  and schema-defined objects before treating standalone YAML export as the
  primary user workflow

#### Scenario: Infrahub mapping profiles are user-owned

- **WHEN** an Infrahub plugin, extension, or artifact workflow maps graph data
  into TopoViewer
- **THEN** the mapping SHALL be explicit and schema-aware
- **AND** it SHALL NOT hardcode a single vendor, service, or infrastructure
  schema into TopoViewer core

### Requirement: Infrahub use cases

TopoViewer SHALL document realistic Infrahub use cases before implementation.

#### Scenario: Intended-state topology views

- **WHEN** Infrahub use cases are documented
- **THEN** they SHALL include intended network topology generated from graph data
- **AND** they SHALL include in-platform preview or artifact publishing tied to
  Infrahub data
- **AND** they MAY include service dependency, ownership, and architecture
  documentation views

#### Scenario: Branch and diff views are explicit

- **WHEN** Infrahub roadmap wording mentions branches or comparison
- **THEN** it SHALL describe whether the target is active branch, proposed
  branch, or diff overlay
- **AND** it SHALL NOT imply branch-aware diagrams exist until a prototype
  proves the model

### Requirement: Infrahub risks and non-goals

TopoViewer SHALL make Infrahub integration risks explicit in the roadmap or
implementation plan.

#### Scenario: Flexible schemas are a known risk

- **WHEN** Infrahub integration is planned
- **THEN** schema flexibility SHALL be listed as a mapping risk
- **AND** the integration SHALL require mapping profiles or transforms rather
  than fixed object assumptions

#### Scenario: Artifact publishing is not assumed

- **WHEN** Infrahub artifacts or transforms are mentioned
- **THEN** the roadmap SHALL identify authentication, workspace, branch, and
  artifact publishing behavior as prototype questions
- **AND** it SHALL NOT imply OpsMill/Infrahub support is shipped until a working
  in-platform integration exists
