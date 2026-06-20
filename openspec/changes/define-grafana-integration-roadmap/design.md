## Design

### First integration shape

The first Grafana integration should be a small panel-plugin spike:

```text
Grafana data frames / JSON model -> TopoViewer props -> operational topology panel
```

The spike must answer data shape, refresh, variables, panel options, state
overlay, and rendering performance questions before a public support claim.

### Roadmap language

Use "exploratory" until the data-frame and plugin spike passes. Do not mark
Grafana as supported in public docs.

### Product boundary

Grafana should be a dashboard consumption surface, not the main topology
authoring environment.

### Key risk

Plugin signing, dashboard lifecycle, security/CSP behavior, and large-topology
performance are release gates.
