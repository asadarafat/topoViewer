## ADDED Requirements

### Requirement: NetBox feasibility baseline

TopoViewer SHALL treat NetBox as a feasible inventory source integration, not as
a currently supported integration.

Research anchors:

- [NetBox REST API](https://netboxlabs.com/docs/netbox/integrations/rest-api/)
- [NetBox GraphQL API](https://netboxlabs.com/docs/netbox/integrations/graphql-api/)
- [NetBox plugins](https://netboxlabs.com/docs/netbox/plugins/)

#### Scenario: NetBox roadmap status is accurate

- **WHEN** the public integration roadmap mentions NetBox
- **THEN** it SHALL mark NetBox as feasibility, planned, or exploratory
  unless a working adapter or plugin exists
- **AND** it SHALL NOT claim NetBox integration is supported

#### Scenario: NetBox feasibility is grounded in available APIs

- **WHEN** the roadmap explains why NetBox integration is feasible
- **THEN** it SHALL reference NetBox REST or GraphQL as the likely data access
  path
- **AND** it SHALL frame plugin embedding as a later, higher-maintenance option

### Requirement: NetBox first integration shape

TopoViewer SHALL prefer an external NetBox generator or adapter before a NetBox
plugin.

#### Scenario: First NetBox integration is scoped as a generator

- **WHEN** NetBox integration work is planned
- **THEN** the first shape SHALL be:

```text
NetBox REST/GraphQL -> mapping profile -> TopoViewer topology.yaml + stylesheet.yaml
```

- **AND** the integration SHALL prove topology mapping before committing to
  NetBox plugin packaging

#### Scenario: NetBox mapping profiles are explicit

- **WHEN** a NetBox adapter maps data into TopoViewer
- **THEN** the mapping SHALL allow installation-specific roles, tags, custom
  fields, tenants, circuits, devices, interfaces, and cables
- **AND** the adapter SHALL NOT assume one universal NetBox object taxonomy

### Requirement: NetBox use cases

TopoViewer SHALL document realistic NetBox use cases before implementation.

#### Scenario: Inventory-driven diagrams

- **WHEN** NetBox use cases are documented
- **THEN** they SHALL include site, rack, device, interface, cable, and circuit
  topology diagrams
- **AND** they MAY include MkDocs documentation generation from NetBox snapshots

#### Scenario: Operational overlays require additional data

- **WHEN** NetBox use cases mention BGP status, service paths, alarms, traffic,
  failures, or maintenance state
- **THEN** the roadmap SHALL state that NetBox inventory alone may be
  insufficient
- **AND** additional operational data sources MAY be required

### Requirement: NetBox risks and non-goals

TopoViewer SHALL make NetBox integration risks explicit in the roadmap or
implementation plan.

#### Scenario: NetBox physical and logical topology are separated

- **WHEN** NetBox topology import is described
- **THEN** physical cabling SHALL NOT be presented as automatically equivalent
  to logical routing, BGP, service, or dependency topology

#### Scenario: NetBox plugin is not promised prematurely

- **WHEN** NetBox plugin embedding is mentioned
- **THEN** the roadmap SHALL identify version compatibility, permissions, UI
  integration, and deployment lifecycle as unresolved risks
