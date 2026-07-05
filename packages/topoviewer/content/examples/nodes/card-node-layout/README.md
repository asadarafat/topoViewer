Card node layout is for nodes that need to read like compact operational
records instead of plain device glyphs.

The node is still a `roundRectangle`. The nested `nodeLayout` object only
changes the internal arrangement: icon box on the left, title and subtitle on
the right. Badges and status markers stay node-level controls, so a card can
keep a TurboFlow-style badge on the top-right shell while its icon cell renders
either a glyph or an inline SVG. Use the badge size keys when the compact
defaults are too small for the card body.

Use this pattern for service maps, application dependencies, Kubernetes
objects, or operations views where every node needs a name plus one short piece
of metadata.
