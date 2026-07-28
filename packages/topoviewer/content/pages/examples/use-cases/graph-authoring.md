# Graph Authoring

Graph authoring is the Studio workflow for creating and editing a TopoViewer
bundle directly on the canvas. The editor feels familiar to diagram tools, but
the output is still topology-as-code: every supported gesture writes topology,
diagram, or attention YAML that can be reviewed, validated, embedded, and
reused.

Use this guide when you want to build a topology from the canvas instead of
starting in raw YAML.

## Try The Feature

Open TopoViewer Studio:

[https://asadarafat.github.io/topoviewer/studio/](https://asadarafat.github.io/topoviewer/studio/)

Create a small graph:

1. Create a project from the project menu.
2. Drag two Router objects from **Objects** to the canvas.
3. Choose **Link**, then drag between the exposed node connection points.
4. Choose **Path** and select a reachable traversal.
5. Drag a Region from **Annotations** around the nodes.
6. Select an object and edit it in **Edit > Visual**.
7. Open **Properties > Code** to inspect the source Studio wrote.

??? example "Run the same workflow locally"

    ```bash
    npm run docs:preview
    ```

    Open:

    ```text
    http://127.0.0.1:8001/topoviewer/studio/
    ```

    For only the focused authoring app:

    ```bash
    npm run studio:dev
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
primary canvas action. That is why Studio has explicit tools for topology
objects instead of arbitrary whiteboard shapes.

## Canvas Actions

| Action | Entry point | What it does | YAML written |
| --- | --- | --- | --- |
| Select | Canvas toolbar | Select, marquee-select, drag, arrange, duplicate, or delete. | Position, size, selection-driven mutations, or deletes. |
| Pan | Canvas toolbar | Pan without changing selection. | None. |
| Node | Objects palette | Drag a semantic node template onto the canvas. | `graph.nodes[]` with `id`, `layers`, and `position`. |
| Link | Edges palette | Enter one-shot link mode and drag between valid connection points. | `graph.links[]` with `source`, `target`, optional handles, and layers. |
| Path | Edges palette | Select a reachable traversal and confirm it. | `graph.paths[]` with an ordered node sequence. |
| Region | Annotations palette | Drag a region onto the canvas, then move nodes into it. | `graph.regions[]` owns position and membership; an exact stylesheet rule owns width and height. |
| Shape | Annotations palette | Drag a resizable annotation shape onto the canvas. | `diagram.shapes[]` owns identity, position, and layers; an exact stylesheet rule owns geometry, width, height, and rotation. |
| Callout | Annotations palette | Drag a callout and associate it with a target. | `diagram.callouts[]` with `target`, `position`, and layers. |

The tools are intentionally compact. **Edit** carries the detailed fields after
an object exists.

Canvas shortcuts are ignored while the YAML editor, Edit fields, menus, or
other editable controls have focus. In those contexts the focused editor owns
the keyboard.

## Layer Defaults

Canvas-created objects use semantic layer defaults:

- nodes, links, and regions default to `physical`;
- paths default to `paths`;
- shapes and callouts default to `annotations`.

If a document does not declare the preferred layer, Studio falls back to an
existing declared layer instead of writing an undeclared layer ID.

This is separate from the visible layer filter. Hiding a layer in the viewport
does not change the semantic default for newly authored objects.

## Nodes

Use the node tool for fast placement:

1. Open **Objects**.
2. Drag a node template onto the canvas.
3. Select the node.
4. Use Edit to change the object ID, optional display alias, labels, data, position, or
   saved preset.

Studio writes the region facts to `topology.yaml`:

```yaml
nodes:
  - id: node-1
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
4. Select the link if you need to edit endpoints or labels in Edit.

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

Studio enforces graph semantics. A path cannot include a disconnected hop.
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
    labels:
      name: New Region
    members:
      - node-1
      - node-2
    position:
      - 240
      - 120
    layers:
      - physical
```

It writes explicit dimensions to `stylesheet.yaml` in the same undoable command:

```yaml
stylesheet:
  - selector: region[id = "region-1"]
    style:
      width: 360
      height: 220
      draggable: true
      selectable: true
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
      layers:
        - annotations
```

Define the shape geometry and dimensions in `stylesheet.yaml`:

```yaml
stylesheet:
  - selector: shape[id = "shape-1"]
    style:
      shape: rectangle
      width: 180
      height: 96
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
when resize handles are visible. Studio writes every annotation and region
dimension to `stylesheet.yaml`; `topology.yaml` retains only semantic content,
relationships, and positions.

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

Studio uses snap-on-release behavior: the object follows the pointer while
dragging, then settles to the nearest active guide on drag stop. This keeps drag
smooth while still making alignment precise.

Grid snap is a separate authoring setting. Use helper lines for relative visual
alignment. Use grid snap when you want repeatable numeric spacing.

## Objects And Edit

The Objects workspace is the primary creation surface. The visual Edit
workspace is the structured path for exact topology and appearance values:

- palette templates for common topology and annotation objects;
- saved presets after a useful object has been configured;
- exact source values in **Properties > Code** when direct manipulation is not enough.

Edit is the detailed editor for selected objects. Use it to edit:

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
the Code workspace contains an invalid draft, Studio shows diagnostics and keeps
the last valid canvas visible.

That behavior is intentional. It prevents a broken draft from corrupting the
rendered graph and it prevents canvas actions from silently rewriting invalid
text that the user still needs to fix.

The normal recovery loop is:

1. Fix the YAML diagnostic.
2. Apply the valid draft.
3. Return to the canvas.
4. Continue authoring.

## What Is Not A Canvas Action

Some TopoViewer concepts remain Code-first or Edit-first:

- stylesheet selector policy;
- mapper rules for telemetry overlays;
- detailed attention configuration;
- unsupported freeform drawing primitives;
- arbitrary route segments with no graph reachability;
- custom import or source-of-truth conversion.

That boundary is deliberate. Studio should make common graph authoring
fast without hiding the topology model from the user.
