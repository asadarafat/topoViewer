---
hide:
  - toc
---

# Dense summary drill-down

Dense summary drill-down keeps a busy topology useful without making zoom decide what the operator meant. The overview shows one summary per metro, including hidden node count, link count, and worst severity. The PE full mesh between metros is represented as counted aggregate links instead of a pile of individual transport links. Click a metro summary to inspect that region while the rest of the topology stays compressed; drag the expanded region hull to reposition its members, or click the hull to collapse it again.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/attention/dense-summary-drilldown/topology.yaml
    stylesheet: ../../../examples/attention/dense-summary-drilldown/stylesheet.yaml
    height: 560px
    controls: true
    controlsOpen: false
    title: Dense summary drill-down
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dense-summary-drilldown/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dense-summary-drilldown/stylesheet.yaml"
    ```
