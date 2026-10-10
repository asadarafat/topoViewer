---
hide:
  - toc
---

# Selector styling

Selector styling is the core authoring contract. Topology authors classify objects once; visual rules then match by kind, id, labels, or data.

## Expected Result

Selector rules classify objects by kind, id, labels, or data.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `node` rule in stylesheet.yaml, set `borderWidth` to `5`.
3. Reload. Only objects matched by this classification rule receive a thicker border.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Selector styling
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/selectors/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/selectors/stylesheet.yaml"
    ```
