# Authoring

Explore authoring behavior with a live diagram and its two source files. Each example includes an edit to try in your own copy.

## Layered network authoring

The default compact Studio authoring fixture.

It combines underlay, BGP, service, and operations layers in one small topology so Studio and regression checks can exercise layer toggles, relationship editing, attention, and diagnostics without starting from an empty graph.

### Expected Result

A compact layered-network fixture for Studio, demos, and regression checks.

### Try It

1. Copy the two YAML tabs into your own project.
2. In `graph.nodes.0` in topology.yaml, set `graph.nodes.0.labels.name` to `"Edge renamed"`.
3. Reload. The visible alias on fra-pe changes; its stable ID, relationships, and memberships remain unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: layered-network/topology.yaml
    stylesheet: layered-network/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Layered network authoring
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/layered-network/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/layered-network/stylesheet.yaml"
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

### Expected Result

A compact data center fabric template with two spine switches, four leaf switches, and full leaf-to-spine mesh links.

### Try It

1. Copy the two YAML tabs into your own project.
2. In `graph.nodes.0` in topology.yaml, set `graph.nodes.0.labels.name` to `"Edge renamed"`.
3. Reload. The visible alias on Spine-1 changes; its stable ID, relationships, and memberships remain unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: clos-2spine-4leaf/topology.yaml
    stylesheet: clos-2spine-4leaf/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: CLOS 2-spine 4-leaf
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/clos-2spine-4leaf/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/clos-2spine-4leaf/stylesheet.yaml"
    ```

## Insert workflow

A Studio authoring fixture for adding nodes, links, regions, paths, and notes from the object palette.

The graph keeps every declared layer populated so layer toggles remain useful while authoring.

### Expected Result

A Studio fixture for inserting nodes, links, paths, regions, and notes.

### Try It

1. Copy the two YAML tabs into your own project.
2. In `diagram.callouts.0` in topology.yaml, set `diagram.callouts.0.body` to `"Inspect this object before proceeding."`.
3. Reload. The annotation text changes without creating or altering a graph relationship.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: insert-workflow/topology.yaml
    stylesheet: insert-workflow/stylesheet.yaml
    height: 600px
    controls: true
    controlsOpen: false
    title: Insert workflow
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/insert-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/insert-workflow/stylesheet.yaml"
    ```

## Attention workflow

A Studio authoring fixture for editing attention behavior against a small multi-layer service topology.

Use it to exercise object focus, path focus, dense link grouping, and region aggregation.

### Expected Result

A Studio fixture for editing attention focus, aggregation, and link grouping.

### Try It

1. Copy the two YAML tabs into your own project. Select the same layers in the viewer: `underlay`, `service`, `operations`.
2. In `graph.nodes.0` in topology.yaml, set `graph.nodes.0.labels.name` to `"Edge renamed"`.
3. Reload. The visible alias on pe-a changes; its stable ID, relationships, and memberships remain unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: attention-workflow/topology.yaml
    stylesheet: attention-workflow/stylesheet.yaml
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
    --8<-- "docs/topoviewer/examples/authoring/attention-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/attention-workflow/stylesheet.yaml"
    ```

## Inspector workflow

A Studio authoring fixture for inspecting and editing object labels, data, positions, and relationship endpoints.

The topology includes routers, a firewall, a service, links, and a callout so the Inspect panel has varied object types.

### Expected Result

A Studio fixture for inspecting object labels, data, positions, and relationships.

### Try It

1. Copy the two YAML tabs into your own project.
2. In `diagram.callouts.0` in topology.yaml, set `diagram.callouts.0.body` to `"Inspect this object before proceeding."`.
3. Reload. The annotation text changes without creating or altering a graph relationship.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: inspector-workflow/topology.yaml
    stylesheet: inspector-workflow/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Inspector workflow
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/inspector-workflow/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/inspector-workflow/stylesheet.yaml"
    ```

## Dense link grouping

A compact Studio fixture for parallel links and link grouping.

Use it to tune bundle threshold behavior without loading a large topology.

### Expected Result

A Studio fixture for parallel link grouping and bundle threshold editing.

### Try It

1. Copy the two YAML tabs into your own project.
2. In `graph.nodes.0` in topology.yaml, set `graph.nodes.0.labels.name` to `"Edge renamed"`.
3. Reload. The visible alias on a changes; its stable ID, relationships, and memberships remain unchanged.
4. Restore the original settings and reload to compare with the starting view.

=== "Live Viewport"

    ```topoviewer
    topology: dense-links/topology.yaml
    stylesheet: dense-links/stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Dense link grouping
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/dense-links/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/authoring/dense-links/stylesheet.yaml"
    ```
