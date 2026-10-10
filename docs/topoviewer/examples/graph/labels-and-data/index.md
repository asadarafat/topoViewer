---
hide:
  - toc
---

# Labels and data

`labels` are for classification and selector matching. `data` carries facts like metrics, delay, loopback, or counters that tools can inspect without making the visual stylesheet brittle.

## Expected Result

Classification lives in `labels`; operational values live in `data`.

## Try It

1. Copy the two YAML tabs into your own project.
2. In `graph.nodes.0` in topology.yaml, set `graph.nodes.0.labels.name` to `"Edge renamed"`.
3. Reload. The visible alias on PE1 changes; its stable ID, relationships, and memberships remain unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Labels and data
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/labels-and-data/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/labels-and-data/stylesheet.yaml"
    ```
