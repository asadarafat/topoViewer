---
hide:
  - toc
---

# Edge curve styles

## What This Demonstrates

Curve styles are presentation choices. The graph still says A connects to B/C/D/E; the stylesheet controls whether that relationship renders as straight, taxi, smooth-taxi, or unbundled-bezier.

## Expected Result

The live viewport should render "Edge curve styles" without blocking diagnostics. It should show: Different `curveStyle` values produce different edge routing models. The test metadata expects `graphNodes`: `5`, `minVisibleEdges`: `4`.

## What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

## Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/edges/curve-styles/topology.yaml
    stylesheet: ../../../examples/edges/curve-styles/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Edge curve styles
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/curve-styles/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/curve-styles/stylesheet.yaml"
    ```
