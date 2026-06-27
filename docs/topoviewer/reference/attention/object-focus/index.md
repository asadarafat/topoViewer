---
hide:
  - toc
---

# Object focus

## What This Demonstrates

Object focus is the default interactive attention pattern. Click the Checkout flow path, a node, or a link in the live viewport; the selected object is highlighted while unrelated context stays visible but muted. Click empty viewport space to clear the focus and return to the normal topology view.

## Expected Result

The live viewport should render "Object focus" without blocking diagnostics. It should show: Click one topology object to highlight it while dimming the surrounding context. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `5`.

## What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

## Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/attention/object-focus/topology.yaml
    stylesheet: ../../../examples/attention/object-focus/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Object focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/object-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/object-focus/stylesheet.yaml"
    ```
