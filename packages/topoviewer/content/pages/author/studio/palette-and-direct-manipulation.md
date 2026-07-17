# Palette And Direct Manipulation

**Support status:** Experimental

The Object palette is the shortest path from intent to a valid TopoViewer
object. Drag a template to an exact canvas position. Keyboard users can focus a
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
- For Bezier links, use **Control point distance** to set the bend,
  **Control point weight** to move the bend along the route, and **Control point
  step** to separate same-endpoint parallel lanes.
- Drag between a callout and a node to attach the callout's canonical leader.
  This updates the callout target and does not create a graph link.
- Use marquee selection or additive click for multi-object commands.
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

Open **Layers** from the unified canvas toolbar to create, rename,
reorder, filter, assign, or safely delete topology layers. Viewport behavior and
overlay toggles remain under **Viewport**. Fixed canvas dimensions and
presentation overrides are available under **Advanced viewport** so they do not
compete with background, grid, and alignment controls during normal authoring.
Studio defers automatic fit-on-open for dense projects because fitting the whole
graph would defeat viewport culling. Use the canvas **Fit** command when a full
overview is explicitly needed.

## Regions As Groups

Regions provide explicit semantic membership rather than visual rectangles
placed behind unrelated nodes. Group movement preserves relative member
positions. Collapse produces a recoverable aggregate; expanding restores the
members. Region nesting requires an explicit group action so accidental overlap
does not silently create hierarchy.

On a narrow viewport, open and close the active workspace from the header. The
workspace rail still selects Topo, Object, Style, Viewport, or Mapper; the panel
becomes a contextual overlay so it does not permanently reduce canvas space.
