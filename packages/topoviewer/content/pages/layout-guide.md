# Layout Guide

TopoViewer supports manual layouts and layout directives. The layout engine
calculates positions only; rendering remains the job of the viewer.

## Manual Layout

Use manual layout when the diagram is curated and positions are part of the
published artifact.

```yaml
layout:
  mode: manual
  width: 860
  height: 420
graph:
  nodes:
    - id: Spine-1
      position: [260, 80]
```

Manual layout is the safest choice for product screenshots, small examples, and
network diagrams that need exact placement.

## Generic CLOS Layout

Use generic CLOS layout when the graph is layered and dense. The algorithm is
not data-center-specific: it infers stages from connectivity and can use
explicit labels only as an override.

```yaml
layout:
  mode: clos
  width: 1200
  height: 720
  maxStages: 10
  stageGap: 180
  nodeGap: 96
```

Inference prefers graph structure over names. A lower-link-count edge stage can
be treated as a root when the graph shape supports that interpretation. Explicit
`inferLabelRole` mappings are optional and should be reserved for cases where
topology facts are more accurate than connectivity.

## Pinned Nodes

Pinned nodes preserve author intent while the rest of the graph can be laid out:

```yaml
layout:
  mode: clos
  preservePinned: true
  pinnedNodeIds:
    - WAN
```

Use pinned nodes for clouds, legends, external systems, or manually positioned
service endpoints.

## Diagnostics

Layout diagnostics should be visible when:

- inferred stages have low confidence;
- explicit stage hints conflict;
- the graph needs more stages than `maxStages`;
- shape dimensions conflict with shape rules;
- pinned nodes prevent a clean layout.

## Next Steps

- [Layout examples](reference/layout/index.md): rendered CLOS and manual layout cases.
- [Debug rendering](debugging.md): diagnose overlap, label, edge attachment, and layout issues.
- [Stylesheet](stylesheet.md): validate shape dimensions and visual defaults.
