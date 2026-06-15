---
hide:
  - toc
---

# Renderer limit validation

This fixture is intentionally invalid. It documents renderer limit enforcement before a diagram can overload the browser or a documentation build.

=== "Live Viewport"

    !!! warning "Non-renderable validation fixture"
        This test case intentionally violates semantic validation. It is documented so the linter behavior is testable and stable.

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/validation/limit-exceeded/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/validation/limit-exceeded/stylesheet.yaml"
    ```
