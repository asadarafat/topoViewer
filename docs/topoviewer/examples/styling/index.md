# Styling

Explore styling behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Selector styling

Selector styling is the core authoring contract. Topology authors classify objects once; visual rules then match by kind, id, labels, or data.

### Expected Result

Selector rules classify objects by kind, id, labels, or data.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `node` rule in stylesheet.yaml, set `borderWidth` to `5`.
3. Reload. Only objects matched by this classification rule receive a thicker border.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: selectors/topology.yaml
    stylesheet: selectors/stylesheet.yaml
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

## Exact-ID style override

An exact-ID stylesheet rule customizes one object independently of broad
classification rules. Persistent appearance stays in stylesheet.yaml; topology
contains stable identity and relationships. Prefer role or label selectors for
reusable conventions, and reserve exact-ID rules for a deliberate exception.

### Expected Result

Exact-ID stylesheet rules customize one object while preserving shared defaults.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `node` rule in stylesheet.yaml, set `borderWidth` to `6`.
3. Reload. The exact-ID rule changes only its one matching object, independently of broad defaults.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: inline-style-override/topology.yaml
    stylesheet: inline-style-override/stylesheet.yaml
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

## Light and dark theme variables

Theme-aware examples should use CSS variables so the same diagram follows MkDocs Material light and dark mode without duplicating the topology.

### Expected Result

Theme-aware styles should use TopoViewer CSS variables.

### Try It

1. Copy the two YAML tabs into your own project.
2. In `graph.nodes.0` in topology.yaml, set `graph.nodes.0.labels.name` to `"Edge renamed"`.
3. Reload. The visible alias on PE1 changes; its stable ID, relationships, and memberships remain unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: theme-light-dark/topology.yaml
    stylesheet: theme-light-dark/stylesheet.yaml
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

## Label z-index

Use `labelZIndex` when labels need their own draw order without moving the object body, edge line, or region hull. The region label, edge label, endpoint labels, and node labels in this example intentionally use separate label layers.

### Expected Result

Labels can draw in their own layer without changing object, edge, or region draw order.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `region` rule in stylesheet.yaml, set `labelZIndex` to `100`.
3. Reload. The matching label moves above competing drawing layers without changing its object body order.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: label-z-index/topology.yaml
    stylesheet: label-z-index/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Label z-index
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/label-z-index/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/styling/label-z-index/stylesheet.yaml"
    ```
