## From YAML To A Network Diagram

This example is the smallest product story: topology facts are written once,
then a stylesheet turns those facts into a readable network diagram.

The topology file describes the provider underlay slice: routers, links, layers,
regions, and metadata. The stylesheet decides how router roles, labels, regions,
and link state should look. That separation is the point. The diagram can be
reviewed and regenerated without redrawing boxes and lines by hand.

Use this page before the larger real-network and Kubernetes examples. It shows
the same contract those examples use, but with fewer moving parts.

=== "Live Viewport"

    ```topoviewer
    topology: examples/integration/yaml-to-network-diagram/topology.yaml
    stylesheet: examples/integration/yaml-to-network-diagram/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: YAML to network diagram
    selectedLayerIds:
      - underlay
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/yaml-to-network-diagram/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/integration/yaml-to-network-diagram/stylesheet.yaml"
    ```

The rendered result should show the underlay layer from the Service Provider
Network example: four infrastructure nodes, the physical links between them, and
the regions that make the topology easier to scan. The same graph facts are
reused later for BGP, transport, service-path, and failure views.
