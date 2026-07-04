---
hide:
  - toc
---

# Dense CLOS labels

## What This Demonstrates

Dense CLOS labels show the label-placement problem that appears in operational
fabric dashboards: region names, node names, node metadata, endpoint port
labels, and bidirectional bandwidth values all want space around the same small
set of links.

The topology keeps one parent link per fabric adjacency. Physical port names
live on `sourceLabel` and `targetLabel`; bandwidth values live on
`directions.sourceToTarget.label` and `directions.targetToSource.label`. The
stylesheet assigns independent label z-index values and uses the shared
collision policy so labels can move without changing node or link geometry.

## Expected Result

The live viewport should render "Dense CLOS labels" without blocking diagnostics. It should show: Show region, node, metadata, endpoint port, and bidirectional bandwidth labels in one compact CLOS fabric. The test metadata expects `graphNodes`: `5`, `minVisibleEdges`: `6`.

## What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

## Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Dense CLOS labels
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/dense-clos-labels/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/dense-clos-labels/stylesheet.yaml"
    ```
