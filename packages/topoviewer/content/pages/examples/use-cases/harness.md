# Harness

The Harness is the quickest way to author a TopoViewer bundle: topology YAML,
stylesheet YAML, and optional mapper YAML beside a live canvas.

**Support status:** Experimental

## Try It Now

Open the published Harness:

[https://asadarafat.github.io/topoviewer/harness/](https://asadarafat.github.io/topoviewer/harness/)

Use it when you want to test an idea before wiring TopoViewer into React,
MkDocs, Zensical, or Grafana.

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

## Fast Authoring Loop

Start with a template, make one change, apply it, and inspect the result.

1. Pick `Layered network authoring` or `CLOS 2-spine 4-leaf`.
2. Open the `YAML` tab.
3. Edit `Topology YAML` for objects: nodes, links, paths, regions, layers, labels, and data.
4. Edit `Stylesheet YAML` for visual policy: icons, labels, shape, color, links, regions, and layout.
5. Edit `Mapper YAML` only when you want Grafana runtime overlays.
6. Press `Apply`.
7. If diagnostics appear, click the diagnostic, fix the line, and apply again.
8. Drag nodes only when the layout is manual or pinned. Alignment helper lines
   appear during drag so nearby nodes, regions, and midpoint guides are easier
   to snap into place.
9. Use `Download bundle` when the current topology should become source files.

The canvas keeps the last valid applied document. A broken draft should show
diagnostics without destroying the current rendered graph.

## UX Pattern

The productive Harness pattern is small, repeated edits:

```text
choose template
  -> edit one YAML concern
  -> apply
  -> inspect canvas and diagnostics
  -> repeat
  -> download bundle
```

Use `Revert draft` when an edit path is not worth saving. Use `Save` only when
the browser should remember the topology across refreshes. Use export only after
the render is valid.

## Drag Alignment Helper Lines

Drag alignment helper lines are runtime guides for manual layout work. They
appear while an object is being dragged and show when the dragged object is
aligned with another node, region, or midpoint. When snapping is enabled, the
dragged object snaps to the visible guide before the drag-stop position is
reported to the host surface.

They are intentionally not YAML syntax. Helper lines do not write topology,
stylesheet, or mapper files by themselves. The persisted source of truth is
still the bundle you apply and download.

In the Harness, helper lines are enabled by default for the authoring canvas.
Use them when the layout is manual or pinned and you want to line up nodes,
regions, or service objects without guessing by eye. The productive pattern is:

1. Switch to a manual or pinned layout.
2. Drag one object near another object.
3. Watch for horizontal, vertical, or midpoint guide lines.
4. Release the drag when the object snaps into the intended alignment.
5. Apply or download the bundle only when the rendered layout is the layout you want.

In MkDocs and Zensical live examples, helper lines are enabled by default and
can be toggled from the viewport settings button beside the zoom controls. The
toggle is runtime-only: it does not change the fenced block, topology YAML, or
stylesheet YAML. Page authors can still set `helperLines: false` to start a
block with helper lines off, or provide an object to tune snapping.

In Grafana, helper lines are also runtime-only. They appear only when the panel
allows local interaction and node dragging. New panels default both settings to
enabled, so helper lines are available by default during local exploration. If a
dashboard owner disables interaction or node dragging, helper lines disappear
with the drag affordance.

Grafana stores dragged positions as panel interaction state when configured to
persist them. It does not mutate mounted `*.topo.tv.yaml`,
`*.style.tv.yaml`, or `*.mapper.tv.yaml` files.

React hosts can enable the same behavior with the `helperLines` prop:

```tsx
<TopoViewer
  document={document}
  nodesDraggable
  helperLines={{
    enabled: true,
    snap: true,
    threshold: 5,
    showMidpoints: true
  }}
/>
```

MkDocs and Zensical live examples enable the same runtime behavior by default.
Use `helperLines: false` when a read-only documentation example should not show
drag guides:

```yaml
helperLines: false
```

Use the object form when a documentation page needs different snapping behavior:

```yaml
helperLines:
  enabled: true
  snap: true
  threshold: 5
  showMidpoints: true
```

Use `threshold` to control how close a dragged object must be before a guide is
considered active. Use `showMidpoints` when the authoring workflow benefits from
centering an object between nearby objects.

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

Use `Presets` for a starter mapper. Use the rule builder when you know the
telemetry metric but do not want to hand-write the full mapper shape.

## Templates To Start From

The templates are practical starting points, not feature explanations. Open one,
change the YAML, apply, and then download the result when the shape is right.

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

### Insert Workflow

Use this when you want to practice adding nodes, links, regions, paths, and
notes from the Build panel.

```topoviewer
topology: examples/harness/insert-workflow/topology.yaml
stylesheet: examples/harness/insert-workflow/stylesheet.yaml
height: 520px
controls: true
controlsOpen: false
helperLines: true
title: Insert workflow
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
