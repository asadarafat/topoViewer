# Graph Authoring

Graph authoring is the Harness workflow for creating and editing a TopoViewer
bundle directly on the canvas. The editor feels familiar to diagram tools, but
the output is still topology-as-code: every supported gesture writes topology,
diagram, or attention YAML that can be reviewed, validated, embedded, and
reused.

Use this guide when you want to build a topology from the canvas instead of
starting in raw YAML.

## Try The Feature

Open the published Harness:

[https://asadarafat.github.io/topoviewer/harness/](https://asadarafat.github.io/topoviewer/harness/)

Create a small graph:

1. Click `New topology`.
2. Press `N`, then click the canvas twice to create two nodes.
3. Press `L`, then drag from the first node to the second node.
4. Press `P`, click both nodes, then press `Enter` to create a path.
5. Press `G`, then drag around the nodes to create a region.
6. Select an object and edit it in the Inspector.
7. Open the YAML tab to inspect what the canvas wrote.

??? example "Run the same workflow locally"

    ```bash
    npm run docs:preview
    ```

    Open:

    ```text
    http://127.0.0.1:8001/topoviewer/harness/
    ```

    For only the focused authoring app:

    ```bash
    npm run vscode:harness
    ```

## Mental Model

The canvas is not a throwaway drawing surface. The authoring path is:

```text
pointer or keyboard action
        -> TopoViewer mutation
        -> validated YAML
        -> rendered graph
```

If an action cannot be represented as clean TopoViewer YAML, it should not be a
primary canvas action. That is why the Harness has explicit tools for topology
objects instead of arbitrary whiteboard shapes.

## Toolbar Tools

| Tool | Shortcut | What it does | YAML written |
| --- | --- | --- | --- |
| Select | `V` | Select, marquee-select, drag, arrange, duplicate, delete. | Position, size, selection-driven mutations, or deletes for selected objects. |
| Pan | `H` | Pan the viewport. | None. |
| Node | `N` | Click the canvas to create a generic node. | `graph.nodes[]` with `id`, `name`, `layers`, and `position`. |
| Link | `L` | Drag between nodes to create a connection. | `graph.links[]` with `source`, `target`, optional handles, and authoring layers. |
| Path | `P` | Click reachable nodes in sequence, then press `Enter` or `Create path`. | `graph.paths[]` with an ordered node sequence. |
| Region | `G` | Drag bounds around nodes or click empty canvas to create a region container. | `graph.regions[]` with `position`, `size`, `members`, and layers. |
| Shape | `D` | Click the canvas to create a resizable annotation shape. | `diagram.shapes[]` with `position`, `size`, and layers. |
| Callout | `A` | Select a target, then click the canvas to place a note. | `diagram.callouts[]` with `target`, `position`, and layers. |

The tools are intentionally compact. The Inspector carries the detailed fields
after an object exists.

Canvas shortcuts are ignored while the YAML editor, Inspector fields, menus, or
other editable controls have focus. In those contexts the focused editor owns
the keyboard.

## Layer Defaults

Canvas-created objects use semantic layer defaults:

- nodes, links, and regions default to `physical`;
- paths default to `paths`;
- shapes and callouts default to `annotations`.

If a document does not declare the preferred layer, the Harness falls back to an
existing declared layer instead of writing an undeclared layer ID.

This is separate from the visible layer filter. Hiding a layer in the viewport
does not change the semantic default for newly authored objects.

## Nodes

Use the node tool for fast placement:

1. Press `N`.
2. Click the canvas.
3. Select the node.
4. Use the Inspector to change the display name, labels, data, position, or
   saved preset.

The YAML shape is:

```yaml
nodes:
  - id: node-1
    name: New Node
    layers:
      - physical
    position:
      - 320
      - 180
```

Dragging a node commits a single YAML position change on drag stop. Helper lines
and grid snap can affect the committed position, but they do not create extra
objects.

## Links

Use the link tool when the connection should be a graph edge:

1. Press `L`.
2. Drag from one node to another node.
3. Drop on a valid target.
4. Select the link if you need to edit endpoints or labels in the Inspector.

The YAML shape is:

```yaml
links:
  - id: link-1
    source: node-1
    target: node-2
    layers:
      - physical
```

Dropping on empty canvas cancels the link. Parallel links receive deterministic
IDs and do not overwrite existing links.

The runtime renderer may normalize visual direction for stable rendering, but
the authored relationship remains a topology link between two known objects.

## Paths

A path is not the same thing as a link. A link is a graph edge. A path is an
ordered route, service path, tunnel intent, or traversal through the graph.

Use the path tool when the object should be a topology path:

1. Press `P`.
2. Click the first node.
3. Click each reachable node in sequence.
4. Press `Enter` or click `Create path`.
5. Press `Escape` to cancel the pending sequence.

The YAML shape is:

```yaml
paths:
  - id: path-1
    sequence:
      - node-1
      - node-2
    layers:
      - paths
```

The Harness enforces graph semantics. A path cannot include a disconnected hop.
If two adjacent path nodes are directly linked, the path reads as an overlay on
that graph link. If the graph proves reachability through other links, the path
can represent a loose or tunnel-like segment without creating phantom links.

This keeps network patterns such as service paths, IGP shortcuts, Binding SID
tunnels, or loose Segment Routing transport paths expressible without corrupting
the base graph.

## Regions

Regions are durable topology group containers. They are not just decorative
background rectangles.

Use the region tool in two ways:

- drag bounds around positioned nodes to create a region with members;
- click empty canvas to create an empty explicit region container.

The YAML shape is:

```yaml
regions:
  - id: region-1
    name: New Region
    members:
      - node-1
      - node-2
    position:
      - 240
      - 120
    size:
      width: 360
      height: 220
    layers:
      - physical
```

Dragging a node into a region assigns membership on drag stop. Dragging a node
out does not silently remove it from the region because ordinary layout cleanup
should not destroy topology grouping. To release a node, open the node context
menu and choose the release-from-region action.

Clicking the region collapse control updates `attention.aggregate.expandedGroupIds`.
The collapse state is YAML-backed, not hidden browser state.

## Shapes And Callouts

Shapes and callouts are diagram annotations. They are useful for labels,
operational notes, visual framing, and explanation, but they do not replace
topology nodes, links, paths, or regions.

Use shapes for standalone visual annotations:

```yaml
diagram:
  shapes:
    - id: shape-1
      position:
        - 420
        - 260
      size:
        width: 180
        height: 96
      layers:
        - annotations
```

Use callouts when a note should point at a topology object:

```yaml
diagram:
  callouts:
    - id: callout-1
      target: node-1
      position:
        - 560
        - 240
      layers:
        - annotations
```

Shapes, callouts, and explicit region containers can be resized from the canvas
when resize handles are visible.

## Selection And Arrangement

The select tool is the normal editing mode.

Use these actions after selecting objects:

- drag selected objects to move them as one undoable transaction;
- drag empty canvas to marquee-select positioned objects;
- press `Delete` or `Backspace` to delete selected objects;
- press `Cmd+C` or `Ctrl+C` to copy;
- press `Cmd+V` or `Ctrl+V` to paste;
- press `Cmd+D` or `Ctrl+D` to duplicate;
- use arrow keys to nudge selected objects;
- hold `Shift` with arrow keys for a larger nudge.

When multiple positioned objects are selected, the arrangement strip appears:

- `Align left`, `Center`, `Align right`;
- `Align top`, `Middle`, `Align bottom`;
- `Distribute H`, `Distribute V`;
- `Snap`.

These commands write deterministic position changes back to YAML. If grid snap
is enabled, arrangement and nudge commands use the active grid size.

## Helper Lines And Grid Snap

Helper lines are visual alignment guides. They appear during drag when an object
is near another object's horizontal, vertical, or midpoint alignment.

The Harness uses snap-on-release behavior: the object follows the pointer while
dragging, then settles to the nearest active guide on drag stop. This keeps drag
smooth while still making alignment precise.

Grid snap is a separate authoring setting. Use helper lines for relative visual
alignment. Use grid snap when you want repeatable numeric spacing.

## Build Rail And Inspector

The Build tab is not the primary creation surface anymore. It is the structured
fallback for relationship forms:

- `Insert Connection` when exact source and target fields are faster than
  dragging;
- `Insert Path` when exact source, transit, and target fields are faster than
  clicking the path sequence;
- saved presets after an object has been saved from the Inspector.

The Inspector is the detailed editor for selected objects. Use it to edit:

- display names;
- labels and data;
- node positions;
- link endpoints;
- path source, transit nodes, and target;
- region membership;
- shape, callout, and region geometry;
- delete operations.

## YAML Safety

Canvas mutations run only against the last valid applied topology document. If
the YAML tab contains an invalid draft, the Harness shows diagnostics and keeps
the last valid canvas visible.

That behavior is intentional. It prevents a broken draft from corrupting the
rendered graph and it prevents canvas actions from silently rewriting invalid
text that the user still needs to fix.

The normal recovery loop is:

1. Fix the YAML diagnostic.
2. Press `Apply`.
3. Return to the canvas.
4. Continue authoring.

## What Is Not A Canvas Action

Some TopoViewer concepts remain YAML-first or Inspector-first:

- stylesheet selector policy;
- mapper rules for telemetry overlays;
- detailed attention configuration;
- unsupported freeform drawing primitives;
- arbitrary route segments with no graph reachability;
- custom import or source-of-truth conversion.

That boundary is deliberate. The Harness should make common graph authoring
fast without hiding the topology model from the user.
