---
hide:
  - toc
---

# CLOS layout

## What This Demonstrates

CLOS layout infers staged placement from graph structure.

This example intentionally uses generic node names and directed links:

- no manual node positions are authored
- `source` -> `target` link direction defines the preferred root-to-leaf order
- no network-specific labels such as spine or leaf are required

If your topology already has explicit stages, use `layout.clos.stageKey` and
`stageOrder`. If the graph is not staged, use `force`; if placement must be
operator-approved, use `manual`.

## Expected Result

The live viewport should render "CLOS layout" without blocking diagnostics. It should show: CLOS layout infers staged placement from graph structure. The test metadata expects `graphNodes`: `6`, `minVisibleEdges`: `8`.

## What To Inspect

- Inspect `layout` options and node positions.
- Check whether positions are authored manually, inferred, or preserved by layout settings.

## Use When

Use this pattern when positions should be repeatable, inferred, or constrained by topology structure.

=== "Live Viewport"

    ```topoviewer
    topology: topology.yaml
    stylesheet: stylesheet.yaml
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
