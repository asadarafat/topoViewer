# Regions

These examples document the regions behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Nested regions

### What This Demonstrates

Nested regions let broad domains contain narrower regions. In this case the AS region contains an IS-IS L1 region and the member routers.

### Expected Result

The live viewport should render "Nested regions" without blocking diagnostics. It should show: Regions can be nested so broad domains contain smaller domains. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `1`, `minRegions`: `2`.

### What To Inspect

- Inspect `graph.regions` membership and label placement.
- Check padding and region style keys that prevent overlap with member nodes.

### Use When

Use this pattern when grouping nodes into sites, racks, pods, domains, or ownership boundaries.

=== "Live Viewport"

    ```topoviewer
    topology: nested-regions/topology.yaml
    stylesheet: nested-regions/stylesheet.yaml
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

### What This Demonstrates

Overlapping regions are important for network diagrams because some routers, such as ABRs, belong to two scopes at once. R05 is intentionally inside both IS-IS L1 and IS-IS L2.

### Expected Result

The live viewport should render "Overlapping regions" without blocking diagnostics. It should show: A shared node can be a member of multiple regions. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `1`, `minRegions`: `3`.

### What To Inspect

- Inspect `graph.regions` membership and label placement.
- Check padding and region style keys that prevent overlap with member nodes.

### Use When

Use this pattern when grouping nodes into sites, racks, pods, domains, or ownership boundaries.

=== "Live Viewport"

    ```topoviewer
    topology: overlapping-regions/topology.yaml
    stylesheet: overlapping-regions/stylesheet.yaml
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

### What This Demonstrates

Region label placement keeps small or single-node regions readable. Use `labelPosition` and `labelMargin` in region styles to anchor the label on a region edge, then set `headerPadding`, `paddingX`, or `paddingY` in the same region stylesheet rule when an auto-fit hull needs reserved interior space.

### Expected Result

The live viewport should render "Region label placement" without blocking diagnostics. It should show: Region labels can be anchored around the hull with an explicit margin. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`, `minRegions`: `2`.

### What To Inspect

- Inspect `graph.regions` membership and label placement.
- Check padding and region style keys that prevent overlap with member nodes.

### Use When

Use this pattern when grouping nodes into sites, racks, pods, domains, or ownership boundaries.

=== "Live Viewport"

    ```topoviewer
    topology: region-label-placement/topology.yaml
    stylesheet: region-label-placement/stylesheet.yaml
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

### What This Demonstrates

Regions can be interactive hulls. Setting `draggable: true` and `selectable: true` in the stylesheet makes the region behave like an editable scope object.

### Expected Result

The live viewport should render "Draggable regions" without blocking diagnostics. It should show: Regions can be selectable and draggable hulls. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`, `minRegions`: `1`.

### What To Inspect

- Inspect `graph.regions` membership and label placement.
- Check padding and region style keys that prevent overlap with member nodes.

### Use When

Use this pattern when grouping nodes into sites, racks, pods, domains, or ownership boundaries.

=== "Live Viewport"

    ```topoviewer
    topology: draggable-regions/topology.yaml
    stylesheet: draggable-regions/stylesheet.yaml
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
