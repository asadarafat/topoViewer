---
hide:
  - toc
---

# Broken reference validation

This fixture is intentionally invalid. It documents the semantic linter behavior for links that point at missing node IDs.

=== "Live Viewport"

    !!! warning "Non-renderable validation fixture"
        This test case intentionally violates semantic validation. It is documented so the linter behavior is testable and stable.

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/validation/broken-reference/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/validation/broken-reference/stylesheet.yaml"
    ```
