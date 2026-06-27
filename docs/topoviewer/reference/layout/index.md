# Layout

These examples document the layout behaviors from the canonical TopoViewer test-case catalog. Each section is generated from one test case and keeps the live viewport, topology YAML, and stylesheet YAML together.

## Manual layout

### What This Demonstrates

Manual layout means the author supplies coordinates. This is the right mode for diagrams where placement carries meaning.

### Expected Result

The live viewport should render "Manual layout" without blocking diagnostics. It should show: Manual layout preserves authored positions. The test metadata expects `graphNodes`: `3`, `minVisibleEdges`: `2`.

### What To Inspect

- Inspect `layout` options and node positions.
- Check whether positions are authored manually, inferred, or preserved by layout settings.

### Use When

Use this pattern when positions should be repeatable, inferred, or constrained by topology structure.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/layout/manual/topology.yaml
    stylesheet: ../../examples/layout/manual/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Manual layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/manual/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/manual/stylesheet.yaml"
    ```

## Force layout

### What This Demonstrates

Force layout is auto-layout assistance. It is useful when topology data exists but the author does not want to maintain coordinates by hand.

### Expected Result

The live viewport should render "Force layout" without blocking diagnostics. It should show: Force layout computes positions when the author omits coordinates. The test metadata expects `graphNodes`: `5`, `minVisibleEdges`: `5`.

### What To Inspect

- Inspect `layout` options and node positions.
- Check whether positions are authored manually, inferred, or preserved by layout settings.

### Use When

Use this pattern when positions should be repeatable, inferred, or constrained by topology structure.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/layout/force/topology.yaml
    stylesheet: ../../examples/layout/force/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: Force layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/force/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/force/stylesheet.yaml"
    ```

## CLOS layout

### What This Demonstrates

CLOS layout infers staged placement from graph structure.

This example intentionally uses generic node names and directed links:

- no manual node positions are authored
- `source` -> `target` link direction defines the preferred root-to-leaf order
- no network-specific labels such as spine or leaf are required

If your topology already has explicit stages, use `layout.clos.stageKey` and
`stageOrder`. If the graph is not staged, use `force`; if placement must be
operator-approved, use `manual`.

### Expected Result

The live viewport should render "CLOS layout" without blocking diagnostics. It should show: CLOS layout infers staged placement from graph structure. The test metadata expects `graphNodes`: `6`, `minVisibleEdges`: `8`.

### What To Inspect

- Inspect `layout` options and node positions.
- Check whether positions are authored manually, inferred, or preserved by layout settings.

### Use When

Use this pattern when positions should be repeatable, inferred, or constrained by topology structure.

=== "Live Viewport"

    ```topoviewer
    topology: ../../examples/layout/clos/topology.yaml
    stylesheet: ../../examples/layout/clos/stylesheet.yaml
    height: 420px
    controls: true
    controlsOpen: false
    title: CLOS layout
    ```

=== "Topology YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/clos/topology.yaml"
    ```

=== "Stylesheet YAML"

    ```yaml
    --8<-- "docs/topoviewer/examples/layout/clos/stylesheet.yaml"
    ```
