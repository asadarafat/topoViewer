# Styling

These examples document the styling behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Selector styling

### What This Demonstrates

Selector styling is the core authoring contract. Topology authors classify objects once; visual rules then match by kind, id, labels, or data.

### Expected Result

The live viewport should render "Selector styling" without blocking diagnostics. It should show: Selector rules classify objects by kind, id, labels, or data. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

### What To Inspect

- Inspect selector order and the style keys applied by each rule.
- Compare broad defaults with more specific label or data selectors.

### Use When

Use this pattern when building reusable visual rules from labels and data.

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

## Inline style override

### What This Demonstrates

Inline style is an escape hatch. Use it sparingly for one-off emphasis; reusable visual policy still belongs in the stylesheet.

### Expected Result

The live viewport should render "Inline style override" without blocking diagnostics. It should show: Inline `style` overrides are local escape hatches on individual objects. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

### What To Inspect

- Inspect selector order and the style keys applied by each rule.
- Compare broad defaults with more specific label or data selectors.

### Use When

Use this pattern when building reusable visual rules from labels and data.

=== "Live Viewport"

    ```topoviewer
    topology: inline-style-override/topology.yaml
    stylesheet: inline-style-override/stylesheet.yaml
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

### What This Demonstrates

Theme-aware examples should use CSS variables so the same diagram follows MkDocs Material light and dark mode without duplicating the topology.

### Expected Result

The live viewport should render "Light and dark theme variables" without blocking diagnostics. It should show: Theme-aware styles should use TopoViewer CSS variables. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

### What To Inspect

- Inspect selector order and the style keys applied by each rule.
- Compare broad defaults with more specific label or data selectors.

### Use When

Use this pattern when building reusable visual rules from labels and data.

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

### What This Demonstrates

Use `labelZIndex` when labels need their own draw order without moving the object body, edge line, or region hull. The region label, edge label, endpoint labels, and node labels in this example intentionally use separate label layers.

### Expected Result

The live viewport should render "Label z-index" without blocking diagnostics. It should show: Labels can draw in their own layer without changing object, edge, or region draw order. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`, `minRegions`: `1`.

### What To Inspect

- Inspect selector order and the style keys applied by each rule.
- Compare broad defaults with more specific label or data selectors.

### Use When

Use this pattern when building reusable visual rules from labels and data.

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
