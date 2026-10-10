---
hide:
  - toc
---

# Exact-ID style override

An exact-ID stylesheet rule customizes one object independently of broad
classification rules. Persistent appearance stays in stylesheet.yaml; topology
contains stable identity and relationships. Prefer role or label selectors for
reusable conventions, and reserve exact-ID rules for a deliberate exception.

## Expected Result

Exact-ID stylesheet rules customize one object while preserving shared defaults.

## Try It

1. Copy the two YAML tabs into your own project.
2. In the `node` rule in stylesheet.yaml, set `borderWidth` to `6`.
3. Reload. The exact-ID rule changes only its one matching object, independently of broad defaults.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Exact-ID style override
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/inline-style-override/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/inline-style-override/stylesheet.yaml"
    ```
