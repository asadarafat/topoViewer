# Edges

These examples document the edges behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Edge curve styles

Curve styles are presentation choices. The graph still says A connects to B/C/D/E; the stylesheet controls whether that relationship renders as straight, taxi, smooth-taxi, or unbundled-bezier.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/edges/curve-styles/topology.yaml
    stylesheet: ../../examples/edges/curve-styles/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Edge curve styles
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/curve-styles/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/curve-styles/stylesheet.yaml"
    ```

## Arrows, dashes, and labels

Arrows, dashes, and labels are edge styling. The request and reply links use opposite directions, so the endpoint labels make it clear that `sourceLabel` follows the edge source and `targetLabel` follows the edge target. The x/y offsets pull the labels away from the node icons.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/edges/arrows-dashes-labels/topology.yaml
    stylesheet: ../../examples/edges/arrows-dashes-labels/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Arrows, dashes, and labels
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/arrows-dashes-labels/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/arrows-dashes-labels/stylesheet.yaml"
    ```

## Floating anchors

Floating anchors are the default edge behavior. The renderer computes a boundary attachment point from the node geometry so the line does not terminate at the node center.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/edges/floating-anchors/topology.yaml
    stylesheet: ../../examples/edges/floating-anchors/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Floating anchors
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/floating-anchors/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/floating-anchors/stylesheet.yaml"
    ```

## Parent link pipe

Parent links let an overlay relationship ride inside a carrier relationship. The service still connects child endpoints, but the visual lane follows the parent transport pipe.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/edges/parent-link-pipe/topology.yaml
    stylesheet: ../../examples/edges/parent-link-pipe/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Parent link pipe
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/parent-link-pipe/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/parent-link-pipe/stylesheet.yaml"
    ```
