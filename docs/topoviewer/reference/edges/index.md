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

## Arrow and label controls

Use directional arrow properties when the two ends of an edge need different semantics. This example uses a circle at the source, a vee at the target, and separate endpoint label styles so source and target capacity are readable at a glance.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/edges/arrow-label-controls/topology.yaml
    stylesheet: ../../examples/edges/arrow-label-controls/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Arrow and label controls
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/arrow-label-controls/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/arrow-label-controls/stylesheet.yaml"
    ```

## Endpoint spacing and routing

Endpoint spacing moves the visible line inward from node boundaries. Segment controls make manual bend points explicit, while taxi controls create deterministic right-angled routes without relying on automatic layout guesses.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/edges/endpoint-spacing-routing/topology.yaml
    stylesheet: ../../examples/edges/endpoint-spacing-routing/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Endpoint spacing and routing
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-spacing-routing/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-spacing-routing/stylesheet.yaml"
    ```

## Gradient and interaction flags

Linear gradients are useful for directional utilization, ownership, or state transitions. `interactive: false` leaves a reference edge visible while removing edge click handling, and `labelInteractive: false` keeps labels from taking pointer events.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/edges/gradient-and-interaction/topology.yaml
    stylesheet: ../../examples/edges/gradient-and-interaction/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Gradient and interaction flags
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/gradient-and-interaction/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/gradient-and-interaction/stylesheet.yaml"
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
