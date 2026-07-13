# Style Workspace

**Support status:** Experimental

Studio separates workspace-wide authoring from selection-scoped object fields.
Use the vertical rail at the left edge of Studio to switch between:

- **Topo** for the object palette and edge templates;
- **Object** for selected-object identity, geometry, labels, data, and layers;
- **Style** for reusable `stylesheet.yaml` rules, selected-object
  `topology.yaml` overrides, and the combined effective cascade;
- **Viewport** for canvas presentation and interaction preferences;
- **Mapper** for the rule-oriented `mapper.yaml` workflow.

Object follows canvas selection and edits object-owned `topology.yaml` fields.
Selecting an existing object while Topo is active opens Object. Selection while
Style, Viewport, or Mapper is active updates their context without changing the
active workspace. Palette placement remains in Topo so authors can place several
objects without repeatedly reopening the palette.

Generated controls come from canonical authoring metadata so schema, YAML
assistance, Studio, and future hosts do not maintain separate field lists.
The workspace rail uses standard keyboard tab behavior and retains a visible
active indicator. `ArrowUp` and `ArrowDown` move through the vertical workspace
rail.

## Attribute Disclosure

Common task-oriented fields appear immediately. Choose **View More** to reveal
the remaining supported attributes in the same Default, Rule, and This object
matrix. Choose **View Less** to return to the compact list. There is no separate
field mode to learn.

Search always covers common and less-common fields. It matches canonical key,
label, description, alias, and group without requiring View More first. Nested
contracts such as card layout render as one coherent editor rather than
disconnected raw keys.

## Typed Controls

Studio uses Material switches for booleans, selects for enumerations, number
inputs for bounded values, color controls for colors, and structured editors for
nested or list values. Invalid input remains visible with an associated error
and is not committed silently.

Every field declared as a canonical `color` has both a visual color well and an
exact text input. The text input remains authoritative for CSS variables,
named colors, shorthand hex, and RGB(A) values. Studio preserves that source
text until the color well is changed; choosing a color from the well writes a
normalized six-digit hex value. Mapper state-style fields use the same editor.

Open a field's overflow menu and choose **Write default** when the default value
must be explicit. Choose **Unset value** to remove it and return to inherited
behavior. Menu actions retain their full text width; they are not constrained by
the compact icon trigger. Arrow keys move between open menu actions and
`Escape` closes the menu and restores focus to its trigger.

In Style, every attribute row compares **Default**, **Rule**, and **This
object**. Default and Rule write reusable policy to `stylesheet.yaml`; This
object writes a deliberate selected-object exception to `topology.yaml`.
Selecting a cell opens the same generated typed editor beneath the row while
preserving the other two values for comparison. Opening a cell is read-only:
Studio creates a missing default rule only when a value is committed, in the
same undo transaction.

Choose a **Rule** cell to reveal selector selection, match impact, and
lifecycle actions for that attribute. Keeping these controls contextual avoids
a permanent second toolbar above the matrix. This object is unavailable when
there is no compatible canvas selection. The Style context header derives its
object kind from canvas selection rather than exposing a redundant target
dropdown.

## Personal Field Profiles

Fields can be shown in the main list, moved behind View More, reordered, or
hidden locally from the same overflow menu. These sparse, versioned preferences
do not alter project YAML. Expand **Customize fields** to restore hidden fields
or reset the profile.

Multi-selection exposes only compatible shared fields. A bulk edit is one undo
transaction and previews the affected object count before source mutation.
