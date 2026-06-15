---
hide:
  - toc
---

# Unsafe image validation

This fixture is intentionally invalid. It documents the security lint rule that rejects unsafe image references such as `javascript:` URLs.

=== "Live Viewport"

    !!! warning "Non-renderable validation fixture"
        This test case intentionally violates semantic validation. It is documented so the linter behavior is testable and stable.

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/validation/unsafe-image/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/validation/unsafe-image/stylesheet.yaml"
    ```
