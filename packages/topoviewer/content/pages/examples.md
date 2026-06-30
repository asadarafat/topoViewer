# Examples

Start here when you want a copyable topology pattern. These examples are
curated learning paths. The generated reference catalog remains available for
exhaustive feature and regression coverage, but it is not the first learning
path.

## Pick A Pattern

| Pattern | Copy | Expected result | Fields that matter |
|---|---|---|---|
| [Basic graph](#basic-graph) | Two nodes, one link, one stylesheet. | A minimal interactive topology with labels and one straight link. | `graph.nodes`, `graph.links`, `labelFields`, `stylesheet`. |
| [CLOS fabric](#clos-fabric) | A 2-spine, 4-leaf fabric using automatic CLOS layout. | Spines and leaves are arranged by inferred fabric stages. | `layout.mode: clos`, directed fabric links, node labels. |
| [Node styling](#node-styling) | Icon fit, badges, and status markers. | One diagram shows contain, cover, and fill icon behavior. | `iconFit`, `badgeLabel`, `statusPlacement`, node dimensions. |
| [Edge styling](#edge-styling) | Bidirectional directional strokes on one physical link. | One link carries independent source-to-target and target-to-source styles. | `link.directions`, `linkDirection` selectors, arrow offsets. |
| [Attention](#attention) | Object focus with a small graph. | Clicking an object highlights it and dims unrelated context. | `attention`, object IDs, path IDs, focus mode. |
| [Real network](#real-network) | Layered provider underlay, BGP, transport, service, and failure views. | One topology answers multiple operational questions. | `layers`, paths, service labels, severity data. |
| [Grafana mapper overlay](#grafana-mapper-overlay) | Mapper rule skeleton for telemetry overlays. | Prometheus samples change runtime styles without rewriting source YAML. | `*.mapper.tv.yaml`, `select`, `join`, `states`, runtime `style`. |

## Basic Graph

Use this first when validating that a topology file and stylesheet file are
paired correctly.

=== "Live Viewport"

    ```topoviewer
    topology: examples/graph/basic/topology.yaml
    stylesheet: examples/graph/basic/stylesheet.yaml
    height: 360px
    controls: true
    controlsOpen: false
    title: Basic graph
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/basic/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/basic/stylesheet.yaml"
    ```

## CLOS Fabric

Use this when the graph is a fabric and the layout should infer stages from
connectivity instead of manual positions.

=== "Live Viewport"

    ```topoviewer
    topology: examples/harness/clos-2spine-4leaf/topology.yaml
    stylesheet: examples/harness/clos-2spine-4leaf/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: CLOS 2-spine 4-leaf
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/clos-2spine-4leaf/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/clos-2spine-4leaf/stylesheet.yaml"
    ```

## Node Styling

Use this when a node needs compact visual signals without changing topology
facts.

=== "Live Viewport"

    ```topoviewer
    topology: examples/nodes/icon-fit-and-badges/topology.yaml
    stylesheet: examples/nodes/icon-fit-and-badges/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Icon fit and badges
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/icon-fit-and-badges/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/icon-fit-and-badges/stylesheet.yaml"
    ```

## Edge Styling

Use this when one physical adjacency has independent telemetry per direction.
Do not duplicate the physical link unless the topology really has parallel
links.

=== "Live Viewport"

    ```topoviewer
    topology: examples/edges/directional-link-strokes/topology.yaml
    stylesheet: examples/edges/directional-link-strokes/stylesheet.yaml
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

## Attention

Use this when a dense graph needs an intentional focus state. The source graph
stays complete; the viewport emphasizes the selected object and keeps context
muted.

=== "Live Viewport"

    ```topoviewer
    topology: examples/attention/object-focus/topology.yaml
    stylesheet: examples/attention/object-focus/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Object focus
    attention:
      query:
        pathIds:
          - checkout-flow
        mode: dim-context
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/object-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/object-focus/stylesheet.yaml"
    ```

=== "Attention YAML"

    ```yaml
    attention:
      query:
        pathIds:
          - checkout-flow
        mode: dim-context
    ```

## Real Network

Use this when one topology needs multiple operational views. Start with the
underlay, then add BGP, transport, service, and failure layers only when those
questions matter.

=== "Live Viewport"

    ```topoviewer
    topology: examples/integration/real-network-service-path/topology.yaml
    stylesheet: examples/integration/real-network-service-path/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Real network service path
    selectedLayerIds:
      - underlay
      - bgp
      - transport
      - service
    attention:
      query:
        pathIds:
          - payments-primary
        mode: dim-context
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-service-path/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-service-path/stylesheet.yaml"
    ```

Next: [Real Network Demo](real-network-demo.md) for the full sequence.

## Grafana Mapper Overlay

Use this when telemetry should change runtime presentation without mutating the
topology or stylesheet YAML. The harness exports three files for Grafana:
`*.topo.tv.yaml`, `*.style.tv.yaml`, and `*.mapper.tv.yaml`.

```yaml
rules:
  - id: link-utilization
    metric: topoviewer_link_direction_utilization_percent
    select: linkDirection
    join:
      link: link_id
      direction: direction
    value: percent
    states:
      high: ">=80"
      saturated: ">=90"
    style:
      default:
        label: "{{ label.direction }} {{ value | round }}%"
      high:
        lineColor: "#ff9800"
        lineWidth: 5
      saturated:
        lineColor: "#d32f2f"
        lineWidth: 7
        lineStyle: dashed
```

Expected result: a Prometheus sample with matching `link_id` and `direction`
updates only the matching directional stroke. Unmatched, ambiguous, duplicate,
or stale samples should appear in mapper coverage diagnostics.

## Generated Catalog

Use the generated catalog when you need exhaustive feature coverage or a
regression fixture:

- [Graph](reference/graph/index.md)
- [Nodes](reference/nodes/index.md)
- [Edges](reference/edges/index.md)
- [Paths](reference/paths/index.md)
- [Attention](reference/attention/index.md)
- [Regions](reference/regions/index.md)
- [Shapes](reference/shapes/index.md)
- [Callouts](reference/callouts/index.md)
- [Styling](reference/styling/index.md)
- [Layout](reference/layout/index.md)
- [Harness](reference/harness/index.md)
- [Validation](reference/validation/index.md)

## Next Steps

- [Getting started](getting-started.md): build the smallest useful topology from scratch.
- [Style a topology](style-a-topology.md): learn the reusable stylesheet pattern behind the examples.
- [Grafana telemetry call flow](grafana-telemetry-call-flow.md): understand the runtime overlay path.
- [Integration roadmap](integration-roadmap.md): check support status before adopting an integration.
