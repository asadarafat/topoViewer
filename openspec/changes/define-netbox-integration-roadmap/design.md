## Design

### First integration shape

The first NetBox integration should be an external generator:

```text
NetBox REST/GraphQL -> mapping profile -> TopoViewer topology.yaml + stylesheet.yaml
```

This keeps TopoViewer independent from NetBox plugin packaging while proving the
mapping value.

### Roadmap language

Use "feasibility" or "planned" language until there is a working adapter. Do
not mark NetBox as supported in public docs.

### Mapping principle

NetBox installations vary. Any future adapter needs mapping profiles for roles,
tags, tenants, custom fields, circuits, devices, interfaces, and cables.

### Key risk

NetBox inventory alone does not necessarily contain operational state such as
BGP health, service path state, alarms, traffic, or failures.
