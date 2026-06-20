## Design

### First integration shape

The first VS Code integration should be an authoring extension:

```text
topology.yaml + stylesheet.yaml -> schema validation + semantic lint -> live preview webview
```

The extension should reuse the current TopoViewer schemas, semantic lint, and
browser renderer where practical.

### Roadmap language

Use "planned" or "feasibility" language until an extension package exists. Do
not mark VS Code as supported in public docs.

### Authoring boundary

VS Code should be the authoring experience, not a production runtime surface.

### Key risk

Webview CSP, local resource loading, renderer asset packaging, workspace trust,
and multi-file topology/stylesheet pairing must be solved before implementation.
