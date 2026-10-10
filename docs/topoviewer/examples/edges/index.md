# Edges

Explore edges behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Edge curve styles

Curve styles are presentation choices. The graph still says A connects to B/C/D/E; the stylesheet controls whether that relationship renders as straight, taxi, smooth-taxi, or unbundled-bezier.

### Expected Result

Different `curveStyle` values produce different edge routing models.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `link[labels.curve = "unbundled-bezier"]` rule in stylesheet.yaml, set `curveStyle` to `"straight"`.
3. Reload. The matching edge uses a direct route instead of its previous curve.
4. Restore the original settings and reload to compare with the starting view.

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

Arrows, dashes, and labels are edge styling. The request and reply links use the same `lineDashPattern` but different `lineDashOffset` values, so the rendered dash cadence is visibly phase-shifted. Endpoint labels make it clear that `sourceLabel` follows the edge source and `targetLabel` follows the edge target.

### Expected Result

Edges can carry labels, arrows, dash patterns, and dash offsets without changing topology semantics.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `link[labels.direction = "reply"]` rule in stylesheet.yaml, set `targetArrowShape` to `"none"`.
3. Reload. The target arrow disappears; the source relationship remains present.
4. Restore the original settings and reload to compare with the starting view.

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

Use endpoint labels when the two ends of an edge need visible port names. This
example keeps circle and square arrow markers as geometry only, then renders
`sourceLabel` and `targetLabel` as styled endpoint annotations with automatic
placement.

`endpointLabelDistance` moves labels away from their endpoint along the edge. `endpointLabelSideOffset` moves labels perpendicular to the edge during auto placement. `sourceLabelXOffset`, `sourceLabelYOffset`, `targetLabelXOffset`, and `targetLabelYOffset` are final manual nudges after auto placement.

Use the center `label` for the relationship name. Use `sourceLabel` and
`targetLabel` for interface names. Do not put interface names inside arrow
markers; arrows stay marker geometry so the label engine can place endpoint
text independently.

### Expected Result

Endpoint labels can show physical ports while arrow markers remain pure geometry.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `link` rule in stylesheet.yaml, set `sourceLabelYOffset` to `20`.
3. Reload. The source-side port label moves vertically; the endpoint ID and arrow attachment stay unchanged.
4. Restore the original settings and reload to compare with the starting view.

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

Endpoint spacing moves the visible line inward from node boundaries. Segment controls make manual bend points explicit, while taxi controls create deterministic right-angled routes without relying on automatic layout guesses.

### Expected Result

Endpoint spacing, segment controls, and taxi controls make edge routes explicit.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `link[labels.route = "taxi"]` rule in stylesheet.yaml, set `taxiTurn` to `60`.
3. Reload. The taxi turn changes while its source and target remain the same.
4. Restore the original settings and reload to compare with the starting view.

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

Linear gradients are useful for directional utilization, ownership, or state transitions. `interactive: false` leaves a reference edge visible while removing edge click handling, and `labelInteractive: false` keeps labels from taking pointer events.

### Expected Result

Linear gradients and interaction flags can be declared directly on edge style rules.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `link` rule in stylesheet.yaml, set `selectable` to `false`.
3. Reload. Clicking the matched edge no longer selects it; its rendered relationship remains visible.
4. Restore the original settings and reload to compare with the starting view.

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

Floating anchors are the default edge behavior. The renderer computes a boundary attachment point from the node geometry so the line does not terminate at the node center.

### Expected Result

Floating anchors connect to the facing side of each visible node outline.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `link` rule in stylesheet.yaml, set `curveStyle` to `"bezier"`.
3. Reload. The route curves while endpoints remain attached to the facing node outlines.
4. Restore the original settings and reload to compare with the starting view.

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

Parent links let an overlay relationship ride inside a carrier relationship. The service still connects child endpoints, but the visual lane follows the parent transport pipe. Parent links, their carrier links, and links styled as pipes remain independent from attention-based parallel-link grouping because they describe containment rather than parallel capacity.

### Expected Result

A child link can be visually carried inside a parent transport link.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `link[labels.link = "service"]` rule in stylesheet.yaml, set `lineWidth` to `12`.
3. Reload. The carried service lane becomes wider; it still follows its parent transport link.
4. Restore the original settings and reload to compare with the starting view.

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

Directional link strokes model two operational directions on one physical link.
Use them when one adjacency has independent telemetry for each direction and
duplicate links would misrepresent the topology.

The parent link still owns the stable topology identity and any endpoint port
labels. Each `linkDirection` inherits the parent link style, then applies
direction-specific overrides such as line color, arrow marker, dash pattern,
and direction label.

Use direction labels for vector values such as bandwidth or packet rate. Use
`sourceLabel` and `targetLabel` for physical ports. TopoViewer keeps arrows as
marker geometry and places endpoint, center, and direction labels with a shared
label placement pass so dense operational diagrams remain inspectable.

### Expected Result

One physical link can show two independently styled traffic directions.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `linkDirection` rule in stylesheet.yaml, set `lineWidth` to `7`.
3. Reload. One matching direction becomes wider without changing the opposite directional channel.
4. Restore the original settings and reload to compare with the starting view.

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

## Dense CLOS labels

Dense CLOS labels show the label-placement problem that appears in operational
fabric dashboards: region names, node names, endpoint ports, and bidirectional
bandwidth values all need space around the same set of links. The two rows have
enough separation to keep throughput labels out of the central crossing area.

The topology keeps one parent link per fabric adjacency. Physical port names
live on `sourceLabel` and `targetLabel`; bandwidth values live on
`directions.sourceToTarget.label` and `directions.targetToSource.label`. The
stylesheet assigns independent label z-index values and uses the shared
collision policy so labels can move without changing node or link geometry.

Raw node metadata and redundant relationship names stay in inspection so they
do not compete with operational names and values on the canvas. Port names
already identify each adjacency. Blue indicates leaf-to-spine traffic; teal
dashed strokes indicate spine-to-leaf traffic. Values are authored examples,
not live telemetry.

### Expected Result

Keep node names, endpoint ports, and bidirectional bandwidth values legible in a CLOS fabric.

### Try It

1. Copy the two YAML tabs into your own project.
2. In the `link` rule in stylesheet.yaml, set `sourceLabelYOffset` to `14`.
3. Reload. Source port labels shift away from their original placement; inspect the dense junctions for overlap.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: dense-clos-labels/topology.yaml
    stylesheet: dense-clos-labels/stylesheet.yaml
    height: 760px
    controls: true
    controlsOpen: false
    title: Dense CLOS labels
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/dense-clos-labels/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/dense-clos-labels/stylesheet.yaml"
    ```
