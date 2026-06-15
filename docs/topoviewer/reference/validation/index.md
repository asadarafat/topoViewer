# Validation

These examples document the validation behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Broken reference validation

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

## Unsafe image validation

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

## Renderer limit validation

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
