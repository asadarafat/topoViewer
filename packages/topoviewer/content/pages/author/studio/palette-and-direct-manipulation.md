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
creates `diagram.texts[]`; it does not create a graph node or change reachability.

Creating a path does not invent missing graph reachability. Select exactly two
connected nodes and choose the route beside **Path**: shortest traversal,
selected order, or loose endpoints. Studio blocks a path when the required
links do not exist. Route choice belongs to this Path workflow rather than a
global viewport setting.

## Direct Canvas Operations

- Drag a node or annotation to move it. Source position commits once on release.
- Use native resize handles for nodes, regions, shapes, callouts, and text that
  expose geometry. The complete corner target stays inside the object boundary,
  so starting a resize cannot accidentally begin a move.
- Double-click a node, link, link direction, path, region, shape, callout, or
  text object to edit its canonical displayed name, label, title, or text. The
  anchored editor commits through the YAML command history; `Escape` cancels it.
- Drag from a valid connection handle to another node to create a link. Repeat
  the gesture to create a parallel link; TopoViewer assigns deterministic lanes.
- Drag between a callout and a node to attach the callout's canonical leader.
  This updates the callout target and does not create a graph link.
- Use marquee selection or additive click for multi-object commands.
- Copy, cut, paste, duplicate, delete, nudge, align, and distribute selected
  objects from the canvas toolbar or scoped shortcuts.
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

Open **Layers** from its dedicated canvas-toolbar button to create, rename,
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
