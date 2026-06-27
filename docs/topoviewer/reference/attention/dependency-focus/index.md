---
hide:
  - toc
---

# Dependency focus

## What This Demonstrates

Dependency focus uses directed links and path sequences as an adjacency graph. This example starts from `CORE-1`, walks two downstream hops, marks reached nodes as related, and leaves the links as dimmed context so the blast radius is visible without hiding the topology.

## Expected Result

The live viewport should render "Dependency focus" without blocking diagnostics. It should show: Traverse directed topology relationships to show downstream blast radius. The test metadata expects `graphNodes`: `5`, `minVisibleEdges`: `4`.

## What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

## Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/attention/dependency-focus/topology.yaml
    stylesheet: ../../../examples/attention/dependency-focus/stylesheet.yaml
    height: 460px
    controls: true
    controlsOpen: false
    title: Dependency focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dependency-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dependency-focus/stylesheet.yaml"
    ```
