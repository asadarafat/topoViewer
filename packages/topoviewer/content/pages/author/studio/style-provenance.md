# Style Provenance

**Support status:** Experimental

A rendered value may come from a default, one or more ordered stylesheet rules,
an object-specific override, or a runtime mapper overlay. Studio exposes that
cascade so a local exception does not accidentally become shared policy and a
shared policy change is not buried inside one topology object.

The Style panel presents each canonical attribute as one row with three authored
sources:

- **Default** edits the bare target rule, such as `node`, in `stylesheet.yaml`;
- **Rule** edits the chosen selector rule, such as
  `node[labels.role = "core"]`, in `stylesheet.yaml`;
- **This object** edits the selected object's inline `style` in `topology.yaml`.

Choose a cell to expand the typed editor for exactly that attribute and source.
The three values remain visible together, so a local exception does not hide
the policy it overrides. A dash means that source does not define the
attribute. Default values shown in italics come from canonical authoring
metadata and are not written until changed or explicitly written.

Later matching selectors override earlier selectors, then This object wins over
the authored stylesheet. Unset a This object value to reveal the inherited
result again.
Studio never copies one edit into multiple sources.

The selector control lists every specific rule compatible with the target kind,
including rules that do not currently match the selected object. Its actions
create, rename, duplicate, move, and delete selectors as undoable stylesheet
changes. The affected-object count and IDs show current impact before a shared
field changes. Canvas selection establishes the object kind shown in the Style
context header, so the panel does not repeat that choice as another target
control. With no selected canvas object, Studio retains the last compatible
kind for reusable-rule work while This object is disabled.

When an object is selected, Studio suggests selectors for its kind, stable ID,
and labels. Prefer a stable low-cardinality label for reusable policy:

```yaml
- selector: 'node[labels.role = "core"]'
  style:
    shape: roundRectangle
    backgroundColor: "#123456"
```

If a bare Default rule does not exist, Studio inserts it before specific rules
for that target. This preserves the stylesheet contract: broad defaults establish
policy first and later selectors refine it.

Unknown future fields are preserved during unrelated structured edits. Studio
lists them under the source that owns them and can open their exact YAML range
rather than deleting or pretending to understand them.

Mapper state styles are runtime overlays. They should override only values that
change with telemetry; stable shape, icon, label, and layout policy remains in
`stylesheet.yaml`.
