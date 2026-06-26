# Harness

These examples document the harness behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Layered network authoring

The default authoring harness template.

It combines underlay, BGP, service, and operations layers in one small topology so the harness can demonstrate layer toggles, relationship editing, attention, and diagnostics without starting from an empty graph.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/harness/layered-network/topology.yaml
    stylesheet: ../../examples/harness/layered-network/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Layered network authoring
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/layered-network/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/layered-network/stylesheet.yaml"
    ```

## CLOS 2-spine 4-leaf

A compact **2-spine, 4-leaf CLOS** fixture using `layout.mode: clos`.

- 2 spine nodes
- 4 leaf nodes
- 8 full-mesh fabric links (each leaf to both spines)
- no manual node positions
- no `stageKey` or `inferLabelRole`
- stages are inferred from directed `source` -> `target` fabric links
- `labels.node` only drives styling, icons, and outlines

Use this fixture as the smallest practical automatic-layout example. If a real
topology uses undirected or mixed-direction links, add a dedicated stage field
and reference it with `layout.clos.stageKey`.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/harness/clos-2spine-4leaf/topology.yaml
    stylesheet: ../../examples/harness/clos-2spine-4leaf/stylesheet.yaml
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

## Insert workflow

An authoring harness template for adding nodes, links, regions, paths, and notes from the Build panel.

The graph keeps every declared layer populated so layer toggles remain useful while authoring.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/harness/insert-workflow/topology.yaml
    stylesheet: ../../examples/harness/insert-workflow/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Insert workflow
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/insert-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/insert-workflow/stylesheet.yaml"
    ```

## Attention workflow

An authoring harness template for editing attention behavior against a small multi-layer service topology.

Use it to exercise object focus, path focus, dense link grouping, and region aggregation from the browser harness.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/harness/attention-workflow/topology.yaml
    stylesheet: ../../examples/harness/attention-workflow/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Attention workflow
    selectedLayerIds:
      - underlay
      - service
      - operations
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/attention-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/attention-workflow/stylesheet.yaml"
    ```

## Inspector workflow

An authoring harness template for inspecting and editing object labels, data, positions, and relationship endpoints.

The topology includes routers, a firewall, a service, links, and a callout so the Inspect panel has varied object types.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/harness/inspector-workflow/topology.yaml
    stylesheet: ../../examples/harness/inspector-workflow/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Inspector workflow
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/inspector-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/inspector-workflow/stylesheet.yaml"
    ```

## Dense link grouping

A compact harness template for parallel links and link grouping.

Use it to tune bundle threshold behavior without loading a large topology.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/harness/dense-links/topology.yaml
    stylesheet: ../../examples/harness/dense-links/stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Dense link grouping
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/dense-links/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/harness/dense-links/stylesheet.yaml"
    ```
