# Accessibility

**Support status:** Experimental

Studio targets WCAG 2.2 AA for the authoring shell. Pointer-only canvas actions
have keyboard alternatives, and connection state is announced with text rather
than color alone.

## Keyboard Workflow

- Use `Tab` and `Shift+Tab` to move through the header, workspace rail, active
  left workspace, and canvas.
- Use `Up` and `Down` on the vertical workspace rail to move between Topo,
  Object, Style, Viewport, and Mapper.
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

Dialogs trap focus and return it to the invoking control. Workspace tabs use
standard tab semantics and arrow-key selection. Style attributes use one
searchable list with an accessible View More disclosure. Field action menus
support arrow-key traversal and return focus to the trigger when closed with
`Escape`.
Validation errors use `aria-invalid` and associated error text. Status, mapper
coverage, and connection validity are announced through live regions.
Color fields expose an accessible text input and a separately named color well;
color is never the only validation signal. Resize completion motion is removed
under `prefers-reduced-motion`.

The tested visual states include light and dark themes, forced colors, reduced
motion, 200 percent reflow, a 640 px viewport, long labels, dialogs, invalid
source, mapper authoring, and presentation mode.

## Manual Screen Reader Check

On macOS, enable VoiceOver with `Cmd+F5`, then verify this sequence:

1. Navigate to the Object palette and create two nodes.
2. Confirm each node has an object role and readable name.
3. Select nodes and create a link through the toolbar.
4. Open Style from the workspace rail and hear the Default, Selector, and
   Bypass matrix, View More disclosure, field labels, and validation text.
5. Open Object and confirm it still describes the selected object.
6. Open and close the YAML drawer and confirm focus returns to its trigger.
7. Trigger invalid YAML and confirm the status and recovery action are announced.

Automated checks complement this manual review; they do not replace screen
reader and keyboard use.
