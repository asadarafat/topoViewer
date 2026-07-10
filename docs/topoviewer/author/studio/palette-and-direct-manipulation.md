# Palette And Direct Manipulation

**Support status:** Experimental

The Object palette is the shortest path from intent to a valid TopoViewer
object. Drag a template to an exact canvas position. Keyboard users can focus a
template and press `Enter` to place it at a deterministic visible position.

## Object Families

The palette creates nodes, paths, regions, shapes, callouts, local assets, and
saved presets. Nodes and links join the `physical` layer by default. Paths use
the `paths` layer. Shapes and callouts use the `annotations` layer.

Creating a path does not invent missing graph reachability. Select a connected
sequence or use deterministic shortest-path creation. Studio blocks a path when
the required links do not exist.

## Direct Canvas Operations

- Drag a node or annotation to move it. Source position commits once on release.
- Use native resize handles for nodes, regions, shapes, and callouts that expose
  geometry.
- Drag from a valid connection handle to another node to create a link.
- Use marquee selection or additive click for multi-object commands.
- Copy, cut, paste, duplicate, delete, nudge, align, and distribute selected
  objects from the canvas toolbar or scoped shortcuts.
- Drag a node into a region to preview membership. Use the object context menu
  to release it without deleting either object.

Helper lines and grid snap are transient authoring aids. They affect the final
position but do not serialize private guide objects. Active drag remains in the
renderer and writes YAML only after release.

## Regions As Groups

Regions provide explicit semantic membership rather than visual rectangles
placed behind unrelated nodes. Group movement preserves relative member
positions. Collapse produces a recoverable aggregate; expanding restores the
members. Region nesting requires an explicit group action so accidental overlap
does not silently create hierarchy.

On a narrow viewport, open and close the palette and Inspector from the header.
They become contextual side panels so they do not permanently reduce canvas
space.
