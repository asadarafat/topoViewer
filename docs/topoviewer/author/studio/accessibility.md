# Accessibility

**Support status:** Beta Preview

Studio targets WCAG 2.2 AA for the authoring shell. Pointer-only canvas actions
have keyboard alternatives, and connection state is announced with text rather
than color alone.

## Keyboard Workflow

- Use `Tab` and `Shift+Tab` to move through the command bar, project source,
  shared source editor, preview controls, canvas, contextual drawer, session
  dock, and status bar in their logical order.
- Use arrow keys within Source/Split/Preview and the session-dock tab list.
- Focus the source/preview separator and use `Left` or `Right` to resize it
  within the documented bounds.
- Focus a palette item and press `Enter` to create it.
- Use additive selection and **Connect selected nodes** when pointer connection
  handles are not practical.
- Use toolbar commands for copy, duplicate, delete, align, distribute, nudge,
  undo, and redo.
- Double-click an object to open its focused label or text editor. Press
  `Enter` to commit, `Shift+Enter` to add a line in standalone text, or `Escape`
  to cancel and return focus.
- Resize one selected object with `Alt` plus an arrow key when pointer handles
  are not practical.
- Use `Escape` to close contextual menus, drawers, dialogs, and presentation
  mode.

Dialogs and temporary narrow-layout drawers trap focus and return it to the
invoking control. Project source exposes the selected document, and
Source/Split/Preview exposes pressed state. One shared Monaco workspace switches
among topology, stylesheet, and optional mapper source. Preview-local Add,
Properties, and Mapper Visual never mount another editor. Visual fields use
named accordions, associated labels and errors, explicit
mixed values, provenance text, and keyboard-reachable reset or source actions.
The source footer announces validation state and keeps Apply and Revert
reachable for the active document.
Validation errors use `aria-invalid` and associated error text. Status, mapper
coverage, and connection validity are announced through live regions.
Color fields expose an accessible text input, a separately named color well,
and a named opacity slider with a numeric percentage; color is never the only
validation signal. Resize completion motion is removed under
`prefers-reduced-motion`.

The tested visual states include light and dark themes, forced colors, reduced
motion, 200 percent reflow, a 640 px viewport, long labels, dialogs, invalid
source, mapper authoring, and presentation mode.

## Manual Screen Reader Check

On macOS, enable VoiceOver with `Cmd+F5`, then verify this sequence:

1. Navigate through project source to **Object drawer** and create two nodes.
2. Confirm each node has an object role and readable name.
3. Select nodes and create a link through the toolbar.
4. Select an object and confirm Properties opens without moving focus. Hear the
   Topology and Appearance sections, effective values, provenance, and
   validation text.
5. Commit and reset a Visual field, then confirm selection and viewport context
   remain unchanged.
6. Move between `topology.yaml` and `stylesheet.yaml` in project source, use
   completion and diagnostics, then return to preview without losing the
   candidate or focus context.
7. Trigger invalid `stylesheet.yaml` and confirm the status, Apply-disabled state, and
   Revert action are announced.
8. Open Mapper Visual, create the first rule, select `mapper.yaml` in project
   source, and confirm the shared editor, diagnostics, Apply, and Revert
   controls are announced.
9. Expand **Topology outline > Attention**, focus a compatible canvas
   selection, toggle interactive click focus, and open Attention YAML. Confirm
   status and switch state are announced without relying on color.

Automated checks complement this manual review; they do not replace screen
reader and keyboard use.
