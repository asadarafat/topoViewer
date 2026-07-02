# Examples Gallery

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
| [Kubernetes service map](#kubernetes-service-map) | Real EDA Kubernetes services, deployments, pods, and TopoNodes. | TopoViewer renders live platform inventory as a service map with topology runtime bindings. | `Service` selectors, control-plane/topology-runtime layers, regions, EDA status data. |
| [Real network](#real-network) | Layered provider underlay, BGP, transport, service, and failure views. | One topology answers multiple operational questions. | `layers`, paths, service labels, severity data. |
| [Grafana mapper overlay](#grafana-mapper-overlay) | Mapper rule skeleton for telemetry overlays. | Prometheus samples change runtime styles without rewriting source YAML. | `*.mapper.tv.yaml`, `select`, `join`, `states`, runtime `style`. |

## Basic Graph

What this proves: the smallest useful TopoViewer diagram is just graph facts
plus one selector stylesheet.

Use this when you need to validate that a topology file and stylesheet file are
paired correctly before adding layers, regions, paths, or attention.

=== "Live Viewport"

    ```topoviewer
    topology: examples/graph/basic/topology.yaml
    stylesheet: examples/graph/basic/stylesheet.yaml
    height: 360px
    controls: true
    controlsOpen: false
    title: Basic graph
    ```

=== "Copy Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/basic/topology.yaml"
    ```

=== "Copy Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/graph/basic/stylesheet.yaml"
    ```

## CLOS Fabric

What this proves: CLOS layout can infer fabric stages from connectivity instead
of forcing authors to hand-place every node.

Use this when the graph is a fabric and the layout should provide the first
readable arrangement before the author tunes labels, icons, or regions.

=== "Live Viewport"

    ```topoviewer
    topology: examples/harness/clos-2spine-4leaf/topology.yaml
    stylesheet: examples/harness/clos-2spine-4leaf/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: CLOS 2-spine 4-leaf
    ```

=== "Copy Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/clos-2spine-4leaf/topology.yaml"
    ```

=== "Copy Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/clos-2spine-4leaf/stylesheet.yaml"
    ```

## Node Styling

What this proves: node shape, icon fit, badges, and status markers are visual
policy, not topology facts.

Use this when a node needs compact operational signals without duplicating or
mutating the source topology.

=== "Live Viewport"

    ```topoviewer
    topology: examples/nodes/icon-fit-and-badges/topology.yaml
    stylesheet: examples/nodes/icon-fit-and-badges/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Icon fit and badges
    ```

=== "Copy Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/icon-fit-and-badges/topology.yaml"
    ```

=== "Copy Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/nodes/icon-fit-and-badges/stylesheet.yaml"
    ```

## Edge Styling

What this proves: one physical link can render independent directional strokes,
labels, arrows, and line styles.

Use this when one adjacency has independent telemetry per direction. Do not
duplicate the physical link unless the topology really has parallel links.

=== "Live Viewport"

    ```topoviewer
    topology: examples/edges/directional-link-strokes/topology.yaml
    stylesheet: examples/edges/directional-link-strokes/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Directional link strokes
    ```

=== "Copy Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/directional-link-strokes/topology.yaml"
    ```

=== "Copy Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/edges/directional-link-strokes/stylesheet.yaml"
    ```

## Attention

What this proves: focus state can emphasize what matters without deleting
context from the source graph.

Use this when a dense graph needs object, path, dependency, or change focus
without losing context.

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

=== "Copy Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/object-focus/topology.yaml"
    ```

=== "Copy Stylesheet YAML"

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

## Kubernetes Service Map

What this proves: TopoViewer is not limited to network-provider diagrams. The
same YAML model can describe Kubernetes services, deployments, pods, EDA custom
resources, simulated fabric nodes, and service-selector relationships from a
real EDA Playground cluster.

Use this when platform, SRE, or application teams need a reviewable service map
from live Kubernetes inventory rather than a hand-drawn dependency picture.

=== "Live Viewport"

    ```topoviewer
    topology: examples/integration/kubernetes-service-map/topology.yaml
    stylesheet: examples/integration/kubernetes-service-map/stylesheet.yaml
    height: 760px
    controls: true
    controlsOpen: false
    title: Kubernetes service map
    selectedLayerIds:
      - control-plane
      - topology-runtime
    ```

=== "Copy Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/kubernetes-service-map/topology.yaml"
    ```

=== "Copy Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/kubernetes-service-map/stylesheet.yaml"
    ```

## Real Network

What this proves: one topology can answer different operational questions by
switching layers and focus state.

Use this when one source model needs multiple operational views without
maintaining separate static diagrams.

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

=== "Copy Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-service-path/topology.yaml"
    ```

=== "Copy Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/real-network-service-path/stylesheet.yaml"
    ```

## Grafana Mapper Overlay

What this proves: telemetry can change runtime presentation without mutating the
topology or stylesheet YAML.

Use this when Grafana should mount harness-authored `*.topo.tv.yaml`,
`*.style.tv.yaml`, and `*.mapper.tv.yaml` bundles and apply Prometheus-driven
overlays at runtime.

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

More copyable mapper recipes are in [Grafana TopoViewer Containerlab Lab](../labs/grafana-topoviewer-containerlab-lab.md#mapper-recipes).

## Generated Catalog

Use the generated catalog when you need exhaustive feature coverage:
- [Graph](../reference/graph/index.md)
- [Nodes](../reference/nodes/index.md)
- [Edges](../reference/edges/index.md)
- [Paths](../reference/paths/index.md)
- [Attention](../reference/attention/index.md)
- [Regions](../reference/regions/index.md)
- [Shapes](../reference/shapes/index.md)
- [Callouts](../reference/callouts/index.md)
- [Styling](../reference/styling/index.md)
- [Layout](../reference/layout/index.md)
- [Validation](../reference/validation/index.md)
