# Design

## Target Architecture

### Core Renderer

The core package adds a `DiagramText` object under `diagram.texts`. It compiles
to a dedicated React Flow node rendered by `TextNode`. Text is rendered as inert
plain text with preserved newlines; it is never interpreted as HTML or
Markdown.

The public renderer adds an `onObjectDoubleClick` event with source identity,
runtime identity, object data, pointer coordinates, and modifier state. The
renderer reports intent only. It does not own an editor or mutate a document.

One shared `AuthoringNodeResizer` component owns React Flow resize handles and
the resize-state classes used by nodes, regions, shapes, callouts, and text.
Geometry tracks the pointer without transitions. Resize completion produces a
short outline/handle cue. `prefers-reduced-motion: reduce` disables that cue.

### Studio UI

`StudioThemeProvider` is the sole Material theme owner. It defines compact
density, typography, focus, color, shape, light/dark schemes, and component
defaults. It exposes CSS variables so the canvas shell and non-Material layout
CSS can consume the same tokens.

Feature modules consume Studio-owned controls from `src/ui`. Those controls
wrap supported second-level Material imports and encode Studio density,
accessible naming, and stable test hooks. Feature modules SHALL NOT add raw
buttons, text inputs, selects, textareas, checkboxes, dialogs, menus, tabs, or
accordions. Low-level native inputs are permitted only inside the UI layer when
Material has no equivalent, such as the browser color well and file picker.

The graph canvas and TopoViewer-rendered objects remain core renderer content,
not Material components.

### Color Editing

Every authoring field whose canonical metadata uses `dataType: color` renders a
`StudioColorField`. The field always includes:

- a visible color well;
- a Material text field for exact CSS input;
- validation without destructive coercion;
- an accessible label and error message.

The text value is authoritative. The color well normalizes parseable solid
colors to `#RRGGBB`; when the textual value cannot be represented by the native
well, it uses a deterministic fallback while preserving the authored text until
the user chooses a new color.

### Direct Text Editing

Double-clicking an editable object opens a compact Material popover anchored to
the pointer position. The editor resolves one canonical field:

- node, region, shape, link, and path: explicit `label`, otherwise `name`;
- callout: `title`, with multiline body available from the Inspector;
- text: `text`;
- link direction: `label`.

Enter commits a single-line value. Shift+Enter inserts a newline in multiline
text. Escape cancels. Focus returns to the canvas after either action. The
command layer writes only the selected scalar path and preserves unrelated YAML
source.

## Text Contract

```yaml
diagram:
  texts:
    - id: maintenance-note
      text: Planned maintenance\n23:00-23:30 UTC
      position: [420, 120]
      size: [240, 72]
      layers: [annotations]
      style:
        color: "#172033"
        fontSize: 18
        fontWeight: 700
        textAlign: center
        verticalAlign: middle
```

Supported object fields are `id`, `text`, `position`, `size`, `rotation`,
`align`, `verticalAlign`, `locked`, `layers`, `labels`, `data`, and `style`.
Canonical style keys are `color`, `backgroundColor`, `borderColor`,
`borderWidth`, `borderRadius`, `fontFamily`, `fontSize`, `fontWeight`,
`fontStyle`, `lineHeight`, `textAlign`, `verticalAlign`, `padding`, `rotation`,
`width`, `height`, `display`, `draggable`, `selectable`, `opacity`, and `zIndex`.

## Performance

Material imports use supported second-level paths. Bundle budgets are measured
before and after migration. Monaco, mapper analysis, and export remain lazy.
The migration SHALL fail if it moves those features into the initial bundle.

Resize feedback changes only classes and local state. It SHALL NOT trigger YAML
commits or graph recompilation until resize end. Dense graph interaction tests
measure pointer responsiveness with feedback enabled.

## Accessibility

- Theme focus indicators meet visible contrast requirements.
- Material menus, dialogs, fields, tabs, switches, and tooltips retain native
  keyboard contracts.
- The quick editor announces the selected object and edited field.
- Text objects expose their content as the accessible name.
- Resize completion animation respects reduced motion.
- Browser and VS Code hosts run the same axe and keyboard journeys.

## Security

Text content is rendered through React text nodes. It SHALL NOT use
`dangerouslySetInnerHTML`, parse Markdown, resolve remote assets, or execute
template expressions. Material UI is restricted to the private Studio
application and does not alter renderer trust boundaries.

## Rollback

The feature is additive. Removing `diagram.texts` support would require a
schema migration and is therefore not a runtime rollback mechanism. Studio UI
migration remains reviewable in separate conventional commits: theme/control
foundation, feature migration, text primitive, and direct manipulation.
