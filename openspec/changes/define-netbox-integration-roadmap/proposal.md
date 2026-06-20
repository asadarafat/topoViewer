## Why

NetBox is a likely source of truth for many TopoViewer users, but the project
does not yet have a NetBox adapter or plugin. Before the public docs say
"NetBox integration" in a roadmap, the scope needs to be precise: what is
feasible, what use cases are realistic, what the first integration shape should
be, and what must not be promised.

## What Changes

Define the NetBox integration roadmap as a standalone OpenSpec change:

- establish NetBox as a feasible inventory source, not supported today;
- prefer an external REST/GraphQL generator before a NetBox plugin;
- document inventory-driven topology use cases;
- document risks around operational state, physical-versus-logical topology,
  plugin lifecycle, and installation-specific mapping.

## Capabilities

### New Capabilities

- `netbox-integration-roadmap`: feasibility, use cases, first integration shape,
  risks, and public roadmap wording constraints for NetBox.

## Impact

- Public integration roadmap wording for NetBox.
- Future adapter design for NetBox-to-TopoViewer YAML generation.
- No renderer, schema, MkDocs, or package implementation in this change.

## Non-Goals

- Building a NetBox adapter.
- Building a NetBox plugin.
- Claiming NetBox integration is supported.
- Defining a universal NetBox object mapping for all installations.
