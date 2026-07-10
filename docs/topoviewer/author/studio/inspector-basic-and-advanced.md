# Inspector Basic And Advanced

**Support status:** Experimental

The Inspector follows canvas selection. Object fields edit topology facts;
generated style fields edit visual policy. Controls come from canonical
authoring metadata so schema, YAML assistance, Studio, and future hosts do not
maintain separate field lists.

## Style Profiles

- **Basic:** common task-oriented fields for the selected object family.
- **Advanced:** less common geometry, label, marker, interaction, and rendering
  controls.
- **All:** every supported field applicable to the selection.
- **Modified:** only fields explicitly written by the current edit scope.

Search matches canonical key, label, description, and group. Nested contracts
such as card layout render as one coherent editor rather than disconnected raw
keys.

## Typed Controls

Studio uses checkboxes for booleans, selects for enumerations, number inputs for
bounded values, color controls for colors, and structured editors for nested or
list values. Invalid input remains visible with an associated error and is not
committed silently.

Choose **Use default** when the default value must be written explicitly. Choose
**Unset** to remove the field and return to inherited behavior.

## Personal Field Profiles

Fields can move between Basic and Advanced or be hidden locally. These sparse,
versioned preferences do not alter project YAML. **Show hidden** and **Reset
field profile** make the customization reversible.

Multi-selection exposes only compatible shared fields. A bulk edit is one undo
transaction and previews the affected object count before source mutation.
