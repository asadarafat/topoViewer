## Design

### Product Direction

The harness should behave like a topology authoring tool with a strong YAML
editor, not like a form builder for every TopoViewer field.

Inspect should answer:

- What object is selected?
- What semantic data does it carry?
- What relationships does it participate in?
- What topology mutation should happen next?

The YAML editor should answer:

- Which key is valid here?
- Which value is valid here?
- Which object/layer/path/region ID can be referenced here?
- Which style key or selector should be used?
- What snippet gets me started quickly?
- What style keys exist for this object, grouped by purpose?
- What is the next valid token if I ask for help here?

### Style Discovery Workflow

The primary style workflow should be selected-object driven:

1. User selects an object on the canvas.
2. User invokes `Create style rule` / `Style in YAML` from the harness.
3. Harness switches to Stylesheet YAML.
4. Harness inserts or focuses a rule like:

   ```yaml
   - selector: node[id = "fra-pe"]
     style:
       
   ```

5. Cursor lands inside the `style:` block.
6. The editor opens or clearly offers context suggestions grouped by category.

The inserted selector should prefer the most precise stable selector:

- `node[id = "..."]`, `link[id = "..."]`, `path[id = "..."]`, or
  `region[id = "..."]` for direct object edits;
- label/data selectors only when the user explicitly chooses to style a class of
  objects.

This keeps style authoring in Stylesheet YAML while still giving the user a
clear, guided path from object selection to valid style syntax.

### CLI-Like Context Help

TopoViewer should provide CLI-style discovery in the YAML editor:

- `Ctrl+Space` opens Monaco suggestions for the current cursor context.
- Typing `?` or pressing a visible `Suggestions` action opens the same
  context help without inserting invalid YAML into the saved document.
- The help list should be local to the cursor context:
  - inside `graph.nodes`, show node fields;
  - inside `link.source` / `link.target`, show node IDs;
  - inside stylesheet `selector`, show selector snippets;
  - inside stylesheet `style`, show style keys for the selector kind;
  - after a style key, show valid enum/boolean/color/value suggestions.
- Style key suggestions should be grouped:
  - Geometry;
  - Shape;
  - Fill / Border / Underlay;
  - Label;
  - Badge / Status;
  - Icon / Image;
  - Interaction;
  - Edge line;
  - Edge labels;
  - Arrows.
- Each suggestion should carry a concise explanation and expected value type.

### YAML Intelligence Sources

The initial provider can be deterministic and local:

- JSON schema / semantic model:
  - topology root keys;
  - `graph.*` collections;
  - object fields;
  - attention fields;
  - stylesheet rule shape.
- Style metadata:
  - known node, edge, region, path, callout, and shape style keys;
  - data types;
  - enum values;
  - color-aware values.
- Current document context:
  - graph node IDs for link/path/reference values;
  - layer IDs;
  - region IDs;
  - path IDs;
  - existing label/data keys;
  - selectors based on object IDs and common labels.

### Completion Levels

Implementation should progress in levels:

1. **Schema completions**
   Suggest valid keys and common snippets based on coarse YAML path.
2. **Context completions**
   Suggest IDs and selectors from the current parsed topology/stylesheet.
3. **Value completions**
   Suggest enum values, booleans, style key values, and Material UI color
   palette values.
4. **Inline suggestions**
   Add ghost-text style completions only after deterministic completions are
   reliable. These remain local and schema-derived, not cloud AI.

### Monaco Integration

Use Monaco language providers:

- `registerCompletionItemProvider('yaml', ...)` for key/value/snippet
  suggestions;
- `registerHoverProvider('yaml', ...)` for short field help;
- existing diagnostics/markers for validation feedback.

The provider should know whether the active tab is Topology YAML or Stylesheet
YAML. It should avoid suggesting stylesheet keys in topology contexts except for
legacy inline style compatibility, which should be secondary.

For `?` help, do not leave a literal `?` in the document. The key handling
should trigger the same completion model, then remove the typed helper
character or intercept it before Monaco commits it to the YAML model.

### Inspect Simplification

Remove the style key/value section from Inspect. Keep:

- object name;
- display name;
- layer;
- position where applicable;
- labels;
- data;
- link endpoints;
- path sequence;
- preset save;
- apply properties;
- delete.

The deleted `use-stylesheet-for-harness-style-edits` direction is intentionally
not archived as completed. It was superseded before completion because the
stylesheet-first workflow belongs in the YAML editor, not as another Inspect
form surface.

### Test Strategy

Playwright should verify visible behavior:

- Inspect no longer shows Style rows.
- Topology YAML suggests node/link/path/region keys in topology contexts.
- Stylesheet YAML suggests selectors and style keys.
- Value suggestions include enums and IDs where relevant.
- Diagnostics still mark invalid YAML lines.

Lower-level unit tests can cover pure suggestion helper functions once helper
logic is factored out of the React component.
