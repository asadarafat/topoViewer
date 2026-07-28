# Accessibility

**Support status:** Beta Preview

Studio targets WCAG 2.2 AA for the authoring shell. Pointer-only canvas actions
have keyboard alternatives, and connection state is announced with text rather
than color alone.

## Keyboard Workflow

- Use `Tab` and `Shift+Tab` to move through the header, workspace rail, active
  left workspace, and canvas.
- Use `Up` and `Down` on the vertical workspace rail to move between Add,
  Properties, and Mapper.
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

Dialogs trap focus and return it to the invoking control. Workspace destinations
expose selected state and support arrow-key navigation. Properties exposes
Visual and Code as a named segmented control, then Code exposes topology and
stylesheet as a named tab list. Mapper has its own Visual and Code segmented
control; Mapper Code is enabled after the optional mapper document exists.
Visual fields use named accordions, associated labels and errors, explicit
mixed values, provenance text, and keyboard-reachable reset or source actions.
The fixed candidate footer announces validation state and keeps Apply and Revert
reachable in either Properties mode.
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

1. Navigate to Add and create two nodes.
2. Confirm each node has an object role and readable name.
3. Select nodes and create a link through the toolbar.
4. Select an object and confirm Properties opens without moving focus. Hear the
   Visual/Code mode switch, Topology and Appearance sections, effective values,
   provenance, and validation text.
5. Commit and reset a Visual field, then confirm selection and viewport context
   remain unchanged.
6. Switch to Code, move between `topology.yaml` and `stylesheet.yaml`, use
   completion and diagnostics, then return to Visual without losing the
   candidate or focus context.
7. Trigger invalid `stylesheet.yaml` and confirm the status, Apply-disabled state, and
   Revert action are announced.
8. Open Mapper, create the first rule, switch to Code, and confirm the
   `mapper.yaml` editor, diagnostics, Apply, and Revert controls are announced.

Automated checks complement this manual review; they do not replace screen
reader and keyboard use.
