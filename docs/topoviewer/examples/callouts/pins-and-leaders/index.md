---
hide:
  - toc
---

# Pins and leaders

Pins give leaders exact attachment points. This matters when a diagram has bars, ports, SAPs, or physical slots where center-point attachment is misleading.

The SAP `service` pin faces PE1’s `west` pin. The access line approaches that
facing edge, while the note sits above it; neither leader crosses the router.
SAP means service access point.

## Expected Result

Leaders can attach to named pins instead of object centers.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `callout` rule in stylesheet.yaml, set `lineWidth` to `3`.
3. Reload. The leader becomes wider; its named pin attachment remains on the same object.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Pins and leaders
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/pins-and-leaders/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/callouts/pins-and-leaders/stylesheet.yaml"
    ```
