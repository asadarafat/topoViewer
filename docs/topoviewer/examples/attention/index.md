# Attention

These examples document the attention behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Object focus

### What This Demonstrates

Object focus is the default interactive attention pattern. Click the Checkout flow path, a node, or a link in the live viewport; the selected object is highlighted while unrelated context stays visible but muted. Click empty viewport space to clear the focus and return to the normal topology view.

### Expected Result

The live viewport should render "Object focus" without blocking diagnostics. It should show: Click one topology object to highlight it while dimming the surrounding context. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `5`.

### What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

### Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: object-focus/topology.yaml
    stylesheet: object-focus/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Object focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/object-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/object-focus/stylesheet.yaml"
    ```

## Change focus

### What This Demonstrates

Change focus is a declarative attention query for operational change. This small topology starts with attention already applied: `CORE-1` and the degraded `core-1-core-2` link changed after the selected timestamp, so they are highlighted while the unchanged objects remain visible but muted.

### Expected Result

The live viewport should render "Change focus" without blocking diagnostics. It should show: Focus objects with recent change metadata while preserving topology context. The test metadata expects `graphNodes`: `5`, `minVisibleEdges`: `5`.

### What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

### Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: change-focus/topology.yaml
    stylesheet: change-focus/stylesheet.yaml
    height: 520px
    controls: true
    controlsOpen: false
    title: Change focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/change-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/change-focus/stylesheet.yaml"
    ```

## Region collapse

### What This Demonstrates

Region collapse demonstrates progressive disclosure. The access metro region starts declaratively collapsed into one aggregate summary node; click the `Access metro` summary in the live viewport to expand the region and reveal its member nodes and internal links. Click the expanded region hull to collapse it back into the summary node.

### Expected Result

The live viewport should render "Region collapse" without blocking diagnostics. It should show: Collapse a region into an aggregate summary, then click it to expand member nodes. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

### What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

### Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: region-collapse/topology.yaml
    stylesheet: region-collapse/stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Region collapse
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-collapse/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-collapse/stylesheet.yaml"
    ```

## Dense summary drill-down

### What This Demonstrates

Dense summary drill-down keeps a busy topology useful without making zoom decide what the operator meant. The overview shows one summary per metro, including hidden node count, link count, and worst severity. The PE full mesh between metros is represented as counted aggregate links instead of a pile of individual transport links. Click a metro summary to inspect that region while the rest of the topology stays compressed; drag the expanded region hull to reposition its members, or click the hull to collapse it again.

### Expected Result

The live viewport should render "Dense summary drill-down" without blocking diagnostics. It should show: Keep dense metro topologies readable with summary nodes, counted full-mesh links, and explicit click-to-expand drill-down. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `3`, `minRegions`: `0`.

### What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

### Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: dense-summary-drilldown/topology.yaml
    stylesheet: dense-summary-drilldown/stylesheet.yaml
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

## Advanced zoom policy

### What This Demonstrates

Advanced zoom policy is an optional host-controlled behavior for map-style overview/detail transitions. The recommended operator workflow is still explicit: click an aggregate summary to expand it, then click the expanded region hull or parent object to collapse it. Use zoom thresholds only when the embedding experience intentionally wants detail to follow viewport scale.

### Expected Result

The live viewport should render "Advanced zoom policy" without blocking diagnostics. It should show: Optionally bind aggregate expansion to zoom thresholds when a host needs map-style overview/detail transitions. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`, `minRegions`: `0`.

### What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

### Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: advanced-zoom-policy/topology.yaml
    stylesheet: advanced-zoom-policy/stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Advanced zoom policy
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/advanced-zoom-policy/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/advanced-zoom-policy/stylesheet.yaml"
    ```

## Link grouping

### What This Demonstrates

Link grouping demonstrates threshold-based edge aggregation. Three transport links between the same two routers start as one summary link labeled `3 links`; click the summary link to reveal each member as a Cytoscape-style bundled Bezier edge.

### Expected Result

The live viewport should render "Link grouping" without blocking diagnostics. It should show: Group parallel links by endpoint and layer when the count crosses a threshold. The test metadata expects `graphNodes`: `2`.

### What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

### Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: link-grouping/topology.yaml
    stylesheet: link-grouping/stylesheet.yaml
    height: 440px
    controls: true
    controlsOpen: false
    title: Link grouping
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/link-grouping/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/link-grouping/stylesheet.yaml"
    ```

## Query primitives

### What This Demonstrates

Query primitives demonstrates the general focus query surface. The topology declares stable IDs, labels, nested data, and link media metadata; the MkDocs attention block focuses `CORE-1`, all access nodes, objects with critical severity or fanout 12, and the fiber link selected through a stylesheet-compatible selector.

### Expected Result

The live viewport should render "Query primitives" without blocking diagnostics. It should show: Focus by explicit IDs, labels, data fields, and stylesheet-compatible selectors. The test metadata expects `graphNodes`: `5`, `minVisibleEdges`: `4`.

### What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

### Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: query-primitives/topology.yaml
    stylesheet: query-primitives/stylesheet.yaml
    height: 460px
    controls: true
    controlsOpen: false
    title: Query primitives
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/query-primitives/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/query-primitives/stylesheet.yaml"
    ```

## Region focus

### What This Demonstrates

Region focus uses `graph.regions[].members` as the declarative grouping source. The attention query focuses the access metro region, so its member nodes become prominent while the PE outside the region and the surrounding links stay as dimmed context.

### Expected Result

The live viewport should render "Region focus" without blocking diagnostics. It should show: Focus a region and its member nodes while preserving surrounding context. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `3`, `minRegions`: `1`.

### What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

### Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: region-focus/topology.yaml
    stylesheet: region-focus/stylesheet.yaml
    height: 460px
    controls: true
    controlsOpen: false
    title: Region focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/region-focus/stylesheet.yaml"
    ```

## Dependency focus

### What This Demonstrates

Dependency focus uses directed links and path sequences as an adjacency graph. This example starts from `CORE-1`, walks two downstream hops, marks reached nodes as related, and leaves the links as dimmed context so the blast radius is visible without hiding the topology.

### Expected Result

The live viewport should render "Dependency focus" without blocking diagnostics. It should show: Traverse directed topology relationships to show downstream blast radius. The test metadata expects `graphNodes`: `5`, `minVisibleEdges`: `4`.

### What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

### Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: dependency-focus/topology.yaml
    stylesheet: dependency-focus/stylesheet.yaml
    height: 460px
    controls: true
    controlsOpen: false
    title: Dependency focus
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dependency-focus/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/dependency-focus/stylesheet.yaml"
    ```

## Hide context

### What This Demonstrates

Hide context mode is useful when context should be removed from the rendered view instead of muted. The topology marks two PE nodes with `labels.role: pe`; the attention query focuses that label and hides every non-matching node and link.

### Expected Result

The live viewport should render "Hide context" without blocking diagnostics. It should show: Use hide-context mode when the focused set should be isolated instead of dimmed. The test metadata expects `graphNodes`: `2`.

### What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

### Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: hide-context/topology.yaml
    stylesheet: hide-context/stylesheet.yaml
    height: 440px
    controls: true
    controlsOpen: false
    title: Hide context
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/hide-context/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/hide-context/stylesheet.yaml"
    ```

## Parent and label collapse

### What This Demonstrates

Parent and label collapse shows the other aggregate group types. Service child nodes under `PE-1` collapse by parent-child relationship, and access nodes collapse by `labels.role: access`; clicking the `PE-1 services` summary expands only that parent-derived group.

### Expected Result

The live viewport should render "Parent and label collapse" without blocking diagnostics. It should show: Collapse parent-child objects and label-defined groups into aggregate summaries. The test metadata expects `graphNodes`: `4`, `minVisibleEdges`: `3`.

### What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

### Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: parent-label-collapse/topology.yaml
    stylesheet: parent-label-collapse/stylesheet.yaml
    height: 500px
    controls: true
    controlsOpen: false
    title: Parent and label collapse
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/parent-label-collapse/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/parent-label-collapse/stylesheet.yaml"
    ```

## Aggregate badge and status

### What This Demonstrates

Aggregate badge and status defaults make a collapsed group useful before drill-down. The summary node shows the hidden member count as a badge and the worst member severity as a status marker.

### Expected Result

The live viewport should render "Aggregate badge and status" without blocking diagnostics. It should show: Collapsed aggregate summaries can expose hidden member count and worst severity as compact node cues. The test metadata expects `graphNodes`: `2`, `minVisibleEdges`: `1`.

### What To Inspect

- Review the attention state in the live viewport and compare it with the optional Attention YAML tab.
- Check which objects stay prominent and which objects are dimmed, collapsed, or summarized.

### Use When

Use this pattern when a dense graph needs focus, dimming, aggregation, or label-priority behavior.

=== "Live Viewport"

    ```topoviewer
    topology: aggregate-badge-status/topology.yaml
    stylesheet: aggregate-badge-status/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Aggregate badge and status
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/aggregate-badge-status/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/attention/aggregate-badge-status/stylesheet.yaml"
    ```
