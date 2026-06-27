---
hide:
  - toc
---

# CLOS 2-spine 4-leaf

## What This Demonstrates

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

## Expected Result

The live viewport should render "CLOS 2-spine 4-leaf" without blocking diagnostics. It should show: A compact data center fabric template with two spine switches, four leaf switches, and full leaf-to-spine mesh links. The test metadata expects `graphNodes`: `6`, `minVisibleEdges`: `8`, `minRegions`: `1`.

## What To Inspect

- Use the example as an authoring template in the browser harness.
- Apply changes and confirm the rendered viewport stays in sync with YAML.

## Use When

Use this pattern when building browser or VS Code authoring workflows.

=== "Live Viewport"

    ```topoviewer
    topology: ../../../examples/harness/clos-2spine-4leaf/topology.yaml
    stylesheet: ../../../examples/harness/clos-2spine-4leaf/stylesheet.yaml
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
