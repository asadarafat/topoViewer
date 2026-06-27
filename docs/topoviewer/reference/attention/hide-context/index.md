---
hide:
  - toc
---

# Hide context

## What This Demonstrates

Hide context mode is useful when context should be removed from the rendered view instead of muted. The topology marks two PE nodes with `labels.role: pe`; the attention query focuses that label and hides every non-matching node and link.

## Expected Result

The live viewport should render "Hide context" without blocking diagnostics. It should show: Use hide-context mode when the focused set should be isolated instead of dimmed. The test metadata expects `graphNodes`: `2`.

## What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

## Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/attention/hide-context/topology.yaml
    stylesheet: ../../../examples/attention/hide-context/stylesheet.yaml
    height: 440px
    controls: true
    controlsOpen: false
    title: Hide context
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/hide-context/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/hide-context/stylesheet.yaml"
    ```
