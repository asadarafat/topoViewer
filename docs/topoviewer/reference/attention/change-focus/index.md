---
hide:
  - toc
---

# Change focus

## What This Demonstrates

Change focus is a declarative attention query for operational change. This small topology starts with attention already applied: `CORE-1` and the degraded `core-1-core-2` link changed after the selected timestamp, so they are highlighted while the unchanged objects remain visible but muted.

## Expected Result

The live viewport should render "Change focus" without blocking diagnostics. It should show: Focus objects with recent change metadata while preserving topology context. The test metadata expects `graphNodes`: `5`, `minVisibleEdges`: `5`.

## What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

## Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/attention/change-focus/topology.yaml
    stylesheet: ../../../examples/attention/change-focus/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Change focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/change-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/change-focus/stylesheet.yaml"
    ```
