Card node layout is for nodes that need to read like compact operational
records instead of plain device glyphs.

The node is still a `roundRectangle`. The nested `nodeLayout` object only
changes the internal arrangement: icon box on the left, title and subtitle on
the right, and an optional badge attached to the icon. This keeps the shape
contract stable while making the YAML easier to read than a long flat list of
card-specific style keys.

Use this pattern for service maps, application dependencies, Kubernetes
objects, or operations views where every node needs a name plus one short piece
of metadata.
