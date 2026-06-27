---
hide:
  - toc
---

# Query primitives

## What This Demonstrates

Query primitives demonstrates the general focus query surface. The topology declares stable IDs, labels, nested data, and link media metadata; the MkDocs attention block focuses `CORE-1`, all access nodes, objects with critical severity or fanout 12, and the fiber link selected through a stylesheet-compatible selector.

## Expected Result

The live viewport should render "Query primitives" without blocking diagnostics. It should show: Focus by explicit IDs, labels, data fields, and stylesheet-compatible selectors. The test metadata expects `graphNodes`: `5`, `minVisibleEdges`: `4`.

## What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

## Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/attention/query-primitives/topology.yaml
    stylesheet: ../../../examples/attention/query-primitives/stylesheet.yaml
    height: 460px
    controls: true
    controlsOpen: false
    title: Query primitives
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/query-primitives/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/query-primitives/stylesheet.yaml"
    ```
