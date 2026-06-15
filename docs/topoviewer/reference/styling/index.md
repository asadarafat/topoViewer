# Styling

These examples document the styling behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Selector styling

Selector styling is the core authoring contract. Topology authors classify objects once; visual rules then match by kind, id, labels, or data.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/styling/selectors/topology.yaml
    stylesheet: ../../examples/styling/selectors/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Selector styling
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/selectors/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/selectors/stylesheet.yaml"
    ```

## Inline style override

Inline style is an escape hatch. Use it sparingly for one-off emphasis; reusable visual policy still belongs in the stylesheet.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/styling/inline-style-override/topology.yaml
    stylesheet: ../../examples/styling/inline-style-override/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Inline style override
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/inline-style-override/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/inline-style-override/stylesheet.yaml"
    ```

## Light and dark theme variables

Theme-aware examples should use CSS variables so the same diagram follows MkDocs Material light and dark mode without duplicating the topology.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/styling/theme-light-dark/topology.yaml
    stylesheet: ../../examples/styling/theme-light-dark/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Light and dark theme variables
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/theme-light-dark/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/theme-light-dark/stylesheet.yaml"
    ```
