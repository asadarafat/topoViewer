## Design

### First integration shape

The first Infrahub integration should be a schema-aware export workflow:

```text
Infrahub GraphQL/Python SDK -> mapping profile -> TopoViewer topology.yaml
```

Future work may generate TopoViewer artifacts from Infrahub branches,
transformations, or artifact workflows.

### Roadmap language

Use "feasibility" or "planned" language until there is a working adapter. Do
not mark OpsMill/Infrahub as supported in public docs.

### Mapping principle

Infrahub schemas are flexible. Any future adapter needs explicit, user-owned
mapping profiles rather than fixed object assumptions.

### Key risk

Branch/diff diagrams need a precise comparison model before they can be
promised: active branch, proposed branch, or diff overlay.
