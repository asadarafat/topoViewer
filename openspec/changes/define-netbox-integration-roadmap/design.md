## Design

### First integration shape

The first NetBox integration should be an in-platform NetBox plugin:

```text
NetBox plugin -> NetBox models/API -> mapping profile -> embedded TopoViewer view + optional YAML export
```

This makes TopoViewer useful where NetBox users already review inventory. The
plugin can still expose YAML export for documentation workflows, but the primary
interaction should be inside NetBox.

### Roadmap language

Use "feasibility" or "planned" language until there is a working plugin. Do not
mark NetBox as supported in public docs.

### Mapping principle

NetBox installations vary. Any future plugin needs mapping profiles for roles,
tags, tenants, custom fields, circuits, devices, interfaces, and cables.

### Key risk

NetBox inventory alone does not necessarily contain operational state such as
BGP health, service path state, alarms, traffic, or failures.

### Plugin risks

The plugin direction must account for NetBox version compatibility, permission
models, UI extension points, deployment lifecycle, and upgrades. Those risks do
not change the desired first integration shape; they define what the prototype
must prove.
