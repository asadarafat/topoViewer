# Regions

These examples document the regions behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Nested regions

Nested regions let broad domains contain narrower regions. In this case the AS region contains an IS-IS L1 region and the member routers.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/regions/nested-regions/topology.yaml
    stylesheet: ../../examples/regions/nested-regions/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Nested regions
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/nested-regions/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/nested-regions/stylesheet.yaml"
    ```

## Overlapping regions

Overlapping regions are important for network diagrams because some routers, such as ABRs, belong to two scopes at once. R05 is intentionally inside both IS-IS L1 and IS-IS L2.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/regions/overlapping-regions/topology.yaml
    stylesheet: ../../examples/regions/overlapping-regions/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Overlapping regions
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/overlapping-regions/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/overlapping-regions/stylesheet.yaml"
    ```

## Region label placement

Region label placement keeps small or single-node regions readable. Use `labelPosition` and `labelMargin` in region styles to anchor the label on a region edge, then use `headerPadding`, `paddingX`, or `paddingY` on the region when the label needs reserved interior space.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/regions/region-label-placement/topology.yaml
    stylesheet: ../../examples/regions/region-label-placement/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Region label placement
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/region-label-placement/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/region-label-placement/stylesheet.yaml"
    ```

## Draggable regions

Regions can be interactive hulls. Setting `draggable: true` and `selectable: true` in the stylesheet makes the region behave like an editable scope object.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/regions/draggable-regions/topology.yaml
    stylesheet: ../../examples/regions/draggable-regions/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Draggable regions
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/draggable-regions/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/regions/draggable-regions/stylesheet.yaml"
    ```
