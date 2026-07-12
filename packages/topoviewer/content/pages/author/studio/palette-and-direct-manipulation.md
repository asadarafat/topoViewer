# Palette And Direct Manipulation

**Support status:** Experimental

The Object palette is the shortest path from intent to a valid TopoViewer
object. Drag a template to an exact canvas position. Keyboard users can focus a
template and press `Enter` to place it at a deterministic visible position.

## Object Families

The palette is grouped by canonical object family: Nodes, Paths, Regions,
Shapes, Callouts, standalone Text, and saved Presets. Each family contains compatible templates.
For example, **Basic node** creates an unopinionated node while **Router** and
**Switch** preview and create trusted local SVG-backed nodes. A visual template
also adds its icon declaration to `stylesheet.yaml` when the opened project
does not already provide that key. The resulting bundle therefore remains
self-contained instead of depending on a Studio-only asset catalog.

Nodes and links join the `physical` layer by default. Paths use the `paths`
layer. Shapes, callouts, and text use the `annotations` layer. A text template
creates `diagram.texts[]`; it does not create a graph node or change reachability.

Creating a path does not invent missing graph reachability. Select a connected
sequence or use deterministic shortest-path creation. Studio blocks a path when
the required links do not exist.

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

Helper lines and grid snap are transient authoring aids. They affect the final
position but do not serialize private guide objects. Active drag remains in the
renderer and writes YAML only after release.

Active resize is transition-free so the pointer and geometry remain coupled.
After release, Studio uses a brief outline cue to confirm the commit. The cue is
disabled when the operating system requests reduced motion. Keyboard users can
resize one selected object with `Alt` plus an arrow key.

Open **Layers** from its dedicated canvas-toolbar button to create, rename,
reorder, filter, assign, or safely delete topology layers. Viewport behavior and
overlay toggles remain under **Viewport settings**.

## Regions As Groups

Regions provide explicit semantic membership rather than visual rectangles
placed behind unrelated nodes. Group movement preserves relative member
positions. Collapse produces a recoverable aggregate; expanding restores the
members. Region nesting requires an explicit group action so accidental overlap
does not silently create hierarchy.

On a narrow viewport, open and close the palette and Inspector from the header.
They become contextual side panels so they do not permanently reduce canvas
space.
