## Design

### First integration shape

The first Infrahub integration should be an in-platform extension or artifact
workflow:

```text
Infrahub extension/artifact workflow -> schema-aware mapping profile -> TopoViewer view or published artifact
```

This keeps TopoViewer close to Infrahub branches, schema-defined objects,
transforms, and artifacts. Standalone YAML export can remain available, but it
should not be the primary integration shape.

### Roadmap language

Use "feasibility" or "planned" language until there is a working in-platform
integration. Do not mark OpsMill/Infrahub as supported in public docs.

### Mapping principle

Infrahub schemas are flexible. Any future plugin, extension, or artifact
workflow needs explicit, user-owned mapping profiles rather than fixed object
assumptions.

### Key risk

Branch/diff diagrams need a precise comparison model before they can be
promised: active branch, proposed branch, or diff overlay.

### In-platform risks

The prototype must prove where the integration lives in the OpsMill/Infrahub
workflow, how it authenticates, how it selects branches and schemas, and whether
TopoViewer output is rendered as an embedded view, artifact, or both.
