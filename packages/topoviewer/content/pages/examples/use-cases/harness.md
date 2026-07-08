# Harness

The Harness is the fastest way to author a TopoViewer bundle before embedding
it in docs, React, Zensical, or Grafana. It gives you a canvas-first editor for
common graph work, an Inspector for object details, and YAML tabs for the source
files that every other TopoViewer surface consumes.

**Support status:** Experimental

## Try It Now

Open the published Harness:

[https://asadarafat.github.io/topoviewer/harness/](https://asadarafat.github.io/topoviewer/harness/)

Use the toolbar above the canvas for the normal authoring loop:

1. Press `N` or click the node tool, then click the canvas to place nodes.
2. Press `L` or click the link tool, then drag between nodes to create links.
3. Press `P` or click the path tool, then click reachable nodes in sequence and
   press `Enter` to create a path.
4. Press `G` or click the region tool, then drag bounds around nodes or click
   empty canvas to create a region container.
5. Select objects to edit names, labels, data, relationship endpoints, and
   geometry in the Inspector.
6. Open the YAML tab to inspect or refine the files that the canvas produced.
7. Download the bundle when the graph, style, and mapper are ready to move into
   another surface.

??? example "Run the Harness locally"

    Use the GitHub Pages-style preview when you want to test the same paths used
    by the published site:

    ```bash
    npm run docs:preview
    ```

    Open:

    ```text
    http://127.0.0.1:8001/topoviewer/harness/
    ```

    For the focused authoring app only:

    ```bash
    npm run vscode:harness
    ```

    Use the printed local URL.

## Authoring Pattern

The productive Harness pattern is small, visible changes:

```text
choose a template or create a new topology
  -> use the canvas tool for the object you want
  -> select the object and refine it in the Inspector
  -> inspect the YAML that was written
  -> repeat
  -> download the bundle
```

The canvas is not a separate drawing layer. A pointer gesture writes
TopoViewer YAML through the same validation path used by the rest of the
project. If a draft YAML edit is invalid, the canvas keeps the last valid graph
instead of destroying the preview.

Use `Save` when the browser should remember the topology across refreshes. Use
`Revert draft` when an editing path is not worth keeping. Use `Download bundle`
when the current topology should become source files.

## What Each Area Does

The toolbar above the canvas is for high-frequency graph authoring: select,
pan, node, link, path, region, shape, and callout.

The Inspector is the detailed object editor. Use it for display names, labels,
data, positions, sizes, path sequences, link endpoints, region membership,
saved presets, and delete operations.

The Build tab is now the fallback structured form for relationships that are
easier to express through exact fields: connection and path creation. Saved
presets appear there only after you create them from the Inspector.

The YAML tab is the source editor for topology, stylesheet, and mapper files.
Use it when you want precise edits, schema assist, or a reviewable diff.

The Attention and Layers tabs are for runtime view control and authoring
metadata. They should not replace topology, stylesheet, or mapper YAML.

## Graph Authoring Guide

The detailed guide is [Graph Authoring](graph-authoring.md). It covers the
toolbar tools, shortcuts, grouping behavior, path reachability rules,
copy/paste, alignment, grid snap, helper lines, and the exact YAML families
written by each action.

## Drag Alignment Helper Lines

Helper lines are enabled by default in the Harness. They appear while an object
is dragged and show horizontal, vertical, or midpoint alignment candidates.
Dragging stays smooth under the pointer and the nearest visible guide is applied
on drag stop.

Helper lines are runtime guides. They do not write topology, stylesheet, or
mapper YAML by themselves. The persisted source of truth is still the bundle
you apply and download.

Use the settings button beside the zoom controls to toggle helper lines or grid
snap while authoring. Use grid snap when you want deterministic spacing; use
helper lines when you want visual alignment without forcing every object onto a
grid.

## Bundle Files

The YAML tab maps directly to the files used by other TopoViewer surfaces:

| Tab | File role | Grafana bundle suffix |
| --- | --- | --- |
| `Topology YAML` | Stable graph objects, layers, labels, data, positions, paths, regions, and attention. | `*.topo.tv.yaml` |
| `Stylesheet YAML` | Icons, label fields, layout options, and selector-driven visual style. | `*.style.tv.yaml` |
| `Mapper YAML` | Runtime telemetry rules that map Grafana data frames to TopoViewer object overlays. | `*.mapper.tv.yaml` |

`Download bundle` validates the draft and writes all three canonical files using
the current graph ID as the filename base.

## YAML Assist

Use `Ctrl+Space` or `Cmd+Space` in the editor for completions. Use `?` at
structural YAML positions for candidate keys and short explanations.

The useful pattern is:

- use the canvas for object placement and common relationship work;
- use assist to insert the correct key or object scaffold;
- keep indentation aligned with the surrounding YAML;
- apply early so diagnostics stay close to the change;
- use the current topology to drive mapper suggestions for object IDs, labels,
  data keys, layers, and endpoints.

## Mapper Authoring

Use `Mapper YAML` when the bundle is intended for Grafana.

The Harness can preview whether mapper rules resolve against the currently
applied topology. It reports matched objects, unmatched rules, ambiguous
endpoint rules, duplicate targets, and stale object references before the bundle
is mounted in Grafana.

Use presets for a starter mapper. Use the rule builder when you know the
telemetry metric but do not want to hand-write the full mapper shape.

## Templates To Start From

The templates are practical starting points, not feature explanations. Open one,
change the graph through the canvas or YAML, apply, and download the result when
the shape is right.

### Layered Network Authoring

Use this when you want layers, service paths, operational links, mapper YAML,
and multiple object families in one editable topology.

```topoviewer
topology: examples/harness/layered-network/topology.yaml
stylesheet: examples/harness/layered-network/stylesheet.yaml
height: 520px
controls: true
controlsOpen: false
helperLines: true
title: Layered network authoring
```

### CLOS 2-Spine 4-Leaf

Use this when you want a small fabric template with spines, leaves, regions, and
straight fabric links.

```topoviewer
topology: examples/harness/clos-2spine-4leaf/topology.yaml
stylesheet: examples/harness/clos-2spine-4leaf/stylesheet.yaml
height: 420px
controls: true
controlsOpen: false
helperLines: true
title: CLOS 2-spine 4-leaf
```

### Canvas Workflow

Use this when you want to practice adding nodes, links, regions, paths, and
notes from the canvas toolbar.

```topoviewer
topology: examples/harness/insert-workflow/topology.yaml
stylesheet: examples/harness/insert-workflow/stylesheet.yaml
height: 520px
controls: true
controlsOpen: false
helperLines: true
title: Canvas workflow
```

### Attention Workflow

Use this when you want to edit focus, dimming, dense-link grouping, and region
aggregation.

```topoviewer
topology: examples/harness/attention-workflow/topology.yaml
stylesheet: examples/harness/attention-workflow/stylesheet.yaml
height: 520px
controls: true
controlsOpen: false
helperLines: true
title: Attention workflow
selectedLayerIds:
  - underlay
  - service
  - operations
```

### Inspector Workflow

Use this when you want to inspect and edit labels, data, positions, and
relationship endpoints across different object types.

```topoviewer
topology: examples/harness/inspector-workflow/topology.yaml
stylesheet: examples/harness/inspector-workflow/stylesheet.yaml
height: 520px
controls: true
controlsOpen: false
helperLines: true
title: Inspector workflow
```

### Dense Link Grouping

Use this when you want to tune parallel-link grouping and bundle threshold
behavior without loading a large topology.

```topoviewer
topology: examples/harness/dense-links/topology.yaml
stylesheet: examples/harness/dense-links/stylesheet.yaml
height: 500px
controls: true
controlsOpen: false
helperLines: true
title: Dense link grouping
```
