# Palette And Direct Manipulation

**Support status:** Beta Preview

The preview-local Add drawer is the shortest path from intent to a valid
TopoViewer object. Open **Object drawer** under Authoring in project source,
then drag a template to an exact preview position. Keyboard users can focus a
template and press `Enter` to place it at a deterministic visible position.

## Object Families

The palette is grouped into Nodes, Edges, Annotations, and saved Presets.
Nodes include **Router**, **Controller**, **Service**, and **Parent with
children** templates. Edges include **Link**, **Parallel link**, **Parent link
pipe**, **Path**, and **Directional traffic**. Annotations include **Region**,
**Shape**, **Callout**, and **Text**.

Visual node templates preview and create trusted local SVG-backed objects. A
template also adds its icon declaration to `stylesheet.yaml` when the opened
project does not already provide that key. The resulting bundle therefore
remains self-contained instead of depending on a Studio-only asset catalog.

Drag a placeable object to an exact canvas position or activate it to create at
a deterministic visible position. Creation completes immediately; Studio does
not leave Router, Region, Shape, Callout, Text, or Preset looking like a mode
after the object exists.

Relationship templates are different. **Link**, **Parallel link**, **Parent
link pipe**, and **Directional traffic** enter a temporary edge-authoring mode.
Valid endpoints become available until one relationship is created, the tool is
activated again, or `Escape` cancels it.

Nodes and links join the `physical` layer by default. Paths use the `paths`
layer. Shapes, callouts, and text use the `annotations` layer. A text template
creates `diagram.texts[]`; it does not create a graph node, expose link
endpoints, or change reachability. Studio declares a missing default layer in
the same undoable creation transaction instead of leaving an invalid reference.

Creating a path does not invent missing graph reachability. Select exactly two
connected nodes and choose the route beside **Path**: shortest traversal,
selected order, or loose endpoints. Studio blocks a path when the required
links do not exist. Route choice belongs to this Path workflow rather than a
global viewport setting.

## Saved Objects

Select one node, link, or annotation and choose **Save to Object Palette** from the
unified canvas toolbar or object context menu. Studio snapshots the object's effective
appearance and any referenced icon, then stores it as a reusable palette item
across browser reloads and projects. Use the saved item's overflow menu to
rename or delete it.

Saved objects keep labels, data, layers, dimensions, handles, content, and
visual policy. They do not keep the source ID, canvas position, parent,
region membership, or callout attachment. Each insertion therefore receives a
fresh ID and position without creating dangling references.

A saved link appears as an edge template rather than a draggable object. Activate
it, then connect two valid node endpoints. Studio creates a fresh link with the
saved labels, data, layers, direction definitions, and effective appearance, but
uses the new source, target, and handles. Paths remain graph-specific and cannot
be saved as presets.

## Format Painter

Select one object and choose **Copy formatting** from the canvas toolbar. Studio
enters a one-shot Format Painter mode. Select another object of the same kind to
copy the source object's effective appearance without copying its ID, name,
labels, data, layers, relationships, or mapper state. Select empty canvas or
press `Escape` to cancel.

Format Painter writes the target appearance as an exact-ID stylesheet rule. If
the target uses imported inline visual values, move those values to
`stylesheet.yaml` first so the copied rule has one unambiguous owner.

## Direct Canvas Operations

- Drag a node or annotation to move it. Source position commits once on release.
- Use native resize handles for nodes, regions, shapes, callouts, and text that
  expose geometry. The complete corner target stays inside the object boundary,
  so starting a resize cannot accidentally begin a move.
- Double-click a node, link, link direction, path, region, shape, callout, or
  text object to edit its canonical displayed name, label, title, or text. Text
  opens a safe rich-text workspace with formatting controls and a rendered
  preview; its YAML remains portable Markdown rather than stored HTML. The
  anchored editor commits through the YAML command history; `Escape` cancels it.
- New text auto-fits its rendered content. A manual resize writes an explicit
  `size` tuple; undoing that resize returns the object to content-fit sizing.
- Drag from a valid connection handle to another node to create a link. Repeat
  the gesture to create a parallel link; TopoViewer assigns deterministic lanes.
- For Bezier links, use **Control point distance** to set the base bend,
  **Control point weight** to move the bend along the route, and **Control point
  step** to separate same-endpoint parallel lanes around that bend.
- Drag between a callout and a node to attach the callout's canonical leader.
  This updates the callout target and does not create a graph link.
- Use marquee selection or additive click for multi-object commands. Right-click
  the native selection box, or press `Shift+F10`, to open bulk actions without
  collapsing the selection. The menu exposes Align and Distribute as a submenu;
  Duplicate and Delete state the number of affected objects before they run.
- Copy, cut, and paste selected objects with scoped keyboard shortcuts. The
  object context menu keeps only Duplicate, Save to Object
  Palette, contextual structure actions, and Delete.
- Drag a node into a region to preview membership. Use the object context menu
  to release it without deleting either object.

**Alignment assistance** enables helper lines and alignment snapping together.
These transient authoring aids affect the final position but do not serialize
private guide objects. Active drag remains in the renderer and writes YAML only
after release.

Active resize is transition-free so the pointer and geometry remain coupled.
After release, Studio uses a brief outline cue to confirm the commit. The cue is
disabled when the operating system requests reduced motion. Keyboard users can
resize one selected object with `Alt` plus an arrow key.

## Layer Authoring

Open **Project Source**, then expand **Topology outline > Layers**. The collapsed
row shows the number of declared layers and keeps **Add layer** visible. Expanding
the row opens the manager without changing the active source document. Choose
**View YAML** when you explicitly want `topology.yaml` focused at
`graph.layers`.

**Add layer** asks for a display name before changing the project and previews
the collision-safe ID that Studio will write. Each layer row shows how many
graph and diagram objects reference it. Select the row to inspect the layer,
double-click its name to rename it, or open its action menu to assign the current
selection, reorder the layer, or delete it with an explicit replacement. Studio
protects the final declared layer and prevents an object from losing its final
layer membership.

Layer definitions and object membership are portable `topology.yaml` data.
Visibility checkboxes are view state: they filter the current preview without
rewriting project source. When a YAML draft is invalid, Studio keeps expansion,
source navigation, selection, and visibility available but disables actions
that would mutate the last valid topology behind the draft.

## Attention Authoring

Open **Project Source**, then expand **View policies > Attention**. Attention is
one optional, project-level policy in `topology.yaml`, so it is separate from
the topology object outline. Its row shows **Not set** or the number of active
features and never exposes an Add button. Expanding the row does not change the
current source document, canvas selection, or project history.

When compatible objects are selected, object **Properties > Attention** exposes
shortcuts to focus the selection, add it to or remove it from the focused set,
aggregate one selected region or parent, and open the complete policy. These
are contextual commands over the same project-level policy, not per-object
Attention settings. Global presentation modes, click behavior, parallel-link
grouping, advanced clauses, and policy removal remain in **View policies** or
the owning YAML.

Use **Focus canvas selection** to focus selected nodes, edges, link directions,
paths, or regions by their stable IDs. Unsupported diagram annotations are
ignored. You can also choose focused objects directly, set **Focus mode** to
Highlight, Dim context, or Hide context, and enable **Interactive click focus**
with its own click mode. Every accepted action updates the preview immediately
and creates one undoable topology command.

The **Aggregation** section accepts one selected region or one parent node that
has children. **Aggregate selected structure** creates a deterministic group,
then exposes whether that group starts expanded, whether aggregate objects
expand on click, and a group removal action. Removing a group does not remove
its source region, parent, or members.

The **Parallel links** section controls link grouping, the minimum link count,
grouping by endpoints and/or layer, an optional link selector, and click
expansion. These settings own `attention.links.grouping`; they do not create or
delete links.

Visual Attention intentionally covers the common workflow only. Existing
label, data, path, region, selector, dependency, change, and viewport criteria
remain preserved and are reported as additional YAML policy. Choose **View
attention YAML** to edit those fields in the shared schema-aware source
workspace. **Remove attention** requires confirmation because it removes the
complete top-level policy, including advanced clauses.

When an unapplied topology draft is invalid, Attention remains visible and
**View attention YAML** remains available, but every visual source mutation is
disabled. Correct or revert the draft first; Studio never applies a visual
change over stale valid topology. Undo and redo restore the complete previous
and next Attention policy.

Select empty canvas to open canvas **Properties** for viewport behavior and
overlay toggles. Fixed canvas dimensions and presentation overrides are
available under **Advanced viewport** so they do not compete with background,
grid, and alignment controls during normal authoring.
Studio defers automatic fit-on-open for dense projects because fitting the whole
graph would defeat viewport culling. Use the canvas **Fit** command when a full
overview is explicitly needed.

## Regions As Groups

Regions provide explicit semantic membership rather than visual rectangles
placed behind unrelated nodes. Group movement preserves relative member
positions. Collapse produces a recoverable aggregate; expanding restores the
members. Region nesting requires an explicit group action so accidental overlap
does not silently create hierarchy.

On a narrow viewport, project source and contextual authoring use accessible
temporary MUI drawers. Source and Preview remain separately reachable, and no
permanent rail reduces the canvas.
