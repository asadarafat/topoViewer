# Layout

These examples document the layout behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Manual layout

Manual layout means the author supplies coordinates. This is the right mode for diagrams where placement carries meaning.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/layout/manual/topology.yaml
    stylesheet: ../../examples/layout/manual/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Manual layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/manual/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/manual/stylesheet.yaml"
    ```

## Force layout

Force layout is auto-layout assistance. It is useful when topology data exists but the author does not want to maintain coordinates by hand.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/layout/force/topology.yaml
    stylesheet: ../../examples/layout/force/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Force layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/force/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/force/stylesheet.yaml"
    ```
