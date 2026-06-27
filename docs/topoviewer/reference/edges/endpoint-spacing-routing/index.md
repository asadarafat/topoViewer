---
hide:
  - toc
---

# Endpoint spacing and routing

## What This Demonstrates

Endpoint spacing moves the visible line inward from node boundaries. Segment controls make manual bend points explicit, while taxi controls create deterministic right-angled routes without relying on automatic layout guesses.

## Expected Result

The live viewport should render "Endpoint spacing and routing" without blocking diagnostics. It should show: Endpoint spacing, segment controls, and taxi controls make edge routes explicit. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `2`.

## What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

## Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/edges/endpoint-spacing-routing/topology.yaml
    stylesheet: ../../../examples/edges/endpoint-spacing-routing/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Endpoint spacing and routing
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-spacing-routing/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-spacing-routing/stylesheet.yaml"
    ```
