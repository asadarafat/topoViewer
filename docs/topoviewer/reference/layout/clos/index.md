---
hide:
  - toc
---

# CLOS layout

CLOS layout infers staged placement from graph structure.

This example intentionally uses generic node names and directed links:

- no manual node positions are authored
- `source` -> `target` link direction defines the preferred root-to-leaf order
- no network-specific labels such as spine or leaf are required

If your topology already has explicit stages, use `layout.clos.stageKey` and
`stageOrder`. If the graph is not staged, use `force`; if placement must be
operator-approved, use `manual`.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/layout/clos/topology.yaml
    stylesheet: ../../../examples/layout/clos/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: CLOS layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/clos/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/clos/stylesheet.yaml"
    ```
