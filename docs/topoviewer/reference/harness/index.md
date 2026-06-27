# Harness

These examples document the harness behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Layered network authoring

### What This Demonstrates

The default authoring harness template.

It combines underlay, BGP, service, and operations layers in one small topology so the harness can demonstrate layer toggles, relationship editing, attention, and diagnostics without starting from an empty graph.

### Expected Result

The live viewport should render "Layered network authoring" without blocking diagnostics. It should show: The default browser harness template for layered network authoring.

### What To Inspect

- Use the example as an authoring template in the browser harness.
- Apply changes and confirm the rendered viewport stays in sync with YAML.

### Use When

Use this pattern when building browser or VS Code authoring workflows.

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

### What This Demonstrates

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

### Expected Result

The live viewport should render "CLOS 2-spine 4-leaf" without blocking diagnostics. It should show: A compact data center fabric template with two spine switches, four leaf switches, and full leaf-to-spine mesh links. The test metadata expects `graphNodes`: `6`, `minVisibleEdges`: `8`, `minRegions`: `1`.

### What To Inspect

- Use the example as an authoring template in the browser harness.
- Apply changes and confirm the rendered viewport stays in sync with YAML.

### Use When

Use this pattern when building browser or VS Code authoring workflows.

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

### What This Demonstrates

An authoring harness template for adding nodes, links, regions, paths, and notes from the Build panel.

The graph keeps every declared layer populated so layer toggles remain useful while authoring.

### Expected Result

The live viewport should render "Insert workflow" without blocking diagnostics. It should show: A browser harness template for inserting nodes, links, paths, regions, and notes.

### What To Inspect

- Use the example as an authoring template in the browser harness.
- Apply changes and confirm the rendered viewport stays in sync with YAML.

### Use When

Use this pattern when building browser or VS Code authoring workflows.

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

### What This Demonstrates

An authoring harness template for editing attention behavior against a small multi-layer service topology.

Use it to exercise object focus, path focus, dense link grouping, and region aggregation from the browser harness.

### Expected Result

The live viewport should render "Attention workflow" without blocking diagnostics. It should show: A browser harness template for editing attention focus, aggregation, and link grouping.

### What To Inspect

- Use the example as an authoring template in the browser harness.
- Apply changes and confirm the rendered viewport stays in sync with YAML.

### Use When

Use this pattern when building browser or VS Code authoring workflows.

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

### What This Demonstrates

An authoring harness template for inspecting and editing object labels, data, positions, and relationship endpoints.

The topology includes routers, a firewall, a service, links, and a callout so the Inspect panel has varied object types.

### Expected Result

The live viewport should render "Inspector workflow" without blocking diagnostics. It should show: A browser harness template for inspecting object labels, data, positions, and relationships.

### What To Inspect

- Use the example as an authoring template in the browser harness.
- Apply changes and confirm the rendered viewport stays in sync with YAML.

### Use When

Use this pattern when building browser or VS Code authoring workflows.

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

### What This Demonstrates

A compact harness template for parallel links and link grouping.

Use it to tune bundle threshold behavior without loading a large topology.

### Expected Result

The live viewport should render "Dense link grouping" without blocking diagnostics. It should show: A browser harness template for parallel link grouping and bundle threshold editing.

### What To Inspect

- Use the example as an authoring template in the browser harness.
- Apply changes and confirm the rendered viewport stays in sync with YAML.

### Use When

Use this pattern when building browser or VS Code authoring workflows.

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
