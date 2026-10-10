---
hide:
  - toc
---

# Dense CLOS labels

Dense CLOS labels show the label-placement problem that appears in operational
fabric dashboards: region names, node names, endpoint ports, and bidirectional
bandwidth values all need space around the same set of links. The two rows have
enough separation to keep throughput labels out of the central crossing area.

The topology keeps one parent link per fabric adjacency. Physical port names
live on `sourceLabel` and `targetLabel`; bandwidth values live on
`directions.sourceToTarget.label` and `directions.targetToSource.label`. The
stylesheet assigns independent label z-index values and uses the shared
collision policy so labels can move without changing node or link geometry.

Raw node metadata and redundant relationship names stay in inspection so they
do not compete with operational names and values on the canvas. Port names
already identify each adjacency. Blue indicates leaf-to-spine traffic; teal
dashed strokes indicate spine-to-leaf traffic. Values are authored examples,
not live telemetry.

## Expected Result

Keep node names, endpoint ports, and bidirectional bandwidth values legible in a CLOS fabric.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `link` rule in stylesheet.yaml, set `sourceLabelYOffset` to `14`.
3. Reload. Source port labels shift away from their original placement; inspect the dense junctions for overlap.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 760px
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
