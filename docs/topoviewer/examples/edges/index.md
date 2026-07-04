# Edges

These examples document the edges behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Edge curve styles

### What This Demonstrates

Curve styles are presentation choices. The graph still says A connects to B/C/D/E; the stylesheet controls whether that relationship renders as straight, taxi, smooth-taxi, or unbundled-bezier.

### Expected Result

The live viewport should render "Edge curve styles" without blocking diagnostics. It should show: Different `curveStyle` values produce different edge routing models. The test metadata expects `graphNodes`: `5`, `minVisibleEdges`: `4`.

### What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

### Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: curve-styles/topology.yaml
    stylesheet: curve-styles/stylesheet.yaml
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

### What This Demonstrates

Arrows, dashes, and labels are edge styling. The request and reply links use the same `lineDashPattern` but different `lineDashOffset` values, so the rendered dash cadence is visibly phase-shifted. Endpoint labels make it clear that `sourceLabel` follows the edge source and `targetLabel` follows the edge target.

### Expected Result

The live viewport should render "Arrows, dashes, and labels" without blocking diagnostics. It should show: Edges can carry labels, arrows, dash patterns, and dash offsets without changing topology semantics. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `2`.

### What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

### Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: arrows-dashes-labels/topology.yaml
    stylesheet: arrows-dashes-labels/stylesheet.yaml
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

## Endpoint label controls

### What This Demonstrates

Use endpoint labels when the two ends of an edge need visible port names. This example keeps circle and square arrow markers as geometry only, then renders `sourceLabel` and `targetLabel` as styled endpoint annotations with automatic placement.

`endpointLabelDistance` moves labels away from their endpoint along the edge. `endpointLabelSideOffset` moves labels perpendicular to the edge during auto placement. `sourceLabelXOffset`, `sourceLabelYOffset`, `targetLabelXOffset`, and `targetLabelYOffset` are final manual nudges after auto placement.

### Expected Result

The live viewport should render "Endpoint label controls" without blocking diagnostics. It should show: Endpoint labels can show physical ports while arrow markers remain pure geometry. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

### What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

### Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: endpoint-label-controls/topology.yaml
    stylesheet: endpoint-label-controls/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Endpoint label controls
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-label-controls/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/endpoint-label-controls/stylesheet.yaml"
    ```

## Endpoint spacing and routing

### What This Demonstrates

Endpoint spacing moves the visible line inward from node boundaries. Segment controls make manual bend points explicit, while taxi controls create deterministic right-angled routes without relying on automatic layout guesses.

### Expected Result

The live viewport should render "Endpoint spacing and routing" without blocking diagnostics. It should show: Endpoint spacing, segment controls, and taxi controls make edge routes explicit. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `2`.

### What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

### Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: endpoint-spacing-routing/topology.yaml
    stylesheet: endpoint-spacing-routing/stylesheet.yaml
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

### What This Demonstrates

Linear gradients are useful for directional utilization, ownership, or state transitions. `interactive: false` leaves a reference edge visible while removing edge click handling, and `labelInteractive: false` keeps labels from taking pointer events.

### Expected Result

The live viewport should render "Gradient and interaction flags" without blocking diagnostics. It should show: Linear gradients and interaction flags can be declared directly on edge style rules. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `2`.

### What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

### Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: gradient-and-interaction/topology.yaml
    stylesheet: gradient-and-interaction/stylesheet.yaml
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

### What This Demonstrates

Floating anchors are the default edge behavior. The renderer computes a boundary attachment point from the node geometry so the line does not terminate at the node center.

### Expected Result

The live viewport should render "Floating anchors" without blocking diagnostics. It should show: Floating anchors connect to the nearest point on each node boundary. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

### What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

### Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: floating-anchors/topology.yaml
    stylesheet: floating-anchors/stylesheet.yaml
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

### What This Demonstrates

Parent links let an overlay relationship ride inside a carrier relationship. The service still connects child endpoints, but the visual lane follows the parent transport pipe.

### Expected Result

The live viewport should render "Parent link pipe" without blocking diagnostics. It should show: A child link can be visually carried inside a parent transport link. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `1`.

### What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

### Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: parent-link-pipe/topology.yaml
    stylesheet: parent-link-pipe/stylesheet.yaml
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

## Directional link strokes

### What This Demonstrates

Directional link strokes model two operational directions on one physical link. Use them when one adjacency has independent telemetry for each direction and duplicate links would misrepresent the topology.

### Expected Result

The live viewport should render "Directional link strokes" without blocking diagnostics. It should show: One physical link can show two independently styled traffic directions. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

### What To Inspect

- Inspect `graph.links` for endpoint IDs and labels.
- Compare line, arrow, label, and curve style keys in the stylesheet.

### Use When

Use this pattern when link readability, routing, arrowheads, or edge labels matter.

=== "Live Viewport"

    ```topoviewer
    topology: directional-link-strokes/topology.yaml
    stylesheet: directional-link-strokes/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Directional link strokes
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/directional-link-strokes/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/directional-link-strokes/stylesheet.yaml"
    ```
