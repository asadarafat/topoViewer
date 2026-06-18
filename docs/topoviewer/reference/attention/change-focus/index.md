---
hide:
  - toc
---

# Change focus

Change focus is a declarative attention query for operational change. This small topology starts with attention already applied: `CORE-1` and the degraded `core-1-core-2` link changed after the selected timestamp, so they are highlighted while the unchanged objects remain visible but muted.

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
