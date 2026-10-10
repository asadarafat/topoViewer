---
hide:
  - toc
---

# Parent link pipe

Parent links let an overlay relationship ride inside a carrier relationship. The service still connects child endpoints, but the visual lane follows the parent transport pipe. Parent links, their carrier links, and links styled as pipes remain independent from attention-based parallel-link grouping because they describe containment rather than parallel capacity.

## Expected Result

A child link can be visually carried inside a parent transport link.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `link[labels.link = "service"]` rule in stylesheet.yaml, set `lineWidth` to `12`.
3. Reload. The carried service lane becomes wider; it still follows its parent transport link.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Parent link pipe
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/parent-link-pipe/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/parent-link-pipe/stylesheet.yaml"
    ```
