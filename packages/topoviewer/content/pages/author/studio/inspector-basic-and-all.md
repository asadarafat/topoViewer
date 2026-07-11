# Inspector Basic And All

**Support status:** Experimental

The Inspector follows canvas selection and separates authoring by document:

- **Topology** edits identity and geometry in `topology.yaml`.
- **Styles** edits either an inline `topology.yaml` override or a reusable
  `stylesheet.yaml` selector rule. The active destination is always visible.
- **Mapper** opens the rule-oriented `mapper.yaml` workspace instead of mixing
  telemetry fields into one selected object.

Generated controls come from canonical authoring metadata so schema, YAML
assistance, Studio, and future hosts do not maintain separate field lists.
The document and style-view tab strips use standard keyboard tab behavior,
consume the available Inspector width, and retain a visible active indicator.

## Style Profiles

- **Basic:** common task-oriented fields for the selected object family.
- **All:** every supported field applicable to the selection.

Search matches canonical key, label, description, and group. Nested contracts
such as card layout render as one coherent editor rather than disconnected raw
keys.

## Typed Controls

Studio uses checkboxes for booleans, selects for enumerations, number inputs for
bounded values, color controls for colors, and structured editors for nested or
list values. Invalid input remains visible with an associated error and is not
committed silently.

Open a field's overflow menu and choose **Write default** when the default value
must be explicit. Choose **Unset value** to remove it and return to inherited
behavior. Menu actions retain their full text width; they are not constrained by
the compact icon trigger. Arrow keys move between open menu actions and
`Escape` closes the menu and restores focus to its trigger.

## Personal Field Profiles

Fields can be added to or removed from Basic, reordered, or hidden locally from
the same overflow menu. These sparse, versioned preferences do not alter
project YAML. Expand **Customize fields** to restore hidden fields or reset the
profile.

Multi-selection exposes only compatible shared fields. A bulk edit is one undo
transaction and previews the affected object count before source mutation.
