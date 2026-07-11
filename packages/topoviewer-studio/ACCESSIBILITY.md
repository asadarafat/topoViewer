# TopoViewer Studio Accessibility Contract

TopoViewer Studio targets WCAG 2.2 AA for the primary authoring workflows in
the browser and VS Code hosts. The browser and VS Code routes mount the same
Studio application, so keyboard, focus, naming, validation, and announcement
behavior belong to this package.

## Focus Model

The default focus order follows the visible workspace: header commands, object
palette, topology canvas, Inspector, then footer tools. Responsive palette and
Inspector panels retain that order when opened as overlays.

- Activating a palette template creates and selects the object, then moves
  focus to the canvas.
- React Flow nodes and edges remain keyboard focusable. Selection updates the
  Inspector and the polite live region.
- The source and mapper drawers are non-modal workspaces. Closing either drawer
  restores focus to the control that opened it.
- Export, destructive confirmations, and external-change dialogs contain focus
  while open and restore the prior focus when they close.
- Presentation mode moves focus to its exit control and restores focus to the
  presentation command on exit.
- Opening the keyboard context menu moves focus to its first available action;
  closing it restores focus to the canvas object or canvas region.

## Keyboard Map

Keyboard commands are scoped to the topology canvas. They do not intercept
text inputs, editable content, dialogs, menus, or Monaco.

| Workflow | Keyboard interaction |
|---|---|
| Choose and place | Focus a palette template and press `Enter` or `Space`. |
| Select | Tab to a topology object, then use the React Flow selection keys. Use the platform modifier for additive selection. |
| Move | Press an arrow key for one pixel or `Shift+Arrow` for ten pixels. |
| Resize | Press `Alt+Arrow` for one pixel or `Alt+Shift+Arrow` for ten pixels. Left/up shrink; right/down grow. |
| Connect | Select exactly two nodes and press `L`, or activate **Connect selected nodes** in the canvas toolbar. |
| Region membership | Create a region from selected nodes, or nudge a node into a region. Press `Shift+F10` or the Context Menu key and choose **Release from region** to remove membership. |
| Context actions | Press `Shift+F10` or the Context Menu key. Use arrow keys, `Home`, and `End` within the menu; press `Escape` to close it. |
| Clipboard | Use `Control/Command+C`, `X`, or `V`; use `Control/Command+D` to duplicate. |
| Delete | Press `Delete` or `Backspace` while canvas focus is active. |
| Inspector and mapper | Tab through generated controls. `Enter` commits text fields and `Escape` restores their previous value. Field action menus use arrow keys and return focus to their trigger on `Escape`. Mapper metrics are buttons as well as drag sources. |
| Layers | Open viewport settings, then use named checkboxes and buttons for visibility, membership, ordering, creation, and deletion. |
| Drawer resize | Focus the drawer separator and press `ArrowUp` or `ArrowDown`. |
| Tabs | Use left/right arrows or `Home`/`End`; only the active tab is in the Tab sequence. |
| Save and export | Use the named header commands and dialog controls. Progress, completion, and failures are announced. |

## Announcements

One polite live region reports selection, placement, valid or invalid
connection targets, command completion, diagnostics, persistence state, and
export completion. Blocking failures also render as visible alerts. Repeated
connection-target messages are deduplicated so pointer movement does not flood
assistive technology.

Color is supplementary. Selection, connection validity, mapper coverage,
diagnostics, save state, and errors all have text or accessible-state
equivalents.

## Verification Contract

The Phase 16 gate covers:

- automated axe checks for the default shell, selected-object Inspector,
  viewport settings and layers, source drawer, mapper workspace, project menu,
  export dialog, and external-change dialog;
- keyboard-only creation, selection, movement, resize, connection, contextual
  region action, mapper rule creation, save, and export entry;
- 200 percent zoom, narrow viewport, light and dark schemes, reduced motion,
  forced colors, and long translated-like labels;
- a macOS keyboard and VoiceOver review of the same primary workflow.

Critical and serious automated findings block the phase. Lower-severity
findings require an owner and rationale in this document before release.

## Residual Findings

No lower-severity automated exception is approved by default. Host applications
remain responsible for preserving browser or VS Code zoom, contrast,
reduced-motion, and assistive-technology preferences around the Studio webview.

## Phase 16 Review Record

On 2026-07-10, Chromium completed seven Studio accessibility workflows with
zero axe violations. The suite covered all major shell states, keyboard-only
authoring, connection announcements, focus containment and restoration,
validation associations, narrow reflow, dark mode, reduced motion, forced
colors, long labels, and external-change conflict handling.

Asad Arafat completed the manual VoiceOver review on 2026-07-10 with macOS
26.5.1 and Chrome 150.0.7871.47. Focus order, names, roles, values, selected
state, keyboard authoring, live announcements, modal focus containment and
restoration, 200 percent zoom, Increase Contrast, and Reduce Motion passed. The
review found no critical, serious, or lower-severity residual accessibility
findings.

The manual review used this repeatable checklist:

1. Open `http://127.0.0.1:5175/` in Chrome on macOS and enable VoiceOver.
2. Traverse the header, palette, canvas objects, Inspector, and footer in DOM
   order; confirm names, roles, values, and selected state are announced.
3. Create two nodes from the palette, select both, connect them, move and resize
   one node, create a region, and release a member through `Shift+F10`.
4. Confirm placement, selection, connection validity, command completion, save
   state, and rejection messages are announced once and remain understandable.
5. Open and close source, mapper, export, project, layer-delete, mapper-delete,
   and external-change surfaces; confirm focus containment and restoration.
6. Repeat the save and export entry workflows at 200 percent zoom and with
   Increase Contrast and Reduce Motion enabled.

Future reviews must record the reviewer, macOS/browser versions, date, and any
finding. Do not pass the OpenSpec assistive-technology gate while any critical
or serious finding remains unresolved.
