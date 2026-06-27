---
hide:
  - toc
---

# Unsafe image validation

## What This Demonstrates

This fixture is intentionally invalid. It documents the security lint rule that rejects unsafe image references such as `javascript:` URLs.

## Expected Result

This fixture should not render as a normal topology. It should produce the documented validation behavior without hiding the diagnostic.

## What To Inspect

- Inspect the invalid or edge-case YAML and the expected diagnostic behavior.
- Use this example to understand what CI should reject.

## Use When

Use this pattern when documenting lint, schema, or invalid-input behavior.

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
