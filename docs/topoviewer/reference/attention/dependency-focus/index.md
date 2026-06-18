---
hide:
  - toc
---

# Dependency focus

Dependency focus uses directed links and path sequences as an adjacency graph. This example starts from `CORE-1`, walks two downstream hops, marks reached nodes as related, and leaves the links as dimmed context so the blast radius is visible without hiding the topology.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/attention/dependency-focus/topology.yaml
    stylesheet: ../../../examples/attention/dependency-focus/stylesheet.yaml
    height: 460px
    controls: true
    controlsOpen: false
    title: Dependency focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dependency-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dependency-focus/stylesheet.yaml"
    ```
